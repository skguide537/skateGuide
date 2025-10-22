import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { BadRequestError } from '@/types/error-models';

// GET /api/comments - List comments for a skatepark
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const skateparkId = searchParams.get('skateparkId');
        const page = searchParams.get('page');
        const limit = searchParams.get('limit');

        if (!skateparkId) {
            return NextResponse.json(
                { error: 'skateparkId is required' },
                { status: 400 }
            );
        }

        // Get current user (optional - for permissions)
        let currentUser = null;
        try {
            currentUser = await getUserFromRequest(request);
        } catch (error) {
            // User not authenticated - that's fine for public comments
            currentUser = null;
        }

        const comments = await commentService.listComments({
            skateparkId,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            currentUser: currentUser ? { _id: currentUser._id.toString(), role: currentUser.role } : undefined,
        });

        return NextResponse.json(comments);
    } catch (error: any) {
        console.error('GET /api/comments error:', error);
        if (error instanceof BadRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { skateparkId, commentBody } = body;

        if (!skateparkId) {
            return NextResponse.json(
                { error: 'skateparkId is required' },
                { status: 400 }
            );
        }

        if (!commentBody) {
            return NextResponse.json(
                { error: 'commentBody is required' },
                { status: 400 }
            );
        }

        const comment = await commentService.createComment({
            skateparkId,
            userId: user._id.toString(),
            body: commentBody
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/comments error:', error);
        
        if (error instanceof BadRequestError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
}
