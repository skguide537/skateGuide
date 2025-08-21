'use client';

import { useState, memo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Image from 'next/image';
import Skeleton from '@mui/material/Skeleton';

// Custom lightweight carousel - no external dependencies
interface FastCarouselProps {
    images: string[];
    alt: string;
    height?: number;
}

// Generate a better blur placeholder - more realistic skatepark-like colors
const generateBlurPlaceholder = (width: number = 400, height: number = 200) => {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Create a realistic skatepark gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#8A8A8A'); // Concrete
            gradient.addColorStop(0.25, '#A7A9AC'); // Asphalt
            gradient.addColorStop(0.5, '#B8B9BC'); // Light concrete
            gradient.addColorStop(0.75, '#6E7763'); // Dark asphalt
            gradient.addColorStop(1, '#8A8A8A'); // Back to concrete
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Add subtle texture patterns
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
                ctx.fillRect(
                    Math.random() * width,
                    Math.random() * height,
                    Math.random() * 15 + 3,
                    Math.random() * 15 + 3
                );
            }
            
            // Add some darker spots for realism
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
                ctx.fillRect(
                    Math.random() * width,
                    Math.random() * height,
                    Math.random() * 10 + 2,
                    Math.random() * 10 + 2
                );
            }
        }
        
        return canvas.toDataURL('image/jpeg', 0.15);
    } catch (error) {
        console.warn('Failed to generate custom placeholder:', error);
        return null;
    }
};

// Fallback blur data URL for when canvas is not available
const fallbackBlurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

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
    const blurDataURL = (typeof window !== 'undefined' ? generateBlurPlaceholder(400, height) : null) || fallbackBlurDataURL;

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
