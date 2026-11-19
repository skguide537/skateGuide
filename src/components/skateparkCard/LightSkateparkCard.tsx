'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { memo } from 'react';
import SkateparkModal from '../modals/SkateparkModal';
import FastCarousel from '../ui/FastCarousel';
import DeleteConfirmationDialog from '../modals/DeleteConfirmationDialog';
import FavoriteButton from '../common/FavoriteButton';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import { useLightSkateparkCard } from '@/hooks/useLightSkateparkCard';
import { CardData } from '@/services/card.service';
import { CardSpot, ExternalLink } from '@/types/skatepark';

interface LightSkateparkCardProps extends CardSpot {
    coordinates?: { lat: number; lng: number };
    levels?: string[];
    externalLinks?: ExternalLink[];
    isDeleting?: boolean;
    onDelete?: (spotId: string) => void;
    createdBy?: string | { _id: string; name: string; photoUrl?: string; role?: string; };
}

const LightSkateparkCard = memo(function LightSkateparkCard(props: LightSkateparkCardProps) {
    const cardData: CardData = {
        _id: props._id,
        title: props.title,
        description: props.description,
        tags: props.tags,
        photoNames: props.photoNames,
        isPark: props.isPark,
        size: props.size,
        avgRating: props.avgRating,
        distanceKm: props.distanceKm,
        location: props.location ?? (props.coordinates
            ? { type: 'Point', coordinates: [props.coordinates.lng, props.coordinates.lat] as [number, number] }
            : undefined)
    };

    const {
        // State
        modalOpen,
        deleteDialogOpen,
        isDeleting,
        
        // Computed values
        isAdmin,
        typeInfo,
        imagesToShow,
        tagsInfo,
        distanceText,
        ratingText,
        
        // Actions
        openModal,
        closeModal,
        openDeleteDialog,
        closeDeleteDialog,
        handleDelete,
        handleCardClick,
        formatImageSrc,
        
        // Style getters
        getCardStyles,
        getDeleteButtonStyles,
        getTypeBadgeStyles,
        getDistanceBadgeStyles,
        accessibilityLabel,
        tooltipText
    } = useLightSkateparkCard(cardData, props.onDelete);

    const ratingDisplay = ratingText === '0.0' ? 'New' : ratingText;

    return (
        <>
            <Card 
                onClick={handleCardClick}
                sx={getCardStyles()}
                title={tooltipText}
                aria-label={accessibilityLabel}
            >
                {/* Admin Delete Button */}
                {isAdmin && (
                    <IconButton
                        onClick={openDeleteDialog}
                        sx={getDeleteButtonStyles()}
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}

                {/* Image Section */}
                <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <FastCarousel 
                        images={imagesToShow.slice(0, 3)} 
                        alt={props.title ?? 'Skate spot'}
                        height="100%"
                    />
                    
                    {/* Type Badge - Top Left */}
                    <Box sx={getTypeBadgeStyles()}>
                        {typeInfo.emoji} {typeInfo.label}
                    </Box>

                    {/* Distance Badge - Top Right */}
                    {distanceText && (
                        <Box sx={getDistanceBadgeStyles()}>
                            📍 {distanceText}
                        </Box>
                    )}
                </Box>

                {/* Content Section */}
                <CardContent sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    p: 2.25,
                    '&:last-child': { pb: 2.25 }
                }}>
                    {/* Title and Rating Row */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 1.5
                    }}>
                        <Typography 
                            variant="h6" 
                            component="h3" 
                            sx={{ 
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                lineHeight: 1.2,
                                flex: 1,
                                mr: 2
                            }}
                        >
                            {props.title}
                        </Typography>

                        {/* Rating Display */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            backgroundColor: 'var(--color-surface)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <Star sx={{ 
                                fontSize: '1rem', 
                                color: 'var(--color-accent-rust)' 
                            }} />
                            <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                {ratingDisplay}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Tags */}
                    {(tagsInfo.displayTags.length > 0 || tagsInfo.hasMore) && (
                        <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {tagsInfo.displayTags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'var(--color-accent-blue)',
                                            color: 'var(--color-surface-elevated)',
                                            fontWeight: 500,
                                            fontSize: '0.7rem',
                                            height: 24,
                                            '& .MuiChip-label': {
                                                px: 1,
                                            }
                                        }}
                                    />
                                ))}
                                {tagsInfo.hasMore && (
                                    <Chip
                                        label={`+${tagsInfo.moreCount}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'var(--color-surface)',
                                            color: 'var(--color-text-secondary)',
                                            fontWeight: 500,
                                            fontSize: '0.7rem',
                                            height: 24,
                                            border: '1px solid var(--color-border)',
                                            '& .MuiChip-label': {
                                                px: 1,
                                            }
                                        }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    )}

                    {/* Bottom Row - Size, Level, and Actions */}
                    <Box sx={{ 
                        mt: 'auto', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                    }}>
                        <Chip
                            label={props.size}
                            size="small"
                            sx={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                fontWeight: 600,
                                textTransform: 'none',
                                border: '1px solid var(--color-border)'
                            }}
                        />

                        {/* Favorite Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                            <FavoriteButton 
                                spotId={props._id} 
                                size="medium" 
                                showCount={true}
                                variant="icon"
                                sx={{
                                    backgroundColor: 'var(--color-surface-elevated)',
                                    border: '1px solid var(--color-border)',
                                    '&:hover': {
                                        backgroundColor: 'var(--color-surface)',
                                        transform: 'scale(1.05)',
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <SkateparkModal
                _id={props._id}
                open={modalOpen}
                onClose={closeModal}
                title={props.title}
                description={props.description ?? ''}
                photoNames={props.photoNames}
                isPark={props.isPark}
                size={props.size}
                levels={props.levels}
                tags={props.tags}
                coordinates={props.coordinates}
                externalLinks={props.externalLinks}
                distanceKm={props.distanceKm}
                createdBy={typeof props.createdBy === 'object' ? props.createdBy : undefined}
            />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onConfirm={handleDelete}
                spot={{
                    _id: props._id,
                    title: props.title,
                    description: props.description ?? '',
                    photoNames: props.photoNames,
                    isPark: props.isPark,
                    size: props.size,
                    levels: props.levels ?? [],
                    tags: props.tags ?? []
                }}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default LightSkateparkCard;
