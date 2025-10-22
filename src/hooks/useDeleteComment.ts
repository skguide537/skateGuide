import { useState, useCallback } from 'react';
import { commentsClient } from '@/services/commentsClient';
import { logger } from '@/lib/logger';

export const useDeleteComment = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteComment = useCallback(async (
    commentId: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    setIsDeleting(true);
    setError(null);

    try {
      await commentsClient.deleteComment(commentId);

      logger.info(`Comment ${commentId} deleted successfully`, undefined, 'useDeleteComment');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete comment';
      logger.error('Failed to delete comment', err, 'useDeleteComment');
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteComment,
    isDeleting,
    error,
    clearError
  };
};
