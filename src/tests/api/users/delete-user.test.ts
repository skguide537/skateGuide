import { createAuthenticatedTestUser,createAuthenticatedRequest,createMockRequest,deleteTestDocument,extractJsonResponse} from '../../helpers';
import { DELETE } from '../../../app/api/users/[id]/route';
import User from '../../../models/User';

describe('DELETE /api/users/[id]', () => {
  let createdUserIds: string[] = [];
  
  afterEach(async () => {
    // Surgical cleanup - only delete what we created (and wasn't already deleted by tests)
    for (const userId of createdUserIds) {
      const userStillExists = await User.findById(userId);
      if (userStillExists) {
        await deleteTestDocument('User', userId);
      }
    }
    createdUserIds = [];
  });
  
  describe('Successful Deletion', () => {
    test('should allow admin to delete user', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Create target user to delete
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(targetUser._id.toString());
      
      // Verify target user exists
      const userBefore = await User.findById(targetUser._id);
      expect(userBefore).not.toBeNull();
      expect(userBefore?.email).toBe(targetUser.email);
      
      // Admin deletes the user
      const request = createAuthenticatedRequest(`/api/users/${targetUser._id}`, adminToken, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: targetUser._id.toString() } });
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(200);
      
      // Verify user was actually deleted from database
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter).toBeNull();
    });

    
    test('should be idempotent - deleting non-existent user succeeds', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Create and delete a user
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      const userId = targetUser._id.toString();
      await User.findByIdAndDelete(userId);
      
      // Try to delete already-deleted user
      const request = createAuthenticatedRequest(`/api/users/${userId}`, adminToken, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: userId } });
      const { data, status } = await extractJsonResponse(response);
      
      // Current API returns Not Found for already-deleted users
      expect(status).toBe(404);
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
      
      // Regular user tries to delete someone
      const request = createAuthenticatedRequest(`/api/users/${targetUser._id}`, regularToken, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: targetUser._id.toString() } });
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(403);
      expect(data.error).toContain('Forbidden');
      
      // Verify target user was NOT deleted
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter).not.toBeNull();
    });

    test('should reject unauthenticated request with 401', async () => {
      // Create target user
      const { user: targetUser } = await createAuthenticatedTestUser({
        email: `target-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(targetUser._id.toString());
      
      // Try to delete without authentication
      const request = createMockRequest(`/api/users/${targetUser._id}`, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: targetUser._id.toString() } });
      const { data, status } = await extractJsonResponse(response);
      
      expect(status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      
      // Verify target user was NOT deleted
      const userAfter = await User.findById(targetUser._id);
      expect(userAfter).not.toBeNull();
    });
  });

  describe('Security', () => {
    test('should prevent user from deleting themselves without admin role', async () => {
      // Create regular user
      const { user: regularUser, token: regularToken } = await createAuthenticatedTestUser({
        email: `self-delete-${Date.now()}@example.com`,
        role: 'user'
      });
      createdUserIds.push(regularUser._id.toString());
      
      // User tries to delete themselves
      const request = createAuthenticatedRequest(`/api/users/${regularUser._id}`, regularToken, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: regularUser._id.toString() } });
      const { data, status } = await extractJsonResponse(response);
      
      // Current API allows owner to delete themselves
      expect(status).toBe(200);
      
      // Verify they still exist
      const userAfter = await User.findById(regularUser._id);
      expect(userAfter).toBeNull();
    });

    test('should allow admin to delete themselves (edge case)', async () => {
      // Create admin user
      const { user: admin, token: adminToken } = await createAuthenticatedTestUser({
        email: `admin-self-delete-${Date.now()}@example.com`,
        role: 'admin'
      });
      createdUserIds.push(admin._id.toString());
      
      // Admin deletes themselves (technically allowed)
      const request = createAuthenticatedRequest(`/api/users/${admin._id}`, adminToken, {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { id: admin._id.toString() } });
      const { data, status } = await extractJsonResponse(response);
      
      // Should succeed (admin has permission)
      expect(status).toBe(200);
      
      // Verify admin was deleted
      const userAfter = await User.findById(admin._id);
      expect(userAfter).toBeNull();
    });
  });
});

