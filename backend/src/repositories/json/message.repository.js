/**
 * 문의 메시지 저장소 (JSON/메모리 구현).
 * 서버가 재시작되면 사라집니다 — 실제 보관이 필요해지면 mongo 구현체로 교체하세요.
 */
import { randomUUID } from 'node:crypto';

const messages = [];

export const jsonMessageRepository = {
  async create({ name, email, message }) {
    const record = {
      id: randomUUID(),
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };
    messages.push(record);
    return record;
  },

  async findAll() {
    return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

export default jsonMessageRepository;
