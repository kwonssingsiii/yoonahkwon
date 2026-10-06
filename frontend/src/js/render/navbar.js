import { joinHtml, escapeHtml, mount, setText } from './dom.js';

export const renderNavbar = ({ profile, meta }) => {
  setText('.logo-text', profile.name);

  mount(
    'nav-links',
    joinHtml(
      meta.nav,
      (item) => `<li><a href="${escapeHtml(item.href)}" class="nav-link">${escapeHtml(item.label)}</a></li>`,
    ),
  );
};

export default renderNavbar;
