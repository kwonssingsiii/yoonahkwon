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
