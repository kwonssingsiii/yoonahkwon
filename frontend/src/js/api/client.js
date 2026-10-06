/**
 * 공통 fetch 래퍼 — 타임아웃, 에러 통일, 응답 언래핑을 담당합니다.
 * 백엔드는 항상 { success, data } 또는 { success:false, error } 로 응답합니다.
 */
import config from '../config.js';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const request = async (path, { method = 'GET', body, query, signal } = {}) => {
  const url = new URL(`${config.apiBase}${path}`, window.location.origin);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false || payload === null) {
      throw new ApiError(payload?.error?.message ?? `요청 실패 (${response.status}, JSON 이 아닌 응답)`, {
        status: response.status,
        details: payload?.error?.details,
      });
    }

    return payload?.data ?? payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(`요청 시간이 초과되었습니다 (${config.requestTimeoutMs}ms)`, { status: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
};

export default api;
