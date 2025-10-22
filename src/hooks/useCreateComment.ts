import { useState, useCallback } from 'react';
import { commentsClient, CommentDTO } from '@/services/commentsClient';
import { logger } from '@/lib/logger';

export const useCreateComment = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useCallback(async (
    skateparkId: string, 
    body: string,
    onSuccess?: (comment: CommentDTO) => void,
    onError?: (error: string) => void
  ) => {
    setIsCreating(true);
    setError(null);

    try {
      const newComment = await commentsClient.createComment({
        skateparkId,
        body: body.trim()
      });

      logger.info(`Comment created successfully for skatepark ${skateparkId}`, undefined, 'useCreateComment');
      
      if (onSuccess) {
        onSuccess(newComment);
      }

      return newComment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create comment';
      logger.error('Failed to create comment', err, 'useCreateComment');
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createComment,
    isCreating,
    error,
    clearError
  };
};
