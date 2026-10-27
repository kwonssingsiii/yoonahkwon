/**
 * UI 인터랙션 초기화 묶음.
 * 데이터 렌더링이 끝난 뒤에 호출해야 합니다(동적으로 생성된 책에도 효과가 붙도록).
 */
import initWelcome from './welcome.js';
import initShelfCaption from './shelf.js';
import initFlipbook from './flipbook.js';
import initWeather from './weather.js';

export const initUI = () => {
  initWelcome();
  initShelfCaption();
  initFlipbook();
  initWeather(); // 책장 아래 "찾아오는 길"의 현재 날씨
};

export { initWelcome, initShelfCaption, initFlipbook, initWeather };
export default initUI;
