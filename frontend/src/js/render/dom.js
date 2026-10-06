/** 렌더 모듈이 공유하는 작은 헬퍼들. */

/** 데이터에 HTML 특수문자가 있어도 안전하게 출력합니다. */
export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** 여러 줄 템플릿을 합칠 때 사용합니다. */
export const joinHtml = (items, mapper) => items.map(mapper).join('');

/** id 로 컨테이너를 찾아 HTML 을 채웁니다. 없으면 조용히 무시합니다. */
export const mount = (containerId, html) => {
  const el = document.getElementById(containerId);
  if (!el) {
    console.warn(`[render] #${containerId} 컨테이너를 찾을 수 없습니다.`);
    return null;
  }
  el.innerHTML = html;
  return el;
};

/** 텍스트만 바꿔야 하는 단일 요소용. */
export const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el && value != null) el.textContent = value;
};

/** 신뢰된 내부 데이터(bio 등 <strong> 포함)를 넣을 때 사용합니다. */
export const setHtml = (selector, value) => {
  const el = document.querySelector(selector);
  if (el && value != null) el.innerHTML = value;
};
