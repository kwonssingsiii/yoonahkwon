import { escapeHtml, joinHtml, mount, setHtml } from './dom.js';

export const renderContact = ({ contact }) => {
  // intro 는 <br /> 을 포함한 신뢰된 내부 데이터입니다.
  setHtml('#contact-intro', contact.intro);

  mount(
    'contact-cards',
    joinHtml(
      contact.cards,
      (card) => `
      <div class="contact-card" id="${escapeHtml(card.id)}">
        <div class="contact-card-icon">${escapeHtml(card.icon)}</div>
        <div class="contact-card-body">
          <span class="contact-card-label">${escapeHtml(card.label)}</span>
          <span class="contact-card-value">${escapeHtml(card.value)}</span>
        </div>
      </div>`,
    ),
  );
};

export default renderContact;
