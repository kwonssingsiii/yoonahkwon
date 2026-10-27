/** 메인 화면 렌더러를 순서대로 실행합니다. (첫 장면 → 책장) */
import renderMeta from './meta.js';
import renderWelcome from './welcome.js';
import renderLibrary from './library.js';

const renderers = [renderMeta, renderWelcome, renderLibrary];

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
