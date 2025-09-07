/**
 * Shared utility for generating skatepark-themed placeholder images
 * Used by FastCarousel and LQIPImage components to avoid code duplication
 */

import { logger } from '@/lib/logger';

// Fallback blur data URL for when canvas is not available
export const FALLBACK_BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

/**
 * Generate a skatepark-themed blur placeholder image
 * Creates a realistic gradient with concrete/asphalt colors and texture patterns
 * 
 * @param width - Width of the placeholder image (default: 400)
 * @param height - Height of the placeholder image (default: 200)
 * @returns Data URL string of the generated placeholder, or null if generation fails
 */
export const generateSkateparkPlaceholder = (width: number = 400, height: number = 200): string | null => {
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
        logger.warn('Failed to generate custom placeholder', error, 'PlaceholderService');
        return null;
    }
};

/**
 * Get a placeholder for images, either generated or fallback
 * 
 * @param width - Width of the placeholder image (default: 400)
 * @param height - Height of the placeholder image (default: 200)
 * @returns Data URL string of the placeholder image
 */
export const getImagePlaceholder = (width: number = 400, height: number = 200): string => {
    return generateSkateparkPlaceholder(width, height) || FALLBACK_BLUR_DATA_URL;
};
