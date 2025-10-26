import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// GET /api/users/[id]/spots - Get user's spots (paginated, public)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
            return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
        }
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Validate pagination params
        if (isNaN(page) || page < 1) {
            throw new BadRequestError('Invalid page number');
        }
        if (isNaN(limit) || limit < 1 || limit > 50) {
            throw new BadRequestError('Invalid limit (must be between 1 and 50)');
        }

        const result = await userService.getUserSpots(params.id, page, limit);
        return NextResponse.json(result);
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error instanceof BadRequestError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

