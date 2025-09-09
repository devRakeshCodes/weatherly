import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import LoginForm from '$lib/components/auth-layout/LoginForm.svelte';

// Mock the auth module
vi.mock('$lib/scripts/auth.js', () => ({
  loginUser: vi.fn()
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

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with all required elements', () => {
    const { getByText, getByLabelText, getByRole } = render(LoginForm);

    expect(getByText('Welcome back')).toBeInTheDocument();
    expect(getByText('Login to your Weatherly account!')).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(getByText('Forgot your password?')).toBeInTheDocument();
    expect(getByText('Sign up')).toBeInTheDocument();
  });

  it('should have correct links', () => {
    const { getByText } = render(LoginForm);

    const forgotPasswordLink = getByText('Forgot your password?');
    const signupLink = getByText('Sign up');

    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('should show validation error for empty fields', async () => {
    const { getByRole, getByText } = render(LoginForm);
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('should call loginUser with correct credentials', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    loginUser.mockResolvedValue({ success: true, user: { name: 'John Doe' } });

    const { getByLabelText, getByRole } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show success message on successful login', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    loginUser.mockResolvedValue({
      success: true,
      user: { name: 'John Doe' },
      message: 'Login successful'
    });

    const { getByLabelText, getByRole, getByText } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Welcome back, John Doe!')).toBeInTheDocument();
    });
  });

  it('should show error message on failed login', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    loginUser.mockResolvedValue({
      success: false,
      message: 'Invalid email or password'
    });

    const { getByLabelText, getByRole, getByText } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    // Mock a delayed response
    loginUser.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, user: { name: 'John' } }), 100)
        )
    );

    const { getByLabelText, getByRole } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing in...');
  });

  it('should redirect to dashboard on successful login', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    const { goto } = await import('$app/navigation');

    loginUser.mockResolvedValue({
      success: true,
      user: { name: 'John Doe' }
    });

    const { getByLabelText, getByRole } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    // Wait for the timeout to trigger navigation
    await waitFor(
      () => {
        expect(goto).toHaveBeenCalledWith('/dashboard');
      },
      { timeout: 1500 }
    );
  });

  it('should handle network errors gracefully', async () => {
    const { loginUser } = await import('$lib/scripts/auth.js');
    loginUser.mockRejectedValue(new Error('Network error'));

    const { getByLabelText, getByRole, getByText } = render(LoginForm);
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: /login/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });
});
