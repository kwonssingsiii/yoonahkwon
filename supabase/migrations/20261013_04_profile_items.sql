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
