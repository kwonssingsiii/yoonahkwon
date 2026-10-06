/**
 * 방문 예약 저장소 (JSON/메모리 구현) — 로컬에서 DB 없이 시험할 때만 씁니다. (RESERVATION_STORE=json)
 * 서버가 재시작되면 사라집니다. 실제 예약은 supabase 구현체에 저장됩니다.
 */
import { randomUUID } from 'node:crypto';

const reservations = [];

export const jsonReservationRepository = {
  async create({ name, email, purpose, date, time, consent }) {
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
    return reservations.filter((r) => r.date === date && r.status !== 'cancelled').map((r) => r.time);
  },
};

export default jsonReservationRepository;
