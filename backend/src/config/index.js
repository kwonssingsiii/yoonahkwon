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
   * 데이터 저장소 종류. 'supabase' | 'json' | 'mongo'
   * 기본값은 supabase — 포트폴리오 내용의 원본은 Supabase 테이블입니다.
   * DB 없이 시험할 때만 DATA_SOURCE=json (backend/src/data/portfolio.json, 예비용).
   * (repositories/index.js 가 이 값을 보고 구현체를 고릅니다.)
   */
  dataSource: process.env.DATA_SOURCE ?? 'supabase',

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
   * Supabase 접속 정보 — backend/.env (배포는 Vercel 환경변수) 에서만 읽습니다.
   * publishable 키만 넣으세요. 조회 권한이 있는 secret/service_role 키는 절대 넣지 마세요.
   */
  supabase: {
    url: (process.env.SUPABASE_URL ?? '').trim().replace(/\/$/, ''),
    key: (process.env.SUPABASE_PUBLISHABLE_KEY ?? '').trim(),
  },

  /** 외부 API 연동용 자리. services/external/ 에서 사용합니다. */
  external: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL ?? '',
    apiKey: process.env.EXTERNAL_API_KEY ?? '',
    timeoutMs: toInt(process.env.EXTERNAL_API_TIMEOUT_MS, 8000),
  },
};

/** Supabase 를 쓰도록 골랐는데 열쇠가 비어 있으면, 요청이 실패하기 전에 서버 시작 단계에서 알려 줍니다. */
const usesSupabase = config.dataSource === 'supabase' || config.reservationStore === 'supabase';
const validUrl = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.supabase.url);
const validKey = /^(sb_publishable_|eyJ)[\w.-]+$/.test(config.supabase.key) || config.supabase.key.startsWith('sb_secret_');
if (usesSupabase && (!validUrl || !validKey)) {
  throw new Error(
    'SUPABASE_URL 또는 SUPABASE_PUBLISHABLE_KEY 가 비어 있거나 예시 값 그대로입니다. ' +
      'backend/.env 에 Supabase 대시보드 → Project Settings → API Keys 의 값을 넣어 주세요. ' +
      '(DB 없이 시험하려면 DATA_SOURCE=json, RESERVATION_STORE=json)',
  );
}
if (usesSupabase && config.supabase.key.startsWith('sb_secret_')) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY 에 secret 키가 들어 있습니다. sb_publishable_ 로 시작하는 키로 바꿔 주세요.');
}

export default config;
