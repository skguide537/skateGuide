'use client';

import { useState } from 'react';
import Image from 'next/image';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface LQIPImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
    quality?: number;
}

// Generate a skatepark-themed blur placeholder
const generateSkateparkPlaceholder = (width: number = 400, height: number = 200) => {
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

// Fallback blur data URL
const fallbackBlurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

export default function LQIPImage({
    src,
    alt,
    width,
    height,
    fill = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    className,
    style,
    priority = false,
    quality = 75
}: LQIPImageProps) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    const formatSrc = (src: string) => {
        if (src.startsWith('http')) return src;
        return `/${src}`;
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    // Generate custom placeholder or use fallback
    const blurDataURL = generateSkateparkPlaceholder(width || 400, height || 200) || fallbackBlurDataURL;

    return (
        <Box sx={{ position: 'relative', width: fill ? '100%' : width, height: fill ? '100%' : height }}>
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
                        borderRadius: fill ? 0 : 1
                    }}
                />
            )}
            
            {/* Main Image */}
            <Image
                src={formatSrc(src)}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                sizes={sizes}
                className={className}
                style={{
                    ...style,
                    opacity: imageLoading ? 0 : 1,
                    transition: 'opacity 0.4s ease-in-out'
                }}
                loading={priority ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL={blurDataURL}
                quality={quality}
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
                        borderRadius: fill ? 0 : 1,
                        textAlign: 'center',
                        padding: 2
                    }}
                >
                    Image unavailable
                </Box>
            )}
        </Box>
    );
}
