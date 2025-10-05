import '@testing-library/jest-dom';

import { config } from 'dotenv';

// Load environment variables with minimal logging
config({ quiet: true, });

// Add TextEncoder polyfill for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  return jest.fn(() => {
    return { 'data-testid': 'dynamic-component' };
  });
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock process.env
process.env = {
  ...process.env,
  NODE_ENV: 'test',
};

// Mock NextResponse
Object.defineProperty(global, 'NextResponse', {
  value: {
    json: jest.fn((data, init) => ({
      json: jest.fn(() => Promise.resolve(data)),
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
    redirect: jest.fn((url, init) => ({
      json: jest.fn(() => Promise.resolve({ redirect: url })),
      status: 302,
      ok: false,
    })),
    next: jest.fn(() => ({
      json: jest.fn(() => Promise.resolve({ next: true })),
      status: undefined, // NextResponse.next() doesn't have status
      ok: true,
    })),
  }
});

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: (global as any).NextResponse,
  NextRequest: (global as any).Request,
}));

// Conditionally mock MongoDB - only for unit tests, not integration tests
const isIntegrationTest = process.argv.some(arg => arg.includes('integration'));
if (!isIntegrationTest) {
  // Mock MongoDB connection for unit tests
  jest.mock('@/lib/mongodb', () => ({
    connectToDatabase: jest.fn(() => Promise.resolve({ db: {} })),
  }));

  // Mock Mongoose models for unit tests
  jest.mock('@/models/Spot', () => ({
    __esModule: true,
    default: {
      find: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndUpdate: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndDelete: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findById: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
    },
  }));

  jest.mock('@/models/skatepark.model', () => ({
    __esModule: true,
    default: {
      find: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndUpdate: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndDelete: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findById: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
    },
  }));

  jest.mock('@/models/User', () => ({
    __esModule: true,
    default: {
      find: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndUpdate: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findByIdAndDelete: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
      findById: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
    },
  }));
}

afterEach(() => {
  jest.clearAllMocks();
});
