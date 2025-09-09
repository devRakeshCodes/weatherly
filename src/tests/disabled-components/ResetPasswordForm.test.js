import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ResetPasswordForm from '$lib/components/auth-layout/ResetPasswordForm.svelte';

// Mock the auth module
vi.mock('$lib/scripts/auth.js', () => ({
  resetPassword: vi.fn()
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

describe('ResetPasswordForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reset password form with all required elements', () => {
    const { getByText, getByLabelText, getByRole } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });

    expect(getByText('Reset your password')).toBeInTheDocument();
    expect(getByText('Enter your new password below.')).toBeInTheDocument();
    expect(getByLabelText('New Password')).toBeInTheDocument();
    expect(getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(getByText('Sign in')).toBeInTheDocument();
    expect(getByText('Sign up')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    const { getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });

    const signinLink = getByText('Sign in');
    const signupLink = getByText('Sign up');

    expect(signinLink.closest('a')).toHaveAttribute('href', '/login');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('should show validation error for empty fields', async () => {
    const { getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('should show validation error for password mismatch', async () => {
    const { getByLabelText, getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'differentpassword' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should show validation error for weak password', async () => {
    const { getByLabelText, getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: '123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: '123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('should call resetPassword with correct token and password', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    resetPassword.mockResolvedValue({
      success: true,
      message: 'Password reset successfully'
    });

    const testToken = 'test-token-123';
    const { getByLabelText, getByRole } = render(ResetPasswordForm, {
      props: { token: testToken }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith(testToken, 'newpassword123');
    });
  });

  it('should show success message on successful password reset', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    resetPassword.mockResolvedValue({
      success: true,
      message: 'Password reset successfully'
    });

    const { getByLabelText, getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Password reset successfully')).toBeInTheDocument();
      expect(getByText('Redirecting to login page...')).toBeInTheDocument();
    });
  });

  it('should show error message on failed password reset', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    resetPassword.mockResolvedValue({
      success: false,
      message: 'Invalid or expired reset token'
    });

    const { getByLabelText, getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'invalid-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Invalid or expired reset token')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    // Mock a delayed response
    resetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    const { getByLabelText, getByRole } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toHaveTextContent('Resetting...');
  });

  it('should redirect to login on successful password reset', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    const { goto } = await import('$app/navigation');

    resetPassword.mockResolvedValue({
      success: true,
      message: 'Password reset successfully'
    });

    const { getByLabelText, getByRole } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    // Wait for the timeout to trigger navigation
    await waitFor(
      () => {
        expect(goto).toHaveBeenCalledWith('/login');
      },
      { timeout: 2500 }
    );
  });

  it('should handle network errors gracefully', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    resetPassword.mockRejectedValue(new Error('Network error'));

    const { getByLabelText, getByRole, getByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    await fireEvent.input(passwordInput, { target: { value: 'newpassword123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'newpassword123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('should work with empty token prop', () => {
    const { getByText } = render(ResetPasswordForm, {
      props: { token: '' }
    });

    expect(getByText('Reset your password')).toBeInTheDocument();
  });

  it('should clear message when new submission starts', async () => {
    const { resetPassword } = await import('$lib/scripts/auth.js');
    resetPassword.mockResolvedValueOnce({
      success: false,
      message: 'First error message'
    });

    const { getByLabelText, getByRole, getByText, queryByText } = render(ResetPasswordForm, {
      props: { token: 'test-token' }
    });
    const passwordInput = getByLabelText('New Password');
    const confirmPasswordInput = getByLabelText('Confirm New Password');
    const submitButton = getByRole('button', { name: /reset password/i });

    // First submission with error
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('First error message')).toBeInTheDocument();
    });

    // Second submission should clear the previous message
    resetPassword.mockResolvedValueOnce({
      success: true,
      message: 'Success message'
    });

    await fireEvent.click(submitButton);

    // The old error message should be cleared during loading
    expect(queryByText('First error message')).not.toBeInTheDocument();
  });
});
