import { escapeHtml, joinHtml, mount } from './dom.js';

const awardCard = (award) => `
  <div class="award-card" id="${escapeHtml(award.id)}">
    <div class="award-number">${escapeHtml(award.number)}</div>
    <div class="award-icon-wrap">
      <div class="award-icon">${escapeHtml(award.icon)}</div>
    </div>
    <div class="award-body">
      <h3 class="award-title">${escapeHtml(award.title)}</h3>
      <p class="award-desc">${escapeHtml(award.description)}</p>
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
