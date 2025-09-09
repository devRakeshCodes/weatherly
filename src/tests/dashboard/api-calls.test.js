import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherImage,
  getWeatherIcon,
  getCurrentLocation
} from '../../lib/scripts/api-calls.js';

// Mock fetch
global.fetch = vi.fn();

// Mock environment variables
vi.mock('$env/static/public', () => ({
  PUBLIC_WEATHER_API_KEY: 'test-api-key'
}));

describe('API Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentWeather', () => {
    it('should fetch current weather data successfully', async () => {
      const mockWeatherData = {
        name: 'Mumbai',
        main: { temp: 28, humidity: 65 },
        weather: [{ main: 'Clear', description: 'clear sky' }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherData
      });

      const result = await getCurrentWeather(19.1389487, 72.8397202);

      expect(fetch).toHaveBeenCalledWith(
        '/api/weather?lat=19.1389487&lon=72.8397202&type=weather',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockWeatherData);
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(getCurrentWeather(19.1389487, 72.8397202)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getCurrentWeather(19.1389487, 72.8397202)).rejects.toThrow('Network error');
    });
  });

  describe('getWeatherForecast', () => {
    it('should fetch weather forecast data successfully', async () => {
      const mockForecastData = {
        list: [{ dt: 1641015000, main: { temp: 28 }, weather: [{ main: 'Clear' }] }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastData
      });

      const result = await getWeatherForecast(19.1389487, 72.8397202);

      expect(fetch).toHaveBeenCalledWith(
        '/api/weather?lat=19.1389487&lon=72.8397202&type=forecast',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockForecastData);
    });
  });

  describe('getCurrentLocation', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn()
    };

    beforeEach(() => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });
    });

    it('should get current location successfully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 19.1389487,
            longitude: 72.8397202
          }
        });
      });

      const result = await getCurrentLocation();

      expect(result).toEqual({
        lat: 19.1389487,
        lon: 72.8397202
      });
    });

    it('should handle geolocation permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'User denied geolocation' });
      });

      await expect(getCurrentLocation()).rejects.toThrow('User denied geolocation');
    });

    it('should handle geolocation unavailable', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 2, message: 'Position unavailable' });
      });

      await expect(getCurrentLocation()).rejects.toThrow('Position unavailable');
    });

    it('should handle geolocation timeout', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 3, message: 'Timeout' });
      });

      await expect(getCurrentLocation()).rejects.toThrow('Timeout');
    });
  });

  describe('getWeatherImage', () => {
    it('should return sun image for clear day weather', () => {
      const result = getWeatherImage('Clear', '01d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/sun.png');
    });

    it('should return moon image for clear night weather after 6 PM', () => {
      // Mock current time to be after 6 PM
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(19); // 7 PM

      const result = getWeatherImage('Clear', '01n', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/clear-night-sky.png');
    });

    it('should return moon image for clear night weather before sunrise', () => {
      const currentTime = 1640990000; // Before sunrise
      const result = getWeatherImage('Clear', '01n', currentTime, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/clear-night-sky.png');
    });

    it('should return cloudy day image for cloudy day weather', () => {
      const result = getWeatherImage('Clouds', '02d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/cloudy-day.png');
    });

    it('should return cloudy night image for cloudy night weather', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20); // 8 PM

      const result = getWeatherImage('Clouds', '02n', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/cloudy-night.png');
    });

    it('should return rain image for rainy weather', () => {
      const result = getWeatherImage('Rain', '10d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/heavy-rain.png');
    });

    it('should return snow image for snowy weather', () => {
      const result = getWeatherImage('Snow', '13d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/snow.png');
    });

    it('should return default sun image for unknown weather during day', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14); // 2 PM
      const result = getWeatherImage('Unknown', '50d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/sun.png');
    });
  });

  describe('getWeatherIcon', () => {
    it('should return correct icon for clear weather', () => {
      const result = getWeatherIcon('Clear');
      expect(result).toBe('sun');
    });

    it('should return correct icon for cloudy weather', () => {
      const result = getWeatherIcon('Clouds');
      expect(result).toBe('cloudy');
    });

    it('should return correct icon for rainy weather', () => {
      const result = getWeatherIcon('Rain');
      expect(result).toBe('heavy-rain');
    });

    it('should return correct icon for snowy weather', () => {
      const result = getWeatherIcon('Snow');
      expect(result).toBe('snow');
    });

    it('should return default icon for unknown weather during day', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14); // 2 PM
      const result = getWeatherIcon('Unknown');
      expect(result).toBe('sun');
    });
  });

  describe('Time-based Logic', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should correctly identify night time after 6 PM', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18); // 6 PM

      const result = getWeatherImage('Clear', '01d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/clear-night-sky.png');
    });

    it('should correctly identify day time before 6 PM', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14); // 2 PM

      const result = getWeatherImage('Clear', '01d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/sun.png');
    });

    it('should handle edge case at exactly 6 PM', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(18); // Exactly 6 PM

      const result = getWeatherImage('Clear', '01d', 1641015000, 1640995200, 1641034800);
      expect(result).toBe('/assets/icons/clear-night-sky.png');
    });
  });
});
