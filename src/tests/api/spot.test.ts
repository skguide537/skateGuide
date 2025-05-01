import { GET, POST } from '@/app/api/spots/route';
import { PUT, DELETE } from '@/app/api/spots/[spotId]/route';
import { connectDB, clearDB, closeDB } from './setup';

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
        createdBy: '507f191e810c19729de860ea',
      };

      const request = mockRequest('POST', spotData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Florentin Ledge');
      expect(data.type).toBe('street');
    });
  });

  describe('PUT /api/spots/:id', () => {
    it('should update an existing spot', async () => {
      const createResponse = await POST(
        mockRequest('POST', {
          name: 'Update Me',
          description: 'Temporary',
          type: 'diy',
          location: {
            type: 'Point',
            coordinates: [34.781, 32.08],
          },
          createdBy: '507f191e810c19729de860ea',
        })
      );
      const created = await createResponse.json();

      const updateResponse = await PUT(
        mockRequest('PUT', {
          name: 'Updated Spot',
          description: 'Updated Description',
        }),
        { params: { spotId: created._id } }
      );

      const updated = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updated.name).toBe('Updated Spot');
      expect(updated.description).toBe('Updated Description');
    });
  });

  describe('DELETE /api/spots/:id', () => {
    it('should delete a spot by ID', async () => {
      const createResponse = await POST(
        mockRequest('POST', {
          name: 'Delete Me',
          description: 'To be deleted',
          type: 'skatepark',
          location: {
            type: 'Point',
            coordinates: [34.761, 32.067],
          },
          createdBy: '507f191e810c19729de860ea',
        })
      );
      const created = await createResponse.json();

      const deleteResponse = await DELETE({} as Request, {
        params: { spotId: created._id },
      });

      const deleted = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleted._id).toBe(created._id);
    });
  });
});
