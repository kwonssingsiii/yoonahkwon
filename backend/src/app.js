/**
 * Express 앱 조립만 담당합니다 — listen() 은 하지 않습니다.
 * 덕분에 같은 앱을 로컬 서버(server.js), Vercel 서버리스(api/index.js),
 * 테스트 코드에서 그대로 재사용할 수 있습니다.
 */
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';

import config from './config/index.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const FRONTEND_DIR = fileURLToPath(new URL('../../frontend/', import.meta.url));

export const createApp = ({ serveFrontend = false } = {}) => {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(
    cors({
      origin(origin, callback) {
        // 같은 출처 요청(origin 없음)과 허용 목록에 있는 출처만 통과시킵니다.
        if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS 차단된 출처: ${origin}`));
      },
    }),
  );

  // ── API ──────────────────────────────────
  app.use('/api', routes);

  // ── 로컬 개발 시 프론트엔드도 같은 서버에서 제공 ──
  if (serveFrontend) {
    // frontend/ 전체를 정적 서빙합니다 (/index.html, /src/**, /assets/**).
    app.use(express.static(FRONTEND_DIR, { index: 'index.html' }));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
