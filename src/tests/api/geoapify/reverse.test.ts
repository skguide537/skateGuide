import mongoose from 'mongoose';
import { GET as reverseRoute } from '../../../app/api/geoapify/reverse/route';
import { createAuthenticatedTestUser } from '../../helpers/test-data-factory';
import {
  createAuthenticatedRequest,
  createMockRequest,
  extractJsonResponse,
} from '../../helpers/test-helpers';
import { AdminLogModel } from '../../../models/admin-log.model';
import User from '../../../models/User';
import { deleteTestDocument } from '../../helpers';

function mockFetchJson(
  payload: unknown,
  status = 200,
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
) {
  const fetchSpy = jest.spyOn(globalThis as unknown as { fetch: typeof fetch }, 'fetch') as jest.SpyInstance<
    ReturnType<typeof fetch>,
    Parameters<typeof fetch>
  >;

  const response = new Response(JSON.stringify(payload), {
    status,
    headers,
  });

  fetchSpy.mockResolvedValue(response);
  return fetchSpy;
}

describe('Geoapify Reverse Geocoding API', () => {
  let adminToken: string;
  let adminUserId: string;
  const createdUserIds: string[] = [];
  const createdLogIds: string[] = [];

  beforeAll(async () => {
    process.env.GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || 'test-geoapify-key';

    const { user, token } = await createAuthenticatedTestUser({
      email: `admin-geoapify-${Date.now()}@example.com`,
      role: 'admin',
    });

    adminToken = token;
    adminUserId = user._id.toString();
    createdUserIds.push(adminUserId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    if (createdLogIds.length > 0) {
      await AdminLogModel.deleteMany({ _id: { $in: createdLogIds } });
    }

    for (const userId of createdUserIds) {
      const existing = await User.findById(userId);
      if (existing) {
        await deleteTestDocument('User', userId);
      }
    }
  });

  it('should reject unauthenticated requests', async () => {
    const request = createMockRequest('/api/geoapify/reverse', {
      searchParams: { lat: '32.08', lon: '34.78' },
    });

    const response = await reverseRoute(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(401);
    expect(data.error).toMatch(/unauthorized/i);

    const logs = await AdminLogModel.find({ context: '/api/geoapify/reverse' }).lean();
    logs.forEach((log) => {
      const id = (log._id as mongoose.Types.ObjectId).toString();
      if (!createdLogIds.includes(id)) {
        createdLogIds.push(id);
      }
    });
  });

  it('should validate coordinates', async () => {
    const request = createAuthenticatedRequest('/api/geoapify/reverse', adminToken, {
      searchParams: { lat: '200', lon: '34.78' },
    });

    const response = await reverseRoute(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(400);
    expect(data.error).toMatch(/invalid coordinates/i);
  });

  it('should return formatted result for valid coordinates', async () => {
    const featurePayload = {
      features: [
        {
          properties: {
            formatted: 'Tel Aviv, Israel',
            city: 'Tel Aviv',
            state: 'Tel Aviv District',
            country: 'Israel',
            country_code: 'IL',
          },
        },
      ],
    };

    const fetchSpy = mockFetchJson(featurePayload);

    const request = createAuthenticatedRequest('/api/geoapify/reverse', adminToken, {
      searchParams: { lat: '32.08', lon: '34.78' },
    });

    const response = await reverseRoute(request);
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.formatted).toBe('Tel Aviv, Tel Aviv District, Israel');
    expect(data.rawFormatted).toBe('Tel Aviv, Israel');
    expect(data.components.city).toBe('Tel Aviv');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockClear();

    const cachedResponse = await reverseRoute(
      createAuthenticatedRequest('/api/geoapify/reverse', adminToken, {
        searchParams: { lat: '32.08', lon: '34.78' },
      }),
    );
    const cachedResult = await extractJsonResponse(cachedResponse);

    expect(cachedResult.status).toBe(200);
    expect(cachedResult.data.formatted).toBe('Tel Aviv, Tel Aviv District, Israel');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('should handle Geoapify JSON format responses', async () => {
    const jsonPayload = {
      results: [
        {
          formatted: 'Madrid, Community of Madrid, Spain',
          city: 'Madrid',
          state: 'Community of Madrid',
          country: 'Spain',
          country_code: 'ES',
        },
      ],
    };

    const fetchSpy = mockFetchJson(jsonPayload);

    const response = await reverseRoute(
      createAuthenticatedRequest('/api/geoapify/reverse', adminToken, {
        searchParams: { lat: '40.4168', lon: '-3.7038' },
      }),
    );
    const { status, data } = await extractJsonResponse(response);

    expect(status).toBe(200);
    expect(data.formatted).toBe('Madrid, Community of Madrid, Spain');
    expect(data.components.countryCode).toBe('ES');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });
});


