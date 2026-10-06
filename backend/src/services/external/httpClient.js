/**
 * 외부 API 호출용 공통 클라이언트 (타임아웃 + 에러 변환).
 *
 * ▶ 다른 API(공공데이터포털 대기질, 날씨, 지도 등)를 붙일 때
 *   1) backend/.env 에 EXTERNAL_API_BASE_URL / EXTERNAL_API_KEY 설정
 *   2) services/external/ 아래에 파일 하나 만들고 requestExternal() 사용
 *   3) 결과를 가공해서 서비스 → 컨트롤러 → 라우트로 노출
 *
 * 예시:
 *   const data = await requestExternal('/air-quality', { query: { sido: '서울' } });
 *
 * 키가 필요 없는 공개 API 는 baseUrl 을 직접 넘기면 됩니다.
 * 이때는 EXTERNAL_API_KEY 가 다른 서비스로 새지 않도록 Authorization 헤더를 붙이지 않습니다.
 *   const data = await requestExternal('/v1/forecast', { baseUrl: 'https://api.open-meteo.com', query });
 */
import config from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';

export const requestExternal = async (path, { method = 'GET', query, body, headers, baseUrl } = {}) => {
  const useDefaultApi = !baseUrl;
  if (useDefaultApi && !config.external.baseUrl) {
    throw ApiError.internal('EXTERNAL_API_BASE_URL 이 설정되지 않았습니다. backend/.env 를 확인하세요.');
  }

  const url = new URL(path, baseUrl ?? config.external.baseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.external.timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(useDefaultApi && config.external.apiKey ? { Authorization: `Bearer ${config.external.apiKey}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw new ApiError(response.status, `외부 API 오류 (${response.status}): ${url.pathname}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(504, `외부 API 응답 시간 초과 (${config.external.timeoutMs}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export default requestExternal;
