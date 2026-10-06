/**
 * 예약하기관리 (admin-reservations.html) — 예약 목록 테이블과 처리 상태 변경.
 * 상태 변경은 RLS 로 관리자만, 그리고 status 열만 가능합니다. (supabase/migrations 참고)
 */
import { escapeHtml } from '../render/dom.js';
import { formatKoreanDate } from '../reservation/dates.js';
import { renderAdminHeader, requireAdmin, supabase } from './session.js';

/** 처리 상태 4가지 — DB 값 ↔ 화면 이름 */
export const STATUSES = [
  { value: 'pending', label: '접수' },
  { value: 'confirmed', label: '확정' },
  { value: 'change_requested', label: '변경 요청' },
  { value: 'cancelled', label: '취소' },
];
const labelOf = (value) => STATUSES.find((s) => s.value === value)?.label ?? value;

const COLUMNS = 'id, reservation_no, name, email, visit_date, visit_time, purpose, status, created_at';

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

const renderSummary = (rows) => {
  const count = (value) => rows.filter((r) => r.status === value).length;
  $('reservation-summary').innerHTML = `
    <span>전체 <strong>${rows.length}</strong>건</span>
    ${STATUSES.map((s) => `<span class="summary-${s.value}">${s.label} <strong>${count(s.value)}</strong></span>`).join('')}`;
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

  const load = async () => {
    const { data, error } = await supabase.from('reservations').select(COLUMNS).order('created_at', { ascending: false });
    if (error) throw error;
    rows = data;
    renderSummary(rows);
    $('reservation-table-body').innerHTML = rows.length
      ? rows.map(rowHtml).join('')
      : '<tr><td colspan="6" class="table-empty">아직 들어온 예약이 없습니다.</td></tr>';
  };

  $('reservation-table-body').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-status]');
    if (!button || button.disabled) return;

    const tr = button.closest('tr');
    const row = rows.find((r) => r.id === tr.dataset.id);
    const next = button.dataset.status;
    tr.querySelectorAll('.status-action').forEach((b) => { b.disabled = true; });
    setMessage('');

    const { data, error } = await supabase
      .from('reservations')
      .update({ status: next })
      .eq('id', row.id)
      .select(COLUMNS)
      .single();

    if (error) {
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
    tr.outerHTML = rowHtml(row);
    renderSummary(rows);
    setMessage(`${row.reservation_no} · ${row.name} 님 예약을 "${labelOf(next)}"(으)로 변경했습니다.`, 'success');
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
