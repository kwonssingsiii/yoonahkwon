/**
 * Open-Meteo 현재 날씨 — API 키가 필요 없는 공개 API 입니다.
 * 데이터 라이선스(CC BY 4.0)에 따라 화면에 출처를 표기해야 합니다. (render/location.js)
 * https://open-meteo.com/en/docs
 */
import requestExternal from './httpClient.js';

export const OPEN_METEO_SOURCE = { name: 'Open-Meteo', url: 'https://open-meteo.com/' };

export const fetchCurrentWeather = async ({ lat, lon }) => {
  const { current, current_units: units } = await requestExternal('/v1/forecast', {
    baseUrl: 'https://api.open-meteo.com',
    query: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m',
      timezone: 'Asia/Seoul',
    },
  });

  return {
    temperature: current.temperature_2m,
    temperatureUnit: units.temperature_2m,
    humidity: current.relative_humidity_2m,
    humidityUnit: units.relative_humidity_2m,
    observedAt: current.time,
  };
};

export default fetchCurrentWeather;
