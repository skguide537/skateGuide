/**
 * Test helpers exports
 * Central export point for all test utilities
 */

// Database helpers
export {
  connectTestDB,
  closeTestDB,
  getTestDB,
  deleteTestDocument,
  deleteTestDocuments,
  isTestDBConnected,
} from './db-helper';

// Test data factories
export {
  createTestUser,
  createTestSkatepark,
  generateAuthToken,
  createAuthenticatedTestUser,
  type CreateTestUserOptions,
  type CreateTestSkateparkOptions,
} from './test-data-factory';

// Request/Response helpers
export {
  createMockRequest,
  createAuthenticatedRequest,
  extractJsonResponse,
  createRouteParams,
  wait,
  generateRandomObjectId,
  type MockRequestOptions,
} from './test-helpers';

