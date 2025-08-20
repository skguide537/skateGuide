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
import { Warning } from '@mui/icons-material';

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
        level: string;
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
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#d32f2f'
            }}>
                <Warning color="error" />
                <Typography variant="h6" component="span" fontWeight="bold">
                    Delete Skate Spot
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, color: '#2F2F2F' }}>
                        Are you sure you want to delete <strong>"{spot.title}"</strong>? 
                        This action cannot be undone.
                    </Typography>
                </Box>

                {/* Spot Preview */}
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 2, 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e9ecef'
                }}>
                    {/* Thumbnail */}
                    <Avatar
                        src={thumbnailUrl}
                        variant="rounded"
                        sx={{ 
                            width: 80, 
                            height: 80,
                            borderRadius: 2
                        }}
                    />
                    
                    {/* Spot Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#2F2F2F' }}>
                            {spot.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip 
                                label={spot.isPark ? 'Park' : 'Street'} 
                                size="small" 
                                color={spot.isPark ? 'success' : 'warning'}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip 
                                label={spot.size} 
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip 
                                label={spot.level} 
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 20 }}
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
                                        sx={{ fontSize: '0.6rem', height: 18 }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
                    <Typography variant="body2" sx={{ color: '#856404', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning sx={{ fontSize: '1rem' }} />
                        This will permanently remove the spot and all associated photos from Cloudinary.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                    onClick={onClose}
                    disabled={isDeleting}
                    variant="outlined"
                    sx={{
                        borderColor: '#A7A9AC',
                        color: '#A7A9AC',
                        '&:hover': {
                            borderColor: '#8A8A8A',
                            backgroundColor: 'rgba(167, 169, 172, 0.1)'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    variant="contained"
                    color="error"
                    startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        backgroundColor: '#d32f2f',
                        '&:hover': {
                            backgroundColor: '#c62828'
                        },
                        '&:disabled': {
                            backgroundColor: '#6c757d'
                        }
                    }}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Spot'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
