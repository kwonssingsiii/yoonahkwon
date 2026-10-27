/**
 * 메인 화면 = 책장.
 * 포트폴리오의 각 내용(소개 · 학력 · 공모전 출품작)이 한 권의 책이고,
 * 책을 누르면 ui/flipbook.js 가 그 책을 펼칩니다. 여기서는 책등(책장)과 책 속 쪽들을 만듭니다.
 */
import { escapeHtml, joinHtml, mount } from './dom.js';
import { registerBook, clearBooks } from '../ui/flipbook.js';

/** 책등 색 (파스텔) — 레퍼런스 책장의 색 순서 */
const COLORS = {
  lavender: '#b8aed6',
  sand: '#e6d2a8',
  terracotta: '#b5533c',
  slate: '#9fb0c4',
  grey: '#c9c9c9',
  green: '#9bc08a',
  purple: '#ad9bc9',
  peach: '#e9b08a',
  teal: '#9cc4c1',
  beige: '#d9c9a8',
};
const AWARD_COLORS = [COLORS.slate, COLORS.terracotta, COLORS.teal, COLORS.purple];

/* ───────────────────── 책 속 쪽 만들기 ───────────────────── */

const page = (html, className = '') => ({ html, className });

const cover = ({ no, title, sub, color, owner }) =>
  page(
    `<div class="bp-cover" style="--book-color:${color}">
       <span class="bp-cover-no">${no}</span>
       <h2 class="bp-cover-title">${escapeHtml(title)}</h2>
       ${sub ? `<p class="bp-cover-sub">${escapeHtml(sub)}</p>` : ''}
       <p class="bp-cover-owner">${escapeHtml(owner)}</p>
     </div>`,
    'flipbook-page--cover',
  );

const backCover = (color, owner) =>
  page(
    `<div class="bp-cover bp-cover--back" style="--book-color:${color}">
       <p class="bp-cover-owner">${escapeHtml(owner)} · 포트폴리오</p>
     </div>`,
    'flipbook-page--cover',
  );

/** 내용 쪽: 위에 작은 머리글, 아래에 쪽 번호 */
const sheet = (kicker, body, folio) =>
  page(
    `<div class="bp">
       <p class="bp-kicker">${escapeHtml(kicker)}</p>
       <div class="bp-body">${body}</div>
       <span class="bp-folio">${folio}</span>
     </div>`,
  );

const blankSheet = () => page('<div class="bp bp--blank"><span class="bp-ornament">❦</span></div>');

/** 표지 + 내용 + (쪽 수를 짝수로 맞추는 빈 쪽) + 뒤표지 — 덮었을 때 뒤표지가 혼자 오도록 */
const bindBook = ({ no, title, sub, color, owner }, contents) => {
  const inner = contents.length % 2 === 1 ? [...contents, blankSheet()] : contents;
  return [cover({ no, title, sub, color, owner }), ...inner, backCover(color, owner)];
};

/* ── 소개 ── */
const aboutPages = (profile) => {
  const rows = joinHtml(
    profile.cards ?? [],
    (c) => `<div class="bp-row"><span class="bp-row-label">${escapeHtml(c.icon)} ${escapeHtml(c.label)}</span><span>${escapeHtml(c.value)}</span></div>`,
  );
  const first = `
    <p class="bp-lead">${escapeHtml(profile.greeting)}</p>
    <h3 class="bp-name">${escapeHtml(profile.name)}${profile.nameEn ? `<small>${escapeHtml(profile.nameEn)}</small>` : ''}</h3>
    ${profile.tagline ? `<p class="bp-quote">“${escapeHtml(profile.tagline)}”</p>` : ''}
    <div class="bp-rows">${rows}</div>`;
  // bio 는 <strong> 서식을 포함한 신뢰된 내부 데이터입니다.
  const second = `
    <h3 class="bp-title">자기소개</h3>
    ${joinHtml(profile.bio ?? [], (p) => `<p class="bp-text">${p}</p>`)}
    <div class="bp-chips">${joinHtml(profile.tags ?? [], (t) => `<span class="bp-chip">${escapeHtml(t.icon)} ${escapeHtml(t.label)}</span>`)}</div>`;
  return [sheet('소개', first, 1), sheet('소개', second, 2)];
};

