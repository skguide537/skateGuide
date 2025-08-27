import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { logger } from '@/utils/logger';

export async function GET(req: NextRequest) {
    try {
        // In CI environment (not test), return a mock response to avoid database connection issues
        if (process.env.CI && process.env.NODE_ENV !== 'test') {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const { db } = await connectToDatabase();
        if (!db) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        
        const token = cookies().get('token')?.value;
        if (!token)  return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret) as { userId: string };

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(decoded.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            _id: user._id,
            name: user.name,
            photoUrl: user.photoUrl,
            role: user.role // Add role to response for admin checking
        });
    } catch (err) {
        logger.error('GET /api/auth/me error', err as Error, { component: 'auth/me' });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}