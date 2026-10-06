/** 방문 예약 — 빈 시간 조회와 예약 신청. */
import api from './client.js';

export const reservationApi = {
  getAvailability: (date) => api.get('/reservations/availability', { query: { date } }),
  /** 모든 시간이 예약 완료된 날짜 { fullDates: ['2026-10-07', ...] } */
  getFullDates: () => api.get('/reservations/full-dates'),
  create: ({ name, email, purpose, date, time, consent }) =>
    api.post('/reservations', { name, email, purpose, date, time, consent }),
};

export default reservationApi;
