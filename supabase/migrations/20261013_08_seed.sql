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
