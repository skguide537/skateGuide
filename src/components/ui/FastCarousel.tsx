'use client';

import { useState, memo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Image from 'next/image';
import Skeleton from '@mui/material/Skeleton';
import { getImagePlaceholder } from '../../services/placeholder.service';

// Custom lightweight carousel - no external dependencies
interface FastCarouselProps {
    images: string[];
    alt: string;
    height?: number | string;
}


const FastCarousel = memo(function FastCarousel({ 
    images, 
    alt, 
    height = 200 
}: FastCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    if (!images || images.length === 0) return null;
    
    const formatSrc = (src: string) => {
        if (src.startsWith('http')) return src;
        return `/${src}`;
    };

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
        setImageLoading(true); // Reset loading state for new image
        setImageError(false);
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => prev === 0 ? images.length - 1 : 0);
        setImageLoading(true); // Reset loading state for new image
        setImageError(false);
    };

    const goToSlide = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setCurrentIndex(index);
        setImageLoading(true); // Reset loading state for new image
        setImageError(false);
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    // Generate blur placeholder
    const placeholderHeight = typeof height === 'number' ? height : 200;
    const blurDataURL = getImagePlaceholder(400, placeholderHeight);

    // Single image - no navigation needed
    if (images.length === 1) {
        return (
            <Box sx={{ position: 'relative', width: '100%', height }}>
                {/* Loading skeleton */}
                {imageLoading && (
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 1,
                            backgroundColor: 'rgba(167, 169, 172, 0.3)',
                            borderRadius: '8px 8px 0 0'
                        }}
                    />
                )}
                
                <Image
                    src={formatSrc(images[0])}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ 
                        objectFit: 'cover',
                        opacity: imageLoading ? 0 : 1,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                
                {/* Error fallback */}
                {imageError && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#A7A9AC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2F2F2F',
                            fontSize: '0.875rem',
                            borderRadius: '8px 8px 0 0'
                        }}
                    >
                        Image unavailable
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
            {/* Loading skeleton */}
            {imageLoading && (
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        backgroundColor: 'rgba(167, 169, 172, 0.3)',
                        borderRadius: '8px 8px 0 0'
                    }}
                />
                )}
            
            {/* Main Image */}
            <Image
                src={formatSrc(images[currentIndex])}
                alt={`${alt} ${currentIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ 
                    objectFit: 'cover',
                    opacity: imageLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                }}
                loading="lazy"
                placeholder="blur"
                blurDataURL={blurDataURL}
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
            
            {/* Error fallback */}
            {imageError && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#A7A9AC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2F2F2F',
                        fontSize: '0.875rem',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    Image unavailable
                </Box>
            )}

            {/* Navigation Arrows */}
            <IconButton
                onClick={goToPrevious}
                sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                    zIndex: 2,
                }}
                size="small"
            >
                ‹
            </IconButton>

            <IconButton
                onClick={goToNext}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                    zIndex: 2,
                }}
                size="small"
            >
                ›
            </IconButton>

            {/* Dot Indicators */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 2,
                }}
            >
                {images.map((_, index) => (
                    <Box
                        key={index}
                        onClick={(e) => goToSlide(e, index)}
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                                bgcolor: 'white',
                            },
                        }}
                    />
                ))}
            </Box>

            {/* Image Counter */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    zIndex: 2,
                }}
            >
                {currentIndex + 1}/{images.length}
            </Box>
        </Box>
    );
});

export default FastCarousel;
