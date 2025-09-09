<script>
  let coords = $state({ lat: null, lon: null });
  let loading = $state(false);
  let error = $state(null);
  let weatherData = $state(null);

  async function getLocation() {
    loading = true;
    error = null;

    if (!navigator.geolocation) {
      error = 'Geolocation is not supported by this browser';
      loading = false;
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      // Fetch weather data
      await fetchWeatherData();
    } catch (err) {
      error = err.message || 'Unable to get your location';
    } finally {
      loading = false;
    }
  }

  async function fetchWeatherData() {
    if (!coords.lat || !coords.lon) return;

    try {
      const API_KEY = 'c2f066a304d81e8825b4cd66d6522777'; // Replace with your OpenWeather API key from .env
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`
      );

      //   const responseformat = {
      //     coord: {
      //       lon: 72.8394,
      //       lat: 19.1382
      //     },
      //     weather: [
      //       {
      //         id: 802,
      //         main: 'Clouds',
      //         description: 'scattered clouds',
      //         icon: '03n'
      //       }
      //     ],
      //     base: 'stations',
      //     main: {
      //       temp: 28.3,
      //       feels_like: 30.83,
      //       temp_min: 28.3,
      //       temp_max: 28.3,
      //       pressure: 1011,
      //       humidity: 67,
      //       sea_level: 1011,
      //       grnd_level: 1009
      //     },
      //     visibility: 10000,
      //     wind: {
      //       speed: 1.41,
      //       deg: 252,
      //       gust: 1.51
      //     },
      //     clouds: {
      //       all: 34
      //     },
      //     dt: 1757438828,
      //     sys: {
      //       country: 'IN',
      //       sunrise: 1757379316,
      //       sunset: 1757423830
      //     },
      //     timezone: 19800,
      //     id: 6324621,
      //     name: 'Powai',
      //     cod: 200
      //   };

      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }

      weatherData = await response.json();
    } catch (err) {
      error = 'Failed to fetch weather data';
    }
  }
</script>

<div class="p-4">
  <button onclick={getLocation} disabled={loading} class="btn btn-primary">
    {loading ? 'Getting location...' : 'Get My Location & Weather'}
  </button>

  {#if error}
    <div class="error-message mt-4">{error}</div>
  {/if}

  {#if coords.lat && coords.lon}
    <div class="mt-4">
      <h3>Your Location:</h3>
      <p>Latitude: {coords.lat.toFixed(6)}</p>
      <p>Longitude: {coords.lon.toFixed(6)}</p>
    </div>
  {/if}

  {#if weatherData}
    <div class="mt-4">
      <h3>Weather Information:</h3>
      <p>Location: {weatherData.name}</p>
      <p>Temperature: {weatherData.main.temp}°C</p>
      <p>Weather: {weatherData.weather[0].description}</p>
    </div>
  {/if}
</div>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    color: #dc3545;
    padding: 0.5rem;
    border: 1px solid #dc3545;
    border-radius: 0.25rem;
  }
</style>
