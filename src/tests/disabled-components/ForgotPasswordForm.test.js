import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ForgotPasswordForm from '$lib/components/auth-layout/ForgotPasswordForm.svelte';

// Mock the auth module
vi.mock('$lib/scripts/auth.js', () => ({
  generateResetToken: vi.fn()
}));

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

describe('ForgotPasswordForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render forgot password form with all required elements', () => {
    const { getByText, getByLabelText, getByRole } = render(ForgotPasswordForm);

    expect(getByText('Forgot your password?')).toBeInTheDocument();
    expect(
      getByText("Enter your email address and we'll send you a link to reset your password.")
    ).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(getByText('Sign in')).toBeInTheDocument();
    expect(getByText('Sign up')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    const { getByText } = render(ForgotPasswordForm);

    const signinLink = getByText('Sign in');
    const signupLink = getByText('Sign up');

    expect(signinLink.closest('a')).toHaveAttribute('href', '/login');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('should show validation error for empty email', async () => {
    const { getByRole, getByText } = render(ForgotPasswordForm);
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Please enter your email address')).toBeInTheDocument();
    });
  });

  it('should call generateResetToken with correct email', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockResolvedValue({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });

    const { getByLabelText, getByRole } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(generateResetToken).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success message when reset token is generated', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockResolvedValue({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });

    const { getByLabelText, getByRole, getByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('If the email exists, a reset link has been sent')).toBeInTheDocument();
    });
  });

  it('should show demo token when token is returned', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockResolvedValue({
      success: true,
      message: 'If the email exists, a reset link has been sent',
      token: 'demo-token-12345678901234567890'
    });

    const { getByLabelText, getByRole, getByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText(/Demo: Your reset token is demo-tok/)).toBeInTheDocument();
      expect(getByText('Demo Mode:')).toBeInTheDocument();
      expect(getByText('Click here to reset your password')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockResolvedValue({
      success: false,
      message: 'An error occurred'
    });

    const { getByLabelText, getByRole, getByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    // Mock a delayed response
    generateResetToken.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    const { getByLabelText, getByRole } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(submitButton).toHaveTextContent('Sending...');
  });

  it('should handle network errors gracefully', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockRejectedValue(new Error('Network error'));

    const { getByLabelText, getByRole, getByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('should create reset password link with correct token', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    const testToken = 'test-token-123456789';
    generateResetToken.mockResolvedValue({
      success: true,
      message: 'Reset link sent',
      token: testToken
    });

    const { getByLabelText, getByRole, getByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      const resetLink = getByText('Click here to reset your password');
      expect(resetLink.closest('a')).toHaveAttribute('href', `/reset-password?token=${testToken}`);
    });
  });

  it('should clear message when new submission starts', async () => {
    const { generateResetToken } = await import('$lib/scripts/auth.js');
    generateResetToken.mockResolvedValueOnce({
      success: false,
      message: 'First error message'
    });

    const { getByLabelText, getByRole, getByText, queryByText } = render(ForgotPasswordForm);
    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: /send reset link/i });

    // First submission with error
    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('First error message')).toBeInTheDocument();
    });

    // Second submission should clear the previous message
    generateResetToken.mockResolvedValueOnce({
      success: true,
      message: 'Success message'
    });

    await fireEvent.click(submitButton);

    // The old error message should be cleared during loading
    expect(queryByText('First error message')).not.toBeInTheDocument();
  });
});
