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

  /** 외부 API 연동용 자리. services/external/ 에서 사용합니다. */
  external: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL ?? '',
    apiKey: process.env.EXTERNAL_API_KEY ?? '',
    timeoutMs: toInt(process.env.EXTERNAL_API_TIMEOUT_MS, 8000),
  },
};

export default config;
