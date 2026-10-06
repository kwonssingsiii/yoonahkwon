-- =====================================================================
-- 관리자 예약 관리 (admin-reservations.html) 를 위한 변경
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여 넣고 Run 하세요. (한 번만)
--
--   1) 처리 상태 4가지: pending(접수) · confirmed(확정) · change_requested(변경 요청) · cancelled(취소)
--   2) 예약번호 reservation_no: 방문 희망 날짜·시간 + 예약자(이름/이메일) 코드
--      예) R261007-1330-A1B2  → 같은 사람이 여러 번 와도 방문 시간별로 번호가 다릅니다.
--   3) 관리자 명단(admins)에 있는 이메일로 로그인한 계정만 예약 조회 · "상태" 변경 가능
--      (이름 · 이메일 · 시간은 관리자도 수정 불가, 방문자는 지금처럼 추가만 가능)
-- =====================================================================

-- 1) 처리 상태
alter table public.reservations drop constraint reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'change_requested', 'cancelled'));

-- 2) 예약번호 · 상태 변경 시각
alter table public.reservations add column reservation_no text;
alter table public.reservations add column status_updated_at timestamptz;

create or replace function public.set_reservation_no()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reservation_no :=
    'R' || to_char(new.visit_date, 'YYMMDD') || '-' || to_char(new.visit_time, 'HH24MI') || '-' ||
    upper(substr(md5(lower(new.email) || '|' || new.name), 1, 4));
  return new;
end;
$$;

create trigger reservations_set_no
  before insert or update of name, email, visit_date, visit_time on public.reservations
  for each row execute function public.set_reservation_no();

-- 이미 들어와 있는 예약에도 번호를 채웁니다.
update public.reservations
set reservation_no =
  'R' || to_char(visit_date, 'YYMMDD') || '-' || to_char(visit_time, 'HH24MI') || '-' ||
  upper(substr(md5(lower(email) || '|' || name), 1, 4));

alter table public.reservations alter column reservation_no set not null;
create unique index reservations_no_unique on public.reservations (reservation_no) where status <> 'cancelled';

create or replace function public.touch_status_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger reservations_touch_status
  before update of status on public.reservations
  for each row execute function public.touch_status_updated_at();

-- 3) 관리자 명단 · 권한
create table public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 관리자 이메일 (Authentication → Users 에 같은 이메일로 계정을 만들어야 로그인됩니다)
insert into public.admins (email) values ('kwonssingsi@gmail.com');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "admins can read reservations"
  on public.reservations for select
  to authenticated
  using ((select public.is_admin()));

create policy "admins can update reservation status"
  on public.reservations for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 관리자는 "상태" 만 바꿀 수 있게
revoke update on public.reservations from authenticated;
grant update (status) on public.reservations to authenticated;
