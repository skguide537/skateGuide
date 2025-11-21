'use client';

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Alert 
} from '@mui/material';
import { useTheme } from '@/hooks/useTheme';
import { commentsClient, CommentDTO } from '@/services/commentsClient';

interface CommentComposerProps {
  skateparkId: string;
  onCommentCreated: (comment: CommentDTO) => void;
  onError: (error: string) => void;
}

export default function CommentComposer({ 
  skateparkId, 
  onCommentCreated, 
  onError 
}: CommentComposerProps) {
  const { theme } = useTheme();
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 2000;
  const remainingChars = maxLength - commentBody.length;
  const isDisabled = commentBody.trim().length === 0 || isSubmitting;

  const handleSubmit = async () => {
    if (isDisabled) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newComment = await commentsClient.createComment({
        skateparkId,
        body: commentBody.trim()
      });

      // Clear the form
      setCommentBody('');
      
      // Notify parent component
      onCommentCreated(newComment);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create comment';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: 'var(--color-surface-elevated)', 
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)'
    }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-text-primary)' }}>
        Add a Comment
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={3}
        value={commentBody}
        onChange={(e) => setCommentBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a comment…"
        disabled={isSubmitting}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--color-surface)',
            '& fieldset': {
              borderColor: 'var(--color-border)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--color-border-hover)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--color-primary)',
            },
          },
          '& .MuiInputBase-input': {
            color: 'var(--color-text-primary)',
            '&::placeholder': {
              color: 'var(--color-text-secondary)',
              opacity: 1,
            },
          },
        }}
        inputProps={{
          maxLength: maxLength,
        }}
      />

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography 
          variant="caption" 
          color={remainingChars < 100 ? 'error' : 'text.secondary'}
          sx={{ color: 'var(--color-text-secondary)' }}
        >
          {remainingChars} characters remaining
        </Typography>
        
        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
          Press Ctrl+Enter to submit
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isDisabled}
          sx={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-primary-hover)',
            },
            '&:disabled': {
              backgroundColor: 'var(--color-surface-disabled)',
              color: 'var(--color-text-disabled)',
            },
            minWidth: 120,
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Post Comment'
          )}
        </Button>
      </Box>
    </Box>
  );
}
