/** 스크롤 시 네비바 스타일 변경 + 모바일 햄버거 메뉴 + 현재 섹션 하이라이트 */

export const initNavbar = () => {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!navbar || !hamburger || !navLinks) return;

  const closeMenu = () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
  };

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // 링크는 렌더 후 생성되므로 위임 방식으로 처리합니다.
  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('.nav-link')) closeMenu();
  });

  const sections = [...document.querySelectorAll('section[id]')];
  const navItems = () => [...navLinks.querySelectorAll('.nav-link')];

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    const scrollY = window.scrollY + 120;
    const current = sections.find(
      (section) => scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight,
    );
    if (!current) return;

    navItems().forEach((link) => {
      link.style.color = link.getAttribute('href') === `#${current.id}` ? 'var(--clr-primary)' : '';
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

export default initNavbar;
