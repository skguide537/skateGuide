/**
 * Suppress noisy warnings during tests
 * Only suppresses known, harmless warnings - real errors will still show
 */

// Suppress Jest warnings
process.env.SUPPRESS_JEST_WARNINGS = 'true';

// Filter console warnings for cleaner test output
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Suppress known harmless warnings
  const suppressPatterns = [
    'Mongoose: looks like you\'re trying to test a Mongoose app',
    'Failed to restore session',
  ];
  
  if (suppressPatterns.some(pattern => message.includes(pattern))) {
    return; // Suppress this warning
  }
  
  // Show all other warnings
  originalWarn(...args);
};
