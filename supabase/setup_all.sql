-- =====================================================================
-- 새 Supabase 프로젝트 한 번에 세우기 (예약 기능 + 포트폴리오 DB)
--
-- 사용법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--   - 빈 새 프로젝트에서 "한 번만" 실행하세요. (두 번 실행하면 "already exists" 오류)
--   - begin ~ commit 으로 묶여 있어, 중간에 오류가 나면 아무것도 바뀌지 않습니다.
--   - 이미 운영 중인 프로젝트에는 이 파일 대신 새로 추가된 migrations 파일만 실행하세요.
--
-- ※ 자동 생성 파일입니다. 직접 고치지 말고 migrations 를 고친 뒤 `npm run build:setup-sql`.
--
-- 포함된 파일 (실행 순서):
--    1) 20261006_create_reservations.sql
--    2) 20261006_booked_slots_range.sql
--    3) 20261006_admin_reservations.sql
--    4) 20261013_01_column_visibility.sql
--    5) 20261013_02_profiles.sql
--    6) 20261013_03_tags.sql
--    7) 20261013_04_profile_items.sql
--    8) 20261013_05_junctions.sql
--    9) 20261013_06_rls.sql
--   10) 20261013_07_public_views.sql
--   11) 20261013_08_seed.sql
--   12) 20261013_09_fix_is_col_public.sql
--   13) 20261027_01_award_works.sql
--   14) 20261027_02_award_work_urban_forest.sql
--   15) 20261027_03_award_work_traditional_landscape.sql
-- =====================================================================

begin;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261006_create_reservations.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- (이미 적용됨 — 기록용) 방문 예약 테이블 · 방문자 추가 전용 RLS · 빈 시간 조회 함수
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  email text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  purpose text not null check (char_length(purpose) between 1 and 500),
  visit_date date not null,
  visit_time time not null,
  consent boolean not null check (consent),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

comment on table public.reservations is '포트폴리오 방문 예약. 방문자는 추가만 가능하고 조회는 대시보드(운영자)에서만 합니다.';

-- 취소되지 않은 예약끼리 같은 날짜·시간 중복 금지
create unique index reservations_slot_unique
  on public.reservations (visit_date, visit_time)
  where status <> 'cancelled';

alter table public.reservations enable row level security;

create policy "anyone can create a pending reservation"
  on public.reservations for insert
  to anon, authenticated
  with check (status = 'pending' and consent);

create or replace function public.booked_times(p_date date)
returns setof time
language sql
stable
security definer
set search_path = ''
as $$
  select r.visit_time
  from public.reservations r
  where r.visit_date = p_date and r.status <> 'cancelled';
$$;

revoke all on function public.booked_times(date) from public;
grant execute on function public.booked_times(date) to anon, authenticated;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261006_booked_slots_range.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- (적용됨) 예약 페이지 캘린더용: 기간 안의 "예약된 날짜 · 시간"만 돌려줍니다. (예약자 정보 없음)
-- 시간을 차지하는 상태는 유니크 인덱스 reservations_slot_unique 와 같게 "취소가 아닌 모든 예약"입니다.
create or replace function public.booked_slots(p_from date, p_to date)
returns table (visit_date date, visit_time time)
language sql
stable
security definer
set search_path = ''
as $$
  select r.visit_date, r.visit_time
  from public.reservations r
  where r.visit_date between p_from and p_to
    and r.status <> 'cancelled'
    and p_to - p_from <= 92;
$$;

revoke all on function public.booked_slots(date, date) from public;
grant execute on function public.booked_slots(date, date) to anon, authenticated;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261006_admin_reservations.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- 관리자 예약 관리 (admin-reservations.html) 를 위한 변경
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여 넣고 Run 하세요. (한 번만)
--
--   1) 처리 상태 4가지: pending(접수) · confirmed(확정) · change_requested(변경 요청) · cancelled(취소)
--   2) 예약번호 reservation_no: 방문 희망 날짜·시간 + 예약자(이름/이메일) 코드
--      예) R261007-1330-A1B2  → 같은 사람이 여러 번 와도 방문 시간별로 번호가 다릅니다.
--   3) 관리자 명단(admins)에 있는 이메일로 로그인한 계정만 예약 조회 · "상태" 변경 가능
--      (이름 · 이메일 · 시간은 관리자도 수정 불가, 방문자는 지금처럼 추가만 가능)
-- =====================================================================

-- 1) 처리 상태
alter table public.reservations drop constraint reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'change_requested', 'cancelled'));

