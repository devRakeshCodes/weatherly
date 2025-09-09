<script>
  import { page } from '$app/stores';
  import ResetPasswordForm from '$lib/components/custom-layout/ResetPasswordForm.svelte';

  // Get token from URL parameters
  $: token = $page.url.searchParams.get('token') || '';
</script>

<div class="flex h-full w-full flex-row items-center justify-center p-4">
  <ResetPasswordForm {token} />
</div>
