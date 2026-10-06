/**
 * 방문 예약 페이지(reservation.html) 진입점.
 *   1) 예약 규칙을 불러와 캘린더를 바로 그리고, 공휴일은 뒤이어 받아서 막습니다
 *      (공휴일 API 가 느려도 캘린더가 늦게 뜨지 않도록 — 서버도 예약 시 공휴일을 다시 확인합니다)
 *   2) 입력값이 모두 채워지고 동의했을 때만 "예약하기" 를 켜고
 *   3) 최종 확인 팝업에서 한 번 더 "예약하기" 를 눌러야 실제로 저장합니다.
 */
import portfolioApi from '../api/portfolio.api.js';
import reservationApi from '../api/reservation.api.js';
import holidayApi from '../api/holiday.api.js';
import { escapeHtml, setText } from '../render/dom.js';
import createCalendar from './calendar.js';
import { addDays, formatKoreanDate, formatTimeRange, todayInSeoul, weekdayOf } from './dates.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NETWORK_ERROR = '예약 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';

const $ = (id) => document.getElementById(id);

/** 예약 가능 기간이 걸친 연도들의 공휴일을 { 'YYYY-MM-DD': '이름' } 으로 모읍니다. */
const loadHolidays = async (from, to) => {
  const years = [...new Set([from.slice(0, 4), to.slice(0, 4)])];
  const results = await Promise.all(years.map((year) => holidayApi.getByYear(year)));
  return Object.fromEntries(results.flatMap((r) => r.holidays.map((h) => [h.date, h.name])));
};

