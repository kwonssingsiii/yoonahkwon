/**
 * backend/src/data/portfolio.json → frontend/src/data/fallback.json 복사.
 *
 * 프론트엔드는 API 가 죽었을 때 fallback.json 으로 화면을 그립니다.
 * 데이터(JSON)를 고친 뒤 `npm run sync:fallback` 를 실행해 둘을 맞춰 주세요.
 * (나중에 DB 로 옮기면 이 스크립트는 DB → fallback 덤프로 바꾸면 됩니다.)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../backend/src/data/portfolio.json', import.meta.url));
const target = fileURLToPath(new URL('../frontend/src/data/fallback.json', import.meta.url));

const raw = await readFile(source, 'utf-8');
JSON.parse(raw); // 형식 검증
await writeFile(target, raw);

console.log('✅ fallback.json 동기화 완료');
