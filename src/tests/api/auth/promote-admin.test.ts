import { createAuthenticatedTestUser,createAuthenticatedRequest,createMockRequest,deleteTestDocument,extractJsonResponse,generateRandomObjectId} from '../../helpers';
import { POST } from '../../../app/api/auth/promote-admin/route';
import User from '../../../models/User';

describe('POST /api/auth/promote-admin', () => {
  let createdUserIds: string[] = [];
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created
    for (const userId of createdUserIds) {
      await deleteTestDocument('User', userId);
    }
    createdUserIds = [];
  });
  
  describe('Successful Promotion', () => {
    test('should allow admin to promote user to admin', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Create regular user to promote
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(targetUser._id.toString());
      
      // Verify target user is NOT admin yet
      const userBefore = await User.findById(targetUser._id);
      expect(userBefore?.role).toBe('user');
      
      // Admin promotes the user
      const request = createAuthenticatedRequest('/api/auth/promote-admin', adminToken, {
        method: 'POST',
        body: {userId: targetUser._id.toString()}
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      expect(data.message).toBe('User promoted to admin successfully');
      expect(data.userId).toBe(targetUser._id.toString());
      
      // Verify role actually changed in database
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter?.role).toBe('admin');
    });
  });

  describe('Authorization - Admin Required', () => {
    test('should reject non-admin user with 403', async () => {
      // Create regular (non-admin) user
      const { user: regularUser, token: regularToken } = await createAuthenticatedTestUser({
        email: `regular-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(regularUser._id.toString());
      
      // Create target user
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(targetUser._id.toString());
      
      // Regular user tries to promote someone
      const request = createAuthenticatedRequest('/api/auth/promote-admin', regularToken, {
        method: 'POST',
        body: {userId: targetUser._id.toString()}
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(403);
      expect(data.error).toContain('Forbidden');
      expect(data.error).toContain('Admin');
      
      // Verify target user role did NOT change
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter?.role).toBe('user'); // Still user, not admin
    });

    test('should reject unauthenticated request with 401', async () => {
      // Create target user
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(targetUser._id.toString());
      
      // Try to promote without authentication
      const request = createMockRequest('/api/auth/promote-admin', {
        method: 'POST',
        body: {
          userId: targetUser._id.toString()
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      
      // Verify target user role did NOT change
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter?.role).toBe('user');
    });
  });

  describe('Validation', () => {
    test('should reject missing userId with 400', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Try to promote without userId
      const request = createAuthenticatedRequest('/api/auth/promote-admin', adminToken, {
        method: 'POST',
        body: {} // Missing userId
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(400);
      expect(data.error).toBe('User ID is required');
    });

    test('should return 404 for non-existent userId', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Try to promote non-existent user
      const fakeUserId = generateRandomObjectId();
      const request = createAuthenticatedRequest('/api/auth/promote-admin', adminToken, {
        method: 'POST',
        body: {
          userId: fakeUserId
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('Security', () => {
    test('should prevent user from promoting themselves', async () => {
      // Create regular user
      const { user: regularUser, token: regularToken } = await createAuthenticatedTestUser({
        email: `self-promote-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(regularUser._id.toString());
      
      // User tries to promote themselves
      const request = createAuthenticatedRequest('/api/auth/promote-admin', regularToken, {
        method: 'POST',
        body: {
          userId: regularUser._id.toString()
        }
      });
      
      const response = await POST(request);
      const { data, status } = await extractJsonResponse(response);
      
      // Should be rejected because user is not admin
      expect(status).toBe(403);
      expect(data.error).toContain('Forbidden');
      
      // Verify they're still a regular user
      const userAfter = await User.findById(regularUser._id);
      expect(userAfter?.role).toBe('user');
    });
  });
});

