/**
 * 작품 설명집 책 넘기기 (StPageFlip — src/vendor/page-flip.browser.js).
 *
 * <a data-flipbook data-pages='["/…/page-01.jpg", …]' data-title="작품명"> 표지를 누르면
 * 같은 화면 위에 책을 펼칩니다.
 *   - 넓은 화면: 두 쪽 펼침 / 좁은 화면(휴대폰): 한 쪽씩
 *   - 넘기기: 책장 끝을 끌거나 누르기 · ◀ ▶ 버튼 · 키보드 ← →
 *   - 닫기: ✕ 버튼 · Esc · 바깥 어두운 곳
 * 라이브러리는 처음 열 때 한 번만 불러옵니다. (첫 화면 속도에 영향 없음)
 * 불러오지 못하거나 <dialog> 미지원이면 링크(첫 쪽 그림)가 그대로 열립니다.
 */

const LIBRARY_URL = new URL('../../vendor/page-flip.browser.js', import.meta.url).href;

let libraryPromise = null;
const loadLibrary = () => {
  if (window.St?.PageFlip) return Promise.resolve(window.St.PageFlip);
  libraryPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LIBRARY_URL;
    script.onload = () => (window.St?.PageFlip ? resolve(window.St.PageFlip) : reject(new Error('PageFlip 없음')));
    script.onerror = () => {
      libraryPromise = null;
      reject(new Error('책 넘기기 라이브러리를 불러오지 못했습니다.'));
    };
    document.head.append(script);
  });
  return libraryPromise;
};

/** 첫 쪽 그림의 실제 비율로 책 크기를 정합니다. */
const loadImageSize = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1000, height: 1414 }); // A 판형 비율로 대체
    img.src = src;
  });

let dialog = null;
let book = null; // 현재 열린 PageFlip
let pageCount = 0;

const ui = () => ({
  stage: dialog.querySelector('.flipbook-stage'),
  title: dialog.querySelector('.flipbook-title'),
  counter: dialog.querySelector('.flipbook-counter'),
  prev: dialog.querySelector('.flipbook-prev'),
  next: dialog.querySelector('.flipbook-next'),
});

/** 덮인 책(앞표지 · 뒤표지만 보일 때)은 화면 가운데로 옮깁니다. */
const centerClosedBook = (index) => {
  const holder = ui().stage.querySelector('.flipbook-book');
  if (!holder) return;
  const landscape = book?.getOrientation?.() === 'landscape';
  const backCoverAlone = index === pageCount - 1 && pageCount % 2 === 0;
  holder.style.transform = !landscape ? '' : index === 0 ? 'translateX(-25%)' : backCoverAlone ? 'translateX(25%)' : '';
};

const updateCounter = (index) => {
  centerClosedBook(index);
  const { counter, prev, next } = ui();
  // 두 쪽 펼침이면 "2–3 / 12" 처럼 보여 줍니다.
  const spread = book?.getOrientation?.() === 'landscape' && index > 0 && index < pageCount - 1;
  counter.textContent = spread ? `${index + 1}–${Math.min(index + 2, pageCount)} / ${pageCount}` : `${index + 1} / ${pageCount}`;
  prev.disabled = index <= 0;
  next.disabled = index >= pageCount - (spread ? 2 : 1);
};

const destroyBook = () => {
  if (!book) return;
  try {
    book.destroy();
  } catch {
    /* 이미 정리됨 */
  }
  book = null;
};

const build = () => {
  dialog = document.createElement('dialog');
  dialog.className = 'flipbook';
  dialog.innerHTML = `
    <div class="flipbook-bar">
      <p class="flipbook-title"></p>
      <button type="button" class="flipbook-close" aria-label="닫기">✕</button>
    </div>
    <div class="flipbook-stage"></div>
    <div class="flipbook-controls">
      <button type="button" class="flipbook-prev" aria-label="이전 쪽">◀</button>
      <span class="flipbook-counter" aria-live="polite"></span>
      <button type="button" class="flipbook-next" aria-label="다음 쪽">▶</button>
    </div>
    <p class="flipbook-hint">책장 끝을 끌거나 ◀ ▶ · 키보드 ← → 로 넘겨요</p>`;
  document.body.append(dialog);

  const { prev, next } = ui();
  prev.addEventListener('click', () => book?.flipPrev());
  next.addEventListener('click', () => book?.flipNext());
  dialog.querySelector('.flipbook-close').addEventListener('click', () => dialog.close());

  // 책 · 버튼 밖의 어두운 곳을 누르면 닫습니다.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target === ui().stage) dialog.close();
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') book?.flipNext();
    if (event.key === 'ArrowLeft') book?.flipPrev();
  });

  dialog.addEventListener('close', () => {
    destroyBook();
    document.documentElement.classList.remove('lightbox-open');
  });
};

