import { escapeHtml, mount } from './dom.js';

export const renderFooter = ({ profile, meta }) => {
  mount(
    'footer-inner',
    `
    <p class="footer-name">${escapeHtml(profile.name)}</p>
    <p class="footer-sub">${escapeHtml(`${profile.university} ${profile.department} ${profile.grade}`)}</p>
    <p class="footer-copy">${escapeHtml(meta.copyright)}</p>
  `,
  );
};

export default renderFooter;
