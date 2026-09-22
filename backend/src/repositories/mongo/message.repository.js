/**
 * 문의 메시지 MongoDB 구현체 — 자리만 잡아둔 상태입니다.
 * 사용법은 mongo/portfolio.repository.js 상단 주석을 참고하세요.
 */
import config from '../../config/index.js';

const notImplemented = (method) => {
  throw new Error(
    `[mongo] messageRepository.${method}() 가 아직 구현되지 않았습니다. (현재 DATA_SOURCE=${config.dataSource})`,
  );
};

export const mongoMessageRepository = {
  async create(_payload) {
    // TODO: await (await connect()).collection('messages').insertOne({ ...payload, createdAt: new Date() });
    return notImplemented('create');
  },
  async findAll() {
    return notImplemented('findAll');
  },
};

export default mongoMessageRepository;
