/**
 * 방문 예약 로직 — 날짜/시간 규칙과 중복 확인은 여기서, 저장은 저장소에서.
 * 예약 규칙(시간대 · 휴무 요일 · 예약 가능 기간)은 portfolio.json 의 reservation 항목에서 읽고,
 * 공휴일은 holiday.service 에서 확인합니다. (프론트 캘린더와 같은 데이터)
 * 확인 메일이나 알림을 붙인다면 create() 안에서 호출하면 됩니다.
 */
import { portfolioRepository, reservationRepository } from '../repositories/index.js';
import holidayService from './holiday.service.js';
import ApiError from '../utils/ApiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAME_MAX_LENGTH = 50;
const PURPOSE_MAX_LENGTH = 500;

/** 서버가 어느 지역에서 돌든 한국 시간 기준으로 "오늘"과 "지금"을 계산합니다. */
const nowInSeoul = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
};

const toUtcDate = (date) => new Date(`${date}T00:00:00Z`);

const isRealDate = (date) =>
  DATE_PATTERN.test(date ?? '') && toUtcDate(date).toISOString().slice(0, 10) === date;

const addDays = (date, days) => {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * 공휴일이면 이름을 돌려줍니다.
 * 공휴일 API 가 죽어 있으면 예약 자체를 막지 않고 통과시킵니다. (운영자가 확인 후 답장하므로)
 */
const findHoliday = async (date) => {
  try {
    return await holidayService.findByDate(date);
  } catch (error) {
    console.warn('[reservation] 공휴일 확인 실패 — 공휴일 검사 없이 진행합니다.', error.message);
    return null;
  }
};

/** 예약할 수 없는 날짜면 사유를, 가능하면 null 을 돌려줍니다. */
const checkDate = async (date, settings, today) => {
  if (!isRealDate(date)) return '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)';
  if (date < today) return '지난 날짜는 예약할 수 없습니다.';
  if (date > addDays(today, settings.maxDaysAhead)) {
    return `예약은 오늘부터 ${settings.maxDaysAhead}일 이내만 가능합니다.`;
  }
  if (settings.closedWeekdays.includes(toUtcDate(date).getUTCDay())) return '주말에는 예약할 수 없습니다.';
  const holiday = await findHoliday(date);
  if (holiday) return `공휴일(${holiday})에는 예약할 수 없습니다.`;
  return null;
};

const loadSettings = async () => {
  const settings = await portfolioRepository.findReservationSettings();
  if (!settings) throw ApiError.internal('예약 설정이 없습니다.');
  return settings;
};

const buildSlots = async (date, settings, now) => {
  const booked = new Set(await reservationRepository.findBookedTimes(date));
  return settings.timeSlots.map((time) => ({
    time,
    available: !booked.has(time) && !(date === now.date && time <= now.time),
  }));
};

/** 문자열이 아닌 값이 와도 검증 단계에서 터지지 않도록 필드를 다듬어 맞춥니다. */
const TEXT_FIELDS = ['name', 'email', 'purpose', 'date', 'time'];
const normalize = (payload) => ({
  ...Object.fromEntries(
    TEXT_FIELDS.map((key) => [key, typeof payload?.[key] === 'string' ? payload[key].trim() : '']),
  ),
  consent: payload?.consent === true,
});

const validate = async (input, settings, today) => {
  const { name, email, purpose, date, time, consent } = input;
  const errors = {};

  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (name.length > NAME_MAX_LENGTH) errors.name = `이름은 ${NAME_MAX_LENGTH}자 이내로 입력해 주세요.`;
  if (!email) errors.email = '이메일을 입력해 주세요.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = '이메일 형식이 올바르지 않습니다. (예: name@example.com)';
  if (!purpose) errors.purpose = '방문 목적을 입력해 주세요.';
  else if (purpose.length > PURPOSE_MAX_LENGTH) errors.purpose = `방문 목적은 ${PURPOSE_MAX_LENGTH}자 이내로 입력해 주세요.`;

  const dateError = await checkDate(date, settings, today);
  if (dateError) errors.date = dateError;
  if (!settings.timeSlots.includes(time)) errors.time = '희망 시간을 선택해 주세요.';
  if (!consent) errors.consent = '정보 전달에 동의해 주세요.';

  return errors;
};

export const reservationService = {
  /** 특정 날짜의 시간대별 예약 가능 여부. 예약자 정보는 노출하지 않습니다. */
  async getAvailability(date) {
    const settings = await loadSettings();
    const now = nowInSeoul();

    const dateError = await checkDate(date, settings, now.date);
    if (dateError) throw ApiError.badRequest(dateError, { date: dateError });

    return {
      date,
      durationMinutes: settings.durationMinutes,
      slots: await buildSlots(date, settings, now),
    };
  },

  async create(payload) {
    const settings = await loadSettings();
    const now = nowInSeoul();
    const input = normalize(payload);

    const errors = await validate(input, settings, now.date);
    if (Object.keys(errors).length > 0) {
      throw ApiError.badRequest('입력값을 확인해 주세요.', errors);
    }

    const slot = (await buildSlots(input.date, settings, now)).find((s) => s.time === input.time);
    if (!slot.available) {
      throw ApiError.conflict('이미 예약되었거나 지난 시간입니다. 다른 시간을 선택해 주세요.');
    }

    return reservationRepository.create(input);
  },
};

export default reservationService;
