/**
 * 예약 알림 메일 — Formspree AJAX 제출 (https://help.formspree.io/hc/en-us/articles/360013470814).
 * 페이지 이동 없이 JSON 으로 보내고, 메일은 Formspree 폼에 등록된 주소로 전달됩니다.
 *
 * Formspree 특수 필드
 *   email    : 받은 메일에서 "답장" 을 누르면 이 주소로 회신됩니다.
 *   _subject : 받은 메일의 제목
 */
import config from '../config.js';
import { formatKoreanDate } from '../reservation/dates.js';

const sendReservation = async ({ name, email, purpose, date, time, place }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(config.formspreeEndpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `[방문 예약] ${formatKoreanDate(date)} ${time} · ${name}`,
        email,
        이름: name,
        '방문 날짜': formatKoreanDate(date),
        '희망 시간': time,
        장소: place,
        '방문 목적': purpose,
        '정보 전달 동의': '동의함',
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.errors?.map((e) => e.message).join(', ') || `Formspree 오류 (${response.status})`;
      throw new Error(message);
    }
  } finally {
    clearTimeout(timer);
  }
};

export const formspreeApi = { sendReservation };
export default formspreeApi;
