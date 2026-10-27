/**
 * 첫 장면(Welcome) ↔ 책장 화면 전환.
 *   - 처음 들어오면 Welcome 이 보이고, 아무 곳이나 누르거나 Enter · Space 를 누르면 책장으로 넘어갑니다.
 *   - 책장으로 넘어가면 주소에 #library 가 붙어, 브라우저 뒤로 가기로 Welcome 에 돌아갈 수 있습니다.
 *   - 주소에 #library 가 있으면(새로고침 · 공유 링크) 바로 책장을 보여 줍니다.
 */
const LEAVE_MS = 700;
const BOOK_STAGGER_MS = 80;

/** 책장이 나타나면 책들이 왼쪽부터 차례로 올라옵니다. */
const raiseBooks = (library) => {
  library.querySelectorAll('.book').forEach((book, i) => {
    book.classList.remove('visible');
    setTimeout(() => book.classList.add('visible'), 150 + i * BOOK_STAGGER_MS);
  });
};

const els = () => ({
  welcome: document.getElementById('welcome'),
  library: document.getElementById('library'),
});

const showLibrary = ({ animate }) => {
  const { welcome, library } = els();
  if (!welcome || !library || !library.hidden) return;

  const reveal = () => {
    welcome.hidden = true;
    welcome.classList.remove('is-leaving');
    library.hidden = false;
    window.scrollTo(0, 0);
    raiseBooks(library);
    library.querySelector('.book')?.focus({ preventScroll: true });
  };

  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    welcome.classList.add('is-leaving');
    setTimeout(reveal, LEAVE_MS);
  } else {
    reveal();
  }
};

const showWelcome = () => {
  const { welcome, library } = els();
  if (!welcome || !library) return;
  library.hidden = true;
  welcome.hidden = false;
  welcome.classList.remove('is-leaving');
  window.scrollTo(0, 0);
  document.getElementById('welcome-enter')?.focus({ preventScroll: true });
};

const enter = () => {
  if (location.hash !== '#library') history.pushState({ view: 'library' }, '', '#library');
  showLibrary({ animate: true });
};

export const initWelcome = () => {
  const { welcome, library } = els();
  if (!welcome || !library) return;

  welcome.addEventListener('click', enter);
  welcome.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      enter();
    }
  });

  document.getElementById('library-home')?.addEventListener('click', () => {
    if (history.state?.view === 'library') history.back();
    else {
      history.replaceState(null, '', location.pathname);
      showWelcome();
    }
  });

  window.addEventListener('popstate', () => (location.hash === '#library' ? showLibrary({ animate: false }) : showWelcome()));

  if (location.hash === '#library') showLibrary({ animate: false });
  else document.getElementById('welcome-enter')?.focus({ preventScroll: true });
};

export default initWelcome;