-- 2) 예약번호 · 상태 변경 시각
alter table public.reservations add column reservation_no text;
alter table public.reservations add column status_updated_at timestamptz;

create or replace function public.set_reservation_no()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reservation_no :=
    'R' || to_char(new.visit_date, 'YYMMDD') || '-' || to_char(new.visit_time, 'HH24MI') || '-' ||
    upper(substr(md5(lower(new.email) || '|' || new.name), 1, 4));
  return new;
end;
$$;

create trigger reservations_set_no
  before insert or update of name, email, visit_date, visit_time on public.reservations
  for each row execute function public.set_reservation_no();

-- 이미 들어와 있는 예약에도 번호를 채웁니다.
update public.reservations
set reservation_no =
  'R' || to_char(visit_date, 'YYMMDD') || '-' || to_char(visit_time, 'HH24MI') || '-' ||
  upper(substr(md5(lower(email) || '|' || name), 1, 4));

alter table public.reservations alter column reservation_no set not null;
create unique index reservations_no_unique on public.reservations (reservation_no) where status <> 'cancelled';

create or replace function public.touch_status_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger reservations_touch_status
  before update of status on public.reservations
  for each row execute function public.touch_status_updated_at();

-- 3) 관리자 명단 · 권한
create table public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 관리자 이메일 (Authentication → Users 에 같은 이메일로 계정을 만들어야 로그인됩니다)
insert into public.admins (email) values ('kwonssingsi@gmail.com');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "admins can read reservations"
  on public.reservations for select
  to authenticated
  using ((select public.is_admin()));

create policy "admins can update reservation status"
  on public.reservations for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 관리자는 "상태" 만 바꿀 수 있게
revoke update on public.reservations from authenticated;
grant update (status) on public.reservations to authenticated;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_01_column_visibility.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 1/8] 열(column) 공개 스위치판 + 공용 함수
--
--   column_visibility : "어느 테이블의 어느 열을 공개할지" 를 적어 두는 표
--   is_col_public()   : 공개용 뷰가 이 표를 확인할 때 쓰는 함수 (표에 없으면 비공개)
--   touch_updated_at(): 행을 고치면 updated_at 을 자동으로 지금 시각으로 바꿈
-- =====================================================================

create table public.column_visibility (
  table_name  text not null,
  column_name text not null,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (table_name, column_name)
);
comment on table public.column_visibility is
  '열 단위 공개 스위치. is_public 을 바꾸면 *_public 뷰에서 해당 열이 보이거나 NULL 로 가려집니다.';

create or replace function public.is_col_public(p_table text, p_column text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select v.is_public from public.column_visibility v
     where v.table_name = p_table and v.column_name = p_column),
    false
  );
$$;

-- ※ 이 revoke 때문에 뷰가 오류를 냈습니다. 09_fix_is_col_public.sql 에서 바로잡습니다.
revoke all on function public.is_col_public(text, text) from public, anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_02_profiles.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 2/8] profiles — 기본 정보 (한 사람 = 한 행)
--
-- 예전에는 "상명대학교 · 그린스마트시티학과 · 3학년" 이 여러 곳에 따로 적혀 있었습니다.
-- 이제 여기 한 곳만 고치면 메인 화면 · 소개 카드 · 연락처 카드가 함께 바뀝니다.
-- =====================================================================

create table public.profiles (
  id                text primary key,
  name              text not null,
  name_spaced       text,                         -- 메인 화면용 "권 윤 아"
  name_en           text,
  university        text not null,
  department        text not null,
  grade             text,                         -- "3학년"
  enrollment_status text not null default '재학 중',
  greeting          text,                         -- "안녕하세요, 저는"
  tagline           text,                         -- 한 줄 소개
  bio               text[] not null default '{}', -- 자기소개 문단들 (<strong> 허용)
  contact_intro     text,                         -- 연락처 섹션 안내 문구 (<br /> 허용)
  memo              text,                         -- 본인 메모 (항상 비공개)
  updated_at        timestamptz not null default now()
);
comment on table public.profiles is '포트폴리오 주인의 기본 정보. 다른 테이블은 profile_id 로 여기에 연결됩니다.';


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_03_tags.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 3/8] tags — 태그 사전
--
-- "도시숲" 처럼 소개 · 공모전에서 함께 쓰는 태그를 한 번만 저장합니다.
-- 어디에 붙는지는 연결 테이블(profile_tags, award_tags)이 정합니다.
-- =====================================================================

