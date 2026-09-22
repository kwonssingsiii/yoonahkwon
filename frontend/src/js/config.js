/**
 * 프론트엔드 설정.
 * API 주소를 바꿀 일이 생기면 이 파일만 고치면 됩니다.
 */

const resolveApiBase = () => {
  // 1순위: index.html 의 <meta name="api-base" content="..."> 값
  const meta = document.querySelector('meta[name="api-base"]')?.content?.trim();
  if (meta) return meta.replace(/\/$/, '');

  // 2순위: 정적 서버(Live Server, vite preview 등)로 프론트만 띄운 경우
  const { hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal && port && port !== '4000') return 'http://localhost:4000/api';

  // 기본: 같은 출처의 /api (백엔드 통합 실행 · Vercel 배포 모두 해당)
  return '/api';
};

export const config = {
  apiBase: resolveApiBase(),
  requestTimeoutMs: 8000,
  /** API 가 죽어도 페이지가 비지 않도록 번들된 로컬 데이터로 대체할지 여부 */
  useFallbackData: true,
};

export default config;
