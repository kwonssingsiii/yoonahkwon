/** IntersectionObserver 기반 스크롤 등장 애니메이션 (형제 순서만큼 지연). */

const SELECTOR = '.about-card, .timeline-item, .award-card, .skill-item';

export const initReveal = (root = document) => {
  const targets = root.querySelectorAll(SELECTOR);
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const siblings = [...entry.target.parentElement.children];
        const delay = siblings.indexOf(entry.target) * 100;

        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
  );

  targets.forEach((el) => observer.observe(el));
};

export default initReveal;
