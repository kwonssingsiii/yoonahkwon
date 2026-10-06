/**
 * 예약용 월간 캘린더 (외부 라이브러리 없이 사이트 디자인에 맞춘 구현).
 *
 *   const calendar = createCalendar(el, {
 *     min: '2026-10-06', max: '2026-11-05',
 *     getBlockReason: (iso) => '공휴일(한글날)' | null,   // null 이면 선택 가능
 *     onSelect: (iso) => { ... },
 *   });
 */
import { escapeHtml } from '../render/dom.js';
import { toDate, toIso, WEEKDAYS } from './dates.js';

const monthStart = (year, month) => new Date(Date.UTC(year, month, 1));

export const createCalendar = (root, { min, max, getBlockReason, onSelect }) => {
  const minDate = toDate(min);
  let view = { year: minDate.getUTCFullYear(), month: minDate.getUTCMonth() };
  let selected = null;

  const canGo = (offset) => {
    const target = monthStart(view.year, view.month + offset);
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));
    return toIso(last) >= min && toIso(target) <= max;
  };

  const dayCell = (iso) => {
    const day = toDate(iso).getUTCDate();
    const outOfRange = iso < min || iso > max;
    const reason = outOfRange ? null : getBlockReason(iso);
    const disabled = outOfRange || Boolean(reason);
    const classes = [
      'calendar-day',
      reason?.startsWith('공휴일') ? 'is-holiday' : '',
      reason?.startsWith('예약 마감') ? 'is-full' : '',
      iso === min ? 'is-today' : '',
      iso === selected ? 'is-selected' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const label = reason ? `${day}일 · ${reason}` : `${day}일`;

    return `<button type="button" class="${classes}" data-date="${iso}" ${disabled ? 'disabled' : ''}
              aria-pressed="${iso === selected}" aria-label="${escapeHtml(label)}"
              ${reason ? `title="${escapeHtml(reason)}"` : ''}>${day}</button>`;
  };

  const render = () => {
    const first = monthStart(view.year, view.month);
    const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
    const blanks = Array.from({ length: first.getUTCDay() }, () => '<span class="calendar-blank"></span>');
    const prefix = toIso(first).slice(0, 8); // 'YYYY-MM-'
    const days = Array.from({ length: daysInMonth }, (_, i) => dayCell(`${prefix}${String(i + 1).padStart(2, '0')}`));

    root.innerHTML = `
      <div class="calendar-header">
        <button type="button" class="calendar-nav" data-move="-1" aria-label="이전 달" ${canGo(-1) ? '' : 'disabled'}>‹</button>
        <strong class="calendar-title">${view.year}년 ${view.month + 1}월</strong>
        <button type="button" class="calendar-nav" data-move="1" aria-label="다음 달" ${canGo(1) ? '' : 'disabled'}>›</button>
      </div>
      <div class="calendar-grid">
        ${WEEKDAYS.map((w, i) => `<span class="calendar-weekday${i === 0 ? ' is-sun' : i === 6 ? ' is-sat' : ''}">${w}</span>`).join('')}
        ${blanks.join('')}${days.join('')}
      </div>`;
  };

  root.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-move]');
    if (nav && !nav.disabled) {
      const next = monthStart(view.year, view.month + Number(nav.dataset.move));
      view = { year: next.getUTCFullYear(), month: next.getUTCMonth() };
      render();
      return;
    }

    const day = event.target.closest('[data-date]');
    if (!day || day.disabled) return;
    selected = day.dataset.date;
    render();
    root.querySelector(`[data-date="${selected}"]`)?.focus();
    onSelect(selected);
  });

  render();

  return {
    clear() {
      selected = null;
      render();
    },
    refresh: render,
  };
};

export default createCalendar;
