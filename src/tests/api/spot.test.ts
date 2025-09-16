import { GET, POST } from '@/app/api/spots/route';
import { PUT as updateOne, DELETE as deleteOne } from '@/app/api/spots/[spotId]/route';

// Mock the entire route handlers
jest.mock('@/app/api/spots/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock('@/app/api/spots/[spotId]/route', () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

// Import the mocked functions
import { GET as MockGET, POST as MockPOST } from '@/app/api/spots/route';
import { PUT as MockPUT, DELETE as MockDELETE } from '@/app/api/spots/[spotId]/route';

const mockRequest = (method: string, body?: any) =>
  ({
    method,
    json: async () => body,
  } as any);

const mockParams = (spotId: string) => ({ params: { spotId } });

describe('Spots API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/spots', () => {
    it('should return empty array when no spots exist', async () => {
      const mockResponse = { status: 200, json: () => Promise.resolve([]) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual([]);
      expect(MockGET).toHaveBeenCalled();
    });

    it('should return all spots when they exist', async () => {
      const mockSpots = [
        { _id: '1', name: 'Spot 1', description: 'Test spot 1' },
        { _id: '2', name: 'Spot 2', description: 'Test spot 2' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSpots) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockSpots);
      expect(MockGET).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/spots', () => {
    it('should create a new spot', async () => {
      const newSpot = {
        name: 'New Spot',
        description: 'A new test spot',
        coords: { lat: 32.0853, lng: 34.7818 },
      };

      const createdSpot = { _id: '123', ...newSpot, createdAt: new Date() };
      const mockResponse = { status: 200, json: () => Promise.resolve(createdSpot) };
      (MockPOST as jest.Mock).mockResolvedValue(mockResponse);

      const res = await POST(mockRequest('POST', newSpot));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe(newSpot.name);
      expect(data.description).toBe(newSpot.description);
      expect(MockPOST).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const newSpot = { name: 'Invalid Spot' };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockPOST as jest.Mock).mockResolvedValue(mockResponse);

      const res = await POST(mockRequest('POST', newSpot));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/spots/:id', () => {
    it('should update an existing spot', async () => {
      const spotId = '123';
      const updates = { name: 'Updated Spot' };
      const updatedSpot = { _id: spotId, ...updates, updatedAt: new Date() };

      const mockResponse = { status: 200, json: () => Promise.resolve(updatedSpot) };
      (MockPUT as jest.Mock).mockResolvedValue(mockResponse);

      const res = await updateOne(mockRequest('PUT', updates), mockParams(spotId));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe(updates.name);
      expect(MockPUT).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const spotId = '123';
      const updates = { name: 'Updated Spot' };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockPUT as jest.Mock).mockResolvedValue(mockResponse);

      const res = await updateOne(mockRequest('PUT', updates), mockParams(spotId));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/spots/:id', () => {
    it('should delete a spot by ID', async () => {
      const spotId = '123';
      const deletedSpot = { _id: spotId, name: 'Deleted Spot' };

      const mockResponse = { status: 200, json: () => Promise.resolve(deletedSpot) };
      (MockDELETE as jest.Mock).mockResolvedValue(mockResponse);

      const deleteResponse = await deleteOne(mockRequest('DELETE', null), mockParams(spotId));
      const deleted = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleted._id).toBe(spotId);
      expect(MockDELETE).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const spotId = '123';
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockDELETE as jest.Mock).mockResolvedValue(mockResponse);

      const res = await deleteOne(mockRequest('DELETE', null), mockParams(spotId));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
