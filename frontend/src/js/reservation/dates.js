/**
 * 'YYYY-MM-DD' 문자열 날짜 헬퍼. 시간대 문제를 피하려고 전부 UTC 자정 기준으로 계산합니다.
 * "오늘"은 백엔드(reservation.service.js)와 같이 한국 시간 기준입니다.
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const toDate = (iso) => new Date(`${iso}T00:00:00Z`);

export const toIso = (date) => date.toISOString().slice(0, 10);

/**
 * 브라우저마다 en-CA 등의 날짜 "문자열" 형식이 달라(YYYY-MM-DD 또는 M/D/YYYY) format() 결과에 기대지 않고,
 * 연 · 월 · 일 조각을 꺼내 직접 조립합니다.
 */
export const todayInSeoul = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const addDays = (iso, days) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
};

export const weekdayOf = (iso) => toDate(iso).getUTCDay();

/** '2026-10-07' → '2026년 10월 7일 (수)' */
export const formatKoreanDate = (iso) => {
  const d = toDate(iso);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
};

/** '13:30', 30 → '13:30 ~ 14:00' */
export const formatTimeRange = (time, minutes) => {
  const [h, m] = time.split(':').map(Number);
  const end = h * 60 + m + minutes;
  const pad = (n) => String(n).padStart(2, '0');
  return `${time} ~ ${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
};

export { WEEKDAYS };
