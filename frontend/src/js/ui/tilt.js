/** 카드 마우스 추적 3D 틸트 효과. */

const SELECTOR = '.award-card, .about-card';

export const initTilt = (root = document) => {
  root.querySelectorAll(SELECTOR).forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
};

export default initTilt;
