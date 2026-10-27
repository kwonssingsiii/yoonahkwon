/**
 * 사진 크게 보기 (라이트박스).
 *
 * <a href="큰 사진" data-lightbox><img …></a> 를 누르면 새 창 대신 같은 화면 위에 사진을 띄웁니다.
 *   - 처음에는 사진 전체가 화면에 맞게 보이고, 사진을 한 번 더 누르면 실제 크기로 확대(스크롤로 이동)
 *   - ✕ 버튼 · Esc · 바깥 어두운 곳을 누르면 닫힘
 * 브라우저가 <dialog> 를 지원하지 않으면 링크가 그대로 열립니다.
 */

let dialog = null;

const build = () => {
  dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="닫기">✕</button>
    <div class="lightbox-stage">
      <img class="lightbox-img" alt="" />
    </div>
    <p class="lightbox-hint">사진을 누르면 확대 · 축소돼요 · Esc 또는 바깥을 누르면 닫혀요</p>`;
  document.body.append(dialog);

  const img = dialog.querySelector('.lightbox-img');

  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());

  // 사진 밖(어두운 배경 · 여백)을 누르면 닫고, 사진을 누르면 확대/축소합니다.
  dialog.addEventListener('click', (event) => {
    if (event.target === img) {
      dialog.classList.toggle('is-zoomed');
      return;
    }
    if (!event.target.closest('.lightbox-close')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-zoomed');
    document.documentElement.classList.remove('lightbox-open');
  });
};

const open = (src, alt) => {
  if (!dialog) build();
  const img = dialog.querySelector('.lightbox-img');
  img.src = src;
  img.alt = alt ?? '';
  dialog.setAttribute('aria-label', alt ? `${alt} 크게 보기` : '사진 크게 보기');
  dialog.classList.remove('is-zoomed');
  document.documentElement.classList.add('lightbox-open');
  dialog.showModal();
};

let initialized = false;

export const initLightbox = () => {
  if (initialized || typeof HTMLDialogElement !== 'function') return;
  initialized = true;

  // 카드는 데이터를 받은 뒤 그려지므로, 문서 전체에서 한 번만 클릭을 받아 처리합니다.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-lightbox]');
    if (!link) return;
    // Ctrl/⌘ 클릭 · 가운데 클릭은 원래대로 새 탭에서 열리게 둡니다.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    open(link.href, link.querySelector('img')?.alt);
  });
};

export default initLightbox;
