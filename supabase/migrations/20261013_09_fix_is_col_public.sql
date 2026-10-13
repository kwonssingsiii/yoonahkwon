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
