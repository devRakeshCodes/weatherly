import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerUser,
  loginUser,
  generateResetToken,
  resetPassword,
  getCurrentSession,
  logout
} from '$lib/scripts/auth.js';

// Mock browser environment
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm, data) => {
        // Simple mock hash - in real tests you might want more sophisticated mocking
        const input = new TextDecoder().decode(data);
        const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return new Uint8Array([hash % 256]).buffer;
      })
    },
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

// Mock localStorage and sessionStorage
const localStorageMock = {
  data: {},
  getItem: vi.fn((key) => localStorageMock.data[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.data = {};
  })
};

const sessionStorageMock = {
  data: {},
  getItem: vi.fn((key) => sessionStorageMock.data[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    sessionStorageMock.data = {};
  })
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123'
      };

      // Step 1: Register user
      const registerResult = await registerUser(userData.name, userData.email, userData.password);
      expect(registerResult.success).toBe(true);
      expect(registerResult.message).toBe('User registered successfully');

      // Verify user data is stored
      const storedData = JSON.parse(localStorageMock.data['weatherly_auth']);
      expect(storedData[userData.email]).toBeDefined();
      expect(storedData[userData.email].name).toBe(userData.name);
      expect(storedData[userData.email].email).toBe(userData.email);
      expect(storedData[userData.email].passwordHash).toBeDefined();
      expect(storedData[userData.email].salt).toBeDefined();

      // Step 2: Login with correct credentials
      const loginResult = await loginUser(userData.email, userData.password);
      expect(loginResult.success).toBe(true);
      expect(loginResult.message).toBe('Login successful');
      expect(loginResult.user).toEqual({
        name: userData.name,
        email: userData.email
      });

      // Verify session is created
      const sessionData = JSON.parse(sessionStorageMock.data['weatherly_session']);
      expect(sessionData.email).toBe(userData.email);
      expect(sessionData.name).toBe(userData.name);
      expect(sessionData.token).toBeDefined();
      expect(sessionData.expiry).toBeDefined();

      // Step 3: Verify session retrieval
      const currentSession = getCurrentSession();
      expect(currentSession).toEqual(sessionData);

      // Step 4: Logout
      logout();
      expect(sessionStorageMock.data['weatherly_session']).toBeUndefined();
      expect(getCurrentSession()).toBeNull();
    });

    it('should prevent duplicate user registration', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123'
      };

      // Register user first time
      const firstRegister = await registerUser(userData.name, userData.email, userData.password);
      expect(firstRegister.success).toBe(true);

      // Try to register same email again
      const secondRegister = await registerUser('Jane Doe', userData.email, 'differentpassword');
      expect(secondRegister.success).toBe(false);
      expect(secondRegister.message).toBe('User already exists with this email');
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'originalpassword123',
        newPassword: 'newpassword456'
      };

      // Step 1: Register user
      await registerUser(userData.name, userData.email, userData.password);

      // Step 2: Generate reset token
      const resetTokenResult = await generateResetToken(userData.email);
      expect(resetTokenResult.success).toBe(true);
      expect(resetTokenResult.token).toBeDefined();

      // Verify reset token is stored
      const storedData = JSON.parse(localStorageMock.data['weatherly_auth']);
      expect(storedData[userData.email].resetToken).toBe(resetTokenResult.token);
      expect(storedData[userData.email].resetTokenExpiry).toBeDefined();

      // Step 3: Reset password using token
      const resetResult = await resetPassword(resetTokenResult.token, userData.newPassword);
      expect(resetResult.success).toBe(true);
      expect(resetResult.message).toBe('Password reset successfully');

      // Verify reset token is cleared
      const updatedData = JSON.parse(localStorageMock.data['weatherly_auth']);
      expect(updatedData[userData.email].resetToken).toBeNull();
      expect(updatedData[userData.email].resetTokenExpiry).toBeNull();

      // Step 4: Login with new password should work
      const loginWithNewPassword = await loginUser(userData.email, userData.newPassword);
      expect(loginWithNewPassword.success).toBe(true);

      // Step 5: Login with old password should fail
      const loginWithOldPassword = await loginUser(userData.email, userData.password);
      expect(loginWithOldPassword.success).toBe(false);
      expect(loginWithOldPassword.message).toBe('Invalid email or password');
    });

    it('should handle expired reset tokens', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'originalpassword123'
      };

      // Register user
      await registerUser(userData.name, userData.email, userData.password);

      // Generate reset token
      const resetTokenResult = await generateResetToken(userData.email);
      expect(resetTokenResult.success).toBe(true);

      // Manually expire the token by setting past date
      const storedData = JSON.parse(localStorageMock.data['weatherly_auth']);
      storedData[userData.email].resetTokenExpiry = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
      localStorageMock.data['weatherly_auth'] = JSON.stringify(storedData);

      // Try to reset password with expired token
      const resetResult = await resetPassword(resetTokenResult.token, 'newpassword123');
      expect(resetResult.success).toBe(false);
      expect(resetResult.message).toBe('Invalid or expired reset token');
    });
  });

  describe('Session Management', () => {
    it('should handle session expiry', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Register and login
      await registerUser(userData.name, userData.email, userData.password);
      await loginUser(userData.email, userData.password);

      // Verify session exists
      expect(getCurrentSession()).not.toBeNull();

      // Manually expire the session
      const sessionData = JSON.parse(sessionStorageMock.data['weatherly_session']);
      sessionData.expiry = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
      sessionStorageMock.data['weatherly_session'] = JSON.stringify(sessionData);

      // Session should be null and cleared
      expect(getCurrentSession()).toBeNull();
      expect(sessionStorageMock.data['weatherly_session']).toBeUndefined();
    });

    it('should maintain valid session within expiry time', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Register and login
      await registerUser(userData.name, userData.email, userData.password);
      const loginResult = await loginUser(userData.email, userData.password);

      // Session should be valid
      const session = getCurrentSession();
      expect(session).not.toBeNull();
      expect(session.email).toBe(userData.email);
      expect(session.name).toBe(userData.name);

      // Session should still be valid after multiple calls
      expect(getCurrentSession()).not.toBeNull();
      expect(getCurrentSession()).not.toBeNull();
    });
  });

  describe('Security Validations', () => {
    it('should enforce password strength requirements', async () => {
      const weakPasswords = ['123', 'abc', 'short', '1234567']; // All less than 8 characters

      for (const weakPassword of weakPasswords) {
        const result = await registerUser('Test User', 'test@example.com', weakPassword);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 characters long');
      }

      // Strong password should work
      const strongResult = await registerUser('Test User', 'test@example.com', 'strongpassword123');
      expect(strongResult.success).toBe(true);
    });

    it('should not reveal user existence in reset token generation', async () => {
      // Try to generate reset token for non-existent user
      const result = await generateResetToken('nonexistent@example.com');

      // Should return success message for security (don't reveal if email exists)
      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link has been sent');
      expect(result.token).toBeUndefined();
    });

    it('should use different salts for different users', async () => {
      const user1 = { name: 'User 1', email: 'user1@example.com', password: 'samepassword123' };
      const user2 = { name: 'User 2', email: 'user2@example.com', password: 'samepassword123' };

      await registerUser(user1.name, user1.email, user1.password);
      await registerUser(user2.name, user2.email, user2.password);

      const storedData = JSON.parse(localStorageMock.data['weatherly_auth']);

      // Different users should have different salts even with same password
      expect(storedData[user1.email].salt).not.toBe(storedData[user2.email].salt);

      // And different password hashes
      expect(storedData[user1.email].passwordHash).not.toBe(storedData[user2.email].passwordHash);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', async () => {
      // Corrupt the localStorage data
      localStorageMock.data['weatherly_auth'] = 'invalid-json-data';

      // Should handle gracefully and treat as empty storage
      const result = await registerUser('Test User', 'test@example.com', 'password123');
      expect(result.success).toBe(true);
    });

    it('should handle corrupted sessionStorage data', () => {
      // Corrupt the sessionStorage data
      sessionStorageMock.data['weatherly_session'] = 'invalid-json-data';

      // Should handle gracefully and return null
      const session = getCurrentSession();
      expect(session).toBeNull();
    });
  });
});
