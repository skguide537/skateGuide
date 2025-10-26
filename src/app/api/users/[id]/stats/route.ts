import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { NotFoundError } from '@/types/error-models';

// GET /api/users/[id]/stats - Get user statistics (public)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
            return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
        }
        
        const stats = await userService.getUserStats(params.id);
        return NextResponse.json(stats);
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

