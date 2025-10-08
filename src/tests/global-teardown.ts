import { closeTestDB } from './helpers';

/**
 * Global teardown for Jest tests
 * Runs once after all test suites complete
 */
export default async function globalTeardown() {
  console.log('🧹 Running global teardown...');
  
  try {
    await closeTestDB();
    console.log('✅ Global teardown complete - database connection closed');
  } catch (error) {
    console.error('❌ Failed to close database connection in global teardown:', error);
    // Don't throw - we want tests to report their results even if cleanup fails
  }
}

