import { GET as getStatsOverviewRoute } from '../../../app/api/admin/stats/overview/route';
import { createAuthenticatedTestUser, createTestSkatepark, createTestUser } from '../../helpers/test-data-factory';
import { deleteTestDocument } from '../../helpers';
import { createAuthenticatedRequest, extractJsonResponse } from '../../helpers/test-helpers';
import User from '../../../models/User';
import { SkateparkModel } from '../../../models/skatepark.model';

describe('Admin Stats API', () => {
  let adminToken: string;
  let adminUserId: string;
  const createdUserIds: string[] = [];
  const createdParkIds: string[] = [];

  beforeAll(async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-stats-${Date.now()}@example.com`,
      role: 'admin',
    });
    adminToken = token;
    adminUserId = user._id.toString();
    createdUserIds.push(adminUserId);
  });

  afterAll(async () => {
    for (const parkId of createdParkIds) {
      await SkateparkModel.findByIdAndDelete(parkId);
    }
    for (const userId of createdUserIds) {
      const userExists = await User.findById(userId);
      if (userExists) {
        await deleteTestDocument('User', userId);
      }
    }
  });

  it('should return stats overview with expected structure', async () => {
    const contributor = await createTestUser({ email: `stats-user-${Date.now()}@example.com` });
    createdUserIds.push(contributor._id.toString());

    const park = await createTestSkatepark({
      title: 'Stats Park',
      createdBy: contributor._id,
      isApproved: true,
      levels: ['Beginner', 'Intermediate'],
      size: 'Medium',
      isPark: true,
    });
    createdParkIds.push(park._id.toString());

    const request = createAuthenticatedRequest('/api/admin/stats/overview?topContributorsLimit=5', adminToken);
    const response = await getStatsOverviewRoute(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.users).toBeDefined();
    expect(data.users.totals).toHaveProperty('totalUsers');
    expect(Array.isArray(data.users.newUsersByDay)).toBe(true);
    expect(data.parks).toBeDefined();
    expect(data.parks.totals).toHaveProperty('total');
    expect(Array.isArray(data.parks.topContributors)).toBe(true);
    expect(Array.isArray(data.parks.geo)).toBe(true);
  });
});


