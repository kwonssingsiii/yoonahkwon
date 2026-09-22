/**
 * 포트폴리오 데이터 접근 계층.
 * 화면 코드(render/*)는 fetch 를 직접 부르지 않고 항상 이 파일을 거칩니다.
 * → API 주소나 응답 형태가 바뀌어도 여기만 고치면 됩니다.
 */
import api, { ApiError } from './client.js';
import config from '../config.js';

/** 백엔드가 없거나 실패했을 때 사용할 로컬 데이터 */
const loadFallback = async () => {
  const response = await fetch(new URL('../../data/fallback.json', import.meta.url));
  if (!response.ok) throw new Error('fallback.json 을 불러오지 못했습니다.');
  return response.json();
};

export const portfolioApi = {
  /** 전체 데이터 한 번에 — 첫 렌더에 사용합니다. */
  async getAll() {
    try {
      return { data: await api.get('/portfolio'), source: 'api' };
    } catch (error) {
      if (!config.useFallbackData) throw error;
      console.warn('[portfolio] API 호출 실패 → 로컬 데이터로 대체합니다.', error.message);
      return { data: await loadFallback(), source: 'fallback' };
    }
  },

  getAwards: (tag) => api.get('/portfolio/awards', { query: { tag } }),
  getAwardById: (id) => api.get(`/portfolio/awards/${encodeURIComponent(id)}`),
  getHealth: () => api.get('/health'),
};

export { ApiError };
export default portfolioApi;
