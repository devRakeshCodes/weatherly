import { browser } from '$app/environment';

// Security constants
const STORAGE_KEY = 'weatherly_auth';
const SALT_ROUNDS = 12;

/**
 * Secure password hashing using Web Crypto API
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password, salt) {
  if (!browser) return '';

  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random salt
 * @returns {string} - Random salt
 */
function generateSalt() {
  if (!browser) return '';

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random token
 * @returns {string} - Random token
 */
function generateToken() {
  if (!browser) return '';

  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get stored user data from localStorage
 * @returns {Object|null} - User data or null
 */
function getStoredUsers() {
  if (!browser) return {};

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading stored users:', error);
    return {};
  }
}

/**
 * Store user data in localStorage
 * @param {Object} users - Users data
 */
function storeUsers(users) {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error storing users:', error);
  }
}

/**
 * Register a new user
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function registerUser(name, email, password) {
  if (!browser) return { success: false, message: 'Not in browser environment' };

  const users = getStoredUsers();

  // Check if user already exists
  if (users[email]) {
    return { success: false, message: 'User already exists with this email' };
  }

  // Validate password strength
  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long' };
  }

  const salt = generateSalt();
  const hashedPassword = await hashPassword(password, salt);

  // Store user data
  users[email] = {
    name,
    email,
    passwordHash: hashedPassword,
    salt,
    createdAt: new Date().toISOString(),
    resetToken: null,
    resetTokenExpiry: null
  };

  storeUsers(users);

  return { success: true, message: 'User registered successfully' };
}

/**
 * Login user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function loginUser(email, password) {
  if (!browser) return { success: false, message: 'Not in browser environment' };

  const users = getStoredUsers();
  const user = users[email];

  if (!user) {
    return { success: false, message: 'Invalid email or password' };
  }

  const hashedPassword = await hashPassword(password, user.salt);

  if (hashedPassword !== user.passwordHash) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Create session token
  const sessionToken = generateToken();
  const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store session
  sessionStorage.setItem(
    'weatherly_session',
    JSON.stringify({
      token: sessionToken,
      email: user.email,
      name: user.name,
      expiry: sessionExpiry.toISOString()
    })
  );

  return {
    success: true,
    message: 'Login successful',
    user: { name: user.name, email: user.email }
  };
}

/**
 * Generate password reset token
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, message: string, token?: string}>}
 */
export async function generateResetToken(email) {
  if (!browser) return { success: false, message: 'Not in browser environment' };

  const users = getStoredUsers();
  const user = users[email];

  if (!user) {
    // Don't reveal if email exists for security
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Update user with reset token
  users[email] = {
    ...user,
    resetToken,
    resetTokenExpiry: resetTokenExpiry.toISOString()
  };

  storeUsers(users);

  return {
    success: true,
    message: 'If the email exists, a reset link has been sent',
    token: resetToken // In real app, this would be sent via email
  };
}

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetPassword(token, newPassword) {
  if (!browser) return { success: false, message: 'Not in browser environment' };

  const users = getStoredUsers();

  // Find user with matching reset token
  const userEmail = Object.keys(users).find((email) => {
    const user = users[email];
    return (
      user.resetToken === token &&
      user.resetTokenExpiry &&
      new Date(user.resetTokenExpiry) > new Date()
    );
  });

  if (!userEmail) {
    return { success: false, message: 'Invalid or expired reset token' };
  }

  // Validate new password
  if (newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long' };
  }

  const user = users[userEmail];
  const newSalt = generateSalt();
  const newHashedPassword = await hashPassword(newPassword, newSalt);

  // Update user password and clear reset token
  users[userEmail] = {
    ...user,
    passwordHash: newHashedPassword,
    salt: newSalt,
    resetToken: null,
    resetTokenExpiry: null
  };

  storeUsers(users);

  return { success: true, message: 'Password reset successfully' };
}

/**
 * Get current session
 * @returns {Object|null} - Session data or null
 */
export function getCurrentSession() {
  if (!browser) return null;

  try {
    const sessionData = sessionStorage.getItem('weatherly_session');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);

    // Check if session is expired
    if (new Date(session.expiry) <= new Date()) {
      sessionStorage.removeItem('weatherly_session');
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

/**
 * Logout user
 */
export function logout() {
  if (!browser) return;

  sessionStorage.removeItem('weatherly_session');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentSession() !== null;
}
