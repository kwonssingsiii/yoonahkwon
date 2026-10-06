/** 찾아오는 길 주소 기준 현재 날씨 (백엔드가 Open-Meteo 를 대신 호출합니다). */
import api from './client.js';

export const weatherApi = {
  getCurrent: () => api.get('/weather'),
};

export default weatherApi;
