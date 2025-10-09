import { getUserFromRequest } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user from JWT token in cookie
        const currentUser = await getUserFromRequest(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is admin
        if (currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // 3. Connect to database
        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // 4. Delete the target user
        await User.findByIdAndDelete(params.id);
        
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
    }
}


