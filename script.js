/* =========================================
   script.js — Portfolio Interactions
   ========================================= */

// ── Navbar scroll effect ──────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ── Mobile hamburger menu ─────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
});
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
  });
});

// ── Intersection Observer: fade-in animations ─
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px',
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger delay based on siblings index
      const siblings = [...entry.target.parentElement.children];
      const idx = siblings.indexOf(entry.target);
      const delay = idx * 100;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      fadeObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all animatable elements
const animatables = document.querySelectorAll(
  '.about-card, .timeline-item, .award-card, .skill-item'
);
animatables.forEach(el => fadeObserver.observe(el));

// ── Particle generator ────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    const size = Math.random() * 5 + 2; // 2–7 px
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10; // 10–25s
    const delay   = Math.random() * 15;
    const opacity = Math.random() * 0.5 + 0.2;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -${size}px;
      opacity: 0;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      box-shadow: 0 0 ${size * 2}px rgba(74,181,105,0.6);
    `;
    container.appendChild(p);
  }
}
createParticles();

// ── Smooth active nav highlight ───────────
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    const sectionTop    = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navItems.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${id}`) {
          link.style.color = 'var(--clr-primary)';
        }
      });
    }
  });
});

// ── Hero scroll smooth ────────────────────
document.getElementById('hero-cta-btn')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('hero-awards-btn')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('awards')?.scrollIntoView({ behavior: 'smooth' });
});

// ── Card tilt micro-interaction ───────────
document.querySelectorAll('.award-card, .about-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `
      translateY(-8px)
      rotateX(${-y * 6}deg)
      rotateY(${x * 6}deg)
    `;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── Page load progress bar ────────────────
(function createProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0', left: '0',
    height: '3px',
    background: 'linear-gradient(90deg, #4ab569, #2ecc71)',
    zIndex: '9999',
    width: '0%',
    transition: 'width 0.1s linear',
    boxShadow: '0 0 10px rgba(74,181,105,0.7)',
    pointerEvents: 'none',
  });
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrollTop  = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = pct + '%';
  });
})();

console.log('✅ 권윤아 포트폴리오 웹사이트 로드 완료!');
