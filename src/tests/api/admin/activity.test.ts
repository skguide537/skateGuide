import mongoose from 'mongoose';
import { GET as getActivityFeed } from '../../../app/api/admin/activity/route';
import { createAuthenticatedTestUser } from '../../helpers/test-data-factory';
import { createAuthenticatedRequest, extractJsonResponse, generateRandomObjectId } from '../../helpers/test-helpers';
import { recordActivity } from '../../../services/activity-log.service';
import { ActivityType, ActivityModel } from '../../../models/activity.model';
import User from '../../../models/User';
import { deleteTestDocument } from '../../helpers';

describe('Admin Activity API', () => {
  let adminToken: string;
  let adminUserId: string;
  const createdUserIds: string[] = [];
  const createdActivityIds: string[] = [];

  beforeAll(async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-activity-${Date.now()}@example.com`,
      role: 'admin',
    });
    adminToken = token;
    adminUserId = user._id.toString();
    createdUserIds.push(adminUserId);
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      const userExists = await User.findById(userId);
      if (userExists) {
        await deleteTestDocument('User', userId);
      }
    }
    if (createdActivityIds.length > 0) {
      await ActivityModel.deleteMany({ _id: { $in: createdActivityIds } });
    }
  });

  it('should paginate activity feed', async () => {
    for (let i = 0; i < 3; i++) {
      const activity = await recordActivity({
        type: ActivityType.PARK_CREATED,
        actorUserId: adminUserId,
        targetType: 'park',
        targetId: generateRandomObjectId(),
        metadata: { iteration: i },
      });
      createdActivityIds.push((activity._id as mongoose.Types.ObjectId).toString());
    }

    const request = createAuthenticatedRequest('/api/admin/activity?limit=2', adminToken);
    const response = await getActivityFeed(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.data.length).toBeLessThanOrEqual(2);
    expect(data.nextCursor === null || typeof data.nextCursor === 'string').toBe(true);
  });
});


