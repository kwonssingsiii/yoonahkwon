-- =====================================================================
-- [DB연결 7/8] 공개용 뷰 (*_public) — 방문자 · 백엔드가 읽는 "진열장"
--
--   ① 행 : where is_public           → 숨긴 항목은 아예 빠짐
--   ② 열 : is_col_public('표','열')  → 꺼 둔 열은 NULL 로 가려짐
--   ③ 항상 비공개 열(memo 등)은 뷰에 처음부터 넣지 않음
--
-- 뷰는 소유자 권한(security_invoker = false)으로 실행돼야 잠긴 원본 테이블을 읽을 수 있습니다.
-- Supabase Advisor 의 "security definer view" 경고는 이 설계 때문이며 의도된 것입니다.
-- 원본 테이블에 열을 추가하면 여기에도 직접 추가해야 사이트에 나옵니다.
-- =====================================================================

create view public.profiles_public with (security_invoker = false) as
select
  id, name, name_spaced, university, department, enrollment_status, greeting,
  case when public.is_col_public('profiles', 'name_en')       then name_en       end as name_en,
  case when public.is_col_public('profiles', 'grade')         then grade         end as grade,
  case when public.is_col_public('profiles', 'tagline')       then tagline       end as tagline,
  case when public.is_col_public('profiles', 'bio')           then bio           end as bio,
  case when public.is_col_public('profiles', 'contact_intro') then contact_intro end as contact_intro
from public.profiles;

create view public.educations_public with (security_invoker = false) as
select
  id, profile_id, title, sort_order,
  case when public.is_col_public('educations', 'period_label') then period_label end as period_label,
  case when public.is_col_public('educations', 'subtitle')     then subtitle     end as subtitle,
  case when public.is_col_public('educations', 'description')  then description  end as description,
  case when public.is_col_public('educations', 'badges')       then badges       end as badges
from public.educations
where is_public;

create view public.awards_public with (security_invoker = false) as
select
  id, profile_id, icon, title, sort_order,
  case when public.is_col_public('awards', 'description') then description end as description,
  case when public.is_col_public('awards', 'year')        then year        end as year,
  case when public.is_col_public('awards', 'result')      then result      end as result
from public.awards
where is_public;

create view public.skills_public with (security_invoker = false) as
select
  id, profile_id, icon, name, sort_order,
  case when public.is_col_public('skills', 'description') then description end as description
from public.skills
where is_public;

create view public.contacts_public with (security_invoker = false) as
select
  id, profile_id, type, icon, label, sort_order,
  case when public.is_col_public('contacts', 'value') then value end as value
from public.contacts
where is_public;

create view public.tags_public with (security_invoker = false) as
select id, label, icon
from public.tags
where is_public;

create view public.profile_tags_public with (security_invoker = false) as
select pt.profile_id, pt.tag_id, pt.sort_order
from public.profile_tags pt
join public.tags t on t.id = pt.tag_id and t.is_public;

create view public.award_tags_public with (security_invoker = false) as
select at.award_id, at.tag_id, at.sort_order
from public.award_tags at
join public.awards a on a.id = at.award_id and a.is_public
join public.tags   t on t.id = at.tag_id   and t.is_public;

create view public.locations_public with (security_invoker = false) as
select profile_id, intro, place_name, address, map_query, lat, lon, directions, note
from public.locations
where is_public;

create view public.reservation_settings_public with (security_invoker = false) as
select profile_id, intro, duration_minutes, time_slots, closed_weekdays, max_days_ahead
from public.reservation_settings;

create view public.site_meta_public with (security_invoker = false) as
select profile_id, title, description, copyright
from public.site_meta;

create view public.nav_items_public with (security_invoker = false) as
select profile_id, href, label, sort_order
from public.nav_items
where is_public;

-- 뷰는 읽기만 허용합니다.
do $$
declare
  v text;
begin
  foreach v in array array[
    'profiles_public', 'educations_public', 'awards_public', 'skills_public', 'contacts_public',
    'tags_public', 'profile_tags_public', 'award_tags_public', 'locations_public',
    'reservation_settings_public', 'site_meta_public', 'nav_items_public'
  ]
  loop
    execute format('revoke all on public.%I from anon, authenticated', v);
    execute format('grant select on public.%I to anon, authenticated', v);
  end loop;
end;
$$;
