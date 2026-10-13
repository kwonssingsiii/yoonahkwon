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
