import { 
  connectTestDB, 
  closeTestDB, 
  createMockRequest, 
  deleteTestDocument, 
  extractJsonResponse 
} from '../../helpers';
import { POST } from '../../../app/api/auth/register/route';
import User from '../../../models/User';

describe('POST /api/auth/register - Sanity Test', () => {
  let createdUserIds: string[] = [];
  
  // Note: Database connection handled by global-setup.ts
  // No need to connect/disconnect in individual tests
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created
    for (const userId of createdUserIds) {
      await deleteTestDocument('User', userId);
    }
    createdUserIds = [];
  });
  
  test('SANITY: should register a new user and save to database', async () => {
    // 1. Create request
    const request = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Sanity Test User',
        email: `sanity-${Date.now()}@test.com`,
        password: 'TestPassword123!'
      }
    });
    
    // 2. Call actual API route
    const response = await POST(request);
    const { data, status } = await extractJsonResponse(response);
    
    // 3. Track for cleanup
    createdUserIds.push(data._id);
    
    // 4. Assertions
    expect(status).toBe(200);
    expect(data._id).toBeDefined();
    expect(data.name).toBe('Sanity Test User');
    expect(data.email).toContain('sanity-');
    expect(data.token).toBeDefined();
    expect(data.password).toBeUndefined(); // Password should not be returned
    
    // 5. Verify user actually saved to database
    const userInDb = await User.findById(data._id);
    expect(userInDb).toBeTruthy();
    expect(userInDb?.name).toBe('Sanity Test User');
    expect(userInDb?.password).not.toBe('TestPassword123!'); // Should be hashed
  });
});

