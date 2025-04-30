import { GET, POST } from '@/app/api/spots/route';
import { clearDB, closeDB, connectDB } from './setup';

const mockRequest = (method: string, body?: any) =>
  ({
    method,
    json: async () => body,
  } as Request);

describe('Spots API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('GET /api/spots', () => {
    it('should return empty array when no spots exist', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /api/spots', () => {
    it('should create a new spot', async () => {
      const spotData = {
        name: 'Florentin Ledge',
        description: 'A street ledge in Tel Aviv',
        type: 'street',
        location: {
          type: 'Point',
          coordinates: [34.772, 32.075],
        },
        createdBy: '507f191e810c19729de860ea', // fake ObjectId
      };

      const request = mockRequest('POST', spotData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Florentin Ledge');
      expect(data.type).toBe('street');
    });
  });
});
