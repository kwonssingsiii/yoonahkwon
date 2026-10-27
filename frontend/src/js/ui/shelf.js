/** 책장 아래 안내문: 마우스를 올리거나 (키보드로) 고른 책의 설명을 보여 줍니다. */
export const initShelfCaption = () => {
  const shelf = document.getElementById('shelf-books');
  const caption = document.getElementById('shelf-caption');
  if (!shelf || !caption) return;
  const initial = caption.textContent;

  const show = (event) => {
    const book = event.target.closest('[data-caption]');
    caption.textContent = book ? book.dataset.caption : initial;
    caption.classList.toggle('is-active', Boolean(book));
  };
  shelf.addEventListener('mouseover', show);
  shelf.addEventListener('focusin', show);
  shelf.addEventListener('mouseleave', () => {
    caption.textContent = initial;
    caption.classList.remove('is-active');
  });
};

export default initShelfCaption;
