<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import Icon from '$lib/components/ui/icon/icon.svelte';
  import { getCurrentSession, logout } from '$lib/scripts/auth.js';
  import {
    getCurrentLocation,
    getCurrentWeather,
    getWeatherIcon,
    formatTime,
    storeWeatherHistory,
    getWeatherHistory
  } from '$lib/scripts/api-calls.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';

  let session = $state(null);
  let currentWeather = $state(null);
  let weatherHistory = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let activeTab = $state('current');

  onMount(async () => {
    session = getCurrentSession();

    // Redirect to login if not authenticated
    if (!session) {
      goto('/login');
      return;
    }

    // Load weather history
    weatherHistory = getWeatherHistory();

    // Fetch current weather
    await fetchCurrentWeather();
  });

  async function fetchCurrentWeather() {
    loading = true;
    error = null;

    try {
      // First check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error(
          'Geolocation is not supported by this browser. Please enable location services.'
        );
      }

      const location = await getCurrentLocation();
      const weather = await getCurrentWeather(location.lat, location.lon);

      // Check if weather data is valid
      if (!weather || !weather.weather || !weather.weather[0]) {
        throw new Error('Invalid weather data received. Please try again.');
      }

      currentWeather = {
        ...weather,
        location: location,
        icon: getWeatherIcon(
          weather.weather[0].main,
          weather.weather[0].icon,
          weather.dt,
          weather.sys.sunrise,
          weather.sys.sunset
        )
      };

      // Store in history
      storeWeatherHistory(weather);
      weatherHistory = getWeatherHistory();
    } catch (err) {
      // Handle specific geolocation errors
      if (err.message.includes('User denied')) {
        error = 'Location access denied. Please allow location access and try again.';
      } else if (err.message.includes('Position unavailable')) {
        error = 'Unable to determine your location. Please check your GPS settings.';
      } else if (err.message.includes('Timeout')) {
        error = 'Location request timed out. Please try again.';
      } else {
        error = err.message || 'Failed to fetch weather data. Please try again.';
      }
      console.error('Weather fetch error:', err);
    } finally {
      loading = false;
    }
  }

  function handleLogout() {
    logout();
    goto('/login');
  }

  function getWeatherBackground() {
    if (!currentWeather) return '';

    const weather = currentWeather.weather[0].main.toLowerCase();
    const isNight = new Date().getHours() >= 18;

    if (weather.includes('rain') || weather.includes('storm')) {
      return 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800';
    } else if (weather.includes('cloud')) {
      return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600';
    } else if (isNight) {
      return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900';
    } else {
      return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
    }
  }

  function formatHistoryTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
</script>

