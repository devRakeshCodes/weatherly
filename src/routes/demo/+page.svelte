<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import { registerUser, loginUser, getCurrentSession, logout } from '$lib/auth.js';
  import { onMount } from 'svelte';

  let session = $state(null);
  let message = $state('');

  onMount(() => {
    session = getCurrentSession();
  });

  async function createDemoUser() {
    const result = await registerUser('Demo User', 'demo@weatherly.com', 'password123');
    message = result.message;

    if (result.success) {
      // Auto login the demo user
      const loginResult = await loginUser('demo@weatherly.com', 'password123');
      if (loginResult.success) {
        session = getCurrentSession();
        message += ' - Auto logged in!';
      }
    }
  }

  function handleLogout() {
    logout();
    session = null;
    message = 'Logged out successfully';
  }
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-8 p-4">
  <div class="space-y-4 text-center">
    <h1 class="font-manrope text-4xl font-bold">Authentication Demo</h1>
    <p class="text-lg text-muted-foreground">Test the client-side authentication system</p>
  </div>

  {#if message}
    <div class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
      {message}
    </div>
  {/if}

  {#if session}
    <div class="space-y-4 text-center">
      <p class="text-lg">
        Welcome, <span class="font-semibold text-primary">{session.name}</span>!
      </p>
      <p class="text-sm text-muted-foreground">Email: {session.email}</p>
      <Button onclick={handleLogout} variant="outline">Logout</Button>
    </div>
  {:else}
    <div class="space-y-4">
      <Button onclick={createDemoUser} variant="default">Create Demo User & Login</Button>
      <div class="text-center text-sm text-muted-foreground">
        This will create a user with email: demo@weatherly.com and password: password123
      </div>
    </div>
  {/if}

  <div class="flex gap-4">
    <Button href="/" variant="outline">Go to Home</Button>
    <Button href="/login" variant="default">Login Page</Button>
    <Button href="/signup" variant="secondary">Signup Page</Button>
  </div>
</div>
