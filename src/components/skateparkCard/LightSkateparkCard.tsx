'use client';

// Lightweight version of SkateparkCard without heavy Carousel
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import { useState, memo } from 'react';
import Image from 'next/image';
import SkateparkModal from '../modals/SkateparkModal';
import FastCarousel from '../ui/FastCarousel';
import { useUser } from '@/context/UserContext';
import DeleteConfirmationDialog from '../modals/DeleteConfirmationDialog';
import FavoriteButton from '../common/FavoriteButton';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import LocationOn from '@mui/icons-material/LocationOn';

interface LightSkateparkCardProps {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    coordinates: { lat: number; lng: number };
    isPark: boolean;
    size: string;
    level: string;
    avgRating: number;
    distanceKm: number;
    externalLinks: any[];
    isDeleting?: boolean;
    onDelete?: (spotId: string) => void;
}

const LightSkateparkCard = memo(function LightSkateparkCard({
    _id,
    title,
    description,
    tags,
    photoNames,
    coordinates,
    isPark,
    size,
    level,
    avgRating,
    distanceKm,
    externalLinks,
    isDeleting,
    onDelete
}: LightSkateparkCardProps) {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { user } = useUser();
    const isAdmin = user?.role === 'admin';

    const formatSrc = (src: string) => {
        if (src.startsWith('http')) return src;
        return `/${src}`;
    };

    const hasPhotos = photoNames && photoNames.length > 0;
    const imagesToShow = hasPhotos ? photoNames : ["https://res.cloudinary.com/dcncqacrd/image/upload/v1747566727/skateparks/default-skatepark.png"];

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Card 
                onClick={() => !isDeleting && setOpen(true)}
                sx={{ 
                    width: 345,
                    height: 420,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-md)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)',
                    transition: 'all var(--transition-fast)',
                    opacity: isDeleting ? 0.5 : 1,
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    '&:hover': {
                        transform: isDeleting ? 'none' : 'translateY(-4px)',
                        boxShadow: isDeleting ? 'var(--shadow-md)' : 'var(--shadow-xl)',
                        backgroundColor: isDeleting ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
                    },
                    '&:active': {
                        transform: isDeleting ? 'none' : 'translateY(-2px)',
                    }
                }}
            >
                {/* Admin Delete Button */}
                {user?.role === 'admin' && (
                  <IconButton
                    onClick={handleDelete}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(220, 53, 69, 0.9)',
                      color: 'white',
                      width: 32,
                      height: 32,
                      zIndex: 10,
                      '&:hover': {
                        backgroundColor: 'var(--color-error)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all var(--transition-fast)',
                    }}
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
                    alt={title}
                    formatSrc={formatSrc}
                    height={200}
                    showArrows={false}
                    showDots={true}
                    autoPlay={false}
                />
                    
                    {/* Type Badge - Top Left */}
                    <Box sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: isPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
                        color: 'var(--color-surface-elevated)',
                        px: 2,
                        py: 0.5,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        {isPark ? '🏞️ Park' : '🛣️ Street'}
                    </Box>

                    {/* Distance Badge - Top Right */}
                    <Box sx={{
                        position: 'absolute',
                        top: 8,
                        right: user?.role === 'admin' ? 48 : 8,
                        backgroundColor: 'rgba(52, 152, 219, 0.9)',
                        color: 'var(--color-surface-elevated)',
                        px: 2,
                        py: 0.5,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        📍 {distanceKm.toFixed(1)}km
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
                        {title}
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
                                {avgRating.toFixed(1)}
                        </Typography>
                        </Box>
                    </Box>

                    {/* Distance Display */}
                    {distanceKm !== undefined && (
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
                                {distanceKm.toFixed(1)}km away
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
                        {description || 'No description available'}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {tags.slice(0, 3).map((tag, index) => (
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
                            {tags.length > 3 && (
                                <Chip
                                    label={`+${tags.length - 3}`}
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
                                    {size}
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
                                    {level}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Favorite Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                          <FavoriteButton 
                            spotId={_id} 
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
                _id={_id}
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                description={description}
                photoNames={photoNames}
                isPark={isPark}
                size={size}
                level={level}
                tags={tags}
                coordinates={coordinates}
                externalLinks={externalLinks}
                distanceKm={distanceKm}
            />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={() => {
                    if (onDelete) {
                        onDelete(_id);
                    }
                    setDeleteDialogOpen(false);
                }}
                spot={{
                    _id,
                    title,
                    description,
                    photoNames,
                    isPark,
                    size,
                    level,
                    tags
                }}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default LightSkateparkCard;
