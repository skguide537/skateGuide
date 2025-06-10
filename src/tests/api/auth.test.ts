import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { GET as me } from '@/app/api/auth/me/route';
import { connectDB, clearDB, closeDB } from './setup';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
import { cookies as mockCookies } from 'next/headers';

const mockRequest = (method: string, body?: any) =>
  ({
    method,
    json: async () => body,
  } as Request);

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456',
      };

      const res = await register(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe(user.name);
      expect(data.email).toBe(user.email);
      expect(data.token).toBeDefined();
    });

    it('should not allow duplicate email', async () => {
      const user = {
        name: 'Dup',
        email: 'dup@example.com',
        password: 'abc123',
      };

      await register(mockRequest('POST', user));
      const res = await register(mockRequest('POST', user));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const user = {
        name: 'Login Test',
        email: 'login@example.com',
        password: 'mypassword',
      };

      await register(mockRequest('POST', user));

      const res = await login(
        mockRequest('POST', {
          email: user.email,
          password: user.password,
        })
      );

      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.email).toBe(user.email);
      expect(data.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const user = {
        name: 'Wrong Pass',
        email: 'wrong@example.com',
        password: 'rightpass',
      };

      await register(mockRequest('POST', user));

      const res = await login(
        mockRequest('POST', {
          email: user.email,
          password: 'wrongpass',
        })
      );

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with unknown email', async () => {
      const res = await login(
        mockRequest('POST', {
          email: 'nonexistent@example.com',
          password: 'whatever',
        })
      );

      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    const createToken = (userId: string) =>
      jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '1d',
      });

    it('should return 401 if no token is provided', async () => {
      (mockCookies as jest.Mock).mockReturnValue({
        get: () => undefined,
      });

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return limited user fields if logged in', async () => {
      const inserted = await (global as any).db.collection('users').insertOne({
        name: 'Me Test',
        email: 'me@example.com',
        password: 'hashed-password',
        role: 'user',
        photoUrl: 'https://example.com/photo.jpg',
        photoId: 'some-photo-id',
        createdAt: new Date(),
      });

      const token = createToken(inserted.insertedId.toString());

      (mockCookies as jest.Mock).mockReturnValue({
        get: () => ({ value: token }),
      });

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data._id).toBeDefined();
      expect(data.name).toBe('Me Test');
      expect(data.photoUrl).toBe('https://example.com/photo.jpg');
      expect(data.email).toBeUndefined();
      expect(data.role).toBeUndefined();
      expect(data.photoId).toBeUndefined();
    });

    it('should return 404 if token is valid but user does not exist', async () => {
      const fakeId = new ObjectId().toString();
      const token = createToken(fakeId);

      (mockCookies as jest.Mock).mockReturnValue({
        get: () => ({ value: token }),
      });

      const res = await me({} as any);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });
});
