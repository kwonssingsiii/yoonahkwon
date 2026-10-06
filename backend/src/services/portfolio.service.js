/**
 * 포트폴리오 비즈니스 로직.
 * 저장소(repository)가 무엇이든 여기 코드는 바뀌지 않습니다.
 */
import { portfolioRepository } from '../repositories/index.js';
import ApiError from '../utils/ApiError.js';

export const portfolioService = {
  /** 프론트엔드 첫 렌더에 필요한 전체 데이터를 한 번에 반환합니다. */
  async getAll() {
    const data = await portfolioRepository.findAll();
    if (!data) throw ApiError.notFound('포트폴리오 데이터가 없습니다.');
    return data;
  },

  getProfile: () => portfolioRepository.findProfile(),
  getEducation: () => portfolioRepository.findEducation(),
  getSkills: () => portfolioRepository.findSkills(),
  getContact: () => portfolioRepository.findContact(),
  getMeta: () => portfolioRepository.findMeta(),
  getLocation: () => portfolioRepository.findLocation(),

  /** 공모전 목록 — tag 쿼리스트링으로 필터링할 수 있습니다. */
  async getAwards({ tag } = {}) {
    const awards = await portfolioRepository.findAwards();
    if (!tag) return awards;
    return awards.filter((award) => award.tags?.includes(tag));
  },

  async getAwardById(id) {
    const award = await portfolioRepository.findAwardById(id);
    if (!award) throw ApiError.notFound(`공모전을 찾을 수 없습니다: ${id}`);
    return award;
  },
};

export default portfolioService;