/** 화면에 들어가는 가장 큰 책 크기(한 쪽 기준)와 펼침 여부를 계산합니다. */
const fitPageSize = (ratio) => {
  const { stage } = ui();
  const style = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availH = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const twoPages = availW >= 640 && availW / 2 >= Math.min(availH * ratio, availW / 2) * 0.9; // 가로가 넉넉하면 두 쪽 펼침
  const pageW = Math.min(twoPages ? availW / 2 : availW, availH * ratio);
  return { width: Math.floor(pageW), height: Math.floor(pageW / ratio), twoPages };
};

const open = async (pages, title, fallbackHref) => {
  if (!dialog) build();
  const { stage, title: titleEl, counter } = ui();
  titleEl.textContent = title ? `${title} — 작품 설명집` : '작품 설명집';
  counter.textContent = '불러오는 중…';
  stage.replaceChildren();
  document.documentElement.classList.add('lightbox-open');
  dialog.showModal();

  try {
    const [PageFlip, size] = await Promise.all([loadLibrary(), loadImageSize(pages[0])]);
    if (!dialog.open) return; // 불러오는 사이 닫힘

    const page = fitPageSize(size.width / size.height);
    const holder = document.createElement('div'); // destroy() 가 이 요소를 지우므로 매번 새로 만듭니다.
    holder.className = 'flipbook-book';
    // 책이 들어갈 칸 크기: 두 쪽 펼침이면 두 배 너비, 휴대폰이면 한 쪽 너비
    holder.style.width = `${page.twoPages ? page.width * 2 : page.width}px`;
    stage.append(holder);

    // 쪽마다 <img> 를 담은 칸을 만듭니다. (그림 방식은 빈 왼쪽 면을 흰색으로 칠해서 HTML 방식을 씁니다)
    pageCount = pages.length;
    const items = pages.map((src, i) => {
      const item = document.createElement('div');
      item.className = 'flipbook-page';
      if (i === 0 || i === pages.length - 1) item.dataset.density = 'hard'; // 앞 · 뒤표지는 딱딱하게
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${title ?? '작품 설명집'} ${i + 1}쪽`;
      img.decoding = 'async';
      img.draggable = false;
      item.append(img);
      return item;
    });
    holder.append(...items);

    // 'stretch' 는 칸 너비가 minWidth 의 두 배보다 좁으면 한 쪽씩 보여 줍니다.
    // 휴대폰(한 쪽)이면 minWidth 를 칸의 절반보다 크게 잡아 한 쪽 모드로 고정합니다.
    const minWidth = page.twoPages ? Math.min(120, page.width) : Math.ceil(page.width * 0.6);
    book = new PageFlip(holder, {
      width: page.width,
      height: page.height,
      size: 'stretch', // 칸 너비에 맞춰 늘고 줄어듦 (휴대폰에서 잘리지 않도록)
      minWidth,
      maxWidth: page.width,
      minHeight: Math.round(minWidth / (size.width / size.height)),
      maxHeight: page.height,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
      maxShadowOpacity: 0.4,
      mobileScrollSupport: false,
      flippingTime: 700,
    });
    book.on('flip', (event) => updateCounter(event.data));
    book.on('changeOrientation', () => updateCounter(book.getCurrentPageIndex()));
    book.loadFromHTML(items);
    updateCounter(0);
    dialog.querySelector('.flipbook-next').focus();
  } catch (error) {
    console.error('[flipbook]', error);
    dialog.close();
    window.location.href = fallbackHref; // 라이브러리 실패 시 첫 쪽 그림이라도 보여 줍니다.
  }
};

let initialized = false;

export const initFlipbook = () => {
  if (initialized || typeof HTMLDialogElement !== 'function') return;
  initialized = true;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-flipbook]');
    if (!link) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    let pages = [];
    try {
      pages = JSON.parse(link.dataset.pages ?? '[]');
    } catch {
      /* 잘못된 목록이면 링크로 열기 */
    }
    if (!pages.length) return;

    event.preventDefault();
    open(pages, link.dataset.title, link.href);
  });
};

export default initFlipbook;
