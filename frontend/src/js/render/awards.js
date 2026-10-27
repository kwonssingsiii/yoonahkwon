import { escapeHtml, joinHtml, mount } from './dom.js';

/** 사진 한 장: 누르면 같은 화면에서 크게 보기 (ui/lightbox.js) */
const photoFigure = (image) => `
  <a class="award-work-figure" href="${escapeHtml(image.large || image.src)}" data-lightbox
     aria-label="${escapeHtml(image.alt)} — 크게 보기">
    <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" />
  </a>`;

/** 설명집: 표지를 누르면 책처럼 넘겨 보기 (ui/flipbook.js). 페이지 목록은 data-pages 에 담습니다. */
const bookFigure = (booklet, image, title) => {
  const cover = image?.src || booklet.pages[0];
  const alt = image?.alt || `${title} 작품 설명집 표지`;
  return `
  <a class="award-work-figure award-work-figure--book" href="${escapeHtml(booklet.pages[0])}" data-flipbook
     data-pages="${escapeHtml(JSON.stringify(booklet.pages))}" data-title="${escapeHtml(title)}"
     aria-label="${escapeHtml(title)} 작품 설명집 넘겨 보기 (${booklet.pages.length}쪽)">
    <img src="${escapeHtml(cover)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
    <span class="award-book-badge">📖 눌러서 넘겨 보기 · ${booklet.pages.length}쪽</span>
  </a>`;
};

/** 출품작(사진 또는 설명집 · 작품명 · 설명). 공모전에 work 가 없으면 아무것도 그리지 않습니다. */
const awardWork = (work, awardTitle) => {
  if (!work) return '';
  const { image, booklet, title, summary } = work;
  const figure = booklet?.pages?.length
    ? bookFigure(booklet, image, title || awardTitle)
    : image?.src
      ? photoFigure(image)
      : '';
  return `
      <div class="award-work">
        ${figure}
        <span class="award-work-label">출품작</span>
        ${title ? `<h4 class="award-work-title">${escapeHtml(title)}</h4>` : ''}
        ${summary ? `<p class="award-work-summary">${escapeHtml(summary)}</p>` : ''}
      </div>`;
};

const awardCard = (award) => `
  <div class="award-card" id="${escapeHtml(award.id)}">
    <div class="award-number">${escapeHtml(award.number)}</div>
    <div class="award-icon-wrap">
      <div class="award-icon">${escapeHtml(award.icon)}</div>
    </div>
    <div class="award-body">
      <h3 class="award-title">${escapeHtml(award.title)}</h3>
      <p class="award-desc">${escapeHtml(award.description)}</p>
      ${awardWork(award.work, award.title)}
      <div class="award-tags">
        ${joinHtml(award.tags ?? [], (tag) => `<span class="award-tag">${escapeHtml(tag)}</span>`)}
      </div>
    </div>
    <div class="award-glow"></div>
  </div>`;

export const renderAwards = ({ awards }) => {
  if (!awards?.length) {
    mount('awards-grid', '<p class="empty-state">등록된 공모전 이력이 없습니다.</p>');
    return;
  }
  mount('awards-grid', joinHtml(awards, awardCard));
};

export { awardCard };
export default renderAwards;
