<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import { getCurrentSession, logout } from '$lib/scripts/auth.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let session = $state(null);

  onMount(() => {
    session = getCurrentSession();

    // Redirect to login if not authenticated
    if (!session) {
      goto('/login');
    }
  });

  function handleLogout() {
    logout();
    goto('/login');
  }
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-8 p-4">
  {#if session}
    <div class="space-y-4 text-center">
      <h1 class="font-manrope text-4xl font-bold">Welcome to your Dashboard!</h1>
      <p class="text-lg text-muted-foreground">
        Hello, <span class="font-semibold text-foreground">{session.name}</span>!
      </p>
      <p class="text-muted-foreground">You are successfully logged in to Weatherly.</p>
    </div>

    <div class="flex gap-4">
      <Button variant="outline" onclick={handleLogout}>Logout</Button>
      <Button href="/">Go to Home</Button>
    </div>
  {:else}
    <div class="text-center">
      <p class="text-muted-foreground">Loading...</p>
    </div>
  {/if}
</div>
