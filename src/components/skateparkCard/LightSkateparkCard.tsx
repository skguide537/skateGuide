'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import { memo } from 'react';
import Image from 'next/image';
import SkateparkModal from '../modals/SkateparkModal';
import FastCarousel from '../ui/FastCarousel';
import DeleteConfirmationDialog from '../modals/DeleteConfirmationDialog';
import FavoriteButton from '../common/FavoriteButton';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import LocationOn from '@mui/icons-material/LocationOn';
import { useLightSkateparkCard } from '@/hooks/useLightSkateparkCard';
import { CardData } from '@/services/card.service';
import { ExternalLink } from '@/types/skatepark';

interface LightSkateparkCardProps {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    coordinates: { lat: number; lng: number };
    isPark: boolean;
    size: string;
    levels: string[];
    avgRating: number;
    distanceKm: number;
    externalLinks: ExternalLink[];
    isDeleting?: boolean;
    onDelete?: (spotId: string) => void;
}

const LightSkateparkCard = memo(function LightSkateparkCard(props: LightSkateparkCardProps) {
    const cardData: CardData = {
        _id: props._id,
        title: props.title,
        description: props.description,
        tags: props.tags,
        photoNames: props.photoNames,
        coordinates: props.coordinates,
        isPark: props.isPark,
        size: props.size,
        levels: props.levels,
        avgRating: props.avgRating,
        distanceKm: props.distanceKm,
        externalLinks: props.externalLinks
    };

    const {
        // State
        modalOpen,
        deleteDialogOpen,
        isDeleting,
        
        // Computed values
        isAdmin,
        typeInfo,
        levelDisplayText,
        imagesToShow,
        truncatedDescription,
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
        getDistanceBadgeStyles
    } = useLightSkateparkCard(cardData, props.onDelete);

    return (
        <>
            <Card 
                onClick={handleCardClick}
                sx={getCardStyles()}
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
                    height: 200, 
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <FastCarousel 
                        images={imagesToShow} 
                        alt={props.title}
                        height={200}
                    />
                    
                    {/* Type Badge - Top Left */}
                    <Box sx={getTypeBadgeStyles()}>
                        {typeInfo.emoji} {typeInfo.label}
                    </Box>

                    {/* Distance Badge - Top Right */}
                    <Box sx={getDistanceBadgeStyles()}>
                        📍 {props.distanceKm.toFixed(1)}km
                    </Box>
                </Box>

                {/* Content Section */}
                <CardContent sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    p: 3,
                    '&:last-child': { pb: 3 }
                }}>
                    {/* Title and Rating Row */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 2
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
                                {ratingText}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Distance Display */}
                    {props.distanceKm !== undefined && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 2,
                            px: 1.5,
                            py: 0.5,
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            alignSelf: 'flex-start'
                        }}>
                            <LocationOn sx={{ 
                                fontSize: '1rem', 
                                color: 'var(--color-accent-blue)' 
                            }} />
                            <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                fontSize: '0.8rem'
                            }}>
                                {distanceText}
                            </Typography>
                        </Box>
                    )}

                    {/* Description */}
                    <Typography 
                        variant="body2" 
                        color="var(--color-text-secondary)"
                        sx={{ 
                            mb: 3, 
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {truncatedDescription}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ mb: 3 }}>
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

                    {/* Bottom Row - Size, Level, and Actions */}
                    <Box sx={{ 
                        mt: 'auto', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                    }}>
                        {/* Size and Level */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
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
                                <Typography variant="caption" sx={{ 
                                    fontWeight: 600,
                                    color: 'var(--color-text-primary)',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem'
                                }}>
                                    {props.size}
                                </Typography>
                            </Box>
                            
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
                                <Typography variant="caption" sx={{ 
                                    fontWeight: 600,
                                    color: 'var(--color-text-primary)',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem'
                                }}>
                                    {levelDisplayText}
                                </Typography>
                            </Box>
                        </Box>

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
                description={props.description}
                photoNames={props.photoNames}
                isPark={props.isPark}
                size={props.size}
                levels={props.levels}
                tags={props.tags}
                coordinates={props.coordinates}
                externalLinks={props.externalLinks}
                distanceKm={props.distanceKm}
            />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onConfirm={handleDelete}
                spot={{
                    _id: props._id,
                    title: props.title,
                    description: props.description,
                    photoNames: props.photoNames,
                    isPark: props.isPark,
                    size: props.size,
                    levels: props.levels,
                    tags: props.tags
                }}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default LightSkateparkCard;
