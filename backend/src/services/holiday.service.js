/**
 * 공휴일 조회 — 예약 캘린더(프론트)와 예약 검증(reservation.service)이 같은 데이터를 씁니다.
 * 공휴일은 자주 바뀌지 않으므로 연도별로 하루 동안 캐시합니다.
 */
import { fetchKoreanHolidays, NAGER_DATE_SOURCE } from './external/nagerDate.js';
import ApiError from '../utils/ApiError.js';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map(); // year → { expiresAt, holidays }

const getYear = async (year) => {
  const hit = cache.get(year);
  if (hit && hit.expiresAt > Date.now()) return hit.holidays;

  const holidays = await fetchKoreanHolidays(year);
  cache.set(year, { expiresAt: Date.now() + CACHE_TTL_MS, holidays });
  return holidays;
};

export const holidayService = {
  /** [{ date: 'YYYY-MM-DD', name }] */
  async getByYear(rawYear) {
    const year = Number.parseInt(rawYear, 10);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw ApiError.badRequest('연도를 확인해 주세요. (예: ?year=2026)');
    }
    return { year, holidays: await getYear(year), source: NAGER_DATE_SOURCE };
  },

  /** 해당 날짜의 공휴일 이름, 아니면 null */
  async findByDate(date) {
    const holidays = await getYear(Number.parseInt(date.slice(0, 4), 10));
    return holidays.find((h) => h.date === date)?.name ?? null;
  },
};

export default holidayService;
