import { escapeHtml, mount } from './dom.js';

export const renderHero = ({ profile }) => {
  const subtitle = [profile.department, profile.university, profile.grade]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');

  mount(
    'hero-content',
    `
    <p class="hero-greeting">${escapeHtml(profile.greeting)}</p>
    <h1 class="hero-name">${escapeHtml(profile.nameSpaced ?? profile.name)}</h1>
    <div class="hero-divider"></div>
    <p class="hero-subtitle">${subtitle}</p>
    <p class="hero-desc">${escapeHtml(profile.tagline)}</p>
    <div class="hero-cta">
      <a href="#about" class="btn-primary" id="hero-cta-btn">더 알아보기</a>
      <a href="#awards" class="btn-outline" id="hero-awards-btn">공모전 보기</a>
    </div>
  `,
  );
};

export default renderHero;
