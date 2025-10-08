import { connectTestDB } from './helpers';

/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */
export default async function globalSetup() {
  // Add TextEncoder polyfill globally if not available (needed for Node.js)
  if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // Connect to actual database before running tests
  console.log('🔌 Connecting to test database...');
  try {
    await connectTestDB();
    console.log('✅ Global setup complete - database ready');
  } catch (error) {
    console.error('❌ Failed to connect to test database in global setup:', error);
    throw error; // Fail fast if database connection fails
  }
}
