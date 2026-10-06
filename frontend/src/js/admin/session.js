/**
 * 관리자 화면 공통 — Supabase 로그인 세션 · 관리자 확인 · 상단 헤더(탭).
 * 권한은 화면이 아니라 DB(RLS · public.is_admin())가 지킵니다. 여기서는 안내만 합니다.
 */
import { auth, db } from './supabase.js';

export { auth, db };

/** 상단 오른쪽 탭. 새 관리 화면이 생기면 여기에 한 줄 추가하면 됩니다. */
const TABS = [{ id: 'reservations', label: '예약하기관리', href: '/admin-reservations.html' }];

export const renderAdminHeader = (activeTab, email) => {
  const header = document.getElementById('admin-header');
  if (!header) return;

  header.hidden = false;
  header.querySelector('.admin-tabs').innerHTML = `
    ${TABS.map(
      (tab) =>
        `<a href="${tab.href}" class="admin-tab${tab.id === activeTab ? ' is-active' : ''}"
            ${tab.id === activeTab ? 'aria-current="page"' : ''}>${tab.label}</a>`,
    ).join('')}
    <button type="button" class="admin-logout" id="admin-logout">로그아웃</button>`;
  header.querySelector('.admin-user').textContent = email ?? '';

  document.getElementById('admin-logout').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = '/admin.html';
  });
};

export const getSession = () => auth.getSession();

export const isAdmin = async () => (await db.rpc('is_admin')) === true;

/**
 * 관리자 전용 페이지 맨 앞에서 호출합니다.
 * 로그인 안 됨 → 로그인 화면으로 보내고(돌아올 주소 기억), 관리자가 아니면 null.
 */
export const requireAdmin = async () => {
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent(window.location.pathname);
    window.location.replace(`/admin.html?next=${next}`);
    return null;
  }
  return { session, admin: await isAdmin() };
};
