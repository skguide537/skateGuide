import { connectTestDB } from './helpers';
import { config } from 'dotenv';

/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */
export default async function globalSetup() {
  // Load environment variables FIRST
  config({quiet: true});
  // Add TextEncoder polyfill globally if not available (needed for Node.js)
  if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // Connect to actual database before running tests
  try {
    await connectTestDB();
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error; // Fail fast if database connection fails
  }
}
