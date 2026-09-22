/** 상단 스크롤 진행률 바. */

export const initProgressBar = () => {
  if (document.getElementById('progress-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '3px',
    background: 'linear-gradient(90deg, #4ab569, #2ecc71)',
    zIndex: '9999',
    width: '0%',
    transition: 'width 0.1s linear',
    boxShadow: '0 0 10px rgba(74,181,105,0.7)',
    pointerEvents: 'none',
  });
  document.body.prepend(bar);

  const update = () => {
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (doc.scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
};

export default initProgressBar;
