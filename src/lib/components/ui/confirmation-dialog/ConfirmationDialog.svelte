<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import Icon from '$lib/components/ui/icon/icon.svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let {
    open = $bindable(false),
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = () => {},
    onCancel = () => {},
    variant = 'default' // 'default', 'destructive'
  } = $props();

  function handleConfirm() {
    onConfirm();
    open = false;
  }

  function handleCancel() {
    onCancel();
    open = false;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <!-- Dialog -->
    <div class="w-full max-w-md" transition:scale={{ duration: 200, easing: quintOut }}>
      <Card.Root class="border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
        <Card.Content class="p-6">
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-center space-x-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full {variant ===
                'destructive'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'}"
              >
                <Icon
                  name={variant === 'destructive' ? 'alert-triangle' : 'help-circle'}
                  class="h-5 w-5"
                />
              </div>
              <h2 id="dialog-title" class="text-lg font-semibold text-slate-900">
                {title}
              </h2>
            </div>

            <!-- Message -->
            <p class="leading-relaxed text-slate-600">
              {message}
            </p>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <Button onclick={handleCancel} variant="outline" class="flex-1">
                {cancelText}
              </Button>
              <Button
                onclick={handleConfirm}
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                class="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
{/if}

<style>
  /* Ensure dialog is above everything */
  :global(body:has([role='dialog'])) {
    overflow: hidden;
  }
</style>
