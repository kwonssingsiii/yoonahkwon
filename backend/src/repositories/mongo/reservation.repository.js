/**
 * 방문 예약 MongoDB 구현체 — 자리만 잡아둔 상태입니다.
 * 사용법은 mongo/portfolio.repository.js 상단 주석을 참고하세요.
 * (같은 날짜·시간 중복을 막으려면 { date: 1, time: 1 } 유니크 인덱스를 거는 것을 권장합니다.)
 */
import config from '../../config/index.js';

const notImplemented = (method) => {
  throw new Error(
    `[mongo] reservationRepository.${method}() 가 아직 구현되지 않았습니다. (현재 DATA_SOURCE=${config.dataSource})`,
  );
};

export const mongoReservationRepository = {
  async create(_payload) {
    // TODO: await (await connect()).collection('reservations').insertOne({ ...payload, status: 'pending', createdAt: new Date() });
    return notImplemented('create');
  },
  async findByDate(_date) {
    // TODO: return (await connect()).collection('reservations').find({ date, status: { $ne: 'cancelled' } }).toArray();
    return notImplemented('findByDate');
  },
};

export default mongoReservationRepository;
