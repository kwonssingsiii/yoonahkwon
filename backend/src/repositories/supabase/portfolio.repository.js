/**
 * 포트폴리오 Supabase 구현체 (PostgREST 를 fetch 로 직접 호출 — 추가 패키지 없음).
 *
 * 방문자 권한(publishable 키)으로는 원본 테이블을 읽을 수 없고, 공개용 뷰(*_public)만 읽습니다.
 *   - 숨긴 행(is_public=false)은 뷰에서 빠지고
 *   - 꺼 둔 열(column_visibility)은 NULL 로 옵니다.
 * 여기서는 뷰 12개를 동시에 읽어, JSON 구현체(data/portfolio.json)와 똑같은 모양으로 조립합니다.
 * 테이블 구조는 supabase/migrations/20261013_*.sql 에 있습니다.
 */
import config from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';

/** 관리자가 DB 를 고치면 최대 이 시간 뒤에 사이트에 반영됩니다. */
const CACHE_TTL_MS = 60 * 1000;

const select = async (view, query = '') => {
  const response = await fetch(`${config.supabase.url}/rest/v1/${view}?select=*${query}`, {
    headers: {
      apikey: config.supabase.key,
      Authorization: `Bearer ${config.supabase.key}`,
    },
  });

  if (response.ok) return response.json();

  const error = await response.json().catch(() => ({}));
  console.error('[supabase]', view, response.status, error);
  throw ApiError.internal('포트폴리오 데이터베이스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
};

/** 가려진 열(NULL)이 화면에 "null" 로 찍히지 않도록 빈 문자열로 바꿉니다. */
const text = (value) => value ?? '';

const byOrder = '&order=sort_order';

const fetchAll = async () => {
  const [
    profiles, educations, awards, skills, contacts, tags,
    profileTags, awardTags, locations, reservations, metas, navItems,
  ] = await Promise.all([
    select('profiles_public', '&limit=1'),
    select('educations_public', byOrder),
    select('awards_public', byOrder),
    select('skills_public', byOrder),
    select('contacts_public', byOrder),
    select('tags_public'),
    select('profile_tags_public', byOrder),
    select('award_tags_public', byOrder),
    select('locations_public'),
    select('reservation_settings_public'),
    select('site_meta_public'),
    select('nav_items_public', byOrder),
  ]);

  const profile = profiles[0];
  if (!profile) return null;

  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const location = locations[0];
  const reservation = reservations[0];
  const meta = metas[0];

  // 소개 카드 · 연락처 카드는 profiles 한 곳에서 만들어 중복 입력을 없앱니다. 값이 가려지면 카드도 빠집니다.
  const aboutCards = [
    { id: 'about-card-name', icon: '👤', label: '이름', value: profile.name },
    { id: 'about-card-school', icon: '🏫', label: '학교', value: profile.university },
    { id: 'about-card-major', icon: '🌿', label: '학과', value: profile.department },
    { id: 'about-card-year', icon: '📚', label: '학년', value: profile.grade },
  ].filter((card) => card.value);

  const contactCards = [
    { id: 'contact-school', icon: '🏫', label: '소속', value: `${profile.university} ${profile.department}` },
    ...(profile.grade
      ? [{ id: 'contact-grade', icon: '📖', label: '학년', value: `${profile.grade} ${profile.enrollment_status}` }]
      : []),
    ...contacts
      .filter((c) => c.value)
      .map((c) => ({ id: c.id, icon: text(c.icon), label: c.label, value: c.value })),
  ];

  return {
    profile: {
      name: profile.name,
      nameSpaced: profile.name_spaced ?? profile.name,
      nameEn: text(profile.name_en),
      university: profile.university,
      department: profile.department,
      grade: text(profile.grade),
      tagline: text(profile.tagline),
      greeting: text(profile.greeting),
      bio: profile.bio ?? [],
      tags: profileTags
        .map((pt) => tagById.get(pt.tag_id))
        .filter(Boolean)
        .map((tag) => ({ id: tag.id, label: tag.label, icon: text(tag.icon) })),
      cards: aboutCards,
    },

    education: educations.map((e) => ({
      id: e.id,
      year: text(e.period_label),
      title: e.title,
      subtitle: text(e.subtitle),
      description: text(e.description),
      badges: e.badges ?? [],
    })),

    awards: awards.map((a, index) => ({
      id: a.id,
      number: String(index + 1).padStart(2, '0'),
      icon: text(a.icon),
      title: a.title,
      description: text(a.description),
      tags: awardTags
        .filter((at) => at.award_id === a.id)
        .map((at) => tagById.get(at.tag_id)?.label)
        .filter(Boolean),
      ...(a.year != null ? { year: a.year } : {}),
      ...(a.result != null ? { result: a.result } : {}),
    })),

    skills: skills.map((s) => ({
      id: s.id,
      icon: text(s.icon),
      name: s.name,
      description: text(s.description),
    })),

    contact: {
      intro: text(profile.contact_intro),
      cards: contactCards,
    },

    location: location && {
      intro: text(location.intro),
      placeName: text(location.place_name),
      address: text(location.address),
      mapQuery: text(location.map_query),
      ...(location.lat != null && location.lon != null
        ? { coordinates: { lat: location.lat, lon: location.lon } }
        : {}),
      directions: location.directions ?? [],
      note: text(location.note),
    },

    reservation: reservation && {
      intro: text(reservation.intro),
      durationMinutes: reservation.duration_minutes,
      timeSlots: reservation.time_slots,
      closedWeekdays: reservation.closed_weekdays,
      maxDaysAhead: reservation.max_days_ahead,
    },

    meta: {
      title: meta?.title ?? profile.name,
      description: text(meta?.description),
      copyright: text(meta?.copyright),
      nav: navItems.map((n) => ({ href: n.href, label: n.label })),
    },
  };
};

let cache = null;

const load = async () => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const data = await fetchAll();
  cache = { data, at: Date.now() };
  return data;
};

/** 테스트 · 관리자 수정 직후 바로 반영하고 싶을 때 캐시를 비웁니다. */
export const invalidateCache = () => {
  cache = null;
};

export const supabasePortfolioRepository = {
  async findAll() {
    return load();
  },
  async findProfile() {
    return (await load())?.profile ?? null;
  },
  async findEducation() {
    return (await load())?.education ?? [];
  },
  async findAwards() {
    return (await load())?.awards ?? [];
  },
  async findAwardById(id) {
    const awards = (await load())?.awards ?? [];
    return awards.find((award) => award.id === id) ?? null;
  },
  async findSkills() {
    return (await load())?.skills ?? [];
  },
  async findContact() {
    return (await load())?.contact ?? null;
  },
  async findLocation() {
    return (await load())?.location ?? null;
  },
  async findReservationSettings() {
    return (await load())?.reservation ?? null;
  },
  async findMeta() {
    return (await load())?.meta ?? null;
  },
};

export default supabasePortfolioRepository;
