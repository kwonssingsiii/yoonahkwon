/**
 * 예약하기관리 (admin-reservations.html) — 예약 목록 테이블과 처리 상태 변경.
 * 상태 변경은 RLS 로 관리자만, 그리고 status 열만 가능합니다. (supabase/migrations 참고)
 */
import { escapeHtml } from '../render/dom.js';
import { formatKoreanDate } from '../reservation/dates.js';
import { db, renderAdminHeader, requireAdmin } from './session.js';

/** 처리 상태 4가지 — DB 값 ↔ 화면 이름 */
export const STATUSES = [
  { value: 'pending', label: '접수' },
  { value: 'confirmed', label: '확정' },
  { value: 'change_requested', label: '변경 요청' },
  { value: 'cancelled', label: '취소' },
];
const labelOf = (value) => STATUSES.find((s) => s.value === value)?.label ?? value;

const COLUMNS = 'id, reservation_no, name, email, visit_date, visit_time, purpose, status, created_at';

// 여기까지 왔다면 모든 모듈을 불러온 것 — HTML 의 안내 타이머가 오류 문구를 띄우지 않습니다.
window.__adminReady = true;

const $ = (id) => document.getElementById(id);

const statusBadge = (status) => `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(labelOf(status))}</span>`;

const actionButtons = (r) => `
  <div class="status-actions" role="group" aria-label="${escapeHtml(r.reservation_no)} 처리 상태 변경">
    ${STATUSES.map(
      (s) => `
      <button type="button" class="status-action status-action-${s.value}${s.value === r.status ? ' is-current' : ''}"
              data-status="${s.value}" aria-pressed="${s.value === r.status}" ${s.value === r.status ? 'disabled' : ''}>
        ${escapeHtml(s.label)}
      </button>`,
    ).join('')}
  </div>`;

const rowHtml = (r) => `
  <tr data-id="${escapeHtml(r.id)}" data-status="${escapeHtml(r.status)}">
    <td class="cell-no">${escapeHtml(r.reservation_no)}</td>
    <td class="cell-person">
      <strong>${escapeHtml(r.name)}</strong>
      <a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>
    </td>
    <td class="cell-time">
      <span>${escapeHtml(formatKoreanDate(r.visit_date))}</span>
      <strong>${escapeHtml(r.visit_time.slice(0, 5))}</strong>
    </td>
    <td class="cell-purpose">${escapeHtml(r.purpose)}</td>
    <td class="cell-status">${statusBadge(r.status)}</td>
    <td class="cell-actions">${actionButtons(r)}</td>
  </tr>`;

/** 필터: 'all' 또는 STATUSES 의 value. 주소(?status=)에도 남겨 새로고침해도 유지합니다. */
const FILTERS = [{ value: 'all', label: '전체' }, ...STATUSES];

const readFilter = () => {
  const value = new URLSearchParams(window.location.search).get('status');
  return FILTERS.some((f) => f.value === value) ? value : 'all';
};

const writeFilter = (value) => {
  const url = new URL(window.location.href);
  if (value === 'all') url.searchParams.delete('status');
  else url.searchParams.set('status', value);
  window.history.replaceState(null, '', url);
};

const countOf = (rows, value) => (value === 'all' ? rows.length : rows.filter((r) => r.status === value).length);

/** 요약 문장: 전체 N건 / 접수 N건 / 확정 N건 / 변경 요청 N건 / 취소 N건 */
const renderSummary = (rows) => {
  $('reservation-summary').innerHTML = FILTERS.map(
    (f) => `<span class="summary-item summary-${f.value}">${f.label} <strong>${countOf(rows, f.value)}</strong>건</span>`,
  ).join('<span class="summary-sep" aria-hidden="true">/</span>');
};

/** 상태 필터 버튼 (건수 포함) */
const renderFilters = (rows, active) => {
  $('reservation-filters').innerHTML = FILTERS.map(
    (f) => `
    <button type="button" class="status-filter status-filter-${f.value}${f.value === active ? ' is-active' : ''}"
            data-filter="${f.value}" aria-pressed="${f.value === active}">
      ${escapeHtml(f.label)} <span class="status-filter-count">${countOf(rows, f.value)}</span>
    </button>`,
  ).join('');
};

const setMessage = (text, type = '') => {
  const el = $('reservation-message');
  el.textContent = text;
  el.dataset.type = type;
};

const init = async () => {
  const auth = await requireAdmin();
  if (!auth) return; // 로그인 화면으로 이동 중
  renderAdminHeader('reservations', auth.session.user.email);

  if (!auth.admin) {
    $('reservation-table-body').innerHTML =
      `<tr><td colspan="6" class="table-empty">${escapeHtml(auth.session.user.email)} 계정은 관리자로 등록되어 있지 않습니다.</td></tr>`;
    return;
  }

  let rows = [];
  let filter = readFilter();

  /** 요약 · 필터 · 테이블을 현재 rows 와 filter 로 다시 그립니다. */
  const render = () => {
    renderSummary(rows);
    renderFilters(rows, filter);

    const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
    const label = FILTERS.find((f) => f.value === filter).label;
    $('reservation-table-body').innerHTML = visible.length
      ? visible.map(rowHtml).join('')
      : `<tr><td colspan="6" class="table-empty">${
          rows.length ? `"${escapeHtml(label)}" 상태인 예약이 없습니다.` : '아직 들어온 예약이 없습니다.'
        }</td></tr>`;
  };

  const load = async () => {
    rows = await db.select('reservations', { columns: COLUMNS, order: 'created_at.desc' });
    render();
  };

  $('reservation-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    writeFilter(filter);
    setMessage('');
    render();
  });

  $('reservation-table-body').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-status]');
    if (!button || button.disabled) return;

    const tr = button.closest('tr');
    const row = rows.find((r) => r.id === tr.dataset.id);
    const next = button.dataset.status;
    tr.querySelectorAll('.status-action').forEach((b) => { b.disabled = true; });
    setMessage('');

    let data;
    try {
      data = await db.updateById('reservations', row.id, { status: next }, { columns: COLUMNS });
    } catch (error) {
      setMessage(
        error.code === '23505'
          ? `${row.reservation_no}: 같은 시간에 이미 다른 예약이 있어 "${labelOf(next)}"(으)로 바꿀 수 없습니다.`
          : `${row.reservation_no}: 상태를 바꾸지 못했습니다. (${error.message})`,
        'error',
      );
      tr.outerHTML = rowHtml(row); // 원래 상태로 되돌림
      return;
    }

    Object.assign(row, data);
    render(); // 필터를 걸어 둔 상태라면 바뀐 예약은 목록에서 빠집니다.
    setMessage(
      `${row.reservation_no} · ${row.name} 님 예약을 "${labelOf(next)}"(으)로 변경했습니다.` +
        (filter !== 'all' && filter !== next ? ` ("${labelOf(next)}" 필터에서 확인할 수 있습니다)` : ''),
      'success',
    );
  });

  $('reservation-refresh').addEventListener('click', () =>
    load().catch((error) => setMessage(`목록을 불러오지 못했습니다. (${error.message})`, 'error')),
  );

  await load();
};

init().catch((error) => {
  console.error('[admin] 예약 목록 실패:', error);
  $('reservation-table-body').innerHTML =
    `<tr><td colspan="6" class="table-empty">예약 목록을 불러오지 못했습니다. (${escapeHtml(error.message)})</td></tr>`;
});
