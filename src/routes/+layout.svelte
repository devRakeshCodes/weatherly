<script>
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { pwaInfo } from 'virtual:pwa-info';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(async () => {
    if (pwaInfo) {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        immediate: true,
        onRegistered(r) {
          console.log('SW Registered:', r);
        }
      });
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
