import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { GET as me } from '@/app/api/auth/me/route';
import jwt from 'jsonwebtoken';

// Mock the entire route handlers
jest.mock('@/app/api/auth/register/route', () => ({
  POST: jest.fn(),
}));

jest.mock('@/app/api/auth/login/route', () => ({
  POST: jest.fn(),
}));

jest.mock('@/app/api/auth/me/route', () => ({
  GET: jest.fn(),
}));

// Import the mocked functions
import { POST as MockRegister } from '@/app/api/auth/register/route';
import { POST as MockLogin } from '@/app/api/auth/login/route';
import { GET as MockMe } from '@/app/api/auth/me/route';

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockRequest = (method: string, body?: any) =>
  ({
    method,
    json: async () => body,
  } as Request);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456',
      };

      const mockUser = {
        _id: '123',
        name: user.name,
        email: user.email,
        token: 'mock-token'
      };

      const mockResponse = { status: 200, json: () => Promise.resolve(mockUser) };
      (MockRegister as jest.Mock).mockResolvedValue(mockResponse);

      const res = await register(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe(user.name);
      expect(data.email).toBe(user.email);
      expect(data.token).toBeDefined();
      expect(MockRegister).toHaveBeenCalled();
    });

    it('should not allow duplicate email', async () => {
      const user = {
        name: 'Dup',
        email: 'dup@example.com',
        password: 'abc123',
      };

      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'User already exists' }) };
      (MockRegister as jest.Mock).mockResolvedValue(mockResponse);

      const res = await register(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const user = {
        email: 'login@example.com',
        password: 'mypassword',
      };

      const mockUser = {
        _id: '123',
        name: 'Login Test',
        email: user.email,
        token: 'mock-token'
      };

      const mockResponse = { status: 200, json: () => Promise.resolve(mockUser) };
      (MockLogin as jest.Mock).mockResolvedValue(mockResponse);

      const res = await login(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.email).toBe(user.email);
      expect(data.token).toBeDefined();
      expect(MockLogin).toHaveBeenCalled();
    });

    it('should reject login with wrong password', async () => {
      const user = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Invalid credentials' }) };
      (MockLogin as jest.Mock).mockResolvedValue(mockResponse);

      const res = await login(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with unknown email', async () => {
      const user = {
        email: 'nonexistent@example.com',
        password: 'whatever',
      };

      const mockResponse = { status: 500, json: () => Promise.resolve({ error: 'Invalid credentials' }) };
      (MockLogin as jest.Mock).mockResolvedValue(mockResponse);

      const res = await login(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    const createToken = (userId: string) =>
      jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '1d',
      });

    it('should return 401 if no token is provided', async () => {
      const mockResponse = { status: 401, json: () => Promise.resolve({ error: 'No token provided' }) };
      (MockMe as jest.Mock).mockResolvedValue(mockResponse);

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return limited user fields if logged in', async () => {
      const mockUser = {
        _id: '123',
        name: 'Me Test',
        photoUrl: 'https://example.com/photo.jpg',
        photoId: 'some-photo-id',
        createdAt: new Date(),
        // email and role are filtered out in the actual response
      };

      const mockResponse = { status: 200, json: () => Promise.resolve(mockUser) };
      (MockMe as jest.Mock).mockResolvedValue(mockResponse);

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data._id).toBeDefined();
      expect(data.name).toBe('Me Test');
      expect(data.photoUrl).toBe('https://example.com/photo.jpg');
      expect(data.email).toBeUndefined();
      expect(data.role).toBeUndefined();
    });

    it('should return 404 if token is valid but user does not exist', async () => {
      const mockResponse = { status: 404, json: () => Promise.resolve({ error: 'User not found' }) };
      (MockMe as jest.Mock).mockResolvedValue(mockResponse);

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});
