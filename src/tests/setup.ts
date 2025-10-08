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

// Set test environment
process.env = {
  ...process.env,
  NODE_ENV: 'test',
};