const bootstrap = async () => {
  const { data } = await portfolioApi.getAll();
  const settings = data.reservation;
  const placeName = data.location?.placeName ?? '';
  setText('#reservation-intro', settings.intro);

  const form = $('reservation-form');
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    purpose: form.elements.purpose,
    date: form.elements.date,
    time: form.elements.time,
    consent: form.elements.consent,
  };
  const dateBox = $('selected-date');
  const submitButton = $('reservation-submit');
  const submitHint = $('submit-hint');
  const dialog = $('confirm-dialog');

  // ── 에러 표시 ──────────────────────────────
  const setError = (name, message = '') => {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = message;
    fields[name]?.classList.toggle('is-invalid', Boolean(message));
    if (fields[name]) fields[name].setAttribute('aria-invalid', String(Boolean(message)));
    if (name === 'date') dateBox.classList.toggle('is-invalid', Boolean(message));
  };
  const showErrors = (errors = {}) => Object.keys(fields).forEach((name) => setError(name, errors[name]));

  // ── 이메일 형식 검사 (한 번 벗어난 뒤부터 입력할 때마다 즉시 표시) ──
  let emailTouched = false;
  const emailValue = () => fields.email.value.trim();
  const isEmailValid = () => EMAIL_PATTERN.test(emailValue());
  const checkEmail = () => {
    if (!emailTouched) return;
    setError(
      'email',
      emailValue() && !isEmailValid() ? '이메일 형식이 올바르지 않습니다. @ 를 포함해 name@example.com 처럼 입력해 주세요.' : '',
    );
  };
  fields.email.addEventListener('blur', () => {
    emailTouched = true;
    checkEmail();
  });
  fields.email.addEventListener('input', checkEmail);

  // ── 필수 항목이 모두 채워졌을 때만 "예약하기" 활성화 ──
  const missingItems = () =>
    [
      [!fields.date.value, '날짜'],
      [!fields.time.value, '희망 시간'],
      [!fields.name.value.trim(), '이름'],
      [!isEmailValid(), '이메일'],
      [!fields.purpose.value.trim(), '방문 목적'],
      [!fields.consent.checked, '정보 전달 동의'],
    ]
      .filter(([missing]) => missing)
      .map(([, label]) => label);

  const updateSubmitState = () => {
    const missing = missingItems();
    submitButton.disabled = missing.length > 0;
    submitHint.textContent = missing.length ? `남은 항목: ${missing.join(' · ')}` : '';
    setText('#purpose-count', String(fields.purpose.value.length));
  };
  form.addEventListener('input', updateSubmitState);
  form.addEventListener('change', updateSubmitState);

  // ── 희망 시간 드롭다운 ─────────────────────
  const resetTimeSelect = (placeholder) => {
    fields.time.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
    fields.time.disabled = true;
  };

  const loadTimes = async (date) => {
    const previous = fields.time.value;
    resetTimeSelect('예약 가능한 시간을 불러오는 중…');
    setError('time');

    let slots;
    try {
      ({ slots } = await reservationApi.getAvailability(date));
    } catch (error) {
      if (error.status === 400) {
        setError('date', error.message);
        resetTimeSelect('다른 날짜를 선택해 주세요');
        return;
      }
      // 서버 확인이 안 되면 고를 수는 있게 두고, 최종 확인은 예약 시 서버가 합니다.
      slots = settings.timeSlots.map((time) => ({ time, available: true }));
      setError('time', '예약 현황을 확인하지 못했습니다. 신청 시 다시 확인합니다.');
    }
    if (fields.date.value !== date) return; // 그 사이 다른 날짜를 골랐다면 무시

    const open = slots.filter((s) => s.available);
    if (!open.length) {
      resetTimeSelect('이 날짜는 예약이 모두 찼습니다');
      updateSubmitState();
      return;
    }

    fields.time.innerHTML = `
      <option value="">시간을 선택해 주세요</option>
      ${slots
        .map(
          (s) =>
            `<option value="${escapeHtml(s.time)}" ${s.available ? '' : 'disabled'}>
               ${escapeHtml(s.time)}${s.available ? '' : ' (마감)'}
             </option>`,
        )
        .join('')}`;
    fields.time.disabled = false;
    if (open.some((s) => s.time === previous)) fields.time.value = previous;
    updateSubmitState();
  };

  // ── 캘린더 ────────────────────────────────
  const today = todayInSeoul();
  const lastDay = addDays(today, settings.maxDaysAhead);
  let holidays = {};

  const calendar = createCalendar($('calendar'), {
    min: today,
    max: lastDay,
    getBlockReason: (iso) => {
      if (holidays[iso]) return `공휴일(${holidays[iso]})`;
      if (settings.closedWeekdays.includes(weekdayOf(iso))) return '주말';
      return null;
    },
    onSelect: (iso) => {
      fields.date.value = iso;
      dateBox.value = formatKoreanDate(iso);
      setError('date');
      loadTimes(iso);
      updateSubmitState();
    },
  });

  // 공휴일은 캘린더를 그린 뒤 받아서 반영합니다.
  const holidayStatus = $('holiday-status');
  holidayStatus.hidden = false;
  holidayStatus.textContent = '공휴일 정보를 확인하는 중…';
  loadHolidays(today, lastDay)
    .then((loaded) => {
      holidays = loaded;
      holidayStatus.hidden = true;
      calendar.refresh();
      // 공휴일 정보가 오기 전에 공휴일을 골랐다면 선택을 풀어 줍니다.
      if (holidays[fields.date.value]) {
        setError('date', `공휴일(${holidays[fields.date.value]})에는 예약할 수 없습니다. 다른 날짜를 선택해 주세요.`);
        fields.date.value = '';
        dateBox.value = '';
        calendar.clear();
        resetTimeSelect('날짜를 먼저 선택해 주세요');
        updateSubmitState();
      }
    })
    .catch((error) => {
      console.warn('[reservation] 공휴일 조회 실패:', error.message);
      holidayStatus.textContent = '공휴일 정보를 불러오지 못했습니다. 공휴일인 날짜는 예약 시 다시 확인합니다.';
    });

  const resetForm = () => {
    form.reset();
    emailTouched = false;
    fields.date.value = '';
    dateBox.value = '';
    calendar.clear();
    resetTimeSelect('날짜를 먼저 선택해 주세요');
    showErrors();
    updateSubmitState();
  };

  // ── 최종 확인 팝업 ─────────────────────────
  const payload = () => ({
    name: fields.name.value.trim(),
    email: emailValue(),
    purpose: fields.purpose.value.trim(),
    date: fields.date.value,
    time: fields.time.value,
    consent: fields.consent.checked,
  });

  const showDialogStep = (step) => {
    $('confirm-review').hidden = step !== 'review';
    $('confirm-done').hidden = step !== 'done';
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (missingItems().length) return;

    const p = payload();
    const rows = [
      ['날짜', formatKoreanDate(p.date)],
      ['시간', `${formatTimeRange(p.time, settings.durationMinutes)} (${settings.durationMinutes}분)`],
      ['장소', placeName],
      ['이름', p.name],
      ['이메일', p.email],
      ['방문 목적', p.purpose],
    ].filter(([, value]) => value);

    $('confirm-list').innerHTML = rows
      .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join('');
    $('confirm-error').textContent = '';
    $('confirm-submit').disabled = false;
    showDialogStep('review');
    dialog.showModal();
  });

  $('confirm-cancel').addEventListener('click', () => dialog.close());

  $('confirm-submit').addEventListener('click', async () => {
    const button = $('confirm-submit');
    button.disabled = true;
    button.textContent = '예약 중…';
    $('confirm-error').textContent = '';

    try {
      const created = await reservationApi.create(payload());
      $('confirm-done-message').textContent =
        `${formatKoreanDate(created.date)} ${created.time} 방문 예약 신청이 접수되었습니다. ` +
        `확인 후 ${created.email} 로 답장드릴게요.`;
      showDialogStep('done');
      resetForm();
    } catch (error) {
      if (error.status === 400 && error.details) {
        dialog.close();
        showErrors(error.details);
      } else {
        $('confirm-error').textContent = error.status ? error.message : NETWORK_ERROR;
        if (error.status === 409) loadTimes(fields.date.value);
      }
      button.disabled = false;
    } finally {
      button.textContent = '예약하기';
    }
  });

  $('confirm-close').addEventListener('click', () => dialog.close());

  updateSubmitState();
};

bootstrap().catch((error) => {
  console.error('[reservation] 초기화 실패:', error);
  const message = `예약 페이지를 불러오지 못했습니다. 잠시 후 새로고침해 주세요. (${error.message})`;
  setText('#reservation-intro', message);
  const calendarBox = document.getElementById('calendar');
  if (calendarBox) calendarBox.innerHTML = `<p class="field-error">${escapeHtml(message)}</p>`;
});
