// Suppress Mongoose warnings during tests
process.env.SUPPRESS_JEST_WARNINGS = 'true';

// Also suppress console warnings for cleaner test output
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress Mongoose warnings
  if (args[0]?.includes?.('Mongoose: looks like you\'re trying to test a Mongoose app')) {
    return;
  }
  // Suppress other common warnings
  if (args[0]?.includes?.('Failed to restore session')) {
    return;
  }
  originalWarn(...args);
};
