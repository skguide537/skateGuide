import { config } from 'dotenv';

/**
 * Jest setup for API/Database tests
 * Runs before each test file
 */

// Load environment variables from .env file
config({ quiet: true });

// Add TextEncoder polyfill for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Set test environment
process.env.NODE_ENV = 'test';
