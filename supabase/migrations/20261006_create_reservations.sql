-- (이미 적용됨 — 기록용) 방문 예약 테이블 · 방문자 추가 전용 RLS · 빈 시간 조회 함수
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  email text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  purpose text not null check (char_length(purpose) between 1 and 500),
  visit_date date not null,
  visit_time time not null,
  consent boolean not null check (consent),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

comment on table public.reservations is '포트폴리오 방문 예약. 방문자는 추가만 가능하고 조회는 대시보드(운영자)에서만 합니다.';

-- 취소되지 않은 예약끼리 같은 날짜·시간 중복 금지
create unique index reservations_slot_unique
  on public.reservations (visit_date, visit_time)
  where status <> 'cancelled';

alter table public.reservations enable row level security;

create policy "anyone can create a pending reservation"
  on public.reservations for insert
  to anon, authenticated
  with check (status = 'pending' and consent);

create or replace function public.booked_times(p_date date)
returns setof time
language sql
stable
security definer
set search_path = ''
as $$
  select r.visit_time
  from public.reservations r
  where r.visit_date = p_date and r.status <> 'cancelled';
$$;

revoke all on function public.booked_times(date) from public;
grant execute on function public.booked_times(date) to anon, authenticated;
