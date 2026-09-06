export type LocationResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  source?: 'device' | 'search' | 'favorite';
};

export type WeatherPayload = {
  location: LocationResult;
  timezone: string;
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    rain: number;
    pressure: number;
    cloudCover: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    visibility: number;
    uvIndex: number;
    weatherCode: number;
    isDay: boolean;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    humidity: number;
    rainProbability: number;
    precipitation: number;
    windSpeed: number;
    uvIndex: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    high: number;
    low: number;
    apparentHigh: number;
    apparentLow: number;
    precipitation: number;
    rainProbability: number;
    windSpeed: number;
    windGusts: number;
    sunrise: string;
    sunset: string;
  }>;
  airQuality: {
    aqi: number | null;
    pm25: number | null;
    pm10: number | null;
    carbonMonoxide: number | null;
    nitrogenDioxide: number | null;
    sulphurDioxide: number | null;
    ozone: number | null;
  };
};

const API = 'https://api.open-meteo.com/v1/forecast';
const AIR_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODE_API = 'https://geocoding-api.open-meteo.com/v1/search';

export const DEFAULT_LOCATION: LocationResult = {
  id: 1261481,
  name: 'New Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  country: 'India',
  country_code: 'IN',
  admin1: 'Delhi',
  timezone: 'Asia/Kolkata',
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ name: query.trim(), count: '5', language: 'en', format: 'json' });
  const data = await fetchJson<{ results?: LocationResult[] }>(`${GEOCODE_API}?${params}`);
  return data.results ?? [];
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Reverse geocoding unavailable');
    const data = await response.json() as { address?: Record<string, string>; display_name?: string };
    const address = data.address ?? {};
    return {
      id: Math.round(latitude * 1000 + longitude), name: address.city || address.town || address.village || address.county || 'Current location', latitude, longitude,
      country: address.country || 'Current area', country_code: address.country_code?.toUpperCase(), admin1: address.state || address.region,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, source: 'device',
    };
  } catch {
    return { id: Math.round(latitude * 1000 + longitude), name: 'Current location', latitude, longitude, country: 'Current area', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, source: 'device' };
  } finally { window.clearTimeout(timeout); }
}

export async function getWeather(location: LocationResult): Promise<WeatherPayload> {
  const forecastParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
      'precipitation', 'rain', 'weather_code', 'cloud_cover', 'surface_pressure',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'visibility', 'uv_index',
    ].join(','),
    hourly: [
      'temperature_2m', 'relative_humidity_2m', 'precipitation_probability',
      'precipitation', 'wind_speed_10m', 'uv_index', 'weather_code',
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max',
      'apparent_temperature_min', 'sunrise', 'sunset', 'precipitation_sum',
      'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });

  const airParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi',
    timezone: 'auto',
    forecast_days: '1',
  });

  const [forecast, air] = await Promise.all([
    fetchJson<any>(`${API}?${forecastParams}`),
    Promise.race([
      fetchJson<any>(`${AIR_API}?${airParams}`),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 3500)),
    ]).catch(() => null),
  ]);

  const current = forecast.current;
  const hourly = forecast.hourly.time.map((time: string, index: number) => ({
    time,
    temperature: forecast.hourly.temperature_2m[index],
    humidity: forecast.hourly.relative_humidity_2m[index],
    rainProbability: forecast.hourly.precipitation_probability[index] ?? 0,
    precipitation: forecast.hourly.precipitation[index] ?? 0,
    windSpeed: forecast.hourly.wind_speed_10m[index],
    uvIndex: forecast.hourly.uv_index[index] ?? 0,
    weatherCode: forecast.hourly.weather_code[index],
  }));

  const daily = forecast.daily.time.map((date: string, index: number) => ({
    date,
    weatherCode: forecast.daily.weather_code[index],
    high: forecast.daily.temperature_2m_max[index],
    low: forecast.daily.temperature_2m_min[index],
    apparentHigh: forecast.daily.apparent_temperature_max[index],
    apparentLow: forecast.daily.apparent_temperature_min[index],
    precipitation: forecast.daily.precipitation_sum[index] ?? 0,
    rainProbability: forecast.daily.precipitation_probability_max[index] ?? 0,
    windSpeed: forecast.daily.wind_speed_10m_max[index],
    windGusts: forecast.daily.wind_gusts_10m_max[index],
    sunrise: forecast.daily.sunrise[index],
    sunset: forecast.daily.sunset[index],
  }));

  const airHourIndex = air?.hourly?.time?.findIndex((time: string) => time >= current.time) ?? -1;
  const airValue = (key: string) => airHourIndex >= 0 ? air?.hourly?.[key]?.[airHourIndex] ?? null : null;

  return {
    location,
    timezone: forecast.timezone ?? location.timezone ?? 'auto',
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      rain: current.rain,
      pressure: current.surface_pressure,
      cloudCover: current.cloud_cover,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      windGusts: current.wind_gusts_10m,
      visibility: current.visibility,
      uvIndex: current.uv_index,
      weatherCode: current.weather_code,
      isDay: Boolean(current.is_day),
    },
    hourly: (() => {
      const startIndex = Math.max(0, hourly.findIndex((item: WeatherPayload['hourly'][number]) => item.time >= current.time));
      return hourly.slice(startIndex, startIndex + 24);
    })(),
    daily,
    airQuality: {
      aqi: airValue('us_aqi'),
      pm25: airValue('pm2_5'),
      pm10: airValue('pm10'),
      carbonMonoxide: airValue('carbon_monoxide'),
      nitrogenDioxide: airValue('nitrogen_dioxide'),
      sulphurDioxide: airValue('sulphur_dioxide'),
      ozone: airValue('ozone'),
    },
  };
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return code === 1 ? 'Mainly clear' : 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Variable conditions';
}

export function weatherGroup(code: number): 'clear' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog' {
  if (code === 0) return 'clear';
  if ([1, 2, 3].includes(code)) return 'cloud';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  return 'storm';
}

export function weatherIcon(code: number, isDay = true): string {
  if (!isDay && code === 0) return 'moon';
  if (code === 0) return 'sun';
  if ([1, 2].includes(code)) return 'partly';
  if (code === 3) return 'cloud';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  return 'storm';
}

export function aqiMeta(aqi: number | null) {
  if (aqi === null) return { label: 'Unavailable', tone: 'muted', description: 'Air quality data is not available for this location right now.' };
  if (aqi <= 50) return { label: 'Good', tone: 'good', description: 'Air quality is clear. Ideal conditions for most outdoor activities.' };
  if (aqi <= 100) return { label: 'Moderate', tone: 'moderate', description: 'Air quality is acceptable, though sensitive individuals may notice minor discomfort.' };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'warn', description: 'Sensitive groups should consider shorter outdoor sessions.' };
  return { label: 'Unhealthy', tone: 'danger', description: 'Consider reducing prolonged outdoor exertion until conditions improve.' };
}
