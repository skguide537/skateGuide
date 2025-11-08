import mongoose from 'mongoose';
import { GET as getAuthFailures } from '../../../app/api/admin/monitoring/auth-failures/route';
import { GET as getApiErrors } from '../../../app/api/admin/monitoring/api-errors/route';
import { GET as getRateLimit } from '../../../app/api/admin/monitoring/rate-limit/route';
import { createAuthenticatedTestUser } from '../../helpers/test-data-factory';
import { createAuthenticatedRequest, extractJsonResponse } from '../../helpers/test-helpers';
import { recordAdminLog } from '../../../services/admin.service';
import User from '../../../models/User';
import { deleteTestDocument } from '../../helpers';
import { AdminLogModel } from '../../../models/admin-log.model';

describe('Admin Monitoring API', () => {
  let adminToken: string;
  let adminUserId: string;
  const createdUserIds: string[] = [];
  const createdLogIds: string[] = [];

  beforeAll(async () => {
    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-monitor-${Date.now()}@example.com`,
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
    if (createdLogIds.length > 0) {
      await AdminLogModel.deleteMany({ _id: { $in: createdLogIds } });
    }
  });

  it('should return logs for each monitoring category', async () => {
    const authLog = await recordAdminLog({
      category: 'auth_failure',
      message: 'Test auth failure',
      context: '/api/admin/test',
    });
    createdLogIds.push((authLog._id as mongoose.Types.ObjectId).toString());
    const errorLog = await recordAdminLog({
      category: 'api_error',
      message: 'Test api error',
      context: '/api/admin/test',
    });
    createdLogIds.push((errorLog._id as mongoose.Types.ObjectId).toString());
    const rateLog = await recordAdminLog({
      category: 'rate_limit',
      message: 'Test rate limit',
      context: '/api/admin/test',
    });
    createdLogIds.push((rateLog._id as mongoose.Types.ObjectId).toString());

    const authRequest = createAuthenticatedRequest('/api/admin/monitoring/auth-failures', adminToken);
    const authResponse = await getAuthFailures(authRequest);
    const authResult = await extractJsonResponse(authResponse);

    expect(authResult.status).toBe(200);
    expect(Array.isArray(authResult.data.data)).toBe(true);

    const apiRequest = createAuthenticatedRequest('/api/admin/monitoring/api-errors', adminToken);
    const apiResponse = await getApiErrors(apiRequest);
    const apiResult = await extractJsonResponse(apiResponse);

    expect(apiResult.status).toBe(200);
    expect(Array.isArray(apiResult.data.data)).toBe(true);

    const rateRequest = createAuthenticatedRequest('/api/admin/monitoring/rate-limit', adminToken);
    const rateResponse = await getRateLimit(rateRequest);
    const rateResult = await extractJsonResponse(rateResponse);

    expect(rateResult.status).toBe(200);
    expect(Array.isArray(rateResult.data.data)).toBe(true);
  });
});


