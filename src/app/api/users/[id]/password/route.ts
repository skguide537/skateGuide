import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { userService } from '@/services/user.service';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// PATCH /api/users/[id]/password - Change password (owner only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is owner
        if (currentUser._id.toString() !== params.id) {
            return NextResponse.json({ error: 'Forbidden - Only owner can change password' }, { status: 403 });
        }

        // 3. Get and validate request body
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        // 4. Update password
        await userService.updatePassword(params.id, currentPassword, newPassword);
        
        return NextResponse.json({ success: true, message: 'Password updated successfully' });
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

