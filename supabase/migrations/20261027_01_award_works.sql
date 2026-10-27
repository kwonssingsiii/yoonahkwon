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
