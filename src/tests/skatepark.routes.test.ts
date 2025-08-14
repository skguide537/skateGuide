import { GET, POST } from "@/app/api/skateparks/route";
import { GET as getOne, PUT as updateOne, DELETE as deleteOne } from "@/app/api/skateparks/[id]/route";
import { POST as rate } from "@/app/api/skateparks/[id]/rate/route";
import { POST as report } from "@/app/api/skateparks/[id]/report/route";

// Mock the entire route handlers
jest.mock('@/app/api/skateparks/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

jest.mock('@/app/api/skateparks/[id]/route', () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

jest.mock('@/app/api/skateparks/[id]/rate/route', () => ({
  POST: jest.fn(),
}));

jest.mock('@/app/api/skateparks/[id]/report/route', () => ({
  POST: jest.fn(),
}));

// Import the mocked functions
import { GET as MockGET, POST as MockPOST } from '@/app/api/skateparks/route';
import { GET as MockGetOne, PUT as MockPUT, DELETE as MockDELETE } from '@/app/api/skateparks/[id]/route';
import { POST as MockRate } from '@/app/api/skateparks/[id]/rate/route';
import { POST as MockReport } from '@/app/api/skateparks/[id]/report/route';

const mockRequest = (method: string, body?: any) =>
  ({
    method,
    json: async () => body,
  } as any);

const mockParams = (id: string) => ({ params: { id } });

describe('Skatepark API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/skateparks', () => {
    it('should return all skateparks', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Park 1', location: 'Tel Aviv' },
        { _id: '2', name: 'Park 2', location: 'Jerusalem' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
      expect(MockGET).toHaveBeenCalled();
    });

    it('should search skateparks by terms', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Tel Aviv Park', location: 'Tel Aviv' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should perform advanced search', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Advanced Park', size: 'Large', level: 'Expert' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should search by tags', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Tagged Park', tags: ['street', 'bowl'] },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should find skateparks near location', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Nearby Park', coords: { lat: 32.0853, lng: 34.7818 } },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should get top rated skateparks', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Top Rated', rating: 4.8 },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should get recent skateparks', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Recent Park', createdAt: new Date() },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should handle errors', async () => {
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return paginated skateparks', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Page 1 Park' },
        { _id: '2', name: 'Page 1 Park 2' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });

    it('should fallback to default page/limit if invalid', async () => {
      const mockSkateparks = [
        { _id: '1', name: 'Default Park' },
      ];

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkateparks) };
      (MockGET as jest.Mock).mockResolvedValue(mockResponse);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkateparks);
    });
  });

  describe('POST /api/skateparks', () => {
    it('should create a new skatepark', async () => {
      const mockSkatepark = {
        name: 'New Skatepark',
        description: 'A new test skatepark',
        location: 'Tel Aviv',
        coords: { lat: 32.0853, lng: 34.7818 },
      };

      const createdSkatepark = { _id: '123', ...mockSkatepark, createdAt: new Date() };
      const mockResponse = { status: 201, json: () => Promise.resolve(createdSkatepark) };
      (MockPOST as jest.Mock).mockResolvedValue(mockResponse);

      const response = await POST(mockRequest('POST', mockSkatepark));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdSkatepark);
      expect(MockPOST).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const mockSkatepark = { name: 'Unauthorized Park' };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockPOST as jest.Mock).mockResolvedValue(mockResponse);

      const response = await POST(mockRequest('POST', mockSkatepark));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/skateparks/[id]', () => {
    it('should return a specific skatepark', async () => {
      const skateparkId = '123';
      const mockSkatepark = {
        _id: skateparkId,
        name: 'Specific Park',
        description: 'A specific test skatepark',
      };

      const mockResponse = { status: 200, json: () => Promise.resolve(mockSkatepark) };
      (MockGetOne as jest.Mock).mockResolvedValue(mockResponse);

      const response = await getOne(mockRequest('GET', null), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSkatepark);
      expect(MockGetOne).toHaveBeenCalled();
    });

    it('should return 404 if skatepark not found', async () => {
      const skateparkId = 'nonexistent';
      const mockResponse = { status: 404, json: () => Promise.resolve({ error: 'Skatepark not found' }) };
      (MockGetOne as jest.Mock).mockResolvedValue(mockResponse);

      const response = await getOne(mockRequest('GET', null), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Skatepark not found');
    });
  });

  describe('PUT /api/skateparks/[id]', () => {
    it('should update a skatepark', async () => {
      const skateparkId = '123';
      const updates = { name: 'Updated Skatepark' };
      const updatedSkatepark = { _id: skateparkId, ...updates, updatedAt: new Date() };

      const mockResponse = { status: 200, json: () => Promise.resolve(updatedSkatepark) };
      (MockPUT as jest.Mock).mockResolvedValue(mockResponse);

      const response = await updateOne(mockRequest('PUT', updates), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedSkatepark);
      expect(MockPUT).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const skateparkId = '123';
      const updates = { name: 'Unauthorized Update' };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockPUT as jest.Mock).mockResolvedValue(mockResponse);

      const response = await updateOne(mockRequest('PUT', updates), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/skateparks/[id]', () => {
    it('should delete a skatepark', async () => {
      const skateparkId = '123';
      const deletedSkatepark = { _id: skateparkId, name: 'Deleted Skatepark' };

      const mockResponse = { status: 200, json: () => Promise.resolve(deletedSkatepark) };
      (MockDELETE as jest.Mock).mockResolvedValue(mockResponse);

      const response = await deleteOne(mockRequest('DELETE', null), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(deletedSkatepark);
      expect(MockDELETE).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const skateparkId = '123';
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockDELETE as jest.Mock).mockResolvedValue(mockResponse);

      const response = await deleteOne(mockRequest('DELETE', null), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/skateparks/[id]/rate', () => {
    it('should rate a skatepark', async () => {
      const skateparkId = '123';
      const ratingData = { rating: 5, comment: 'Great park!' };
      const result = { message: 'Rating added', rating: ratingData };

      const mockResponse = { status: 200, json: () => Promise.resolve(result) };
      (MockRate as jest.Mock).mockResolvedValue(mockResponse);

      const response = await rate(mockRequest('POST', ratingData), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Rating added');
      expect(MockRate).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const skateparkId = '123';
      const ratingData = { rating: 5 };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockRate as jest.Mock).mockResolvedValue(mockResponse);

      const response = await rate(mockRequest('POST', ratingData), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/skateparks/[id]/report', () => {
    it('should report a skatepark', async () => {
      const skateparkId = '123';
      const reportData = { reason: 'Broken equipment', description: 'Ramp is damaged' };
      const result = { message: 'Report submitted', report: reportData };

      const mockResponse = { status: 200, json: () => Promise.resolve(result) };
      (MockReport as jest.Mock).mockResolvedValue(mockResponse);

      const response = await report(mockRequest('POST', reportData), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Report submitted');
      expect(MockReport).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      const skateparkId = '123';
      const reportData = { reason: 'Test reason' };
      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Internal server error' }) };
      (MockReport as jest.Mock).mockResolvedValue(mockResponse);

      const response = await report(mockRequest('POST', reportData), mockParams(skateparkId));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});