/**
 * 찾아오는 길 주소(portfolio.json 의 location.coordinates) 기준 현재 날씨.
 * 방문자마다 외부 API 를 부르지 않도록 10분간 캐시합니다.
 * 날씨 제공처를 바꾸려면 services/external/ 에 같은 형태를 돌려주는 함수를 만들어 교체하면 됩니다.
 */
import { portfolioRepository } from '../repositories/index.js';
import { fetchCurrentWeather, OPEN_METEO_SOURCE } from './external/openMeteo.js';
import ApiError from '../utils/ApiError.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = null; // { key, expiresAt, data }

export const weatherService = {
  async getForLocation() {
    const location = await portfolioRepository.findLocation();
    const coords = location?.coordinates;
    if (!coords) throw ApiError.notFound('날씨를 조회할 좌표가 설정되지 않았습니다.');

    const key = `${coords.lat},${coords.lon}`;
    if (cache?.key === key && cache.expiresAt > Date.now()) return cache.data;

    const data = { ...(await fetchCurrentWeather(coords)), source: OPEN_METEO_SOURCE };
    cache = { key, expiresAt: Date.now() + CACHE_TTL_MS, data };
    return data;
  },
};

export default weatherService;
