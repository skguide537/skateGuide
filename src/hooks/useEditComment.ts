import { useState, useCallback } from 'react';
import { commentsClient, CommentDTO } from '@/services/commentsClient';
import { logger } from '@/lib/logger';

export const useEditComment = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editComment = useCallback(async (
    commentId: string,
    newBody: string,
    onSuccess?: (comment: CommentDTO) => void,
    onError?: (error: string) => void
  ) => {
    setIsEditing(true);
    setError(null);

    try {
      const updatedComment = await commentsClient.editComment(commentId, {
        body: newBody.trim()
      });

      logger.info(`Comment ${commentId} edited successfully`, undefined, 'useEditComment');
      
      if (onSuccess) {
        onSuccess(updatedComment);
      }

      return updatedComment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to edit comment';
      logger.error('Failed to edit comment', err, 'useEditComment');
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw err;
    } finally {
      setIsEditing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    editComment,
    isEditing,
    error,
    clearError
  };
};
