import { escapeHtml, joinHtml, mount } from './dom.js';

export const renderEducation = ({ education }) => {
  mount(
    'timeline',
    joinHtml(
      education,
      (item) => `
      <div class="timeline-item" id="${escapeHtml(item.id)}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-year">${escapeHtml(item.year)}</div>
          <h3 class="timeline-title">${escapeHtml(item.title)}</h3>
          <p class="timeline-sub">${escapeHtml(item.subtitle)}</p>
          <p class="timeline-desc">${escapeHtml(item.description)}</p>
          <div class="timeline-badges">
            ${joinHtml(
              item.badges ?? [],
              (badge) =>
                `<span class="badge badge-${escapeHtml(badge.variant)}">${escapeHtml(badge.label)}</span>`,
            )}
          </div>
        </div>
      </div>`,
    ),
  );
};

export default renderEducation;
