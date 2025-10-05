import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import User from '@/models/User';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const adminUserId = request.headers.get('x-user-id');
        if (!adminUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const adminUser = await db.collection('users').findOne(
            { _id: new ObjectId(adminUserId) },
            { projection: { role: 1 } }
        );

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        await User.findByIdAndDelete(params.id);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
    }
}


