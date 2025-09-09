<script>
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import IndieSeprator from '../ui/separator/indie-seprator.svelte';
  import { loginUser } from '$lib/scripts/auth.js';
  import { goto } from '$app/navigation';

  let { class: className, ...restProps } = $props();
  const id = crypto.randomUUID();

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let messageType = $state(''); // 'success' or 'error'

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      message = 'Please fill in all fields';
      messageType = 'error';
      return;
    }

    isLoading = true;
    message = '';

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        message = `Welcome back, ${result.user.name}!`;
        messageType = 'success';

        // Redirect to dashboard or home page
        setTimeout(() => {
          goto('/dashboard');
        }, 1000);
      } else {
        message = result.message;
        messageType = 'error';
      }
    } catch (error) {
      message = 'An error occurred. Please try again.';
      messageType = 'error';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class={cn('flex w-5xl max-w-5xl flex-col justify-center gap-6', className)} {...restProps}>
  <Card.Root class="h-full overflow-hidden p-0">
    <Card.Content class="grid p-0 md:grid-cols-2">
      <form class="p-6 md:p-8" onsubmit={handleSubmit}>
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-center text-center">
            <h1 class="font-manrope text-2xl font-bold">Welcome back</h1>
            <p class="text-balance text-muted-foreground">Login to your Weatherly account!</p>
          </div>

          {#if message}
            <div
              class={cn(
                'rounded-md p-3 text-sm',
                messageType === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              )}
            >
              {message}
            </div>
          {/if}

          <div class="grid gap-3">
            <Label for="email-{id}">Email</Label>
            <Input
              id="email-{id}"
              type="email"
              placeholder="m@example.com"
              bind:value={email}
              required
              disabled={isLoading}
            />
          </div>
          <div class="grid gap-3">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <a href="/forgot-password" class="ml-auto text-sm underline-offset-2 hover:underline">
                Forgot your password?
              </a>
            </div>
            <Input
              id="password-{id}"
              type="password"
              bind:value={password}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Login'}
          </Button>
          <IndieSeprator gradient class="w-full">
            <div slot="label" class="px-2 text-xs">or</div>
          </IndieSeprator>

          <div class="text-center text-sm">
            Don&apos;t have an account?
            <a href="/signup" class="underline underline-offset-4"> Sign up </a>
          </div>
        </div>
      </form>
      <div class="relative hidden bg-muted md:block">
        <img
          src="/assets/images/weather-bg2.jpg"
          alt="placeholder"
          class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </Card.Content>
  </Card.Root>
</div>
