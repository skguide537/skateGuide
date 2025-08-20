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
        
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        if (onDelete) {
            onDelete(_id);
        }
    };

    return (
        <>
            <Card
                onClick={() => !isDeleting && setOpen(true)}
                sx={{
                    width: 345,
                    height: 420,
                    boxShadow: 5,
                    borderRadius: 2,
                    backgroundColor: '#A7A9AC',
                    color: '#2F2F2F',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDeleting ? 0.6 : 1,
                    position: 'relative',
                    '&:hover': {
                        transform: isDeleting ? 'none' : 'translateY(-6px)',
                        boxShadow: isDeleting ? 5 : 12,
                        backgroundColor: isDeleting ? '#A7A9AC' : '#B8B9BC',
                    },
                    '&:active': {
                        transform: isDeleting ? 'none' : 'translateY(-2px)',
                        boxShadow: isDeleting ? 5 : 8,
                    }
                }}
            >
                {/* Admin Delete Button - Top Right */}
                {isAdmin && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 10,
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            sx={{
                                minWidth: 32,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                borderColor: '#dc3545',
                                color: '#dc3545',
                                p: 0,
                                '&:hover': {
                                    borderColor: '#c82333',
                                    backgroundColor: '#c82333',
                                    color: '#fff'
                                },
                                '&:disabled': {
                                    borderColor: '#6c757d',
                                    color: '#6c757d'
                                }
                            }}
                        >
                            ✕
                        </Button>
                    </Box>
                )}

                {/* Fast custom carousel - much lighter than react-material-ui-carousel */}
                <FastCarousel 
                    images={imagesToShow} 
                    alt={title}
                    height={200}
                />

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1.1rem' }}>
                        {title}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Rating value={avgRating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                            ({avgRating.toFixed(1)})
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                        <Chip label={isPark ? 'Park' : 'Street'} size="small" color={isPark ? 'success' : 'warning'} />
                        <Chip label={size} size="small" />
                        <Chip label={level} size="small" />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Distance: {distanceKm.toFixed(1)} km
                    </Typography>

                    {/* Click hint - subtle indication that card is clickable */}
                    <Box sx={{ 
                        mt: 'auto', 
                        textAlign: 'center',
                        py: 1,
                        color: 'rgba(47, 47, 47, 0.7)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                    }}>
                        {isDeleting ? 'Deleting...' : 'Click to view details'}
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
            />
        </>
    );
});

export default LightSkateparkCard;
