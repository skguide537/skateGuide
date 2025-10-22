import { connectToDatabase } from '@/lib/mongodb';
import { BadRequestError, NotFoundError } from '@/types/error-models';
import { CommentModel, ICommentModel } from '@/models/comment.model';
import { logger } from '@/lib/logger';

export interface CommentDTO {
    id: string;
    skateparkId: string;
    userId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;
    canEdit: boolean;
    canDelete: boolean;
}

export interface CreateCommentRequest {
    skateparkId: string;
    userId: string;
    body: string;
}

export interface ListCommentsRequest {
    skateparkId: string;
    page?: number;
    limit?: number;
}

export interface ListCommentsResponse {
    items: CommentDTO[];
    page: number;
    limit: number;
    total: number;
}

class CommentService {
    // Helper function to map comment to DTO
    private mapToDTO(comment: ICommentModel, currentUser?: { _id: string; role?: string }): CommentDTO {
        const isOwner = currentUser && comment.userId.toString() === currentUser._id;
        const isAdmin = currentUser?.role === 'admin';
        
        return {
            id: (comment._id as any).toString(),
            skateparkId: comment.skateparkId.toString(),
            userId: comment.userId.toString(),
            body: comment.body,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            editedAt: comment.editedAt,
            canEdit: isOwner || isAdmin,
            canDelete: isOwner || isAdmin
        };
    }

    // Validate ObjectId format
    private isValidObjectId(id: string): boolean {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    // Create a new comment
    public async createComment({ skateparkId, userId, body }: CreateCommentRequest): Promise<CommentDTO> {
        // Validate inputs
        if (!this.isValidObjectId(skateparkId)) {
            throw new BadRequestError('Invalid skatepark ID format');
        }
        if (!this.isValidObjectId(userId)) {
            throw new BadRequestError('Invalid user ID format');
        }
        if (!body || body.trim().length === 0) {
            throw new BadRequestError('Comment body is required');
        }
        if (body.length > 2000) {
            throw new BadRequestError('Comment cannot exceed 2000 characters');
        }

        try {
            await connectToDatabase();
            
            const comment = new CommentModel({
                skateparkId,
                userId,
                body: body.trim()
            });

            await comment.save();
            
            logger.info(`Comment created for skatepark ${skateparkId} by user ${userId}`, undefined, 'CommentService');
            
            return this.mapToDTO(comment);
        } catch (error) {
            logger.error('Failed to create comment', error, 'CommentService');
            throw error;
        }
    }

    // List comments for a skatepark with pagination
    public async listComments({ skateparkId, page = 1, limit = 20 }: ListCommentsRequest): Promise<ListCommentsResponse> {
        // Validate inputs
        if (!this.isValidObjectId(skateparkId)) {
            throw new BadRequestError('Invalid skatepark ID format');
        }
        
        // Clamp limit to max 50
        const clampedLimit = Math.min(Math.max(limit, 1), 50);
        const clampedPage = Math.max(page, 1);
        const skip = (clampedPage - 1) * clampedLimit;

        try {
            await connectToDatabase();
            
            // Get total count
            const total = await CommentModel.countDocuments({ skateparkId });
            
            // Get comments with pagination, sorted by newest first
            const comments = await CommentModel
                .find({ skateparkId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(clampedLimit)
                .populate('userId', 'name')
                .exec();

            const items = comments.map(comment => this.mapToDTO(comment));
            
            return {
                items,
                page: clampedPage,
                limit: clampedLimit,
                total
            };
        } catch (error) {
            logger.error('Failed to list comments', error, 'CommentService');
            throw error;
        }
    }

    // Edit a comment (only owner can edit)
    public async editComment({ id, userId, body }: { 
        id: string; 
        userId: string; 
        body: string; 
    }): Promise<CommentDTO> {
        // Validate inputs
        if (!this.isValidObjectId(id)) {
            throw new BadRequestError('Invalid comment ID format');
        }
        if (!this.isValidObjectId(userId)) {
            throw new BadRequestError('Invalid user ID format');
        }
        if (!body || body.trim().length === 0) {
            throw new BadRequestError('Comment body is required');
        }
        if (body.length > 2000) {
            throw new BadRequestError('Comment cannot exceed 2000 characters');
        }

        try {
            await connectToDatabase();
            
            const comment = await CommentModel.findById(id);
            if (!comment) {
                throw new NotFoundError('Comment not found');
            }

            // Check ownership only (no admin override)
            const isOwner = comment.userId.toString() === userId;
            if (!isOwner) {
                throw new BadRequestError('Not authorized to edit this comment');
            }

            // Update comment
            comment.body = body.trim();
            comment.editedAt = new Date();
            await comment.save();

            logger.info(`Comment ${id} edited by user ${userId}`, undefined, 'CommentService');
            
            return this.mapToDTO(comment, { _id: userId, role: 'user' });
        } catch (error) {
            logger.error('Failed to edit comment', error, 'CommentService');
            throw error;
        }
    }

    // Delete a comment (owner can delete own, admin can delete any)
    public async deleteComment({ id, userId, isAdmin }: { 
        id: string; 
        userId: string; 
        isAdmin?: boolean; 
    }): Promise<{ success: boolean; message: string }> {
        // Validate inputs
        if (!this.isValidObjectId(id)) {
            throw new BadRequestError('Invalid comment ID format');
        }
        if (!this.isValidObjectId(userId)) {
            throw new BadRequestError('Invalid user ID format');
        }

        try {
            await connectToDatabase();
            
            const comment = await CommentModel.findById(id);
            if (!comment) {
                throw new NotFoundError('Comment not found');
            }

            // Check ownership or admin
            const isOwner = comment.userId.toString() === userId;
            if (!isOwner && !isAdmin) {
                throw new BadRequestError('Not authorized to delete this comment');
            }

            
            await CommentModel.findByIdAndDelete(id);

            logger.info(`Comment ${id} deleted by user ${userId} (${isAdmin ? 'admin' : 'owner'})`, undefined, 'CommentService');
            
            return { success: true, message: 'Comment deleted successfully' };
        } catch (error) {
            logger.error('Failed to delete comment', error, 'CommentService');
            throw error;
        }
    }
}

export const commentService = new CommentService();
