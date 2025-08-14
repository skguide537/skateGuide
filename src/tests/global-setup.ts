// Global setup for Jest tests
export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Add TextEncoder polyfill globally if not available
  if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // Mock fetch globally for tests
  if (typeof global.fetch === 'undefined') {
    global.fetch = jest.fn();
  }

  // Set up test database environment variables if not present
  if (!process.env.MONGO_URI_TEST) {
    process.env.MONGO_URI_TEST = 'mongodb://localhost:27017/skateguide-test';
  }

  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: any[]) => {
    // Only show errors that aren't related to test setup
    if (!args[0]?.includes?.('Failed to restore session') && 
        !args[0]?.includes?.('Database connection test failed')) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: any[]) => {
    // Only show warnings that aren't related to test setup
    if (!args[0]?.includes?.('No test database URI available') &&
        !args[0]?.includes?.('integration tests will be skipped')) {
      originalConsoleWarn(...args);
    }
  };
}
