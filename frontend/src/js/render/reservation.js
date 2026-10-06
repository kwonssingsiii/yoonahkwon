import { escapeHtml, joinHtml, mount, setText } from './dom.js';

/** 한국 시간 기준 YYYY-MM-DD (백엔드 reservation.service.js 와 같은 기준) */
const todayInSeoul = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const renderReservation = ({ reservation }) => {
  if (!reservation) return;
  setText('#reservation-intro', reservation.intro);

  mount(
    'reservation-purpose',
    `<option value="" disabled selected>선택해 주세요</option>
     ${joinHtml(reservation.purposes ?? [], (p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)}`,
  );

  const dateInput = document.getElementById('reservation-date');
  if (dateInput) {
    const today = todayInSeoul();
    dateInput.min = today;
    dateInput.max = addDays(today, reservation.maxDaysAhead ?? 30);
  }
};

export default renderReservation;
