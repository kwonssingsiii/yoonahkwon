/** 방문 예약 — 빈 시간 조회와 예약 신청. */
import api from './client.js';

export const reservationApi = {
  getAvailability: (date) => api.get('/reservations/availability', { query: { date } }),
  create: ({ name, email, phone, date, time, purpose, message }) =>
    api.post('/reservations', { name, email, phone, date, time, purpose, message }),
};

export default reservationApi;
