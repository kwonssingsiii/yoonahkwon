/** 예약 폼 — 날짜를 고르면 빈 시간을 불러오고, 제출 시 서버 검증 결과를 칸별로 보여 줍니다. */
import reservationApi from '../api/reservation.api.js';
import { escapeHtml, joinHtml } from '../render/dom.js';

export const initReservation = () => {
  const form = document.getElementById('reservation-form');
  if (!form) return;

  const dateInput = form.elements.date;
  const slotsBox = document.getElementById('reservation-slots');
  const status = document.getElementById('reservation-status');
  const submit = document.getElementById('reservation-submit');

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.dataset.type = type;
  };

  const showErrors = (errors = {}) => {
    form.querySelectorAll('[data-error-for]').forEach((el) => {
      el.textContent = errors[el.dataset.errorFor] ?? '';
    });
  };

  const showSlotHint = (message) => {
    slotsBox.innerHTML = `<p class="slot-hint">${escapeHtml(message)}</p>`;
  };

  const loadSlots = async () => {
    const date = dateInput.value;
    showErrors();
    if (!date) {
      showSlotHint('날짜를 먼저 선택해 주세요.');
      return;
    }

    showSlotHint('예약 가능한 시간을 불러오는 중…');
    try {
      const { slots } = await reservationApi.getAvailability(date);
      if (dateInput.value !== date) return; // 그 사이 다른 날짜를 골랐다면 무시

      if (!slots.some((slot) => slot.available)) {
        showSlotHint('이 날짜는 예약이 모두 찼습니다. 다른 날짜를 선택해 주세요.');
        return;
      }

      slotsBox.innerHTML = joinHtml(
        slots,
        (slot) => `
        <label class="slot${slot.available ? '' : ' is-disabled'}">
          <input type="radio" name="time" value="${escapeHtml(slot.time)}" ${slot.available ? '' : 'disabled'} />
          <span>${escapeHtml(slot.time)}</span>
        </label>`,
      );
    } catch (error) {
      showSlotHint(error.status ? error.message : '예약 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  dateInput.addEventListener('change', loadSlots);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));

    if (!payload.time) {
      showErrors({ time: '예약 시간을 선택해 주세요.' });
      return;
    }

    showErrors();
    setStatus('예약을 신청하는 중…');
    submit.disabled = true;

    try {
      const created = await reservationApi.create(payload);
      form.reset();
      showSlotHint('날짜를 먼저 선택해 주세요.');
      setStatus(
        `${created.date} ${created.time} 예약 신청이 접수되었습니다. ${created.email} 로 확인 연락을 드릴게요.`,
        'success',
      );
    } catch (error) {
      showErrors(error.details);
      setStatus(error.status ? error.message : '예약 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 'error');
      if (error.status === 409) loadSlots();
    } finally {
      submit.disabled = false;
    }
  });
};

export default initReservation;
