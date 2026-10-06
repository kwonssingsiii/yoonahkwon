/**
 * 방문 예약 Supabase 구현체 (PostgREST 를 fetch 로 직접 호출 — 추가 패키지 없음).
 *
 * 테이블 · 권한은 Supabase 쪽에 이렇게 잡혀 있습니다.
 *   - public.reservations : RLS 로 "추가만 가능, 조회 불가" → 예약자 개인정보는 대시보드에서만 봅니다.
 *   - public.booked_times(p_date) : 해당 날짜에 예약된 시간만 돌려주는 함수 (빈 시간 계산용)
 *   - (visit_date, visit_time) 유니크 인덱스 : 동시에 같은 시간을 잡아도 하나만 들어갑니다.
 */
import config from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';

const request = async (path, body, { prefer } = {}) => {
  const response = await fetch(`${config.supabase.url}/rest/v1${path}`, {
    method: 'POST',
    headers: {
      apikey: config.supabase.key,
      Authorization: `Bearer ${config.supabase.key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    // return=minimal 이면 201 + 빈 본문이 옵니다.
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const error = await response.json().catch(() => ({}));
  if (error.code === '23505') {
    throw ApiError.conflict('방금 다른 분이 같은 시간을 예약했습니다. 다른 시간을 선택해 주세요.');
  }
  console.error('[supabase]', response.status, error);
  throw ApiError.internal('예약 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
};

export const supabaseReservationRepository = {
  async create({ name, email, purpose, date, time, consent }) {
    // 조회 권한이 없으므로 return=minimal 로 넣고, 넣은 값을 그대로 돌려줍니다.
    await request(
      '/reservations',
      { name, email, purpose, visit_date: date, visit_time: time, consent },
      { prefer: 'return=minimal' },
    );
    return { name, email, purpose, date, time, status: 'pending' };
  },

  /** 해당 날짜에 이미 예약된 시간 ['13:00', ...] */
  async findBookedTimes(date) {
    const times = await request('/rpc/booked_times', { p_date: date });
    return times.map((t) => String(t).slice(0, 5)); // "13:00:00" → "13:00"
  },
};

export default supabaseReservationRepository;
