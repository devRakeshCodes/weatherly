<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import { getCurrentSession, logout } from '$lib/scripts/auth.js';
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';

  let session = $state(null);

  onMount(() => {
    session = getCurrentSession();
  });

  function handleLogout() {
    logout();
    session = null;
  }
</script>

<!-- Modern Hero Section with Background -->
<div class="relative min-h-screen overflow-hidden">
  <!-- Background Image -->
  <div class="absolute inset-0 z-0">
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style="background-image: url('/assets/images/day-clear.jpg')"
    ></div>
    <div class="absolute inset-0 bg-black/40"></div>
    <div
      class="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"
    ></div>
  </div>

  <!-- Content -->
  <div class="relative z-10 flex h-screen w-full flex-col items-center justify-center gap-8 p-4">
    <div class="space-y-6 text-center" in:fade={{ duration: 800 }}>
      <div
        class="mb-8 flex items-center justify-center space-x-4"
        in:fly={{ y: -30, duration: 600, delay: 200 }}
      >
        <div
          class="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 shadow-2xl"
        >
          <span class="text-2xl font-bold text-white">W</span>
        </div>
        <h1 class="font-manrope text-6xl font-bold text-white drop-shadow-2xl">Weatherly</h1>
      </div>

      <p
        class="mx-auto max-w-2xl text-2xl text-white/90 drop-shadow-lg"
        in:fly={{ y: 30, duration: 600, delay: 400 }}
      >
        Your personal weather companion with beautiful, real-time weather insights
      </p>
    </div>

    {#if session}
      <div class="space-y-6 text-center" in:fly={{ y: 30, duration: 600, delay: 600 }}>
        <div class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
          <p class="mb-6 text-2xl text-white">
            Hello, <span class="font-bold text-yellow-300 drop-shadow">{session.name}</span>!
          </p>
          <div class="flex justify-center gap-4">
            <Button
              href="/dashboard"
              class="bg-blue-500 px-8 py-3 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-blue-600"
            >
              Go to Dashboard
            </Button>
            <Button
              onclick={handleLogout}
              class="border-white/30 bg-white/20 px-8 py-3 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    {:else}
      <div class="flex justify-center gap-6" in:fly={{ y: 30, duration: 600, delay: 600 }}>
        <Button
          href="/login"
          class="rounded-xl bg-blue-500 px-10 py-4 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-blue-600"
        >
          Login
        </Button>
        <Button
          href="/signup"
          class="rounded-xl border-white/30 bg-white/20 px-10 py-4 text-xl font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30"
        >
          Sign Up
        </Button>
      </div>
    {/if}
  </div>
</div>
