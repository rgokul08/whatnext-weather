import { describe, expect, it } from 'vitest';

describe('weather tile credentials', () => {
  it('accepts the configured OpenWeatherMap key', async () => {
    const key = import.meta.env.VITE_WEATHER_API_KEY;
    expect(key).toBeTruthy();
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=${key}`);
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15000);
});
