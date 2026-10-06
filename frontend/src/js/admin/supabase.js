/**
 * 관리자 화면 전용 최소 Supabase 클라이언트 (외부 라이브러리 없이 fetch 만 사용).
 *
 * supabase-js 를 CDN 에서 불러오면 하위 파일 10여 개를 이어 받아야 해서, 브라우저 · 확장 프로그램 ·
 * 네트워크에 따라 하나만 막혀도 관리자 화면 전체가 멈췄습니다. 여기서는 쓰는 기능만 직접 구현합니다.
 *   - 로그인(이메일 · 비밀번호) / 로그아웃 / 로그인 유지(토큰 자동 갱신)
 *   - REST 조회 · 수정, RPC 호출
 * 권한은 여전히 DB 의 RLS 가 지킵니다.
 */
import config from '../config.js';

const { url: BASE_URL, publishableKey: API_KEY } = config.supabase;
const STORAGE_KEY = 'yoonahkwon-admin-session';
const REFRESH_MARGIN_SECONDS = 60;

export class SupabaseError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'SupabaseError';
    this.status = status;
    this.code = code;
  }
}

// ── 세션 저장 (사파리 개인정보 보호 모드 등에서 저장소가 막혀도 페이지는 동작) ──
const storage = {
  read() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  write(session) {
    try {
      if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 저장 불가 — 이 탭에서만 로그인 유지 */
    }
  },
};
let memorySession = null;

const saveSession = (data) => {
  const session = data
    ? {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
        user: { id: data.user?.id, email: data.user?.email },
      }
    : null;
  memorySession = session;
  storage.write(session);
  return session;
};

/** fetch + Supabase 오류 형식(auth: msg/error_description, rest: message/code) 통일 */
const request = async (path, { method = 'GET', body, token, headers = {} } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${token ?? API_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new SupabaseError(payload?.msg ?? payload?.error_description ?? payload?.message ?? `요청 실패 (${response.status})`, {
      status: response.status,
      // auth 는 { code: 400, error_code: 'invalid_credentials' }, REST 는 { code: '23505' } 형태라 error_code 를 먼저 봅니다.
      code: payload?.error_code ?? payload?.code,
    });
  }
  return payload;
};

// ── 인증 ──────────────────────────────────
export const auth = {
  async signInWithPassword({ email, password }) {
    const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    return saveSession(data);
  },

  /** 저장된 세션을 돌려주고, 만료가 가까우면 갱신합니다. 갱신 실패 시 로그아웃 상태(null). */
  async getSession() {
    const session = memorySession ?? storage.read();
    if (!session?.refreshToken) return null;
    if (session.expiresAt - REFRESH_MARGIN_SECONDS > Date.now() / 1000) return session;

    try {
      const data = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
      });
      return saveSession(data);
    } catch {
      saveSession(null);
      return null;
    }
  },

  async signOut() {
    const session = memorySession ?? storage.read();
    saveSession(null);
    if (session?.accessToken) {
      await request('/auth/v1/logout', { method: 'POST', token: session.accessToken }).catch(() => {});
    }
  },
};

const withToken = async () => (await auth.getSession())?.accessToken;

// ── 데이터 ────────────────────────────────
export const db = {
  rpc: async (fn, args = {}) => request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args, token: await withToken() }),

  /** select('reservations', { columns: 'id,status', order: 'created_at.desc' }) */
  select: async (table, { columns = '*', order } = {}) => {
    const query = new URLSearchParams({ select: columns.replace(/\s/g, ''), ...(order ? { order } : {}) });
    return request(`/rest/v1/${table}?${query}`, { token: await withToken() });
  },

  /** 한 행을 id 로 수정하고, 수정된 행을 돌려줍니다. */
  updateById: async (table, id, values, { columns = '*' } = {}) => {
    const query = new URLSearchParams({ id: `eq.${id}`, select: columns.replace(/\s/g, '') });
    return request(`/rest/v1/${table}?${query}`, {
      method: 'PATCH',
      body: values,
      token: await withToken(),
      headers: { Prefer: 'return=representation', Accept: 'application/vnd.pgrst.object+json' },
    });
  },
};
