/**
 * 방문 예약 저장소 (JSON/메모리 구현).
 * 서버가 재시작되면 사라집니다 — Vercel 서버리스에서는 인스턴스마다 따로 저장되므로
 * 실제 운영 전에는 반드시 mongo 등 영구 저장소 구현체로 교체하세요.
 */
import { randomUUID } from 'node:crypto';

const reservations = [];

export const jsonReservationRepository = {
  async create({ name, email, phone, date, time, purpose, message }) {
    const record = {
      id: randomUUID(),
      name,
      email,
      phone,
      date,
      time,
      purpose,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    reservations.push(record);
    return record;
  },

  /** 해당 날짜의 예약 목록. 빈 시간 계산에 사용합니다. */
  async findByDate(date) {
    return reservations.filter((r) => r.date === date && r.status !== 'cancelled');
  },
};

export default jsonReservationRepository;
