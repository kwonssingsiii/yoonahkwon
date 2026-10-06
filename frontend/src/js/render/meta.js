/** 문서 title/description 을 데이터로부터 채웁니다. */
export const renderMeta = ({ meta }) => {
  if (meta.title) document.title = meta.title;

  const description = document.querySelector('meta[name="description"]');
  if (description && meta.description) description.setAttribute('content', meta.description);
};

export default renderMeta;
