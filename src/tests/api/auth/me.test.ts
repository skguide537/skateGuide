import jwt from 'jsonwebtoken';
import { GET } from '../../../app/api/auth/me/route';
import {
    createAuthenticatedRequest,
    createAuthenticatedTestUser,
    createMockRequest,
    deleteTestDocument,
    extractJsonResponse
} from '../../helpers';

describe('GET /api/auth/me', () => {
  let createdUserIds: string[] = [];
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created
    for (const userId of createdUserIds) {
      await deleteTestDocument('User', userId);
    }
    createdUserIds = [];
  });
  
  describe('Successful Request', () => {
    test('should return user data with valid token', async () => {
      // Create authenticated user (user + token)
      const { user, token } = await createAuthenticatedTestUser({
        name: 'Me Test User',
        email: `me-${Date.now()}@example.com`
      });
      createdUserIds.push(user._id.toString());
      
      // Create request with token in cookie
      const request = createAuthenticatedRequest('/api/auth/me', token, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data._id).toBe(user._id.toString());
      expect(data.name).toBe('Me Test User');
    });

    test('should return role field for admin checking', async () => {
      const { user, token } = await createAuthenticatedTestUser({
        email: `role-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(user._id.toString());
      
      const request = createAuthenticatedRequest('/api/auth/me', token, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data.role).toBeDefined();
      expect(data.role).toBe('user');
    });

    test('should work for admin users', async () => {
      const { user, token } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(user._id.toString());
      
      const request = createAuthenticatedRequest('/api/auth/me', token, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data._id).toBe(user._id.toString());
      expect(data.role).toBe('admin');
    });
  });

  describe('Authentication Failures', () => {
    test('should return 401 when no token provided', async () => {
      // Create request without token
      const request = createMockRequest('/api/auth/me', {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    test('should return 401 with invalid token', async () => {
      // Create request with garbage token
      const request = createAuthenticatedRequest('/api/auth/me', 'invalid-garbage-token', {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 401 with expired token', async () => {
      // Create user
      const { user } = await createAuthenticatedTestUser({
        email: `expired-${Date.now()}@example.com`
      });
      createdUserIds.push(user._id.toString());
      
      // Generate expired token (negative expiration)
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const expiredToken = jwt.sign(
        { userId: user._id.toString() },
        secret,
        { expiresIn: '-1d' } // Expired 1 day ago
      );
      
      const request = createAuthenticatedRequest('/api/auth/me', expiredToken, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 401 with token signed with wrong secret', async () => {
      const { user } = await createAuthenticatedTestUser({
        email: `wrongsecret-${Date.now()}@example.com`
      });
      createdUserIds.push(user._id.toString());
      
      // Generate token with WRONG secret
      const wrongSecret = 'wrong-secret-key-12345';
      const badToken = jwt.sign(
        { userId: user._id.toString() },
        wrongSecret,
        { expiresIn: '1d' }
      );
      
      const request = createAuthenticatedRequest('/api/auth/me', badToken, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Field Filtering & Security', () => {
    test('should return only allowed fields (_id, name, photoUrl, role)', async () => {
      const { user, token } = await createAuthenticatedTestUser({
        name: 'Field Test User',
        email: `fields-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(user._id.toString());
      
      const request = createAuthenticatedRequest('/api/auth/me', token, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      
      // Should have these fields
      expect(data).toHaveProperty('_id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('photoUrl');
      expect(data).toHaveProperty('role');
      
      // Should NOT have sensitive fields
      expect(data).not.toHaveProperty('password');
      
      // Verify data types
      expect(typeof data._id).toBe('string');
      expect(typeof data.name).toBe('string');
      expect(typeof data.role).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    test('should return 404 if user deleted but token is valid', async () => {
      // Create user and get token
      const { user, token } = await createAuthenticatedTestUser({
        email: `deleted-${Date.now()}@example.com`
      });
      
      // Delete user from database (but keep token valid)
      await deleteTestDocument('User', user._id.toString());
      // Don't add to createdUserIds - already deleted
      
      // Try to access /me with valid token but deleted user
      const request = createAuthenticatedRequest('/api/auth/me', token, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    test('should handle token with non-existent userId', async () => {
      // Generate token with fake userId
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
      
      const fakeToken = jwt.sign(
        { userId: fakeUserId },
        secret,
        { expiresIn: '1d' }
      );
      
      const request = createAuthenticatedRequest('/api/auth/me', fakeToken, {
        method: 'GET'
      });
      
      const response = await GET(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});

