import { 
  createMockRequest, 
  deleteTestDocument, 
  extractJsonResponse 
} from '../../helpers';
import { POST } from '../../../app/api/auth/register/route';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

describe('POST /api/auth/register', () => {
  let createdUserIds: string[] = [];
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created
    for (const userId of createdUserIds) {
      await deleteTestDocument('User', userId);
    }
    createdUserIds = [];
  });
  
  describe('Successful Registration', () => {
    test('should register a new user successfully', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      createdUserIds.push(data._id);
      
      expect(status).toBe(200);
      expect(data._id).toBeDefined();
      expect(data.name).toBe('Test User');
      expect(data.email).toContain('test-');
      expect(data.token).toBeDefined();
    });

    test('should register user with optional fields (photoUrl, photoId)', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'User With Photo',
          email: `photo-${Date.now()}@example.com`,
          password: 'Password123!',
          photoUrl: 'https://example.com/photo.jpg',
          photoId: 'photo-123'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      createdUserIds.push(data._id);
      
      expect(status).toBe(200);
      
      // Verify photo fields saved to database
      const userInDb = await User.findById(data._id);
      expect(userInDb?.photoUrl).toBe('https://example.com/photo.jpg');
      expect(userInDb?.photoId).toBe('photo-123');
    });
  });


  describe('Error Handling - Validation', () => {
    test('should reject duplicate email with 400 status', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      
      // Create first user
      const request1 = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'First User',
          email,
          password: 'Password123!'
        }
      });
      
      const response1 = await POST(request1);
      const { data: data1, status: status1 } = await extractJsonResponse(response1);
      createdUserIds.push(data1._id);
      
      expect(status1).toBe(200);
      
      // Try to create duplicate
      const request2 = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Duplicate User',
          email, // Same email
          password: 'Password123!'
        }
      });
      
      const response2 = await POST(request2);
      const { data: data2, status: status2 } = await extractJsonResponse(response2);
      
      expect(status2).toBe(400);
      expect(data2.error).toBe('User already exists');
    });

    test('should reject missing name field', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          // name missing
          email: `noname-${Date.now()}@example.com`,
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500); // Mongoose validation error
      expect(data.error).toBeDefined();
    });

    test('should reject missing email field', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'No Email User',
          // email missing
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should reject missing password field', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'No Password User',
          email: `nopass-${Date.now()}@example.com`,
          // password missing
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should reject invalid email format', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500);
      expect(data.error).toBeDefined();
      // Error message should mention email validation
      const errorMessage = data.error.toLowerCase();
      expect(
        errorMessage.includes('email') || 
        errorMessage.includes('valid')
      ).toBe(true);
    });

    test('should reject password shorter than 6 characters', async () => {
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Short Pass User',
          email: `short-${Date.now()}@example.com`,
          password: '12345' // Only 5 characters
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should reject name longer than 60 characters', async () => {
      const longName = 'A'.repeat(61); // 61 characters
      
      const request = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: longName,
          email: `longname-${Date.now()}@example.com`,
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

});

