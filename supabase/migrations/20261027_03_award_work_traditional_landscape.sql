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
