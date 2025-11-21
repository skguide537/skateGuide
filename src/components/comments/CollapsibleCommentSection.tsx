'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Collapse,
  Divider
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useComments } from '@/hooks/useComments';
import CommentComposer from './CommentComposer';
import CommentItem from './CommentItem';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/useToast';
import { CommentDTO } from '@/services/commentsClient';

interface CollapsibleCommentSectionProps {
  skateparkId: string;
}

const STORAGE_KEY = 'skateGuide-comments-expanded';

export default function CollapsibleCommentSection({ skateparkId }: CollapsibleCommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { comments, total, isLoading: commentsLoading, error: commentsError, refresh } = useComments(skateparkId);
  const { user } = useUser();
  const { showToast } = useToast();

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isExpanded));
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCommentCreated = (comment: CommentDTO) => {
    refresh();
  };

  const handleCommentUpdated = (comment: CommentDTO) => {
    refresh();
  };

  const handleCommentDeleted = (commentId: string) => {
    refresh();
  };

  const handleError = (error: string) => {
    console.error('Comment action error:', error);
    showToast(error, 'error');
  };

  return (
    <Box sx={{ 
      mb: 3,
      backgroundColor: 'var(--color-surface-elevated)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden'
    }}>
      {/* Header with toggle button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        backgroundColor: 'var(--color-surface-elevated)',
        borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none'
      }}>
        <Typography variant="h6" sx={{ color: 'var(--color-text-primary)' }}>
          💬 Comments ({total})
        </Typography>
        <IconButton
          onClick={handleToggle}
          sx={{ 
            color: 'var(--color-text-secondary)',
            '&:hover': {
              color: 'var(--color-primary)',
              backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)'
            }
          }}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Collapsible content */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2 }}>
          {/* Comments List - Scrollable */}
          <Box sx={{ 
            maxHeight: '400px', // Fixed height to prevent modal overflow
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'var(--color-surface-container)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'var(--color-border)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'var(--color-text-secondary)',
            },
          }}>
            {commentsLoading && (
              <Typography sx={{ color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                Loading comments...
              </Typography>
            )}
            
            {commentsError && (
              <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                Error: {commentsError}
              </Typography>
            )}
            
            {comments.length === 0 && !commentsLoading && (
              <Typography sx={{ color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                No comments yet. Be the first to comment!
              </Typography>
            )}
            
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <CommentItem
                  comment={comment}
                  currentUserId={user?._id}
                  isAdmin={user?.role === 'admin'}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                  onError={handleError}
                />
                {index < comments.length - 1 && (
                  <Divider sx={{ my: 1, borderColor: 'var(--color-border)' }} />
                )}
              </React.Fragment>
            ))}
          </Box>

          {/* Comment Composer - At the bottom when expanded */}
          <Box sx={{ mt: 2 }}>
            <CommentComposer 
              skateparkId={skateparkId}
              onCommentCreated={handleCommentCreated}
              onError={handleError}
            />
          </Box>
        </Box>
      </Collapse>

      {/* Collapsed state - show composer only */}
      {!isExpanded && (
        <Box sx={{ p: 2, borderTop: '1px solid var(--color-border)' }}>
          <CommentComposer 
            skateparkId={skateparkId}
            onCommentCreated={handleCommentCreated}
            onError={handleError}
          />
        </Box>
      )}
    </Box>
  );
}