/* ── 학력 (소개 · 학력 책의 뒷부분 — firstFolio 부터 쪽 번호를 이어서 매김) ── */
const educationPages = (education, firstFolio = 1) =>
  education.map((e, i) =>
    sheet(
      '학력',
      `<p class="bp-period">${escapeHtml(e.year)}</p>
       <h3 class="bp-title">${escapeHtml(e.title)}</h3>
       <p class="bp-sub">${escapeHtml(e.subtitle)}</p>
       <p class="bp-text">${escapeHtml(e.description)}</p>
       <div class="bp-chips">${joinHtml(e.badges ?? [], (b) => `<span class="bp-chip">${escapeHtml(b.label)}</span>`)}</div>`,
      firstFolio + i,
    ),
  );

/* ── 찾아오는 길 ── */
const mapLinks = (query) => {
  const q = encodeURIComponent(query);
  return [
    { label: '네이버 지도', href: `https://map.naver.com/p/search/${q}` },
    { label: '카카오맵', href: `https://map.kakao.com/link/search/${q}` },
    { label: 'Google 지도', href: `https://www.google.com/maps/search/?api=1&query=${q}` },
  ];
};

/** 책장 아래 "찾아오는 길" — 지도 · 주소 · 지도 앱 링크 · 교통 안내 · 현재 날씨 (책이 아니라 화면에 바로 보임) */
const visitSection = (location) => {
  const query = location.mapQuery || location.address;
  return `
    <div class="visit-head">
      <p class="visit-kicker">Location</p>
      <h2 class="visit-title" id="visit-title">찾아오는 길</h2>
      ${location.intro ? `<p class="visit-intro">${escapeHtml(location.intro)}</p>` : ''}
    </div>
    <div class="visit-grid">
      ${
        query
          ? `<div class="visit-map"><iframe title="${escapeHtml(location.placeName || '찾아오는 길')} 지도"
               src="https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed"
               loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
          : '<p class="visit-empty">지도에 표시할 주소가 아직 설정되지 않았습니다.</p>'
      }
      <div class="visit-info">
        <h3 class="visit-place">${escapeHtml(location.placeName || '장소 미정')}</h3>
        <p class="visit-address">${escapeHtml(location.address || '주소가 곧 업데이트됩니다.')}</p>
        ${query ? `<div class="visit-links">${joinHtml(mapLinks(query), (l) => `<a href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a>`)}</div>` : ''}
        ${joinHtml(location.directions ?? [], (d) => `<div class="visit-row"><span class="visit-row-label">${escapeHtml(d.icon)} ${escapeHtml(d.label)}</span><span>${escapeHtml(d.value)}</span></div>`)}
        ${location.coordinates ? '<div class="visit-weather" id="location-weather" aria-live="polite"><p class="weather-hint">현재 날씨를 불러오는 중…</p></div>' : ''}
        ${location.note ? `<p class="visit-note">${escapeHtml(location.note)}</p>` : ''}
      </div>
    </div>
    <p class="visit-source">출처 · 지도: <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google 지도</a> · 날씨: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo (CC BY 4.0)</a></p>`;
};

/* ── 출품작: 소개 표지 + 판넬 · 설명집 그림 ── */
const awardPages = (award) => award.work?.booklet?.pages ?? (award.work?.image ? [award.work.image.large || award.work.image.src] : []);

const awardIntro = (award) =>
  page(
    `<div class="bp bp--award">
       <p class="bp-kicker">${escapeHtml(award.title)}</p>
       <h3 class="bp-title">${escapeHtml(award.work?.title || award.title)}</h3>
       <p class="bp-text">${escapeHtml(award.work?.summary || award.description)}</p>
       <div class="bp-chips">${joinHtml(award.tags ?? [], (t) => `<span class="bp-chip">${escapeHtml(t)}</span>`)}</div>
       <p class="bp-note">다음 쪽부터 출품작을 넘겨 보세요 →</p>
     </div>`,
  );

/* ───────────────────── 책장 ───────────────────── */

/** 책등 하나. kind: 'book'(누르면 펼침) · 'deco'(장식) */
const spine = ({ kind = 'book', id, title, sub, color, h = 100, w, caption, leaning }) => {
  const style = `--book-color:${color};--book-h:${h}%${w ? `;--book-w:${w}px` : ''}`;
  const classes = ['book', `book--${kind}`, leaning ? 'book--leaning' : ''].filter(Boolean).join(' ');
  const inner = `
      <span class="book-label">
        <span class="book-title">${escapeHtml(title)}</span>
        ${sub ? `<span class="book-sub">${escapeHtml(sub)}</span>` : ''}
      </span>`;
  const cap = caption ? ` data-caption="${escapeHtml(caption)}"` : '';

  if (kind === 'deco') return `<div class="${classes}" style="${style}" aria-hidden="true">${inner}</div>`;
  return `<button type="button" class="${classes}" style="${style}" data-book="${escapeHtml(id)}"${cap} aria-label="${escapeHtml(`${caption} — 책 펼치기`)}">${inner}</button>`;
};

/** 책 제목이 길면 책등에는 앞부분만: "고래 올림(林) — 추신…" → "고래 올림(林)" */
const spineTitle = (title) => title.split(/\s+[—:–-]\s+/)[0];

export const renderLibrary = ({ profile, education = [], awards = [], location, meta }) => {
  clearBooks();
  const owner = profile.name;
  const shelf = [];
  let no = 0;

  const addBook = (def, contents, spineExtra = {}) => {
    no += 1;
    registerBook(def.id, { title: def.bookTitle ?? def.title, pages: bindBook({ ...def, no, owner }, contents), ratio: 0.72 });
    shelf.push(spine({ ...def, ...spineExtra }));
  };

  // 소개와 학력은 한 권: 소개 쪽들 다음에 학력 쪽이 이어집니다.
  const about = aboutPages(profile);
  addBook(
    {
      id: 'about',
      title: education.length ? '소개 · 학력' : '소개',
      sub: education.length ? 'Profile' : 'About Me',
      color: COLORS.lavender,
      h: 94,
      caption: education.length ? '소개 · 학력' : '소개', // 커서를 올리면 큰 제목만
    },
    [...about, ...educationPages(education, about.length + 1)],
  );
  (profile.tags ?? []).slice(0, 1).forEach((t) => shelf.push(spine({ kind: 'deco', title: t.label, color: COLORS.grey, h: 78, w: 34 })));

  awards.forEach((award, i) => {
    const pages = awardPages(award);
    if (!pages.length) return;
    no += 1;
    const id = `award-${award.id}`;
    const workTitle = award.work?.title || award.title;
    const color = AWARD_COLORS[i % AWARD_COLORS.length];
    // 출품작은 판넬 · 설명집 그림 비율(가로형)로 펼칩니다. 앞에 작품 소개 쪽을 붙입니다.
    const contents = [awardIntro(award), ...pages];
    const inner = contents.length % 2 === 1 ? [...contents, blankSheet()] : contents;
    registerBook(id, {
      title: `${workTitle} — ${award.title}`,
      pages: [cover({ no, title: spineTitle(workTitle), sub: award.title, color, owner }), ...inner, backCover(color, owner)],
    });
    shelf.push(
      spine({
        id,
        title: spineTitle(workTitle),
        sub: award.title,
        color,
        w: 74,
        caption: award.title, // 커서를 올리면 공모전 이름만 (작품명 · 설명은 책 속에서)
      }),
    );
  });

  (profile.tags ?? []).slice(1, 2).forEach((t) => shelf.push(spine({ kind: 'deco', title: t.label, color: COLORS.grey, h: 88, w: 38, leaning: true })));

  (profile.tags ?? []).slice(2, 3).forEach((t) => shelf.push(spine({ kind: 'deco', title: t.label, color: COLORS.beige, h: 74, w: 32 })));

  mount('shelf-books', shelf.join(''));
  // 찾아오는 길은 책장 아래에 바로 보여 줍니다. (데이터가 없으면 칸을 숨김)
  const visit = mount('library-visit', location ? visitSection(location) : '');
  if (visit) visit.hidden = !location;
  mount('library-owner', `${escapeHtml(owner)}의 책장`);
  mount('library-footer', `${escapeHtml(meta?.copyright ?? '')}`);
};

export default renderLibrary;
