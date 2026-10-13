-- =====================================================================
-- [DB연결 6/8] 잠금 장치 (RLS · 권한)
--
--   방문자(anon)       : 원본 테이블은 아예 못 봄 → 07 의 *_public 뷰만 읽음
--   관리자(admins 명단) : 원본 테이블을 읽고 · 추가 · 수정 · 삭제 가능
--                        (예약 관리에서 쓰는 public.is_admin() 을 그대로 재사용)
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'column_visibility', 'profiles', 'tags', 'educations', 'awards', 'skills', 'contacts',
    'locations', 'reservation_settings', 'site_meta', 'nav_items', 'profile_tags', 'award_tags'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))',
      t
    );
  end loop;

  -- 행을 고칠 때 updated_at 자동 갱신 (연결 테이블은 updated_at 이 없어 제외)
  foreach t in array array[
    'column_visibility', 'profiles', 'tags', 'educations', 'awards', 'skills', 'contacts',
    'locations', 'reservation_settings', 'site_meta', 'nav_items'
  ]
  loop
    execute format(
      'create trigger %1$s_touch_updated_at before update on public.%1$I
         for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end;
$$;
