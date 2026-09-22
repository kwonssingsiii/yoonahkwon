/**
 * JSON 파일 기반 포트폴리오 저장소 (기본 구현).
 * data/portfolio.json 을 읽습니다. DB 가 없어도 서비스가 동작하도록 하는 역할입니다.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_PATH = fileURLToPath(new URL('../../data/portfolio.json', import.meta.url));

/** 파일 I/O 를 매 요청마다 하지 않도록 캐시합니다. */
let cache = null;

const load = async () => {
  if (cache) return cache;
  const raw = await readFile(DATA_PATH, 'utf-8');
  cache = JSON.parse(raw);
  return cache;
};

/** 개발 중 JSON 을 고쳤을 때 캐시를 비우는 용도. */
export const invalidateCache = () => {
  cache = null;
};

export const jsonPortfolioRepository = {
  async findAll() {
    return load();
  },
  async findProfile() {
    return (await load()).profile;
  },
  async findEducation() {
    return (await load()).education;
  },
  async findAwards() {
    return (await load()).awards;
  },
  async findAwardById(id) {
    const awards = (await load()).awards;
    return awards.find((award) => award.id === id) ?? null;
  },
  async findSkills() {
    return (await load()).skills;
  },
  async findContact() {
    return (await load()).contact;
  },
  async findMeta() {
    return (await load()).meta;
  },
};

export default jsonPortfolioRepository;
