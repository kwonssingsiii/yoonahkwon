/** 첫 장면(Welcome). 누르면 ui/welcome.js 가 책장 화면으로 넘깁니다. */
import { escapeHtml, mount } from './dom.js';

export const renderWelcome = ({ profile }) => {
  const subtitle = [profile.department, profile.university, profile.grade].filter(Boolean).map(escapeHtml).join(' · ');
  mount(
    'welcome-content',
    `
    <p class="welcome-kicker">Welcome</p>
    <p class="welcome-greeting">${escapeHtml(profile.greeting)}</p>
    <h1 class="welcome-name">${escapeHtml(profile.nameSpaced ?? profile.name)}</h1>
    <p class="welcome-sub">${subtitle}</p>
    <p class="welcome-tagline">${escapeHtml(profile.tagline)}</p>
    <div class="welcome-books" aria-hidden="true">
      <span style="--book-color:#b8aed6;--h:62%"></span>
      <span style="--book-color:#e6d2a8;--h:78%"></span>
      <span style="--book-color:#b5533c;--h:70%"></span>
      <span style="--book-color:#9fb0c4;--h:88%"></span>
      <span class="is-leaning" style="--book-color:#c9c9c9;--h:74%"></span>
      <span style="--book-color:#9bc08a;--h:82%"></span>
      <span style="--book-color:#ad9bc9;--h:66%"></span>
    </div>
    <button type="button" class="welcome-enter" id="welcome-enter">책장 열기</button>
    <p class="welcome-hint">화면 아무 곳이나 눌러도 들어갈 수 있어요</p>`,
  );
};

export default renderWelcome;
