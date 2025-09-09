<script>
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';
  import IndieSeprator from '../ui/separator/indie-seprator.svelte';
  import { generateResetToken } from '$lib/scripts/auth.js';

  let { class: className, ...restProps } = $props();
  const id = crypto.randomUUID();

  let email = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let messageType = $state(''); // 'success' or 'error'
  let resetToken = $state(''); // For demo purposes

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email) {
      message = 'Please enter your email address';
      messageType = 'error';
      return;
    }

    isLoading = true;
    message = '';

    try {
      const result = await generateResetToken(email);

      if (result.success) {
        message = result.message;
        messageType = 'success';

        // For demo purposes, show the reset token
        if (result.token) {
          resetToken = result.token;
          message += ` (Demo: Your reset token is ${result.token.substring(0, 8)}...)`;
        }
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
            <h1 class="font-manrope text-2xl font-bold">Forgot your password?</h1>
            <p class="text-balance text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
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

          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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

          {#if resetToken}
            <div class="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
              <p class="text-sm font-medium text-blue-700">Demo Mode:</p>
              <p class="mt-1 text-xs text-blue-600">
                In a real application, this would be sent to your email.
                <a href="/reset-password?token={resetToken}" class="underline">
                  Click here to reset your password
                </a>
              </p>
            </div>
          {/if}
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
