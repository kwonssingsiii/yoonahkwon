/**
 * 저장소 팩토리 — "어떤 데이터 소스를 쓸지" 를 결정하는 유일한 파일.
 *
 * 서비스 계층은 항상 여기서 꺼낸 객체만 사용하므로,
 * JSON → MongoDB → PostgreSQL → 외부 API 로 바꿔도 서비스 코드는 그대로입니다.
 *
 * ▶ 새 저장소(예: postgres)를 추가하려면
 *   1) repositories/postgres/portfolio.repository.js 에 같은 메서드 이름으로 구현
 *   2) 아래 registry 에 'postgres' 항목 한 줄 추가
 *   3) .env 에서 DATA_SOURCE=postgres
 */
import config from '../config/index.js';

import jsonPortfolioRepository from './json/portfolio.repository.js';
import jsonMessageRepository from './json/message.repository.js';
import mongoPortfolioRepository from './mongo/portfolio.repository.js';
import mongoMessageRepository from './mongo/message.repository.js';
import jsonReservationRepository from './json/reservation.repository.js';
import mongoReservationRepository from './mongo/reservation.repository.js';

const registry = {
  json: {
    portfolio: jsonPortfolioRepository,
    message: jsonMessageRepository,
    reservation: jsonReservationRepository,
  },
  mongo: {
    portfolio: mongoPortfolioRepository,
    message: mongoMessageRepository,
    reservation: mongoReservationRepository,
  },
};

const selected = registry[config.dataSource];

if (!selected) {
  throw new Error(
    `알 수 없는 DATA_SOURCE: "${config.dataSource}". 사용 가능한 값: ${Object.keys(registry).join(', ')}`,
  );
}

export const portfolioRepository = selected.portfolio;
export const messageRepository = selected.message;
export const reservationRepository = selected.reservation;
export const activeDataSource = config.dataSource;
