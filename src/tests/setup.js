import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock SvelteKit modules that are commonly used
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: '1.0.0'
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => vi.fn()),
    url: new URL('http://localhost:3000'),
    params: {},
    route: { id: null },
    status: 200,
    error: null,
    data: {},
    form: null
  },
  navigating: {
    subscribe: vi.fn(() => vi.fn())
  },
  updated: {
    subscribe: vi.fn(() => vi.fn()),
    check: vi.fn()
  }
}));

// Mock crypto API for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm, data) => {
        // Simple deterministic hash for testing
        const input = new TextDecoder().decode(data);
        const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const buffer = new ArrayBuffer(32);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < 32; i++) {
          view[i] = (hash + i) % 256;
        }
        return buffer;
      })
    },
    getRandomValues: vi.fn((arr) => {
      // Deterministic random values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i * 17 + 42) % 256;
      }
      return arr;
    }),
    randomUUID: vi.fn(() => 'test-uuid-12345678-1234-1234-1234-123456789012')
  }
});

// Mock localStorage and sessionStorage
const createStorageMock = () => {
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
    }),
    key: vi.fn((index) => Object.keys(storage)[index] || null),
    get length() {
      return Object.keys(storage).length;
    }
  };
};

Object.defineProperty(global, 'localStorage', {
  value: createStorageMock()
});

Object.defineProperty(global, 'sessionStorage', {
  value: createStorageMock()
});

// Mock window.location
Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Setup DOM environment
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn()
      }
    })),
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  }
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    location: global.location,
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    crypto: global.crypto,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    getComputedStyle: vi.fn(() => ({})),
    matchMedia: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))
  }
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  global.localStorage.clear();
  global.sessionStorage.clear();
});
