/**
 * 예비 데이터(frontend/src/data/fallback.json) 만들기.
 *
 * 프론트엔드는 API 가 죽었을 때 fallback.json 으로 화면을 그립니다.
 * 원본 데이터가 Supabase 로 옮겨졌으므로, 기본은 "Supabase → fallback.json" 입니다.
 * Supabase 에서 내용을 고친 뒤 `npm run sync:fallback` 을 실행해 둘을 맞춰 주세요.
 *
 *   npm run sync:fallback              Supabase(공개용 뷰) → fallback.json   (backend/.env 의 열쇠 사용)
 *   npm run sync:fallback -- --json    backend/src/data/portfolio.json → fallback.json  (DB 없이)
 *
 * 공개용 뷰에서 읽으므로 비공개로 가려 둔 값은 fallback.json 에도 들어가지 않습니다.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const jsonSource = fileURLToPath(new URL('../backend/src/data/portfolio.json', import.meta.url));
const target = fileURLToPath(new URL('../frontend/src/data/fallback.json', import.meta.url));

if (process.argv.includes('--json')) {
  const raw = await readFile(jsonSource, 'utf-8');
  JSON.parse(raw); // 형식 검증
  await writeFile(target, raw);
  console.log('✅ fallback.json 동기화 완료 (출처: portfolio.json)');
} else {
  // backend/src/config 가 import 되기 전에 backend/.env 를 먼저 읽어 둡니다.
  dotenv.config({ path: fileURLToPath(new URL('../backend/.env', import.meta.url)) });
  const { supabasePortfolioRepository } = await import(
    '../backend/src/repositories/supabase/portfolio.repository.js'
  );

  const data = await supabasePortfolioRepository.findAll();
  if (!data) throw new Error('Supabase 에 포트폴리오 데이터가 없습니다. (profiles 테이블이 비어 있음)');

  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`);
  console.log('✅ fallback.json 동기화 완료 (출처: Supabase)');
}
