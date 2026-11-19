import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/User';
import { SkateparkModel } from '../../models/skatepark.model';
import { connectToDatabase } from '../../lib/mongodb';
import { Tag } from '../../types/enums';

/**
 * Test data factories for creating realistic test data
 * Each factory saves to the actual database
 */

// Counter for generating unique emails
let userCounter = 0;

/**
 * User factory options
 */
export interface CreateTestUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  photoUrl?: string;
  photoId?: string;
}

/**
 * Create a test user in the database
 * Returns the created user with _id
 */
export async function createTestUser(
  options: CreateTestUserOptions = {}
): Promise<any> {
  // Ensure database connection is ready
  await connectToDatabase();
  
  userCounter++;
  
  const userData = {
    name: options.name || `Test User ${userCounter}`,
    email: options.email || `testuser${userCounter}-${Date.now()}@test.com`,
    password: options.password || 'Test123456!',
    role: options.role || 'user',
    photoUrl: options.photoUrl,
    photoId: options.photoId,
  };

  const user = await User.create(userData);
  return user;
}

/**
 * Skatepark factory options
 * Matches your actual Skatepark model schema
 */
export interface CreateTestSkateparkOptions {
  title?: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  size?: 'Small' | 'Medium' | 'Large';
  levels?: string[];
  tags?: string[];
  isPark?: boolean;
  isApproved?: boolean;
  photoNames?: string[];
  createdBy?: string | mongoose.Types.ObjectId;
}

/**
 * Create a test skatepark in the database
 * Uses actual Skatepark model fields
 */
export async function createTestSkatepark(
  options: CreateTestSkateparkOptions = {}
): Promise<any> {
  const skateparkData = {
    title: options.title || `Test Skatepark ${Date.now()}`,
    description: options.description || 'A test skatepark for testing',
    location: options.location || {
      type: 'Point' as const,
      coordinates: [34.7818, 32.0853] // [lng, lat] - Tel Aviv
    },
    size: options.size || 'Medium',
    levels: options.levels || ['Beginner', 'Intermediate'],
    tags: options.tags || [Tag.Rail, Tag.Bowl],
    isPark: options.isPark !== undefined ? options.isPark : true,
    isApproved: options.isApproved !== undefined ? options.isApproved : false,
    photoNames: options.photoNames || ['test-photo.jpg'],
    createdBy: options.createdBy || new mongoose.Types.ObjectId(),
  };

  const skatepark = await SkateparkModel.create(skateparkData);
  return skatepark;
}

/**
 * Generate a valid JWT token for testing
 * Uses same JWT_SECRET as the application
 * 
 * @param userId - User ID to encode in token
 */
export function generateAuthToken(
  userId: string | mongoose.Types.ObjectId
): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  const token = jwt.sign(
    { userId: userId.toString() },
    secret,
    { expiresIn: '30d' }
  );

  return token;
}

/**
 * Create a complete authenticated user (user + token)
 * Useful for testing protected routes
 */
export async function createAuthenticatedTestUser(
  options: CreateTestUserOptions = {}
): Promise<{ user: any; token: string }> {
  const user = await createTestUser(options);
  const token = generateAuthToken(user._id);
  
  return { user, token };
}

