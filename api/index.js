/**
 * Vercel 서버리스 함수 진입점.
 * backend 의 Express 앱을 그대로 감싸서 /api/* 요청을 처리합니다.
 * (정적 프론트엔드는 Vercel 이 직접 서빙하므로 serveFrontend 는 끕니다.)
 */
import { createApp } from '../backend/src/app.js';

export default createApp({ serveFrontend: false });
