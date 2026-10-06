import { escapeHtml, joinHtml, mount } from './dom.js';

export const renderSkills = ({ skills }) => {
  mount(
    'skills-grid',
    joinHtml(
      skills,
      (skill) => `
      <div class="skill-item" id="${escapeHtml(skill.id)}">
        <div class="skill-icon">${escapeHtml(skill.icon)}</div>
        <h4 class="skill-name">${escapeHtml(skill.name)}</h4>
        <p class="skill-desc">${escapeHtml(skill.description)}</p>
      </div>`,
    ),
  );
};

export default renderSkills;
