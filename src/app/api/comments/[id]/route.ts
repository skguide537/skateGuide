import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { BadRequestError, NotFoundError } from '@/types/error-models';

// PATCH /api/comments/[id] - Edit a comment
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = params;
        const body = await request.json();
        const { commentBody } = body;

        if (!commentBody) {
            return NextResponse.json(
                { error: 'commentBody is required' },
                { status: 400 }
            );
        }

        const comment = await commentService.editComment({
            id,
            userId: user._id.toString(),
            body: commentBody
        });

        return NextResponse.json(comment);
    } catch (error: any) {
        console.error('PATCH /api/comments/[id] error:', error);
        
        if (error instanceof BadRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        
        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to edit comment' },
            { status: 500 }
        );
    }
}

// DELETE /api/comments/[id] - Delete a comment (soft delete by default, hard delete for admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = params;
        const isAdmin = user.role === 'admin';

        const result = await commentService.deleteComment({
            id,
            userId: user._id.toString(),
            isAdmin
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('DELETE /api/comments/[id] error:', error);
        
        if (error instanceof BadRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        
        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
