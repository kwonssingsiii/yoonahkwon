/** 모든 섹션 렌더러를 순서대로 실행합니다. 섹션이 늘어나면 여기에 추가하세요. */
import renderMeta from './meta.js';
import renderNavbar from './navbar.js';
import renderHero from './hero.js';
import renderAbout from './about.js';
import renderEducation from './education.js';
import renderAwards from './awards.js';
import renderSkills from './skills.js';
import renderContact from './contact.js';
import renderFooter from './footer.js';

const renderers = [
  renderMeta,
  renderNavbar,
  renderHero,
  renderAbout,
  renderEducation,
  renderAwards,
  renderSkills,
  renderContact,
  renderFooter,
];

export const renderAll = (data) => {
  renderers.forEach((render) => {
    try {
      render(data);
    } catch (error) {
      console.error(`[render] ${render.name} 실패:`, error);
    }
  });
};

export default renderAll;
