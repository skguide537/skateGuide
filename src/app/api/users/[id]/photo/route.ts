import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { userService } from '@/services/user.service';
import { convertToUploadedFile } from '@/lib/file-utils';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// PUT /api/users/[id]/photo - Upload profile photo (owner only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is owner
        if (currentUser._id.toString() !== params.id) {
            return NextResponse.json({ error: 'Forbidden - Only owner can update photo' }, { status: 403 });
        }

        // 3. Get file from FormData
        const formData = await request.formData();
        const file = formData.get('photo') as File;

        if (!file) {
            return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // 4. Convert to UploadedFile format and update photo
        const uploadedFile = await convertToUploadedFile(file);
        const result = await userService.updateProfilePhoto(params.id, uploadedFile);
        
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

// DELETE /api/users/[id]/photo - Delete profile photo (owner only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // 2. Check if current user is owner or admin
        if (currentUser._id.toString() !== params.id && currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Only owner or admin can delete photo' }, { status: 403 });
        }

        // 3. Delete photo
        await userService.deleteProfilePhoto(params.id);
        
        return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
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

