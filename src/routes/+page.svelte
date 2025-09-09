<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import { getCurrentSession, logout } from '$lib/auth.js';
  import { onMount } from 'svelte';

  let session = $state(null);

  onMount(() => {
    session = getCurrentSession();
  });

  function handleLogout() {
    logout();
    session = null;
  }
</script>

<div class="bg- flex h-full w-full flex-col items-center justify-center gap-8 p-4">
  <h1 class="font-manrope text-center text-4xl font-bold">Welcome to Weatherly!</h1>
  <p class="text-center text-lg text-muted-foreground">Your personal weather companion</p>

  {#if session}
    <div class="space-y-4 text-center">
      <p class="text-lg">
        Hello, <span class="font-semibold text-primary">{session.name}</span>!
      </p>
      <div class="flex gap-4">
        <Button href="/dashboard" variant="default">Go to Dashboard</Button>
        <Button onclick={handleLogout} variant="outline">Logout</Button>
      </div>
    </div>
  {:else}
    <div class="flex gap-4">
      <Button href="/login" variant="default">Login</Button>
      <Button href="/signup" variant="outline">Sign Up</Button>
    </div>
  {/if}
</div>
