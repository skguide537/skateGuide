import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '@/utils/logger';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Update user role to admin
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { role: 'admin' } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'User promoted to admin successfully',
            userId: userId
        });
    } catch (error: any) {
        logger.error('Promote admin error', error as Error, { component: 'auth/promote-admin' });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
