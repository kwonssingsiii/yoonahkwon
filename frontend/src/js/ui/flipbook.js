/**
 * 책 넘기기 (StPageFlip — src/vendor/page-flip.browser.js).
 *
 * 책장에 꽂힌 책(<button data-book="id">)을 누르면 같은 화면 위에 책을 펼칩니다.
 * 책 내용은 registerBook(id, { … }) 로 미리 등록해 둡니다. 쪽은 두 종류를 섞어 쓸 수 있습니다.
 *   - '그림 주소' 문자열          → 작품 판넬 · 설명집처럼 그림 한 장이 한 쪽
 *   - { html, className } 객체   → 소개 · 학력처럼 글로 된 쪽
 *
 *   - 넓은 화면: 두 쪽 펼침 / 좁은 화면(휴대폰): 한 쪽씩
 *   - 넘기기: 책장 끝을 끌거나 누르기 · ◀ ▶ 버튼 · 키보드 ← →
 *   - 닫기: ✕ 버튼 · Esc · 바깥 어두운 곳
 * 라이브러리는 처음 열 때 한 번만 불러옵니다. (첫 화면 속도에 영향 없음)
 * 책이 펼쳐지면 document 에 'flipbook:open' 이벤트(detail.id)를 보냅니다. (예: 찾아오는 길의 날씨 불러오기)
 */

const LIBRARY_URL = new URL('../../vendor/page-flip.browser.js', import.meta.url).href;

/** 글로 된 책의 쪽 비율 (가로 ÷ 세로) */
const TEXT_PAGE_RATIO = 0.72;

const books = new Map();

/** 책 내용을 등록합니다. { title, pages, ratio? } — ratio 를 비우면 첫 쪽 그림의 비율을 씁니다. */
export const registerBook = (id, book) => books.set(id, book);
export const clearBooks = () => books.clear();

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
const loadImageRatio = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = () => resolve(1 / 1.414); // A 판형 비율로 대체
    img.src = src;
  });

/** 책 크기 비율: 지정값 → 책 속 첫 그림의 비율 → 글 쪽 기본 비율 */
const pageRatio = async ({ ratio, pages }) => {
  if (ratio) return ratio;
  const firstImage = pages.find((p) => typeof p === 'string');
  return firstImage ? loadImageRatio(firstImage) : TEXT_PAGE_RATIO;
};

let dialog = null;
let flip = null; // 현재 열린 PageFlip
let pageCount = 0;
let openedFrom = null; // 닫으면 포커스를 돌려줄 책

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
  const landscape = flip?.getOrientation?.() === 'landscape';
  const backCoverAlone = index === pageCount - 1 && pageCount % 2 === 0;
  holder.style.transform = !landscape ? '' : index === 0 ? 'translateX(-25%)' : backCoverAlone ? 'translateX(25%)' : '';
};

const updateCounter = (index) => {
  centerClosedBook(index);
  const { counter, prev, next } = ui();
  // 두 쪽 펼침이면 "2–3 / 12" 처럼 보여 줍니다.
  const spread = flip?.getOrientation?.() === 'landscape' && index > 0 && index < pageCount - 1;
  counter.textContent = spread ? `${index + 1}–${Math.min(index + 2, pageCount)} / ${pageCount}` : `${index + 1} / ${pageCount}`;
  prev.disabled = index <= 0;
  next.disabled = index >= pageCount - (spread ? 2 : 1);
};

const destroyFlip = () => {
  if (!flip) return;
  try {
    flip.destroy();
  } catch {
    /* 이미 정리됨 */
  }
  flip = null;
};

const build = () => {
  dialog = document.createElement('dialog');
  dialog.className = 'flipbook';
  dialog.innerHTML = `
    <div class="flipbook-bar">
      <p class="flipbook-title"></p>
      <button type="button" class="flipbook-close" aria-label="책 덮기">✕</button>
    </div>
    <div class="flipbook-stage"></div>
    <div class="flipbook-controls">
      <button type="button" class="flipbook-prev" aria-label="이전 쪽">◀</button>
      <span class="flipbook-counter" aria-live="polite"></span>
      <button type="button" class="flipbook-next" aria-label="다음 쪽 (키보드 → 로도 넘길 수 있어요)">▶</button>
    </div>`;
  document.body.append(dialog);

  const { prev, next } = ui();
  prev.addEventListener('click', () => flip?.flipPrev());
  next.addEventListener('click', () => flip?.flipNext());
  dialog.querySelector('.flipbook-close').addEventListener('click', () => dialog.close());

  // 책 · 버튼 밖의 어두운 곳을 누르면 닫습니다.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target === ui().stage) dialog.close();
  });

  // 키보드 넘기기: 사파리는 책을 연 뒤 포커스가 책 밖(body)으로 빠지는 경우가 있어,
  // 책 창이 아니라 문서 전체에서 받고 책이 열려 있을 때만 처리합니다.
  document.addEventListener('keydown', (event) => {
    if (!dialog?.open || event.defaultPrevented) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      flip?.flipNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      flip?.flipPrev();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    destroyFlip();
    document.documentElement.classList.remove('lightbox-open');
    openedFrom?.focus?.();
    openedFrom = null;
  });
};

/**
 * 화면에 들어가는 가장 큰 책 크기(한 쪽 기준)와 펼침 여부를 계산합니다.
 * 두 쪽 펼침으로 해도 한 쪽 크기가 거의 줄지 않을 때만 펼칩니다.
 *   - 세로로 긴 글 쪽(소개 · 학력): 화면 높이에 맞춰지므로 두 쪽 펼침
 *   - 가로로 긴 판넬 · 설명집 쪽: 펼치면 반으로 작아지므로 한 쪽씩 크게
 */