create table public.tags (
  id         text primary key,          -- 화면의 요소 id 로도 쓰입니다 (tag-1 ...)
  label      text not null unique,
  icon       text,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on table public.tags is '공용 태그. is_public=false 면 이 태그가 붙은 모든 곳에서 함께 숨겨집니다.';


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_04_profile_items.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 4/8] 기능별 테이블 — 모두 profile_id 로 profiles 에 연결
--
--   educations            학력
--   awards                공모전
--   skills                관심 분야
--   contacts              실제 연락 수단 (이메일 · SNS 등, 기본 비공개)
--   locations             찾아오는 길
--   reservation_settings  예약 설정 (시간표 · 휴무 요일)
--   site_meta             페이지 제목 · 설명 · 저작권
--   nav_items             상단 메뉴
-- =====================================================================

create table public.educations (
  id           text primary key,
  profile_id   text not null references public.profiles (id) on delete cascade,
  period_label text,                          -- "현재", "2024 - 2026" 등
  title        text not null,                 -- 학교 이름
  subtitle     text,
  description  text,
  badges       jsonb not null default '[]',   -- [{ "label": "재학 중", "variant": "green" }]
  sort_order   int not null default 0,
  is_public    boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table public.awards (
  id          text primary key,
  profile_id  text not null references public.profiles (id) on delete cascade,
  icon        text,
  title       text not null,
  description text,
  year        smallint,                       -- 참가 연도
  result      text,                           -- 참가 · 입선 · 수상 등
  memo        text,                           -- 본인 메모 (항상 비공개)
  sort_order  int not null default 0,         -- 화면의 01, 02 번호는 이 순서로 매겨집니다
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.skills (
  id          text primary key,
  profile_id  text not null references public.profiles (id) on delete cascade,
  icon        text,
  name        text not null,
  description text,
  sort_order  int not null default 0,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.contacts (
  id          text primary key,
  profile_id  text not null references public.profiles (id) on delete cascade,
  type        text not null,                  -- email · instagram · github · phone ...
  icon        text,
  label       text not null,
  value       text not null,
  sort_order  int not null default 0,
  is_public   boolean not null default false, -- 연락처는 기본 비공개
  updated_at  timestamptz not null default now()
);

create table public.locations (
  profile_id  text primary key references public.profiles (id) on delete cascade,
  intro       text,
  place_name  text,
  address     text,
  map_query   text,
  lat         double precision,
  lon         double precision,
  directions  jsonb not null default '[]',    -- [{ "id", "icon", "label", "value" }]
  note        text,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.reservation_settings (
  profile_id       text primary key references public.profiles (id) on delete cascade,
  intro            text,
  duration_minutes int not null default 30,
  time_slots       text[] not null default '{}',
  closed_weekdays  smallint[] not null default '{0,6}', -- 0=일 ~ 6=토
  max_days_ahead   int not null default 30,
  updated_at       timestamptz not null default now()
);

create table public.site_meta (
  profile_id  text primary key references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  copyright   text,
  updated_at  timestamptz not null default now()
);

create table public.nav_items (
  id          bigint generated always as identity primary key,
  profile_id  text not null references public.profiles (id) on delete cascade,
  href        text not null,
  label       text not null,
  sort_order  int not null default 0,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create index educations_profile_idx on public.educations (profile_id, sort_order);
create index awards_profile_idx     on public.awards (profile_id, sort_order);
create index skills_profile_idx     on public.skills (profile_id, sort_order);
create index contacts_profile_idx   on public.contacts (profile_id, sort_order);
create index nav_items_profile_idx  on public.nav_items (profile_id, sort_order);


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_05_junctions.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 5/8] 연결 테이블 — 태그를 소개 · 공모전에 붙이는 "다리"
-- =====================================================================

create table public.profile_tags (
  profile_id text not null references public.profiles (id) on delete cascade,
  tag_id     text not null references public.tags (id) on delete cascade,
  sort_order int not null default 0,
  primary key (profile_id, tag_id)
);

create table public.award_tags (
  award_id   text not null references public.awards (id) on delete cascade,
  tag_id     text not null references public.tags (id) on delete cascade,
  sort_order int not null default 0,
  primary key (award_id, tag_id)
);

create index profile_tags_tag_idx on public.profile_tags (tag_id);
create index award_tags_tag_idx   on public.award_tags (tag_id);


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_06_rls.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 6/8] 잠금 장치 (RLS · 권한)
--
--   방문자(anon)       : 원본 테이블은 아예 못 봄 → 07 의 *_public 뷰만 읽음
--   관리자(admins 명단) : 원본 테이블을 읽고 · 추가 · 수정 · 삭제 가능
--                        (예약 관리에서 쓰는 public.is_admin() 을 그대로 재사용)
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'column_visibility', 'profiles', 'tags', 'educations', 'awards', 'skills', 'contacts',
    'locations', 'reservation_settings', 'site_meta', 'nav_items', 'profile_tags', 'award_tags'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))',
      t
    );
  end loop;

  -- 행을 고칠 때 updated_at 자동 갱신 (연결 테이블은 updated_at 이 없어 제외)
  foreach t in array array[
    'column_visibility', 'profiles', 'tags', 'educations', 'awards', 'skills', 'contacts',
    'locations', 'reservation_settings', 'site_meta', 'nav_items'
  ]
  loop
    execute format(
      'create trigger %1$s_touch_updated_at before update on public.%1$I
         for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end;
$$;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_07_public_views.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 7/8] 공개용 뷰 (*_public) — 방문자 · 백엔드가 읽는 "진열장"
--
--   ① 행 : where is_public           → 숨긴 항목은 아예 빠짐
--   ② 열 : is_col_public('표','열')  → 꺼 둔 열은 NULL 로 가려짐
--   ③ 항상 비공개 열(memo 등)은 뷰에 처음부터 넣지 않음
--
-- 뷰는 소유자 권한(security_invoker = false)으로 실행돼야 잠긴 원본 테이블을 읽을 수 있습니다.
-- Supabase Advisor 의 "security definer view" 경고는 이 설계 때문이며 의도된 것입니다.
-- 원본 테이블에 열을 추가하면 여기에도 직접 추가해야 사이트에 나옵니다.
-- =====================================================================

