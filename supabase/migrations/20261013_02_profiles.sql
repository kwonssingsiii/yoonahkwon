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
