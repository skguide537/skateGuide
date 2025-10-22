/**
 * Frontend API client for comments-related operations
 * Replaces direct fetch calls with centralized API methods
 */

import { logger } from '@/lib/logger';

export interface CommentDTO {
    id: string;
    skateparkId: string;
    userId: string;
    userName: string;
    userPhotoUrl: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    editedAt?: string;
    canEdit: boolean;
    canDelete: boolean;
}

export interface ListCommentsResponse {
    items: CommentDTO[];
    page: number;
    limit: number;
    total: number;
}

export interface CreateCommentRequest {
    skateparkId: string;
    body: string;
}

export interface EditCommentRequest {
    body: string;
}

export interface DeleteCommentResponse {
    success: boolean;
    message: string;
}

/**
 * Comments API client for frontend operations
 */
class CommentsClient {
    private baseUrl = '/api/comments';

    /**
     * List comments for a skatepark with pagination
     */
    async listComments(skateparkId: string, page: number = 1, limit: number = 20): Promise<ListCommentsResponse> {
        const url = `${this.baseUrl}?skateparkId=${skateparkId}&page=${page}&limit=${limit}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            logger.error('Failed to list comments', error, 'CommentsClient');
            throw error;
        }
    }

    /**
     * Create a new comment
     */
    async createComment(request: CreateCommentRequest): Promise<CommentDTO> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    skateparkId: request.skateparkId,
                    commentBody: request.body
                }),
                credentials: 'include', // Send cookies with request
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Failed to create comment: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            logger.error('Failed to create comment', error, 'CommentsClient');
            throw error;
        }
    }

    /**
     * Edit a comment (owner only)
     */
    async editComment(id: string, request: EditCommentRequest): Promise<CommentDTO> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    commentBody: request.body
                }),
                credentials: 'include', // Send cookies with request
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Failed to edit comment: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            logger.error('Failed to edit comment', error, 'CommentsClient');
            throw error;
        }
    }

    /**
     * Delete a comment (owner or admin)
     */
    async deleteComment(id: string): Promise<DeleteCommentResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
                credentials: 'include', // Send cookies with request
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Failed to delete comment: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            logger.error('Failed to delete comment', error, 'CommentsClient');
            throw error;
        }
    }
}

// Export singleton instance
export const commentsClient = new CommentsClient();
