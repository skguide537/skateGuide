import { GET as getPendingParks } from '../../../app/api/admin/parks/pending/route';
import { PATCH as approveParkRoute } from '../../../app/api/admin/parks/[id]/approve/route';
import { createAuthenticatedTestUser, createTestSkatepark } from '../../helpers/test-data-factory';
import { deleteTestDocument } from '../../helpers';
import { createAuthenticatedRequest, extractJsonResponse } from '../../helpers/test-helpers';
import User from '../../../models/User';
import { SkateparkModel } from '../../../models/skatepark.model';
import { ActivityModel } from '../../../models/activity.model';
import { AdminLogModel } from '../../../models/admin-log.model';

describe('Admin Parks API', () => {
  let adminToken: string;
  let adminUserId: string;
  let createdParkIds: string[] = [];
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-${Date.now()}@example.com`,
      role: 'admin',
    });
    adminToken = token;
    adminUserId = user._id.toString();
    createdUserIds.push(adminUserId);
  });

  afterEach(async () => {
    for (const parkId of createdParkIds) {
      await SkateparkModel.findByIdAndDelete(parkId);
    }
    createdParkIds = [];
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      const userExists = await User.findById(userId);
      if (userExists) {
        await deleteTestDocument('User', userId);
      }
    }
    createdUserIds = [];
  });

  it('should block non-admin users', async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `regular-${Date.now()}@example.com`,
      role: 'user',
    });
    createdUserIds.push(user._id.toString());
    const request = createAuthenticatedRequest('/api/admin/parks/pending', token);
    const response = await getPendingParks(request);
    const { status } = await extractJsonResponse(response);
    expect(status).toBe(403);
    await AdminLogModel.deleteMany({ 'details.userId': user._id.toString() });
  });

  it('should return pending parks with pagination', async () => {
    for (let i = 0; i < 3; i++) {
      const park = await createTestSkatepark({
        title: `Pending Park ${i}`,
        createdBy: adminUserId,
        isApproved: false,
      });
      createdParkIds.push(park._id.toString());
    }

    const request = createAuthenticatedRequest('/api/admin/parks/pending?page=1&limit=2', adminToken);
    const response = await getPendingParks(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.pagination.total).toBeGreaterThanOrEqual(3);
    expect(data.data.length).toBeLessThanOrEqual(2);
  });

  it('should approve a park and be idempotent', async () => {
    const park = await createTestSkatepark({
      title: `Approve Me`,
      createdBy: adminUserId,
      isApproved: false,
    });
    createdParkIds.push(park._id.toString());

    const firstRequest = createAuthenticatedRequest(`/api/admin/parks/${park._id}/approve`, adminToken, {
      method: 'PATCH',
      body: { approve: true },
    });
    const firstResponse = await approveParkRoute(firstRequest, { params: { id: park._id.toString() } });
    const firstResult = await extractJsonResponse(firstResponse);

    expect(firstResult.status).toBe(200);
    expect(firstResult.data.success).toBe(true);
    expect(firstResult.data.alreadyApproved).toBe(false);

    const secondRequest = createAuthenticatedRequest(`/api/admin/parks/${park._id}/approve`, adminToken, {
      method: 'PATCH',
      body: { approve: true },
    });
    const secondResponse = await approveParkRoute(secondRequest, { params: { id: park._id.toString() } });
    const secondResult = await extractJsonResponse(secondResponse);

    expect(secondResult.status).toBe(200);
    expect(secondResult.data.alreadyApproved).toBe(true);
    await ActivityModel.deleteMany({ targetId: park._id });
  });
});


