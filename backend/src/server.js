/** 로컬 개발용 서버 진입점. */
import { createApp } from './app.js';
import config from './config/index.js';
import { activeDataSource } from './repositories/index.js';

const app = createApp({ serveFrontend: true });

app.listen(config.port, () => {
  console.log('');
  console.log('  🌿 그린스마트시티 포트폴리오 백엔드');
  console.log(`  ▸ 서버      http://localhost:${config.port}`);
  console.log(`  ▸ API       http://localhost:${config.port}/api/health`);
  console.log(`  ▸ 환경      ${config.env}`);
  console.log(`  ▸ 데이터    ${activeDataSource}`);
  console.log('');
});
