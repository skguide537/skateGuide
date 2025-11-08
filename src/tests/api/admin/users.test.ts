import { GET as getUsersRoute } from '../../../app/api/admin/users/route';
import { PATCH as patchUserRoleRoute } from '../../../app/api/admin/users/[id]/role/route';
import { DELETE as deleteUserRoute } from '../../../app/api/admin/users/[id]/route';
import {
  createAuthenticatedTestUser,
  createTestUser,
} from '../../helpers/test-data-factory';
import {
  createAuthenticatedRequest,
  extractJsonResponse,
} from '../../helpers/test-helpers';
import User from '../../../models/User';
import { ActivityModel } from '../../../models/activity.model';
import { AdminLogModel } from '../../../models/admin-log.model';
import { deleteTestDocument } from '../../helpers';

describe('Admin Users API', () => {
  let adminToken: string;
  let adminUserId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-users-${Date.now()}@example.com`,
      role: 'admin',
    });
    adminToken = token;
    adminUserId = user._id.toString();
    createdUserIds.push(adminUserId);
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      const existing = await User.findById(userId);
      if (existing) {
        await deleteTestDocument('User', userId);
      }
    }
  });

  it('should list users with pagination', async () => {
    const targetUser = await createTestUser({ email: `list-user-${Date.now()}@example.com` });
    createdUserIds.push(targetUser._id.toString());

    const request = createAuthenticatedRequest('/api/admin/users?limit=10', adminToken);
    const response = await getUsersRoute(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.pagination).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.some((user: any) => user._id === targetUser._id.toString())).toBe(true);
  });

  it('should promote a user to admin', async () => {
    const targetUser = await createTestUser({ email: `promote-user-${Date.now()}@example.com` });
    createdUserIds.push(targetUser._id.toString());

    const request = createAuthenticatedRequest(
      `/api/admin/users/${targetUser._id}/role`,
      adminToken,
      {
        method: 'PATCH',
        body: { role: 'admin' },
      }
    );
    const response = await patchUserRoleRoute(request, { params: { id: targetUser._id.toString() } });
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('admin');

    await User.findByIdAndUpdate(targetUser._id, { role: 'user' });
    await ActivityModel.deleteMany({ targetId: targetUser._id });
  });

  it('should prevent admins from changing their own role', async () => {
    const request = createAuthenticatedRequest(
      `/api/admin/users/${adminUserId}/role`,
      adminToken,
      {
        method: 'PATCH',
        body: { role: 'user' },
      }
    );
    const response = await patchUserRoleRoute(request, { params: { id: adminUserId } });
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(400);
    expect(data.error).toContain('Admins cannot change their own role');
    await AdminLogModel.deleteMany({ context: `/api/admin/users/${adminUserId}/role` });
  });

  it('should demote another admin if more than one exists', async () => {
    const otherAdmin = await createTestUser({ email: `demote-admin-${Date.now()}@example.com`, role: 'admin' });
    createdUserIds.push(otherAdmin._id.toString());

    const request = createAuthenticatedRequest(
      `/api/admin/users/${otherAdmin._id}`,
      adminToken,
      {
        method: 'PATCH',
        body: { role: 'user' },
      }
    );
    const response = await patchUserRoleRoute(request, { params: { id: otherAdmin._id.toString() } });
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.user.role).toBe('user');
    await ActivityModel.deleteMany({ targetId: otherAdmin._id });
  });

  it('should delete a user as admin', async () => {
    const targetUser = await createTestUser({ email: `delete-user-${Date.now()}@example.com` });
    createdUserIds.push(targetUser._id.toString());

    const request = createAuthenticatedRequest(
      `/api/admin/users/${targetUser._id}`,
      adminToken
    );
    const response = await deleteUserRoute(request, { params: { id: targetUser._id.toString() } });
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const userAfter = await User.findById(targetUser._id);
    expect(userAfter).toBeNull();
    await ActivityModel.deleteMany({ targetId: targetUser._id });
  });

  it('should prevent admins from deleting themselves', async () => {
    const request = createAuthenticatedRequest(
      `/api/admin/users/${adminUserId}`,
      adminToken
    );
    const response = await deleteUserRoute(request, { params: { id: adminUserId } });
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(400);
    expect(data.error).toContain('Admins cannot delete themselves');
    await AdminLogModel.deleteMany({ context: `/api/admin/users/${adminUserId}` });
  });
});


