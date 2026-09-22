/** 히어로 영역 부유 파티클 생성. */

export const initParticles = ({ count = 28 } = {}) => {
  const container = document.getElementById('particles');
  if (!container) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 5 + 2; // 2–7 px

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -${size}px;
      opacity: 0;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 15}s;
      box-shadow: 0 0 ${size * 2}px rgba(74,181,105,0.6);
    `;

    fragment.appendChild(particle);
  }

  container.appendChild(fragment);
};

export default initParticles;
