/**
 * Nager.Date 한국 공휴일 — API 키가 필요 없는 공개 API 입니다.
 * 설날 · 추석 같은 음력 공휴일과 대체공휴일도 실제 날짜로 내려줍니다.
 * https://date.nager.at/
 */
import requestExternal from './httpClient.js';

export const NAGER_DATE_SOURCE = { name: 'Nager.Date', url: 'https://date.nager.at/' };

export const fetchKoreanHolidays = async (year) => {
  const holidays = await requestExternal(`/api/v3/PublicHolidays/${year}/KR`, {
    baseUrl: 'https://date.nager.at',
  });
  return holidays.map(({ date, localName }) => ({ date, name: localName }));
};

export default fetchKoreanHolidays;
