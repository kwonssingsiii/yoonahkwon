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
  /**
   * 예약 알림 메일을 보낼 Formspree 폼 주소.
   * 받는 이메일 주소는 코드가 아니라 Formspree 대시보드의 폼 설정에서 정합니다.
   */
  formspreeEndpoint: 'https://formspree.io/f/myekzzkq',
  /**
   * 관리자 화면(admin*.html)이 로그인 · 예약 조회에 쓰는 Supabase.
   * publishable 키는 공개용이며, 예약 조회 · 상태 변경은 RLS 로 관리자 계정만 가능합니다.
   */
  supabase: {
    url: 'https://tzvbuggdqoekgocxqxaz.supabase.co',
    publishableKey: 'sb_publishable_Otc9MamUF-N1JlSNaLYoqw_Rl9nixHP',
  },
};

export default config;
