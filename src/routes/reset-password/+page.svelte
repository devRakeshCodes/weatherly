<script>
  import { page } from '$app/stores';
  import ResetPasswordForm from '$lib/components/auth-layout/ResetPasswordForm.svelte';

  // Using $derived for reactive computation
  const token = $derived($page.url.searchParams.get('token') || '');

  $inspect('token', token);
</script>

<div class="flex h-full w-full flex-row items-center justify-center p-4">
  <ResetPasswordForm {token} />
</div>
