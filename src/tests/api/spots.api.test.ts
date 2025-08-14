import { GET, POST } from '@/app/api/spots/route';

// Mock the database connection
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(() => Promise.resolve({ db: {} }))
}));

// Mock the Spot model with proper default export handling
jest.mock('@/models/Spot', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn()
  }
}));

describe('Spots API', () => {
  let mockSpot: any;
  let mockRequest: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
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
      level: 'beginner',
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
      const { default: Spot } = require('@/models/Spot');
      Spot.find.mockResolvedValue([mockSpot]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const { default: Spot } = require('@/models/Spot');
      Spot.find.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/spots', () => {
    it('should create new spot with valid data', async () => {
      const { default: Spot } = require('@/models/Spot');
      
      Spot.create.mockResolvedValue(mockSpot);
      mockRequest.json = jest.fn().mockResolvedValue(mockSpot);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(data._id).toBe(mockSpot._id);
    });

    it('should handle database errors gracefully', async () => {
      const { default: Spot } = require('@/models/Spot');
      Spot.create.mockRejectedValue(new Error('Database error'));
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
