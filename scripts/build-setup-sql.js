/**
 * supabase/migrations/*.sql → supabase/setup_all.sql (새 Supabase 프로젝트를 한 번에 세우는 파일)
 *
 * 마이그레이션을 추가 · 수정한 뒤 `npm run build:setup-sql` 을 실행하세요.
 * 파일 이름 순서(= 날짜 순서)대로 이어 붙이고 begin ~ commit 으로 묶습니다.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const target = fileURLToPath(new URL('../supabase/setup_all.sql', import.meta.url));
const BAR = '▼'.repeat(55);

/**
 * 기본은 파일 이름 순서(날짜 → 번호)입니다.
 * 번호 없이 같은 날짜에 만든 초기 예약 파일 3개만 실제 실행 순서를 따로 지정합니다.
 * (이름순이면 admin_reservations 가 테이블을 만드는 create_reservations 보다 먼저 와서 실패)
 */
const FIXED_ORDER = [
  '20261006_create_reservations.sql',
  '20261006_booked_slots_range.sql',
  '20261006_admin_reservations.sql',
];
const sortKey = (f) => {
  const fixed = FIXED_ORDER.indexOf(f);
  return `${f.slice(0, 8)}|${fixed === -1 ? 'z' : String(fixed)}|${f}`;
};

const files = (await readdir(dir))
  .filter((f) => f.endsWith('.sql'))
  .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

const header = `-- =====================================================================
-- 새 Supabase 프로젝트 한 번에 세우기 (예약 기능 + 포트폴리오 DB)
--
-- 사용법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--   - 빈 새 프로젝트에서 "한 번만" 실행하세요. (두 번 실행하면 "already exists" 오류)
--   - begin ~ commit 으로 묶여 있어, 중간에 오류가 나면 아무것도 바뀌지 않습니다.
--   - 이미 운영 중인 프로젝트에는 이 파일 대신 새로 추가된 migrations 파일만 실행하세요.
--
-- ※ 자동 생성 파일입니다. 직접 고치지 말고 migrations 를 고친 뒤 \`npm run build:setup-sql\`.
--
-- 포함된 파일 (실행 순서):
${files.map((f, i) => `--   ${String(i + 1).padStart(2, ' ')}) ${f}`).join('\n')}
-- =====================================================================

begin;
`;

const body = [];
for (const file of files) {
  const sql = (await readFile(`${dir}${file}`, 'utf-8')).trim();
  body.push(`\n\n-- ${BAR}\n-- 파일: migrations/${file}\n-- ${BAR}\n\n${sql}\n`);
}

await writeFile(target, `${header}${body.join('')}\n\ncommit;\n`);
console.log(`✅ setup_all.sql 생성 완료 (${files.length}개 파일)`);
