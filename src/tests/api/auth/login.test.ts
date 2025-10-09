import { 
  createMockRequest, 
  createTestUser,
  deleteTestDocument, 
  extractJsonResponse 
} from '../../helpers';
import { POST } from '../../../app/api/auth/login/route';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';

describe('POST /api/auth/login', () => {
  let createdUserIds: string[] = [];
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created
    for (const userId of createdUserIds) {
      await deleteTestDocument('User', userId);
    }
    createdUserIds = [];
  });
  
  describe('Successful Login', () => {
    test('should login with valid credentials', async () => {
      // First, create a user to login with
      const testPassword = 'TestPassword123!';
      const user = await createTestUser({
        email: `login-${Date.now()}@example.com`,
        password: testPassword
      });
      createdUserIds.push(user._id.toString());
      
      // Now try to login
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: testPassword
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data._id).toBe(user._id.toString());
      expect(data.email).toBe(user.email);
      expect(data.name).toBeDefined();
      expect(data.token).toBeDefined();
    });

    test('should set HTTP-only cookie with token', async () => {
      const testPassword = 'CookieTest123!';
      const user = await createTestUser({
        email: `cookie-${Date.now()}@example.com`,
        password: testPassword
      });
      createdUserIds.push(user._id.toString());
      
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: testPassword
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      
      // Check cookie was set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader?.toLowerCase()).toContain('samesite=strict');
    });

    // No need to test this because JWT is outside library
    test('should return valid JWT token', async () => {
      const testPassword = 'TokenTest123!';
      const user = await createTestUser({
        email: `jwt-${Date.now()}@example.com`,
        password: testPassword
      });
      createdUserIds.push(user._id.toString());
      
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: testPassword
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data.token).toBeDefined();
      
      // Verify token is valid and contains correct userId
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(data.token, secret) as { userId: string };
      
      expect(decoded.userId).toBe(user._id.toString());
    });
  });

  describe('Failed Login - Wrong Credentials', () => {
    test('should reject wrong password with 401', async () => {
      const correctPassword = 'CorrectPassword123!';
      const user = await createTestUser({
        email: `wrongpass-${Date.now()}@example.com`,
        password: correctPassword
      });
      createdUserIds.push(user._id.toString());
      
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: 'WrongPassword123!' // Wrong password
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.token).toBeUndefined();
    });

    test('should reject non-existent email with 401', async () => {
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'AnyPassword123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.token).toBeUndefined();
    });

    test('should use same error message for wrong password and wrong email', async () => {
      // Create a user
      const user = await createTestUser({
        email: `security-${Date.now()}@example.com`,
        password: 'Password123!'
      });
      createdUserIds.push(user._id.toString());
      
      // Test wrong password
      const wrongPassRequest = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: 'WrongPassword!'
        }
      });
      const wrongPassResponse = await POST(wrongPassRequest);
      const wrongPassData = await extractJsonResponse(wrongPassResponse);
      
      // Test wrong email
      const wrongEmailRequest = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: `wrong-${Date.now()}@example.com`,
          password: 'Password123!'
        }
      });
      const wrongEmailResponse = await POST(wrongEmailRequest);
      const wrongEmailData = await extractJsonResponse(wrongEmailResponse);
      
      // Both should have same error message (security: prevent user enumeration)
      expect(wrongPassData.data.error).toBe(wrongEmailData.data.error);
      expect(wrongPassData.status).toBe(401);
      expect(wrongEmailData.status).toBe(401);
    });
  });

  describe('Validation', () => {
    test('should reject missing email field', async () => {
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          // email missing
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('should reject missing password field', async () => {
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: `nopass-${Date.now()}@example.com`,
          // password missing
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('should reject empty email', async () => {
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: '',
          password: 'Password123!'
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('should reject empty password', async () => {
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: `empty-${Date.now()}@example.com`,
          password: ''
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('Password Verification', () => {
    test('should verify password using bcrypt comparison', async () => {
      const testPassword = 'MySecretPassword123!';
      const user = await createTestUser({
        email: `bcrypt-${Date.now()}@example.com`,
        password: testPassword
      });
      createdUserIds.push(user._id.toString());
      
      // Verify password is hashed in database
      const userInDb = await User.findById(user._id).select('+password');
      expect(userInDb?.password).not.toBe(testPassword);
      expect(userInDb?.password).toMatch(/^\$2[aby]\$/); // Bcrypt pattern
      
      // Login should still work with plain password
      const request = createMockRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: testPassword
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data._id).toBe(user._id.toString());
    });
  });

});


