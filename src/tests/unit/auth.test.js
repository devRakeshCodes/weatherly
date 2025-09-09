import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerUser,
  loginUser,
  generateResetToken,
  resetPassword,
  getCurrentSession,
  logout,
  isAuthenticated
} from '$lib/scripts/auth.js';

// Mock browser environment
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm, data) => {
        // Create a simple deterministic hash for testing
        const input = new TextDecoder().decode(data);
        const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const buffer = new ArrayBuffer(32);
        const view = new Uint8Array(buffer);
        view[0] = hash % 256;
        return buffer;
      })
    },
    getRandomValues: vi.fn((arr) => {
      // Deterministic values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i * 17 + 42) % 256;
      }
      return arr;
    })
  }
});

// Mock storage
const createMockStorage = () => {
  const storage = {};
  return {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    })
  };
};

const localStorageMock = createMockStorage();
const sessionStorageMock = createMockStorage();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('Authentication Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = await registerUser('John Doe', 'john@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reject duplicate email registration', async () => {
      const existingUsers = {
        'john@example.com': { name: 'John Doe', email: 'john@example.com' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingUsers));

      const result = await registerUser('Jane Doe', 'john@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('User already exists with this email');
    });

    it('should enforce password length requirements', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = await registerUser('John Doe', 'john@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters long');
    });
  });

  describe('User Login', () => {
    it('should reject login for non-existent user', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = await loginUser('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('should create session on successful login', async () => {
      // First register a user to get the correct hash
      localStorageMock.getItem.mockReturnValue('{}');
      await registerUser('John Doe', 'john@example.com', 'password123');

      // Get the stored user data to use for login test
      const setItemCall = localStorageMock.setItem.mock.calls.find(
        (call) => call[0] === 'weatherly_auth'
      );
      const storedData = JSON.parse(setItemCall[1]);

      // Now mock the storage to return this data for login
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = await loginUser('john@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.user).toEqual({ name: 'John Doe', email: 'john@example.com' });
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'weatherly_session',
        expect.stringContaining('"email":"john@example.com"')
      );
    });
  });

  describe('Password Reset', () => {
    it('should generate reset token for existing user', async () => {
      const users = {
        'john@example.com': {
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: 'hash',
          salt: 'salt'
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(users));

      const result = await generateResetToken('john@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link has been sent');
      expect(result.token).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should not reveal if email does not exist', async () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = await generateResetToken('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a reset link has been sent');
      expect(result.token).toBeUndefined();
    });

    it('should reset password with valid token', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const users = {
        'john@example.com': {
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: 'oldhash',
          salt: 'oldsalt',
          resetToken: 'validtoken',
          resetTokenExpiry: futureDate
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(users));

      const result = await resetPassword('validtoken', 'newpassword123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reject expired reset token', async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const users = {
        'john@example.com': {
          resetToken: 'expiredtoken',
          resetTokenExpiry: pastDate
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(users));

      const result = await resetPassword('expiredtoken', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired reset token');
    });
  });

  describe('Session Management', () => {
    it('should return valid session when not expired', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const session = {
        token: 'sessiontoken',
        email: 'john@example.com',
        name: 'John Doe',
        expiry: futureDate
      };
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(session));

      const result = getCurrentSession();

      expect(result).toEqual(session);
    });

    it('should clear expired session', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const session = {
        token: 'sessiontoken',
        email: 'john@example.com',
        name: 'John Doe',
        expiry: pastDate
      };
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(session));

      const result = getCurrentSession();

      expect(result).toBeNull();
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('weatherly_session');
    });

    it('should clear session on logout', () => {
      logout();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('weatherly_session');
    });

    it('should check authentication status correctly', () => {
      // Test authenticated state
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const session = { token: 'token', expiry: futureDate };
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(session));

      expect(isAuthenticated()).toBe(true);

      // Test unauthenticated state
      sessionStorageMock.getItem.mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = await registerUser('Test User', 'test@example.com', 'password123');

      // Should treat corrupted data as empty and allow registration
      expect(result.success).toBe(true);
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorageMock.getItem.mockReturnValue('invalid-json');

      const result = getCurrentSession();

      expect(result).toBeNull();
    });
  });
});
