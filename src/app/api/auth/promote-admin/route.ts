import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user from token
        const currentUser = await getUserFromRequest(req);
        
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is admin
        if (currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // 3. Get target user ID from request body
        const { userId } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 4. Connect to database
        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // 5. Update target user role to admin
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
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('Promote admin error:', error);
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
