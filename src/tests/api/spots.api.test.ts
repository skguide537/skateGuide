// Mock the Spot model and database connection before imports
jest.mock('@/models/Spot', () => ({
  __esModule: true,
  default: {
    find: jest.fn(() => ({
      populate: jest.fn(() => Promise.resolve([]))
    })),
    create: jest.fn(() => Promise.resolve({ _id: 'mock-id' }))
  }
}));

jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() => Promise.resolve({ db: {} }))
}));

import { GET, POST } from '@/app/api/spots/route';

describe('Spots API', () => {
  let mockSpot: any;
  let mockRequest: any;
  let mockSpotModel: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get the mocked Spot model
    mockSpotModel = require('@/models/Spot').default;
    
    mockSpot = {
      _id: 'mock-spot-id',
      title: 'Test Skate Spot',
      description: 'A test spot for testing',
      location: {
        coordinates: [32.073, 34.789],
        type: 'Point'
      },
      type: 'street',
      size: 'medium',
      levels: ['beginner'],
      createdBy: 'mock-user-id'
    };

    mockRequest = {
      url: 'http://localhost:3000/api/spots',
      headers: new Headers(),
      json: jest.fn(),
      nextUrl: new URL('http://localhost:3000/api/spots')
    };
  });

  describe('GET /api/spots', () => {
    it('should return spots list', async () => {
      const mockSpots = [mockSpot];
      mockSpotModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSpots)
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockSpots);
    });

    it('should handle database errors gracefully', async () => {
      mockSpotModel.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/spots', () => {
    it('should create new spot with valid data', async () => {
      mockSpotModel.create.mockResolvedValue(mockSpot);
      mockRequest.json = jest.fn().mockResolvedValue(mockSpot);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(data._id).toBe(mockSpot._id);
    });

    it('should handle database errors gracefully', async () => {
      mockSpotModel.create.mockRejectedValue(new Error('Database error'));
      mockRequest.json = jest.fn().mockResolvedValue(mockSpot);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle invalid request data', async () => {
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
