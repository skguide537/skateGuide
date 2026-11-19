'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField, 
  Button, 
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Edit, Delete, Check, Close, Skateboarding } from '@mui/icons-material';
import { CommentDTO } from '@/services/commentsClient';
import { useEditComment } from '@/hooks/useEditComment';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { formatRelativeTime } from '@/utils/timeUtils';
import CommentAvatar from './CommentAvatar';

interface CommentItemProps {
  comment: CommentDTO;
  currentUserId?: string;
  isAdmin?: boolean;
  onCommentUpdated: (comment: CommentDTO) => void;
  onCommentDeleted: (commentId: string) => void;
  onError: (error: string) => void;
}

export default function CommentItem({ 
  comment, 
  currentUserId, 
  isAdmin = false,
  onCommentUpdated,
  onCommentDeleted,
  onError 
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { editComment, isEditing: isEditLoading, error: editError } = useEditComment();
  const { deleteComment, isDeleting, error: deleteError } = useDeleteComment();

  const isOwner = currentUserId && comment.userId === currentUserId;
  const canEdit = comment.canEdit;
  const canDelete = comment.canDelete;

  const handleEdit = async () => {
    if (editBody.trim() === comment.body.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      const updatedComment = await editComment(comment.id, editBody);
      onCommentUpdated(updatedComment);
      setIsEditing(false);
    } catch (err: any) {
      onError(err.message || 'Failed to edit comment');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(comment.id);
      onCommentDeleted(comment.id);
    } catch (err: any) {
      onError(err.message || 'Failed to delete comment');
    }
  };

  const handleCancelEdit = () => {
    setEditBody(comment.body);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Box 
      sx={{ 
        mb: 2, 
        p: 2, 
        backgroundColor: 'var(--color-surface)', 
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        '&:hover': {
          backgroundColor: 'var(--color-surface-hover)',
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header with user info and timestamp */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Link 
            href={`/profile/${comment.userId}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => e.stopPropagation()}
          >
            <CommentAvatar 
              photoUrl={comment.userPhotoUrl} 
              userName={comment.userName}
              size={32}
            />
          </Link>
          <Box>
            <Link 
              href={`/profile/${comment.userId}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'var(--color-text-primary)',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {comment.userName}
                </Typography>
                <Tooltip title={comment.userRole === 'admin' ? 'This user is an admin' : 'This is a user'}>
                  <Skateboarding 
                    fontSize="small" 
                    sx={{ 
                      color: comment.userRole === 'admin' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                      fontSize: '16px'
                    }}
                  />
                </Tooltip>
              </Box>
            </Link>
            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
              {formatRelativeTime(comment.createdAt)}
              {comment.editedAt && ' (edited)'}
            </Typography>
          </Box>
        </Box>

        {/* Action buttons - only show on hover */}
        {hovered && (canEdit || canDelete) && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {canEdit && (
              <Tooltip title="Edit comment">
                <IconButton
                  size="small"
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    color: 'var(--color-text-secondary)',
                    '&:hover': { color: 'var(--color-primary)' }
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Delete comment">
                <IconButton
                  size="small"
                  onClick={() => setShowDeleteConfirm(true)}
                  sx={{ 
                    color: 'var(--color-text-secondary)',
                    '&:hover': { color: 'var(--color-error)' }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Comment body */}
      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isEditLoading}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--color-surface-elevated)',
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
              },
            }}
            inputProps={{
              maxLength: 2000,
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={handleCancelEdit}
              disabled={isEditLoading}
              sx={{ color: 'var(--color-text-secondary)' }}
            >
              <Close fontSize="small" sx={{ mr: 0.5 }} />
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleEdit}
              disabled={isEditLoading || editBody.trim().length === 0}
              sx={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
                '&:hover': {
                  backgroundColor: 'var(--color-primary-hover)',
                },
              }}
            >
              {isEditLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <>
                  <Check fontSize="small" sx={{ mr: 0.5 }} />
                  Save
                </>
              )}
            </Button>
          </Box>
          
          <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', mt: 1, display: 'block' }}>
            Press Ctrl+Enter to save, Esc to cancel
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
          {comment.body}
        </Typography>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'var(--color-surface-elevated)', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)'
        }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'var(--color-text-primary)' }}>
            Are you sure you want to delete this comment? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              sx={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
              sx={{
                backgroundColor: 'var(--color-error)',
                color: 'var(--color-text-on-error)',
                '&:hover': {
                  backgroundColor: 'var(--color-error-hover)',
                },
              }}
            >
              {isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                'Delete'
              )}
            </Button>
          </Box>
        </Box>
      )}

      {/* Error messages */}
      {editError && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {editError}
        </Typography>
      )}
      {deleteError && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {deleteError}
        </Typography>
      )}
    </Box>
  );
}
