'use client';

import { useState, memo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Image from 'next/image';

// Custom lightweight carousel - no external dependencies
interface FastCarouselProps {
    images: string[];
    alt: string;
    height?: number;
}

const FastCarousel = memo(function FastCarousel({ 
    images, 
    alt, 
    height = 200 
}: FastCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    if (!images || images.length === 0) return null;
    
    const formatSrc = (src: string) => {
        if (src.startsWith('http')) return src;
        return `/${src}`;
    };

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    };

    const goToSlide = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setCurrentIndex(index);
    };

    // Single image - no navigation needed
    if (images.length === 1) {
        return (
            <Box sx={{ position: 'relative', width: '100%', height }}>
                <Image
                    src={formatSrc(images[0])}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
            {/* Main Image */}
            <Image
                src={formatSrc(images[currentIndex])}
                alt={`${alt} ${currentIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />

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
                    top: 8,
                    right: 8,
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
