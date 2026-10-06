import { escapeHtml, joinHtml, mount, setText } from './dom.js';

/** API 키 없이 쓸 수 있는 지도 퍼가기 주소와 지도 앱 바로가기 */
const mapEmbedUrl = (query) => `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

const mapLinks = (query) => {
  const q = encodeURIComponent(query);
  return [
    { label: '네이버 지도', href: `https://map.naver.com/p/search/${q}` },
    { label: '카카오맵', href: `https://map.kakao.com/link/search/${q}` },
    { label: 'Google 지도', href: `https://www.google.com/maps/search/?api=1&query=${q}` },
  ];
};

/** 화면에 작게 표기하는 외부 서비스 출처 (Open-Meteo 는 CC BY 4.0 이라 표기가 필수입니다) */
const SOURCES = [
  { label: '지도', name: 'Google 지도', href: 'https://www.google.com/maps' },
  { label: '날씨', name: 'Open-Meteo (CC BY 4.0)', href: 'https://open-meteo.com/' },
];

const directionCard = (item) => `
  <div class="contact-card location-card" id="${escapeHtml(item.id)}">
    <div class="contact-card-icon">${escapeHtml(item.icon)}</div>
    <div class="contact-card-body">
      <span class="contact-card-label">${escapeHtml(item.label)}</span>
      <span class="contact-card-value">${escapeHtml(item.value)}</span>
    </div>
  </div>`;

export const renderLocation = ({ location }) => {
  if (!location) return;
  setText('#location-intro', location.intro);

  // mapQuery 가 비어 있으면 주소로 검색합니다. 둘 다 없으면 지도 대신 안내를 보여 줍니다.
  const query = location.mapQuery || location.address;

  mount(
    'location-map',
    query
      ? `<iframe title="${escapeHtml(location.placeName || '찾아오는 길')} 지도" src="${escapeHtml(mapEmbedUrl(query))}"
           loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
      : '<p class="empty-state">지도에 표시할 주소가 아직 설정되지 않았습니다.</p>',
  );

  mount(
    'location-info',
    `
    <div class="location-address">
      <h3 class="location-place">${escapeHtml(location.placeName || '장소 미정')}</h3>
      <p class="location-street">${escapeHtml(location.address || '주소가 곧 업데이트됩니다.')}</p>
      ${
        query
          ? `<div class="location-links">
               ${joinHtml(
                 mapLinks(query),
                 (link) =>
                   `<a class="location-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`,
               )}
             </div>`
          : ''
      }
    </div>
    ${
      location.coordinates
        ? `<div class="location-weather" id="location-weather" aria-live="polite">
             <p class="weather-hint">현재 날씨를 불러오는 중…</p>
           </div>`
        : ''
    }
    <div class="location-directions">${joinHtml(location.directions ?? [], directionCard)}</div>
    ${location.note ? `<p class="location-note">${escapeHtml(location.note)}</p>` : ''}
    <p class="location-sources">
      출처 ·
      ${SOURCES.map(
        (s) =>
          `${escapeHtml(s.label)}: <a href="${escapeHtml(s.href)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`,
      ).join(' · ')}
    </p>`,
  );
};

export default renderLocation;
