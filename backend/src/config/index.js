/**
 * 환경 설정 단일 진입점.
 * 코드 어디에서도 process.env 를 직접 읽지 않고 여기서만 읽습니다.
 * → 나중에 DB/외부 API 를 붙일 때 이 파일 하나만 보면 필요한 키를 알 수 있습니다.
 */
import 'dotenv/config';

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isNaN(n) ? fallback : n;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 4000),

  /** 프론트엔드 출처(CORS 허용 목록). 쉼표로 여러 개 지정 가능. */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /**
   * 데이터 저장소 종류. 'json' | 'mongo'
   * DB 를 붙이는 순간 .env 에서 DATA_SOURCE=mongo 로만 바꾸면 됩니다.
   * (repositories/index.js 가 이 값을 보고 구현체를 고릅니다.)
   */
  dataSource: process.env.DATA_SOURCE ?? 'json',

  /** DB 접속 정보 — DATA_SOURCE 가 json 이 아닐 때만 사용됩니다. */
  db: {
    uri: process.env.DATABASE_URL ?? '',
    name: process.env.DATABASE_NAME ?? 'portfolio',
  },

  /**
   * 방문 예약 저장소. 'supabase' | 'json'
   * 기본값은 supabase — Vercel 서버리스에서도 예약이 사라지지 않습니다.
   * 로컬에서 DB 없이 시험할 때는 RESERVATION_STORE=json (메모리, 재시작 시 사라짐).
   */
  reservationStore: process.env.RESERVATION_STORE ?? 'supabase',

  /**
   * Supabase 접속 정보. publishable 키는 브라우저에 노출돼도 되는 공개 키이고,
   * reservations 테이블은 RLS 로 "추가만 가능 · 조회 불가" 로 막혀 있어 기본값으로 둡니다.
   * 조회 권한이 있는 secret/service_role 키는 절대 여기에 넣지 마세요.
   */
  supabase: {
    url: process.env.SUPABASE_URL ?? 'https://tzvbuggdqoekgocxqxaz.supabase.co',
    key: process.env.SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_Otc9MamUF-N1JlSNaLYoqw_Rl9nixHP',
  },

  /** 외부 API 연동용 자리. services/external/ 에서 사용합니다. */
  external: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL ?? '',
    apiKey: process.env.EXTERNAL_API_KEY ?? '',
    timeoutMs: toInt(process.env.EXTERNAL_API_TIMEOUT_MS, 8000),
  },
};

export default config;
