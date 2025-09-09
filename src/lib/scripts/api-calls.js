import { browser } from '$app/environment';

/**
 * Secure API call wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
async function secureApiCall(endpoint, options = {}) {
  if (!browser) {
    throw new Error('API calls are only available in the browser');
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Get user's current location using Geolocation API
 * @returns {Promise<{lat: number, lon: number}>} - User coordinates
 */
export async function getCurrentLocation() {
  if (!browser || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'User denied the request for Geolocation. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}

/**
 * Fetch current weather data for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Weather data
 */
export async function getCurrentWeather(lat, lon) {
  const endpoint = `/api/weather?lat=${lat}&lon=${lon}&type=weather`;
  return await secureApiCall(endpoint);
}

/**
 * Fetch weather forecast data for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Forecast data
 */
export async function getWeatherForecast(lat, lon) {
  const endpoint = `/api/weather?lat=${lat}&lon=${lon}&type=forecast`;
  return await secureApiCall(endpoint);
}

/**
 * Get weather icon based on weather condition and time
 * @param {string} weatherMain - Main weather condition
 * @param {string} weatherIcon - Weather icon code from API
 * @param {number} currentTime - Current timestamp
 * @param {number} sunrise - Sunrise timestamp
 * @param {number} sunset - Sunset timestamp
 * @returns {string} - Icon name for iconStore
 */
export function getWeatherIcon(weatherMain, weatherIcon, currentTime, sunrise, sunset) {
  const isNight = currentTime < sunrise || currentTime > sunset;
  const hour = new Date(currentTime * 1000).getHours();
  const isEvening = hour >= 18; // 6 PM or later

  switch (weatherMain.toLowerCase()) {
    case 'clear':
      return isNight || isEvening ? 'moon' : 'sun';
    case 'clouds':
      return 'cloudy';
    case 'rain':
    case 'drizzle':
      return weatherMain.toLowerCase() === 'rain' ? 'heavy-rain' : 'cloud-sun-rain';
    case 'thunderstorm':
      return 'storm';
    case 'snow':
      return 'snow';
    case 'mist':
    case 'fog':
    case 'haze':
      return 'cloudy';
    default:
      return isNight || isEvening ? 'moon' : 'sun';
  }
}

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted time
 */
export function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Store weather data in localStorage for history
 * @param {Object} weatherData - Weather data to store
 */
export function storeWeatherHistory(weatherData) {
  if (!browser) return;

  try {
    const history = getWeatherHistory();
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      location: `${weatherData.name}, ${weatherData.sys.country}`,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed
    };

    // Keep only last 50 entries
    const updatedHistory = [newEntry, ...history.slice(0, 49)];
    localStorage.setItem('weatherly_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to store weather history:', error);
  }
}

/**
 * Get weather history from localStorage
 * @returns {Array} - Weather history array
 */
export function getWeatherHistory() {
  if (!browser) return [];

  try {
    const history = localStorage.getItem('weatherly_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get weather history:', error);
    return [];
  }
}
