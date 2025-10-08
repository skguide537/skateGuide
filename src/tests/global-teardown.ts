import { closeTestDB } from './helpers';

/**
 * Global teardown for Jest tests
 * Runs once after all test suites complete
 */
export default async function globalTeardown() {
  try {
    await closeTestDB();
  } catch (error) {
    console.error('❌ Failed to close database connection:', error);
    // Don't throw - we want tests to report their results even if cleanup fails
  }
}

