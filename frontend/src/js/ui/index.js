/**
 * UI 인터랙션 초기화 묶음.
 * 데이터 렌더링이 끝난 뒤에 호출해야 합니다(동적으로 생성된 카드에도 효과가 붙도록).
 */
import initNavbar from './navbar.js';
import initReveal from './reveal.js';
import initParticles from './particles.js';
import initTilt from './tilt.js';
import initProgressBar from './progress.js';
import initSmoothScroll from './smoothScroll.js';
import initReservation from './reservation.js';

export const initUI = () => {
  initNavbar();
  initSmoothScroll();
  initProgressBar();
  initParticles();
  initReveal();
  initTilt();
  initReservation();
};

export { initNavbar, initReveal, initParticles, initTilt, initProgressBar, initSmoothScroll, initReservation };
export default initUI;
