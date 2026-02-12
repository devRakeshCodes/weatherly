<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import ConfirmationDialog from '$lib/components/ui/confirmation-dialog/ConfirmationDialog.svelte';
  import { getCurrentSession, logout } from '$lib/scripts/auth.js';
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';

  let session = $state(null);
  let showLogoutConfirm = $state(false);

  onMount(() => {
    session = getCurrentSession();
  });

  function handleLogout() {
    showLogoutConfirm = true;
  }

  function confirmLogout() {
    logout();
    session = null;
  }
</script>

<!-- Modern Hero Section with Background -->
<div class="relative min-h-screen overflow-hidden">
  <!-- Background Image -->
  

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
        <h1 class="font-manrope text-6xl font-bold text-black drop-shadow-2xl">Weatherly</h1>
      </div>

      <p
        class="mx-auto max-w-2xl text-2xl text-black/90 drop-shadow-lg"
        in:fly={{ y: 30, duration: 600, delay: 400 }}
      >
        Your personal weather companion with beautiful, real-time weather insights
      </p>
    </div>

    {#if session}
      <div class="space-y-6 text-center" in:fly={{ y: 30, duration: 600, delay: 600 }}>
        <div class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
          <p class="mb-6 text-2xl text-blue-950">
            Hello, <span class="font-bold drop-shadow">{session.name}</span>!
          </p>
          <div class="flex justify-center gap-4">
            <Button
              href="/dashboard"
              class="bg-black px-8 py-3 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-black/80"
            >
              Go to Dashboard
            </Button>
            <Button
              onclick={handleLogout}
              class="border-white/30 bg-orange-400 px-8 py-3 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-orange-400/80"
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
          class="rounded-xl bg-black px-10 py-4 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-black/80"
        >
          Login
        </Button>
        <Button
          href="/signup"
          class="rounded-xl border-white/30 bg-orange-400 px-10 py-4 text-xl font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-orange-400/80"
        >
          Sign Up
        </Button>
      </div>
    {/if}
  </div>
</div>

<!-- Logout Confirmation Dialog -->
<ConfirmationDialog
  bind:open={showLogoutConfirm}
  title="Logout Confirmation"
  message="Are you sure you want to logout? You'll be redirected to the home page."
  confirmText="Yes, Logout"
  cancelText="Cancel"
  variant="destructive"
  onConfirm={confirmLogout}
/>
