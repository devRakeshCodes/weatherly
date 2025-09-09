<script>
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import IndieSeprator from '../ui/separator/indie-seprator.svelte';
  import { resetPassword } from '$lib/scripts/auth.js';
  import { goto } from '$app/navigation';

  let { class: className, token = '', ...restProps } = $props();
  const id = crypto.randomUUID();

  let password = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let messageType = $state(''); // 'success' or 'error'

  async function handleSubmit(event) {
    event.preventDefault();

    if (!password || !confirmPassword) {
      message = 'Please fill in all fields';
      messageType = 'error';
      return;
    }

    if (password !== confirmPassword) {
      message = 'Passwords do not match';
      messageType = 'error';
      return;
    }

    if (password.length < 8) {
      message = 'Password must be at least 8 characters long';
      messageType = 'error';
      return;
    }

    isLoading = true;
    message = '';

    try {
      const result = await resetPassword(token, password);

      if (result.success) {
        message = result.message;
        messageType = 'success';

        // Redirect to login after successful reset
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
            <h1 class="font-manrope text-2xl font-bold">Reset your password</h1>
            <p class="text-balance text-muted-foreground">Enter your new password below.</p>
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
              {#if messageType === 'success'}
                <div class="mt-1 text-xs">Redirecting to login page...</div>
              {/if}
            </div>
          {/if}

          <div class="grid gap-3">
            <Label for="password-{id}">New Password</Label>
            <Input
              id="password-{id}"
              type="password"
              placeholder="Enter new password"
              bind:value={password}
              required
              disabled={isLoading}
            />
          </div>

          <div class="grid gap-3">
            <Label for="confirm-password-{id}">Confirm New Password</Label>
            <Input
              id="confirm-password-{id}"
              type="password"
              placeholder="Confirm new password"
              bind:value={confirmPassword}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>

          <IndieSeprator gradient class="w-full">
            <div slot="label" class="px-2 text-xs">or</div>
          </IndieSeprator>

          <div class="space-y-2 text-center text-sm">
            <div>
              Remember your password?
              <a href="/login" class="underline underline-offset-4"> Sign in </a>
            </div>
            <div>
              Don't have an account?
              <a href="/signup" class="underline underline-offset-4"> Sign up </a>
            </div>
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
