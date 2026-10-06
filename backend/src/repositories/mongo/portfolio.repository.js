/**
 * MongoDB 구현체 — 아직 비어 있는 "자리"입니다.
 *
 * ▶ DB 를 붙이는 방법 (이 파일만 채우면 끝납니다)
 *   1) npm i mongodb            (backend 폴더에서)
 *   2) backend/.env 에 아래 두 줄 추가
 *        DATA_SOURCE=mongo
 *        DATABASE_URL=mongodb+srv://...
 *   3) 아래 TODO 주석을 실제 쿼리로 교체
 *
 * 서비스/컨트롤러/프론트엔드는 단 한 줄도 고칠 필요가 없습니다.
 * 아래 메서드 이름과 반환 형태(JSON 구현체와 동일)만 지키면 됩니다.
 */
import config from '../../config/index.js';

// import { MongoClient } from 'mongodb';
// let db;
// const connect = async () => {
//   if (db) return db;
//   const client = new MongoClient(config.db.uri);
//   await client.connect();
//   db = client.db(config.db.name);
//   return db;
// };

const notImplemented = (method) => {
  throw new Error(
    `[mongo] portfolioRepository.${method}() 가 아직 구현되지 않았습니다. ` +
      `backend/src/repositories/mongo/portfolio.repository.js 를 채우거나, ` +
      `.env 의 DATA_SOURCE 를 json 으로 되돌리세요. (현재: ${config.dataSource})`,
  );
};

export const mongoPortfolioRepository = {
  async findAll() {
    // TODO: const d = await connect(); return d.collection('portfolio').findOne({ _id: 'main' });
    return notImplemented('findAll');
  },
  async findProfile() {
    return notImplemented('findProfile');
  },
  async findEducation() {
    return notImplemented('findEducation');
  },
  async findAwards() {
    // TODO: return (await connect()).collection('awards').find().sort({ number: 1 }).toArray();
    return notImplemented('findAwards');
  },
  async findAwardById(_id) {
    return notImplemented('findAwardById');
  },
  async findSkills() {
    return notImplemented('findSkills');
  },
  async findContact() {
    return notImplemented('findContact');
  },
  async findLocation() {
    return notImplemented('findLocation');
  },
  async findReservationSettings() {
    return notImplemented('findReservationSettings');
  },
  async findMeta() {
    return notImplemented('findMeta');
  },
};

export default mongoPortfolioRepository;
