/**
 * 프론트엔드 진입점.
 *   1) 백엔드 API 에서 데이터를 받아오고 (실패 시 로컬 fallback)
 *   2) 섹션을 렌더링한 뒤
 *   3) UI 인터랙션을 붙입니다.
 */
import portfolioApi from './api/portfolio.api.js';
import renderAll from './render/index.js';
import initUI from './ui/index.js';

const showError = (message) => {
  const main = document.getElementById('app') ?? document.body;
  main.insertAdjacentHTML(
    'afterbegin',
    `<div class="load-error" role="alert">데이터를 불러오지 못했습니다. ${message}</div>`,
  );
};

const bootstrap = async () => {
  document.body.classList.add('is-loading');

  try {
    const { data, source } = await portfolioApi.getAll();

    renderAll(data);
    initUI();

    document.body.dataset.dataSource = source;
    console.log(`✅ 포트폴리오 로드 완료 (데이터 출처: ${source})`);
  } catch (error) {
    console.error('[bootstrap] 초기화 실패:', error);
    showError(error.message);
  } finally {
    document.body.classList.remove('is-loading');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