create view public.profiles_public with (security_invoker = false) as
select
  id, name, name_spaced, university, department, enrollment_status, greeting,
  case when public.is_col_public('profiles', 'name_en')       then name_en       end as name_en,
  case when public.is_col_public('profiles', 'grade')         then grade         end as grade,
  case when public.is_col_public('profiles', 'tagline')       then tagline       end as tagline,
  case when public.is_col_public('profiles', 'bio')           then bio           end as bio,
  case when public.is_col_public('profiles', 'contact_intro') then contact_intro end as contact_intro
from public.profiles;

create view public.educations_public with (security_invoker = false) as
select
  id, profile_id, title, sort_order,
  case when public.is_col_public('educations', 'period_label') then period_label end as period_label,
  case when public.is_col_public('educations', 'subtitle')     then subtitle     end as subtitle,
  case when public.is_col_public('educations', 'description')  then description  end as description,
  case when public.is_col_public('educations', 'badges')       then badges       end as badges
from public.educations
where is_public;

create view public.awards_public with (security_invoker = false) as
select
  id, profile_id, icon, title, sort_order,
  case when public.is_col_public('awards', 'description') then description end as description,
  case when public.is_col_public('awards', 'year')        then year        end as year,
  case when public.is_col_public('awards', 'result')      then result      end as result
from public.awards
where is_public;

create view public.skills_public with (security_invoker = false) as
select
  id, profile_id, icon, name, sort_order,
  case when public.is_col_public('skills', 'description') then description end as description
from public.skills
where is_public;

create view public.contacts_public with (security_invoker = false) as
select
  id, profile_id, type, icon, label, sort_order,
  case when public.is_col_public('contacts', 'value') then value end as value
from public.contacts
where is_public;

create view public.tags_public with (security_invoker = false) as
select id, label, icon
from public.tags
where is_public;

create view public.profile_tags_public with (security_invoker = false) as
select pt.profile_id, pt.tag_id, pt.sort_order
from public.profile_tags pt
join public.tags t on t.id = pt.tag_id and t.is_public;

create view public.award_tags_public with (security_invoker = false) as
select at.award_id, at.tag_id, at.sort_order
from public.award_tags at
join public.awards a on a.id = at.award_id and a.is_public
join public.tags   t on t.id = at.tag_id   and t.is_public;

create view public.locations_public with (security_invoker = false) as
select profile_id, intro, place_name, address, map_query, lat, lon, directions, note
from public.locations
where is_public;

create view public.reservation_settings_public with (security_invoker = false) as
select profile_id, intro, duration_minutes, time_slots, closed_weekdays, max_days_ahead
from public.reservation_settings;

create view public.site_meta_public with (security_invoker = false) as
select profile_id, title, description, copyright
from public.site_meta;

