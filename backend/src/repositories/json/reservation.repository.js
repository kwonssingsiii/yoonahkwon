/**
 * 방문 예약 저장소 (JSON/메모리 구현) — 로컬에서 DB 없이 시험할 때만 씁니다. (RESERVATION_STORE=json)
 * 서버가 재시작되면 사라집니다. 실제 예약은 supabase 구현체에 저장됩니다.
 */
import { randomUUID } from 'node:crypto';
import ApiError from '../../utils/ApiError.js';

const reservations = [];

const isActive = (r) => r.status !== 'cancelled';

export const jsonReservationRepository = {
  async create({ name, email, purpose, date, time, consent }) {
    // Supabase 의 유니크 인덱스와 같은 역할: 확인과 저장 사이에 await 가 없어 동시 요청도 하나만 통과합니다.
    if (reservations.some((r) => isActive(r) && r.date === date && r.time === time)) {
      throw ApiError.conflict('방금 다른 분이 같은 시간을 예약했습니다. 다른 시간을 선택해 주세요.');
    }
    const record = {
      id: randomUUID(),
      name,
      email,
      purpose,
      date,
      time,
      consent,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    reservations.push(record);
    return record;
  },

  /** 해당 날짜에 이미 예약된 시간 ['13:00', ...] */
  async findBookedTimes(date) {
    return reservations.filter((r) => r.date === date && isActive(r)).map((r) => r.time);
  },

  /** 기간 안에 이미 예약된 날짜 · 시간 [{ date, time }] */
  async findBookedSlots(from, to) {
    return reservations
      .filter((r) => isActive(r) && r.date >= from && r.date <= to)
      .map(({ date, time }) => ({ date, time }));
  },
};

export default jsonReservationRepository;
