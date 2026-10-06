/** 찾아오는 길 섹션의 현재 날씨(기온 · 습도). 실패해도 섹션의 나머지는 그대로 둡니다. */
import weatherApi from '../api/weather.api.js';
import { escapeHtml } from '../render/dom.js';

const formatObservedAt = (iso) => {
  const [, time] = iso.split('T'); // Open-Meteo 가 Asia/Seoul 기준 "YYYY-MM-DDTHH:mm" 으로 줍니다.
  return time ? `${time} 기준` : '';
};

export const initWeather = async () => {
  const box = document.getElementById('location-weather');
  if (!box) return;

  try {
    const w = await weatherApi.getCurrent();
    box.innerHTML = `
      <div class="weather-item">
        <span class="weather-label">🌡️ 기온</span>
        <span class="weather-value">${escapeHtml(Math.round(w.temperature))}${escapeHtml(w.temperatureUnit)}</span>
      </div>
      <div class="weather-item">
        <span class="weather-label">💧 습도</span>
        <span class="weather-value">${escapeHtml(w.humidity)}${escapeHtml(w.humidityUnit)}</span>
      </div>
      <span class="weather-time">현재 날씨 · ${escapeHtml(formatObservedAt(w.observedAt))}</span>`;
  } catch (error) {
    console.warn('[weather] 날씨 조회 실패:', error.message);
    box.innerHTML = '<p class="weather-hint">지금은 날씨 정보를 불러올 수 없습니다.</p>';
  }
};

export default initWeather;
