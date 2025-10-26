import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { userService } from '@/services/user.service';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// PATCH /api/users/[id]/bio - Update bio and social links (owner only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is owner
        if (currentUser._id.toString() !== params.id) {
            return NextResponse.json({ error: 'Forbidden - Only owner can update bio' }, { status: 403 });
        }

        // 3. Get and validate request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        
        const updates: any = {};
        if (body.bio !== undefined) updates.bio = body.bio;
        if (body.instagram !== undefined) updates.instagram = body.instagram;
        if (body.tiktok !== undefined) updates.tiktok = body.tiktok;
        if (body.youtube !== undefined) updates.youtube = body.youtube;
        if (body.website !== undefined) updates.website = body.website;

        // 4. Update bio and socials
        const updatedProfile = await userService.updateBioAndSocials(params.id, updates);
        
        return NextResponse.json(updatedProfile);
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

