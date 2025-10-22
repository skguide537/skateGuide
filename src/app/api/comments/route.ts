import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/services/comment.service';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { BadRequestError } from '@/types/error-models';

// GET /api/comments - List comments for a skatepark
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const skateparkId = searchParams.get('skateparkId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!skateparkId) {
            return NextResponse.json(
                { error: 'skateparkId query parameter is required' },
                { status: 400 }
            );
        }

        const result = await commentService.listComments({
            skateparkId,
            page,
            limit
        });

        return NextResponse.json(result);
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
