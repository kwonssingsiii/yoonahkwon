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
