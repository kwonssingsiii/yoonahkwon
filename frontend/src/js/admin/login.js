/** 관리자 로그인 · 홈 (admin.html) */
import { getSession, isAdmin, renderAdminHeader, supabase } from './session.js';

const $ = (id) => document.getElementById(id);

/** 로그인 후 돌아갈 주소 — 같은 사이트의 관리자 페이지만 허용합니다. */
const nextUrl = () => {
  const next = new URLSearchParams(window.location.search).get('next') ?? '';
  return /^\/admin[\w-]*\.html$/.test(next) ? next : null;
};

const showHome = async (session) => {
  $('admin-login').hidden = true;
  $('admin-home').hidden = false;
  renderAdminHeader('home', session.user.email);

  if (!(await isAdmin())) {
    $('admin-home-message').textContent =
      `${session.user.email} 계정은 관리자로 등록되어 있지 않습니다. 관리자 계정으로 다시 로그인해 주세요.`;
    $('admin-home-links').hidden = true;
  }
};

const init = async () => {
  const session = await getSession();
  if (session) {
    const next = nextUrl();
    if (next) {
      window.location.replace(next);
      return;
    }
    await showHome(session);
    return;
  }

  $('admin-login').hidden = false;
  const form = $('admin-login-form');
  const error = $('admin-login-error');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    button.disabled = true;
    button.textContent = '로그인 중…';

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    });

    button.disabled = false;
    button.textContent = '로그인';

    if (authError) {
      error.textContent =
        authError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : `로그인하지 못했습니다. (${authError.message})`;
      return;
    }

    const next = nextUrl();
    if (next) window.location.replace(next);
    else showHome(data.session);
  });
};

init().catch((err) => {
  console.error('[admin] 초기화 실패:', err);
  $('admin-login').hidden = false;
  $('admin-login-error').textContent = `관리자 화면을 불러오지 못했습니다. (${err.message})`;
});
