/** 히어로 버튼 및 앵커 링크의 부드러운 스크롤. */

export const initSmoothScroll = () => {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
};

export default initSmoothScroll;