const fitPageSize = (ratio) => {
  const { stage } = ui();
  const style = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availH = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const single = Math.min(availW, availH * ratio);
  const spread = Math.min(availW / 2, availH * ratio);
  const twoPages = availW >= 640 && spread >= single * 0.85;
  const pageW = twoPages ? spread : single;
  return { width: Math.floor(pageW), height: Math.floor(pageW / ratio), twoPages, availW };
};

/** 쪽 하나를 만듭니다. 그림 주소면 <img>, 객체면 글 쪽. */
const makePage = (page, i, total, title) => {
  const item = document.createElement('div');
  item.className = 'flipbook-page';
  if (i === 0 || i === total - 1) item.dataset.density = 'hard'; // 앞 · 뒤표지는 딱딱하게

  if (typeof page === 'string') {
    const img = document.createElement('img');
    img.src = page;
    img.alt = `${title} ${i + 1}쪽`;
    img.decoding = 'async';
    img.draggable = false;
    item.append(img);
  } else {
    item.classList.add('flipbook-page--text');
    if (page.className) item.classList.add(...page.className.split(' '));
    const inner = document.createElement('div');
    inner.className = 'book-page';
    inner.innerHTML = page.html; // 렌더 모듈이 escapeHtml 로 만든 신뢰된 HTML
    item.append(inner);
  }
  return item;
};

/** 라이브러리를 못 불러왔을 때: 쪽들을 위아래로 이어 붙여서라도 보여 줍니다. */
const showFallback = (def) => {
  const { stage, counter } = ui();
  counter.textContent = '';
  const list = document.createElement('div');
  list.className = 'flipbook-fallback';
  def.pages.forEach((page, i) => list.append(makePage(page, i, def.pages.length, def.title)));
  stage.replaceChildren(list);
};

const open = async (id, trigger) => {
  const def = books.get(id);
  if (!def?.pages?.length) return;
  if (!dialog) build();
  openedFrom = trigger;

  const { stage, title: titleEl, counter } = ui();
  titleEl.textContent = def.title;
  counter.textContent = '불러오는 중…';
  stage.replaceChildren();
  document.documentElement.classList.add('lightbox-open');
  dialog.showModal();

  try {
    const [PageFlip, ratio] = await Promise.all([loadLibrary(), pageRatio(def)]);
    if (!dialog.open) return; // 불러오는 사이 닫힘

    const page = fitPageSize(ratio);
    const holder = document.createElement('div'); // destroy() 가 이 요소를 지우므로 매번 새로 만듭니다.
    holder.className = 'flipbook-book';
    // 책이 들어갈 칸 크기: 두 쪽 펼침이면 두 배 너비, 휴대폰이면 한 쪽 너비
    holder.style.width = `${page.twoPages ? page.width * 2 : page.width}px`;
    stage.append(holder);

    pageCount = def.pages.length;
    const items = def.pages.map((p, i) => makePage(p, i, pageCount, def.title));
    holder.append(...items);

    // 'stretch' 는 책 칸 너비가 minWidth 의 두 배보다 좁으면 한 쪽씩 보여 줍니다.
    // 라이브러리가 책 칸을 화면 너비(100%)로 넓히므로, 한 쪽씩 볼 때는 minWidth 를 '화면 너비의 절반보다 크게' 잡아
    // 두 쪽 펼침으로 바뀌지 않게 고정합니다. (판넬처럼 가로로 긴 쪽을 크게 보기 위해)
    const minWidth = page.twoPages
      ? Math.min(120, page.width)
      : Math.min(page.width, Math.max(Math.ceil(page.width * 0.6), Math.floor(page.availW / 2) + 1));
    flip = new PageFlip(holder, {
      width: page.width,
      height: page.height,
      size: 'stretch', // 칸 너비에 맞춰 늘고 줄어듦 (휴대폰에서 잘리지 않도록)
      minWidth,
      maxWidth: page.width,
      minHeight: Math.round(minWidth / ratio),
      maxHeight: page.height,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
      maxShadowOpacity: 0.4,
      mobileScrollSupport: false,
      flippingTime: 700,
    });
    flip.on('flip', (event) => updateCounter(event.data));
    flip.on('changeOrientation', () => updateCounter(flip.getCurrentPageIndex()));
    // 표지를 넘기기 시작하는 순간 책을 제자리로 옮겨, 넘김과 이동이 함께 일어나게 합니다.
    flip.on('changeState', (event) => {
      const holder = ui().stage.querySelector('.flipbook-book');
      if (!holder) return;
      if (event.data === 'read') centerClosedBook(flip.getCurrentPageIndex());
      else holder.style.transform = '';
    });
    flip.loadFromHTML(items);
    updateCounter(0);
    dialog.querySelector('.flipbook-next').focus();
    document.dispatchEvent(new CustomEvent('flipbook:open', { detail: { id } }));
  } catch (error) {
    console.error('[flipbook]', error);
    showFallback(def);
    document.dispatchEvent(new CustomEvent('flipbook:open', { detail: { id } }));
  }
};

let initialized = false;

export const initFlipbook = () => {
  if (initialized || typeof HTMLDialogElement !== 'function') return;
  initialized = true;

  // 책은 데이터를 받은 뒤 그려지므로, 문서 전체에서 한 번만 클릭을 받아 처리합니다.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-book]');
    if (!trigger || !books.has(trigger.dataset.book)) return;
    event.preventDefault();
    open(trigger.dataset.book, trigger);
  });
};

export const openBook = (id) => open(id, document.querySelector(`[data-book="${CSS.escape(id)}"]`));

export default initFlipbook;
