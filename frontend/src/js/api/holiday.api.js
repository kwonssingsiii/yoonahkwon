/** 한국 공휴일 (백엔드가 Nager.Date 를 대신 호출합니다). */
import api from './client.js';

export const holidayApi = {
  getByYear: (year) => api.get('/holidays', { query: { year } }),
};

export default holidayApi;