create view public.nav_items_public with (security_invoker = false) as
select profile_id, href, label, sort_order
from public.nav_items
where is_public;

-- 뷰는 읽기만 허용합니다.
do $$
declare
  v text;
begin
  foreach v in array array[
    'profiles_public', 'educations_public', 'awards_public', 'skills_public', 'contacts_public',
    'tags_public', 'profile_tags_public', 'award_tags_public', 'locations_public',
    'reservation_settings_public', 'site_meta_public', 'nav_items_public'
  ]
  loop
    execute format('revoke all on public.%I from anon, authenticated', v);
    execute format('grant select on public.%I to anon, authenticated', v);
  end loop;
end;
$$;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_08_seed.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 8/8] 처음 데이터 — backend/src/data/portfolio.json 내용을 그대로 옮김
--
-- 넣는 순서가 중요합니다: profiles → tags → 기능별 테이블 → 연결 테이블 → 공개 스위치
-- =====================================================================

-- 1) 기본 정보
insert into public.profiles
  (id, name, name_spaced, name_en, university, department, grade, enrollment_status,
   greeting, tagline, bio, contact_intro)
values (
  'kwon-yuna', '권윤아', '권 윤 아', 'Kwon Yuna', '상명대학교', '그린스마트시티학과', '3학년', '재학 중',
  '안녕하세요, 저는',
  '자연과 도시의 조화를 꿈꾸는 조경 디자이너',
  array[
    '안녕하세요! 상명대학교 <strong>그린스마트시티학과</strong> 3학년에 재학 중인 <strong>권윤아</strong>입니다.',
    '저는 자연환경과 도시 인프라의 조화로운 공존을 연구하며, 지속 가능한 도시 조경 설계에 깊은 관심을 가지고 있습니다. 도시숲과 전통 조경의 가치를 현대적으로 재해석하는 작업에 열정을 쏟고 있습니다.'
  ],
  '도시와 자연이 함께 숨쉬는 공간을 함께 만들어가고 싶으시다면<br />언제든지 연락해 주세요! 😊'
);

-- 2) 태그 사전 (소개 태그 5개 + 공모전에만 쓰는 태그 3개)
insert into public.tags (id, label, icon) values
  ('tag-1', '도시숲',     '🌳'),
  ('tag-2', '전통조경',   '🏛️'),
  ('tag-3', '스마트시티', '🏙️'),
  ('tag-4', '그린인프라', '🌱'),
  ('tag-5', '조경설계',   '📐'),
  ('tag-6', '생태설계',   null),
  ('tag-7', '한국정원',   null),
  ('tag-8', '문화유산',   null);

-- 3) 기능별 테이블
insert into public.educations (id, profile_id, period_label, title, subtitle, description, badges, sort_order) values
  ('edu-item-1', 'kwon-yuna', '현재', '상명대학교', '그린스마트시티학과 · 3학년 재학 중',
   '도시 생태계, 조경 설계, 스마트 인프라 등 다양한 분야를 탐구하며 지속 가능한 미래 도시를 위한 역량을 키우고 있습니다.',
   '[{"label": "재학 중", "variant": "green"}, {"label": "3학년", "variant": "blue"}]', 1);

insert into public.awards (id, profile_id, icon, title, description, sort_order) values
  ('award-card-1', 'kwon-yuna', '🌲', '도시숲 공모전',
   '도시 환경 내 녹지 공간 조성 및 도시숲 디자인에 관한 아이디어를 발표한 공모전에 참여했습니다. 자연과 도시가 공존하는 지속 가능한 그린 인프라 계획안을 제안하였습니다.', 1),
  ('award-card-2', 'kwon-yuna', '🏯', '전통조경대전',
   '한국의 전통 조경 미학과 현대 도시 설계를 융합한 작품으로 전통조경대전에 참여하였습니다. 우리 고유의 정원 문화와 자연관을 현대적 언어로 재해석하는 작업을 수행하였습니다.', 2);

