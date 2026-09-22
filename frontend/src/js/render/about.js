import { escapeHtml, joinHtml, mount } from './dom.js';

export const renderAbout = ({ profile }) => {
  mount(
    'about-grid',
    joinHtml(
      profile.cards,
      (card) => `
      <div class="about-card" id="${escapeHtml(card.id)}">
        <div class="card-icon">${escapeHtml(card.icon)}</div>
        <h3 class="card-label">${escapeHtml(card.label)}</h3>
        <p class="card-value">${escapeHtml(card.value)}</p>
      </div>`,
    ),
  );

  // bio 는 <strong> 같은 서식을 포함한 신뢰된 내부 데이터입니다.
  mount('bio-text', joinHtml(profile.bio, (paragraph) => `<p>${paragraph}</p>`));

  mount(
    'bio-tags',
    joinHtml(
      profile.tags,
      (tag) =>
        `<span class="tag" id="${escapeHtml(tag.id)}">${escapeHtml(tag.icon)} ${escapeHtml(tag.label)}</span>`,
    ),
  );
};

export default renderAbout;
