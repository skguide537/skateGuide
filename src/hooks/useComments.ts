import { useState, useEffect, useCallback } from 'react';
import { commentsClient, CommentDTO, ListCommentsResponse } from '@/services/commentsClient';
import { logger } from '@/lib/logger';

export interface UseCommentsReturn {
    comments: CommentDTO[];
    total: number;
    page: number;
    limit: number;
    isLoading: boolean;
    error: string | null;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    hasMore: boolean;
}

export function useComments(skateparkId: string): UseCommentsReturn {
    const [comments, setComments] = useState<CommentDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasMore = comments.length < total;

    const fetchComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!skateparkId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response: ListCommentsResponse = await commentsClient.listComments(
                skateparkId, 
                pageNum, 
                limit
            );

            if (append) {
                setComments(prev => [...prev, ...response.items]);
            } else {
                setComments(response.items);
            }
            
            setTotal(response.total);
            setPage(response.page);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
            setError(errorMessage);
            logger.error('Failed to fetch comments', err, 'useComments');
        } finally {
            setIsLoading(false);
        }
    }, [skateparkId, limit]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoading) return;
        await fetchComments(page + 1, true);
    }, [fetchComments, page, hasMore, isLoading]);

    const refresh = useCallback(async () => {
        await fetchComments(1, false);
    }, [fetchComments]);

    // Initial load
    useEffect(() => {
        fetchComments(1, false);
    }, [fetchComments]);

    return {
        comments,
        total,
        page,
        limit,
        isLoading,
        error,
        loadMore,
        refresh,
        hasMore
    };
}
