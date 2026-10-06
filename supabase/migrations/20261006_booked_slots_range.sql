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