insert into public.skills (id, profile_id, icon, name, description, sort_order) values
  ('skill-1', 'kwon-yuna', '🌿', '도시 생태계', '도시 내 생태 네트워크 구축과 생물 다양성 증진을 위한 녹지 공간 설계', 1),
  ('skill-2', 'kwon-yuna', '🏛️', '전통 조경',   '한국 전통 정원의 미학과 공간 구성 원리를 현대적으로 계승·발전', 2),
  ('skill-3', 'kwon-yuna', '💡', '스마트시티',  '데이터 기반의 지능형 도시 인프라와 스마트 그린 솔루션 연구', 3),
  ('skill-4', 'kwon-yuna', '🗺️', '조경 설계',   '인간 중심적이고 지속 가능한 외부 공간 기획 및 설계', 4),
  ('skill-5', 'kwon-yuna', '🌍', '지속가능성',  '탄소 중립 도시를 위한 친환경 조경 전략과 기후변화 적응 설계', 5),
  ('skill-6', 'kwon-yuna', '🎨', '공간 디자인', '사람과 자연이 어우러지는 아름답고 기능적인 공공 공간 창출', 6);

-- contacts 는 비워 둡니다. 이메일 등을 넣고 싶을 때 예시:
--   insert into public.contacts (id, profile_id, type, icon, label, value, sort_order, is_public)
--   values ('contact-email', 'kwon-yuna', 'email', '✉️', '이메일', 'me@example.com', 1, true);
--   update public.column_visibility set is_public = true where table_name = 'contacts' and column_name = 'value';

insert into public.locations (profile_id, intro, place_name, address, map_query, lat, lon, note) values
  ('kwon-yuna',
   '직접 만나 포트폴리오와 작업 이야기를 나누고 싶으시다면 아래 장소로 찾아와 주세요.',
   '상명대학교 천안캠퍼스 C404a',
   '충청남도 천안시 동남구 상명대길 31, 상명대학교 천안캠퍼스 C404a',
   '충청남도 천안시 동남구 상명대길 31',
   36.833, 127.179,
   '방문 전 아래 버튼으로 예약해 주시면 시간에 맞춰 기다리고 있을게요.');

insert into public.reservation_settings
  (profile_id, intro, duration_minutes, time_slots, closed_weekdays, max_days_ahead) values
  ('kwon-yuna',
   '포트폴리오를 보고 이야기 나누고 싶은 점이 있다면, 원하는 날짜와 시간을 골라 방문 상담을 예약해 주세요. 확인 후 이메일로 답장드립니다.',
   30,
   array['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'],
   array[0, 6],
   30);

insert into public.site_meta (profile_id, title, description, copyright) values
  ('kwon-yuna',
   '권윤아 | 그린스마트시티학과 포트폴리오',
   '상명대학교 그린스마트시티학과 3학년 권윤아의 개인 포트폴리오 웹사이트입니다. 도시숲과 전통조경대전 공모전 참여 이력을 담고 있습니다.',
   '© 2026 Kwon Yuna. All rights reserved.');

insert into public.nav_items (profile_id, href, label, sort_order) values
  ('kwon-yuna', '#about',            '소개',        1),
  ('kwon-yuna', '#education',        '학력',        2),
  ('kwon-yuna', '#awards',           '공모전',      3),
  ('kwon-yuna', '#contact',          '연락처',      4),
  ('kwon-yuna', '#location',         '찾아오는 길', 5),
  ('kwon-yuna', '/reservation.html', '예약',        6);

-- 4) 연결 테이블
insert into public.profile_tags (profile_id, tag_id, sort_order) values
  ('kwon-yuna', 'tag-1', 1), ('kwon-yuna', 'tag-2', 2), ('kwon-yuna', 'tag-3', 3),
  ('kwon-yuna', 'tag-4', 4), ('kwon-yuna', 'tag-5', 5);

insert into public.award_tags (award_id, tag_id, sort_order) values
  ('award-card-1', 'tag-1', 1), ('award-card-1', 'tag-4', 2), ('award-card-1', 'tag-6', 3),
  ('award-card-2', 'tag-2', 1), ('award-card-2', 'tag-7', 2), ('award-card-2', 'tag-8', 3);

-- 5) 열 공개 스위치 (⚙️ 켜고 끌 수 있는 열만 등록. 등록 안 된 열은 비공개로 취급)
insert into public.column_visibility (table_name, column_name, is_public) values
  ('profiles',   'name_en',       true),
  ('profiles',   'grade',         true),
  ('profiles',   'tagline',       true),
  ('profiles',   'bio',           true),
  ('profiles',   'contact_intro', true),
  ('educations', 'period_label',  true),
  ('educations', 'subtitle',      true),
  ('educations', 'description',   true),
  ('educations', 'badges',        true),
  ('awards',     'description',   true),
  ('awards',     'year',          true),
  ('awards',     'result',        false),
  ('skills',     'description',   true),
  ('contacts',   'value',         false);


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261013_09_fix_is_col_public.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- [DB연결 9] is_col_public() 실행 권한 수정
--
-- 뷰는 소유자 권한으로 테이블을 읽지만, 뷰 안에서 부르는 "함수" 의 실행 권한은
-- 지금 읽는 사람(anon)으로 확인합니다. 01 에서 anon 의 실행 권한을 막아 둬서
-- *_public 뷰가 "permission denied for function is_col_public" 오류를 냈습니다.
--
-- → 함수를 소유자 권한(security definer)으로 돌려 column_visibility 를 읽게 하고,
--   anon 도 실행할 수 있게 엽니다. 돌려주는 값은 "이 열이 공개인가" 뿐이라 안전합니다.
-- =====================================================================

