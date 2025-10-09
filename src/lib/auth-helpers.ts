import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

/**
 * Get authenticated user from JWT token in request cookie
 * @param req - NextRequest object
 * @returns User object or null if not authenticated
 */
export async function getUserFromRequest(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return null;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Get user from database
    const { db } = await connectToDatabase();
    if (!db) {
      return null;
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } } // Don't return password
    );

    return user;
  } catch (error) {
    // Invalid token or other error
    return null;
  }
}

/**
 * Check if user is authenticated (has valid token)
 * @param req - NextRequest object
 * @returns boolean
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const user = await getUserFromRequest(req);
  return user !== null;
}

/**
 * Check if user is admin
 * @param req - NextRequest object
 * @returns boolean
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const user = await getUserFromRequest(req);
  return user !== null && user.role === 'admin';
}

