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

import { generatePlaceholder, FALLBACK_BLUR_DATA_URL } from '@/utils/placeholder';

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
    const blurDataURL = generatePlaceholder(width || 400, height || 200) || FALLBACK_BLUR_DATA_URL;

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
