<script>
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import IndieSeprator from '../ui/separator/indie-seprator.svelte';
  import { registerUser } from '$lib/auth.js';
  import { goto } from '$app/navigation';

  let { class: className, ...restProps } = $props();
  const id = crypto.randomUUID();

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let messageType = $state(''); // 'success' or 'error'

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      message = 'Please fill in all fields';
      messageType = 'error';
      return;
    }

    if (password !== confirmPassword) {
      message = 'Passwords do not match';
      messageType = 'error';
      return;
    }

    isLoading = true;
    message = '';

    try {
      const result = await registerUser(name, email, password);

      if (result.success) {
        message = 'Account created successfully! Redirecting to login...';
        messageType = 'success';

        // Redirect to login page
        setTimeout(() => {
          goto('/login');
        }, 2000);
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
            <h1 class="font-manrope text-2xl font-bold">Create your account</h1>
            <p class="text-balance text-muted-foreground">Sign up for your Weatherly account!</p>
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
            <Label for="name-{id}">Full Name</Label>
            <Input
              id="name-{id}"
              type="text"
              placeholder="John Doe"
              bind:value={name}
              required
              disabled={isLoading}
            />
          </div>
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
            <Label for="password-{id}">Password</Label>
            <Input
              id="password-{id}"
              type="password"
              bind:value={password}
              required
              disabled={isLoading}
            />
          </div>
          <div class="grid gap-3">
            <Label for="confirm-password-{id}">Confirm Password</Label>
            <Input
              id="confirm-password-{id}"
              type="password"
              bind:value={confirmPassword}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <IndieSeprator gradient class="w-full">
            <div slot="label" class="px-2 text-xs">or</div>
          </IndieSeprator>

          <div class="text-center text-sm">
            Already have an account?
            <a href="/login" class="underline underline-offset-4"> Sign in </a>
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