alter function public.is_col_public(text, text) security definer;
grant execute on function public.is_col_public(text, text) to anon, authenticated;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261027_01_award_works.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- 공모전 출품작 정보 — 작품명 · 간략 설명 · 사진 한 장
--
--   awards.work_title   출품작 이름
--   awards.work_summary 출품작 간략 설명
--   awards.image_url       카드에 보이는 사진 주소 (예: /assets/images/awards/urban-forest.jpg)
--   awards.image_large_url 사진을 눌렀을 때 크게 보여 줄 선명한 사진 (비우면 image_url 사용)
--   awards.image_alt    사진 설명 (화면 낭독기 · 이미지가 안 뜰 때 보이는 글)
--   awards.booklet_pages 작품 설명집 페이지 그림 주소 목록 — 있으면 표지를 눌렀을 때 책처럼 넘겨 봄
--
-- 여섯 칸 모두 column_visibility 스위치로 켜고 끌 수 있습니다. (처음엔 공개)
-- 뷰는 기존 열 뒤에 새 열을 덧붙이는 것이라 create or replace 로 바꿀 수 있습니다.
-- =====================================================================

alter table public.awards
  add column work_title   text,
  add column work_summary text,
  add column image_url    text,
  add column image_large_url text,
  add column image_alt    text,
  add column booklet_pages text[];

create or replace view public.awards_public with (security_invoker = false) as
select
  id, profile_id, icon, title, sort_order,
  case when public.is_col_public('awards', 'description')  then description  end as description,
  case when public.is_col_public('awards', 'year')         then year         end as year,
  case when public.is_col_public('awards', 'result')       then result       end as result,
  case when public.is_col_public('awards', 'work_title')   then work_title   end as work_title,
  case when public.is_col_public('awards', 'work_summary') then work_summary end as work_summary,
  case when public.is_col_public('awards', 'image_url')    then image_url    end as image_url,
  case when public.is_col_public('awards', 'image_alt')    then image_alt    end as image_alt,
  case when public.is_col_public('awards', 'image_large_url') then image_large_url end as image_large_url,
  case when public.is_col_public('awards', 'booklet_pages') then booklet_pages end as booklet_pages
from public.awards
where is_public;

insert into public.column_visibility (table_name, column_name, is_public) values
  ('awards', 'work_title',   true),
  ('awards', 'work_summary', true),
  ('awards', 'image_url',    true),
  ('awards', 'image_alt',    true),
  ('awards', 'image_large_url', true),
  ('awards', 'booklet_pages', true)
on conflict (table_name, column_name) do nothing;


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261027_02_award_work_urban_forest.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- 도시숲 공모전 출품작 내용 — 「고래 올림(林)」 (제17회 대한민국 도시숲설계공모대전)
-- 20261027_01_award_works.sql 을 먼저 실행한 뒤 실행하세요.
-- 작품설명서 쪽 그림 다시 만들 때: swift scripts/pdf-to-pages.swift <작품설명서.pdf> frontend/assets/images/awards/urban-forest 1600 0.8
-- =====================================================================

