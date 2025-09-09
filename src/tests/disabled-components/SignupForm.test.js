import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import SignupForm from '$lib/components/auth-layout/SignupForm.svelte';

// Mock the auth module
vi.mock('$lib/scripts/auth.js', () => ({
  registerUser: vi.fn()
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

describe('SignupForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signup form with all required elements', () => {
    const { getByText, getByLabelText, getByRole } = render(SignupForm);

    expect(getByText('Create your account')).toBeInTheDocument();
    expect(getByText('Sign up for your Weatherly account!')).toBeInTheDocument();
    expect(getByLabelText('Full Name')).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(getByText('Sign in')).toBeInTheDocument();
  });

  it('should have correct link to login page', () => {
    const { getByText } = render(SignupForm);

    const signinLink = getByText('Sign in');
    expect(signinLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should show validation error for empty fields', async () => {
    const { getByRole, getByText } = render(SignupForm);
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('should show validation error for password mismatch', async () => {
    const { getByLabelText, getByRole, getByText } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'differentpassword' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should call registerUser with correct data', async () => {
    const { registerUser } = await import('$lib/scripts/auth.js');
    registerUser.mockResolvedValue({ success: true, message: 'User registered successfully' });

    const { getByLabelText, getByRole } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });
  });

  it('should show success message on successful registration', async () => {
    const { registerUser } = await import('$lib/scripts/auth.js');
    registerUser.mockResolvedValue({
      success: true,
      message: 'User registered successfully'
    });

    const { getByLabelText, getByRole, getByText } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        getByText('Account created successfully! Redirecting to login...')
      ).toBeInTheDocument();
    });
  });

  it('should show error message on failed registration', async () => {
    const { registerUser } = await import('$lib/scripts/auth.js');
    registerUser.mockResolvedValue({
      success: false,
      message: 'User already exists with this email'
    });

    const { getByLabelText, getByRole, getByText } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'existing@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('User already exists with this email')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const { registerUser } = await import('$lib/scripts/auth.js');
    // Mock a delayed response
    registerUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    const { getByLabelText, getByRole } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toHaveTextContent('Creating Account...');
  });

  it('should redirect to login on successful registration', async () => {
    const { registerUser } = await import('$lib/scripts/auth.js');
    const { goto } = await import('$app/navigation');

    registerUser.mockResolvedValue({
      success: true,
      message: 'User registered successfully'
    });

    const { getByLabelText, getByRole } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
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
    const { registerUser } = await import('$lib/scripts/auth.js');
    registerUser.mockRejectedValue(new Error('Network error'));

    const { getByLabelText, getByRole, getByText } = render(SignupForm);
    const nameInput = getByLabelText('Full Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const confirmPasswordInput = getByLabelText('Confirm Password');
    const submitButton = getByRole('button', { name: /create account/i });

    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });
});
