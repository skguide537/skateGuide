'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Avatar,
    Chip,
    CircularProgress
} from '@mui/material';
import { Warning, Delete, Cancel } from '@mui/icons-material';
import { useTheme } from '@/context/ThemeContext';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    spot: {
        _id: string;
        title: string;
        description: string;
        photoNames: string[];
        isPark: boolean;
        size: string;
        levels: string[];
        tags: string[];
    } | null;
    isDeleting: boolean;
}

export default function DeleteConfirmationDialog({
    open,
    onClose,
    onConfirm,
    spot,
    isDeleting
}: DeleteConfirmationDialogProps) {
    const { theme } = useTheme();
    
    if (!spot) return null;

    const hasPhotos = spot.photoNames && spot.photoNames.length > 0;
    const thumbnailUrl = hasPhotos 
        ? spot.photoNames[0] 
        : "https://res.cloudinary.com/dcncqacrd/image/upload/v1747566727/skateparks/default-skatepark.png";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-border)',
                    background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, var(--color-error) 0%, var(--color-accent-rust) 100%)',
                    }
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'var(--color-error)',
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                position: 'relative',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, var(--color-error) 50%, transparent 100%)',
                }
            }}>
                <Warning sx={{ fontSize: 28, color: 'var(--color-error)' }} />
                <Typography variant="h6" component="span" fontWeight="bold">
                    Delete Skate Spot
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                        Are you sure you want to delete <strong>&quot;{spot.title}&quot;</strong>? 
                        This action cannot be undone.
                    </Typography>
                </Box>

                {/* Spot Preview */}
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 3, 
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    mb: 3
                }}>
                    {/* Thumbnail */}
                    <Avatar
                        src={thumbnailUrl}
                        variant="rounded"
                        sx={{ 
                            width: 80, 
                            height: 80,
                            borderRadius: 'var(--radius-md)',
                            border: '2px solid var(--color-border)'
                        }}
                    />
                    
                    {/* Spot Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, color: 'var(--color-text-primary)' }}>
                            {spot.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                            <Chip 
                                label={spot.isPark ? 'Park' : 'Street'} 
                                size="small" 
                                sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 24,
                                    backgroundColor: spot.isPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
                                    color: 'var(--color-surface-elevated)',
                                    fontWeight: 600
                                }}
                            />
                            <Chip 
                                label={spot.size} 
                                size="small"
                                sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 24,
                                    backgroundColor: 'var(--color-accent-blue)',
                                    color: 'var(--color-surface-elevated)',
                                    fontWeight: 600
                                }}
                            />
                            <Chip 
                                label={spot.levels && spot.levels.length > 0 && spot.levels.some(level => level !== null && level !== undefined) ? 
                                    spot.levels.filter(level => level !== null && level !== undefined).join(', ') : 'Unknown'} 
                                size="small"
                                sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 24,
                                    backgroundColor: 'var(--color-accent-rust)',
                                    color: 'var(--color-surface-elevated)',
                                    fontWeight: 600
                                }}
                            />
                        </Box>
                        
                        {spot.tags.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {spot.tags.slice(0, 3).map((tag, index) => (
                                    <Chip 
                                        key={index} 
                                        label={tag} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ 
                                            fontSize: '0.6rem', 
                                            height: 20,
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-secondary)'
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box sx={{ 
                    p: 2.5, 
                    backgroundColor: 'rgba(255, 107, 53, 0.1)', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--color-accent-rust)',
                    mb: 2
                }}>
                    <Typography variant="body2" sx={{ 
                        color: 'var(--color-accent-rust)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        fontWeight: 500,
                        lineHeight: 1.5
                    }}>
                        <Warning sx={{ fontSize: '1.1rem' }} />
                        This will permanently remove the spot and all associated photos from Cloudinary.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ 
                p: 3, 
                pt: 1, 
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)'
            }}>
                <Button
                    onClick={onClose}
                    disabled={isDeleting}
                    variant="outlined"
                    startIcon={<Cancel />}
                    sx={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                        '&:hover': {
                            borderColor: 'var(--color-accent-blue)',
                            backgroundColor: 'rgba(93, 173, 226, 0.1)',
                            transform: 'translateY(-1px)',
                        },
                        '&:disabled': {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            opacity: 0.5
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    variant="contained"
                    startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
                    sx={{
                        backgroundColor: 'var(--color-error)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: 'var(--color-error)',
                            transform: 'translateY(-1px)',
                            boxShadow: 'var(--shadow-lg)',
                        },
                        '&:disabled': {
                            backgroundColor: 'var(--color-border)',
                            transform: 'none',
                            boxShadow: 'none'
                        }
                    }}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Spot'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