update public.awards
set
  work_title   = '고래 올림(林) — 추신. 같이 가요, 우리',
  work_summary = '과거 쓰레기 매립장이었던 울산 남구 여천동 부지(1.3ha)를 2028 울산국제정원박람회와 이어지는 ''동행''의 도시숲으로 재생한 작품입니다. '
              || '울산의 상징인 고래 형상을 따라 숲을 『환영』·『함께』·『마주』·『소망』해, 우리 네 공간으로 나누고, '
              || '바람생성숲으로 도시 열섬과 미세먼지를 줄이며 미야와키 방식의 탄소중립숲과 내음숲(악취저감숲)으로 탄소 흡수와 매립지 악취 문제를 해결했습니다. '
              || '시민참여 그림길, 기업이 함께 가꾸는 어울숲(ESG), 울산의 역사를 담은 이끼벽화와 AR 스마트벤치로 시민과 기업이 함께 누리는 숲을 제안했습니다.',
  image_url    = '/assets/images/awards/urban-forest.jpg',
  image_large_url = '/assets/images/awards/urban-forest/panel.jpg',
  image_alt    = '고래 올림(林) 설계 판넬 — 고래 형상의 도시숲 평면도와 환영·함께·마주·소망 공간별 계획',
  -- 책으로 넘겨 보기: 1쪽 = 설계 판넬, 2~11쪽 = 작품설명서 10쪽
  booklet_pages = array[
    '/assets/images/awards/urban-forest/panel.jpg',
    '/assets/images/awards/urban-forest/page-01.jpg',
    '/assets/images/awards/urban-forest/page-02.jpg',
    '/assets/images/awards/urban-forest/page-03.jpg',
    '/assets/images/awards/urban-forest/page-04.jpg',
    '/assets/images/awards/urban-forest/page-05.jpg',
    '/assets/images/awards/urban-forest/page-06.jpg',
    '/assets/images/awards/urban-forest/page-07.jpg',
    '/assets/images/awards/urban-forest/page-08.jpg',
    '/assets/images/awards/urban-forest/page-09.jpg',
    '/assets/images/awards/urban-forest/page-10.jpg'
  ]
where id = 'award-card-1';


-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
-- 파일: migrations/20261027_03_award_work_traditional_landscape.sql
-- ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

-- =====================================================================
-- 전통조경대전 출품작 내용 — 「書路(서로) : 나를 읽는 길」 (2026 전통조경대전)
-- 20261027_01_award_works.sql 을 먼저 실행한 뒤 실행하세요.
--
-- 작품 설명집(14쪽)은 쪽마다 그림으로 바꿔 /assets/images/awards/traditional-landscape/ 에 두었습니다.
-- 표지(1쪽)를 누르면 책처럼 넘겨 볼 수 있습니다.
-- 다시 만들 때: swift scripts/pdf-to-pages.swift <설명집.pdf> frontend/assets/images/awards/traditional-landscape 1600 0.78
-- =====================================================================

update public.awards
set
  work_title    = '書路(서로) : 나를 읽는 길',
  work_summary  = '국립중앙도서관 곁에, 선조들이 책을 읽던 태도를 오늘의 방문자가 직접 경험하는 정원 ''書路(서로)''를 제안한 작품입니다. 율곡 이이 『격몽요결』 「독서장」의 독서 순서를 따라 정원을 진입 → 숙독(혼자 읽는 자리) → 체득(자연 속 성찰) → 실천(함께 나누는 자리)으로 구성하고, 보길도 부용동 원림과 담양 소쇄원의 공간 위계를 현대적으로 재해석했습니다. 능화판 문양 담장으로 책을 열고 닫는 흐름을 만들고, 방지무도 지당과 현폭, 누각 틀, 유리지당 위 원도와 대화에 반응하는 인터랙티브 조명으로 혼자의 독서가 서로의 대화로 이어지는 과정을 담았습니다.',
  image_url     = '/assets/images/awards/traditional-landscape/page-01.jpg',
  image_alt     = '書路(서로) 작품 설명집 표지 — 노을 진 산과 굽은 길 위에서 책을 읽는 선비',
  booklet_pages = array[
    '/assets/images/awards/traditional-landscape/page-01.jpg',
    '/assets/images/awards/traditional-landscape/page-02.jpg',
    '/assets/images/awards/traditional-landscape/page-03.jpg',
    '/assets/images/awards/traditional-landscape/page-04.jpg',
    '/assets/images/awards/traditional-landscape/page-05.jpg',
    '/assets/images/awards/traditional-landscape/page-06.jpg',
    '/assets/images/awards/traditional-landscape/page-07.jpg',
    '/assets/images/awards/traditional-landscape/page-08.jpg',
    '/assets/images/awards/traditional-landscape/page-09.jpg',
    '/assets/images/awards/traditional-landscape/page-10.jpg',
    '/assets/images/awards/traditional-landscape/page-11.jpg',
    '/assets/images/awards/traditional-landscape/page-12.jpg',
    '/assets/images/awards/traditional-landscape/page-13.jpg',
    '/assets/images/awards/traditional-landscape/page-14.jpg'
  ]
where id = 'award-card-2';


commit;