<div class="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-4">
  {#if session}
    <!-- Header -->
    <div class="mx-auto max-w-6xl">
      <div class="mb-8 flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="font-manrope text-3xl font-bold text-slate-900">
            Welcome back, {session.name}!
          </h1>
          <p class="text-slate-600">Your personal weather dashboard</p>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" onclick={fetchCurrentWeather} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Weather'}
          </Button>
          <Button variant="outline" onclick={handleLogout}>Logout</Button>
        </div>
      </div>

      <!-- Main Content -->
      <Tabs.Root bind:value={activeTab} class="w-full">
        <Tabs.List class="mb-8 grid w-full grid-cols-2">
          <Tabs.Trigger value="current" class="text-base font-medium">Current Weather</Tabs.Trigger>
          <Tabs.Trigger value="history" class="text-base font-medium">Weather History</Tabs.Trigger>
        </Tabs.List>

        <!-- Current Weather Tab -->
        <Tabs.Content value="current" class="space-y-6">
          {#if !currentWeather && !loading && !error}
            <!-- Initial state - show instructions -->
            <div class="py-20 text-center" in:fade>
              <div class="space-y-6">
                <div class="text-6xl">🌤️</div>
                <h3 class="text-2xl font-semibold text-slate-700">Get Your Weather</h3>
                <p class="mx-auto max-w-md text-slate-500">
                  Click the "Refresh Weather" button above to get current weather for your location.
                  You'll be asked to allow location access.
                </p>
                <Button onclick={fetchCurrentWeather} size="lg" class="mt-4">
                  Get Current Weather
                </Button>
              </div>
            </div>
          {:else if loading}
            <div class="flex items-center justify-center py-20" in:fade>
              <div class="space-y-4 text-center">
                <div
                  class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
                ></div>
                <p class="text-slate-600">Fetching your weather data...</p>
                <p class="text-sm text-slate-400">
                  This may take a moment while we get your location...
                </p>
              </div>
            </div>
          {:else if error}
            <div in:fly={{ y: 20, duration: 300 }}>
              <Card.Root class="border-red-200 bg-red-50">
                <Card.Content class="pt-6">
                  <div class="space-y-4 text-center">
                    <div class="text-4xl text-red-600">⚠️</div>
                    <h3 class="text-lg font-semibold text-red-800">Weather Data Unavailable</h3>
                    <p class="mx-auto max-w-md text-red-600">{error}</p>
                    {#if error.includes('denied') || error.includes('allow')}
                      <div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p class="text-sm text-blue-700">
                          <strong>💡 Tip:</strong> To enable location access:
                        </p>
                        <ul class="mx-auto mt-2 max-w-sm space-y-1 text-left text-xs text-blue-600">
                          <li>• Click the location icon in your browser's address bar</li>
                          <li>• Select "Allow" for location permissions</li>
                          <li>• Refresh the page and try again</li>
                        </ul>
                      </div>
                    {/if}
                    <div class="flex justify-center gap-3">
                      <Button
                        onclick={fetchCurrentWeather}
                        variant="outline"
                        class="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Try Again
                      </Button>
                      <Button href="/test" variant="outline">Test Location</Button>
                    </div>
                  </div>
                </Card.Content>
              </Card.Root>
            </div>
          {:else if currentWeather}
            <!-- Weather Hero Card -->
            <div in:fly={{ y: 20, duration: 500 }}>
              <Card.Root
                class="relative overflow-hidden border-0 shadow-2xl {getWeatherBackground()}"
              >
                <div class="absolute inset-0 bg-black/20"></div>
                <Card.Content class="relative pt-8 pb-8 text-white">
                  <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                    <!-- Weather Info -->
                    <div class="space-y-6">
                      <div class="space-y-2">
                        <h2 class="text-4xl font-bold">
                          {Math.round(currentWeather.main.temp)}°C
                        </h2>
                        <p class="text-xl capitalize opacity-90">
                          {currentWeather.weather[0].description}
                        </p>
                        <p class="text-lg opacity-80">
                          📍 {currentWeather.name}, {currentWeather.sys.country}
                        </p>
                      </div>

                      <!-- Weather Details Grid -->
                      <div class="grid grid-cols-2 gap-4">
                        <div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                          <p class="text-sm opacity-80">Feels like</p>
                          <p class="text-xl font-semibold">
                            {Math.round(currentWeather.main.feels_like)}°C
                          </p>
                        </div>
                        <div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                          <p class="text-sm opacity-80">Humidity</p>
                          <p class="text-xl font-semibold">{currentWeather.main.humidity}%</p>
                        </div>
                        <div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                          <p class="text-sm opacity-80">Wind Speed</p>
                          <p class="text-xl font-semibold">{currentWeather.wind.speed} m/s</p>
                        </div>
                        <div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                          <p class="text-sm opacity-80">Pressure</p>
                          <p class="text-xl font-semibold">{currentWeather.main.pressure} hPa</p>
                        </div>
                      </div>
                    </div>

                    <!-- Weather Icon and Sun Times -->
                    <div class="space-y-6 text-center">
                      <div class="flex justify-center">
                        <Icon
                          name={currentWeather.icon}
                          class="h-32 w-32 text-white drop-shadow-lg"
                        />
                      </div>

                      <!-- Sunrise/Sunset -->
                      <div class="space-y-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                        <h3 class="text-lg font-semibold">Sun Times</h3>
                        <div class="flex items-center justify-between">
                          <div class="text-center">
                            <Icon name="sunrise" class="mx-auto mb-2 h-8 w-8 text-yellow-300" />
                            <p class="text-sm opacity-80">Sunrise</p>
                            <p class="font-semibold">{formatTime(currentWeather.sys.sunrise)}</p>
                          </div>
                          <div class="text-center">
                            <Icon name="sunset" class="mx-auto mb-2 h-8 w-8 text-orange-300" />
                            <p class="text-sm opacity-80">Sunset</p>
                            <p class="font-semibold">{formatTime(currentWeather.sys.sunset)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card.Root>
            </div>
          {/if}
        </Tabs.Content>

        <!-- Weather History Tab -->
        <Tabs.Content value="history" class="space-y-6">
          {#if weatherHistory.length === 0}
            <div in:fade>
              <Card.Root class="border-slate-200">
                <Card.Content class="pt-6">
                  <div class="space-y-4 py-12 text-center">
                    <div class="text-6xl text-slate-400">📊</div>
                    <h3 class="text-xl font-semibold text-slate-700">No Weather History</h3>
                    <p class="text-slate-500">Your weather search history will appear here</p>
                    <Button onclick={fetchCurrentWeather} class="mt-4">Get Current Weather</Button>
                  </div>
                </Card.Content>
              </Card.Root>
            </div>
          {:else}
            <div class="grid gap-4">
              {#each weatherHistory as weather, index (weather.id)}
                <div
                  in:fly={{ y: 20, duration: 300, delay: index * 50 }}
                  class="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card"
                >
                  <Card.Root
                    class="border-slate-200 transition-all duration-300 hover:border-slate-300 hover:shadow-lg"
                  >
                    <Card.Content class="pt-6">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                          <div class="rounded-full bg-gradient-to-br from-blue-100 to-blue-200 p-3">
                            <Icon
                              name={getWeatherIcon(
                                weather.description,
                                weather.icon,
                                Date.now() / 1000,
                                0,
                                0
                              )}
                              class="h-6 w-6 text-blue-600"
                            />
                          </div>
                          <div>
                            <h4 class="font-semibold text-slate-900">{weather.location}</h4>
                            <p class="text-sm text-slate-600 capitalize">{weather.description}</p>
                            <p class="text-xs text-slate-500">
                              {formatHistoryTime(weather.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div class="space-y-1 text-right">
                          <p class="text-2xl font-bold text-slate-900">
                            {Math.round(weather.temperature)}°C
                          </p>
                          <div class="flex space-x-4 text-xs text-slate-500">
                            <span>💧 {weather.humidity}%</span>
                            <span>💨 {weather.windSpeed}m/s</span>
                          </div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card.Root>
                </div>
              {/each}
            </div>

            {#if weatherHistory.length > 0}
              <div class="pt-4 text-center">
                <p class="text-sm text-slate-500">
                  Showing {weatherHistory.length} recent weather searches
                </p>
              </div>
            {/if}
          {/if}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  {:else}
    <div class="flex min-h-screen items-center justify-center">
      <div class="space-y-4 text-center">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="text-slate-600">Loading your dashboard...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom animations for smooth transitions */
  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
</style>
