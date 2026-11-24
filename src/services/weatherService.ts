import { WeatherKind, mapWmoToWeather } from '../world/worldLogic';

export interface LiveWeatherInfo {
  weather: WeatherKind;
  temperatureC: number;
  windKmh: number;
  locationLabel: string;
  source: 'live' | 'cached' | 'offline-fallback';
  updatedAt: number;
}

const CACHE_KEY = 'aashish_3d_weather_v1';

const FALLBACK_WEATHER: LiveWeatherInfo = {
  weather: 'clear',
  temperatureC: 18,
  windKmh: 7,
  locationLabel: 'Kathmandu Valley',
  source: 'offline-fallback',
  updatedAt: Date.now(),
};

export async function fetchLiveWeather(
  lat = 27.7172,
  lon = 85.324,
  locationLabel = 'Kathmandu Valley',
): Promise<LiveWeatherInfo> {
  // Check fresh cache (< 20 minutes old) first to keep external traffic minimal
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveWeatherInfo;
      if (Date.now() - parsed.updatedAt < 20 * 60 * 1000) {
        return { ...parsed, source: 'cached' };
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return loadCachedOrFallback();
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);

    if (!res.ok) {
      return loadCachedOrFallback();
    }

    const json = await res.json();
    const current = json?.current;
    if (!current || typeof current.weather_code !== 'number') {
      return loadCachedOrFallback();
    }

    const info: LiveWeatherInfo = {
      weather: mapWmoToWeather(current.weather_code),
      temperatureC: Math.round(current.temperature_2m ?? 18),
      windKmh: Math.round(current.wind_speed_10m ?? 6),
      locationLabel,
      source: 'live',
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(info));
    } catch {
      // Ignore storage quota errors
    }

    return info;
  } catch {
    return loadCachedOrFallback();
  }
}

function loadCachedOrFallback(): LiveWeatherInfo {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveWeatherInfo;
      return { ...parsed, source: 'cached' };
    }
  } catch {
    // Ignore
  }
  return { ...FALLBACK_WEATHER, updatedAt: Date.now() };
}
