import { getUserFromRequest } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// GET /api/users/[id] - Get user profile (public)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
            return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
        }
        
        const profile = await userService.getUserProfile(params.id);
        return NextResponse.json(profile);
    } catch (error: any) {
        if (error instanceof NotFoundError) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user account (owner or admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is owner or admin
        if (currentUser._id.toString() !== params.id && currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Only owner or admin can delete' }, { status: 403 });
        }

        // 3. Delete user account (will anonymize spots and comments)
        await userService.deleteUserAccount(params.id);
        
        return NextResponse.json({ success: true, message: 'User account deleted successfully' });
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


