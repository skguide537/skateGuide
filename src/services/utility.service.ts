// Utility service for common functions used across components

export class UtilityService {
    // Debounce utility function
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    // Format distance for display
    static formatDistance(distance: number): string {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`;
        } else if (distance < 10) {
            return `${distance.toFixed(1)}km away`;
        } else {
            return `${Math.round(distance)}km away`;
        }
    }

    // Format rating for display
    static formatRating(rating: number): string {
        if (rating === 0) return '0.0';
        return rating.toFixed(1);
    }

    // Create a short description from a long one
    static truncateDescription(description: string, maxLength: number = 100): string {
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength).trim() + '...';
    }

    // Generate a unique key for lists
    static generateKey(prefix: string, id: string | number, index?: number): string {
        return `${prefix}-${id}-${index || 0}`;
    }

    // Check if a value is empty or null
    static isEmpty(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    // Deep clone an object (simple implementation)
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime()) as any;
        if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
        if (typeof obj === 'object') {
            const cloned = {} as any;
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    // Capitalize first letter of each word
    static capitalizeWords(str: string): string {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // Convert camelCase to Title Case
    static camelToTitleCase(str: string): string {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    }

    // Format file size
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if device is mobile
    static isMobile(): boolean {
        if (typeof window === 'undefined') return false;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Check if device is touch device
    static isTouchDevice(): boolean {
        if (typeof window === 'undefined') return false;
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Calculate distance between two coordinates in kilometers
    static getDistanceKm(userLat: number, userLng: number, parkLat: number, parkLng: number): number {
        const R = 6371; // Earth's radius in kilometers
        const toRad = (x: number) => (x * Math.PI) / 180;
        const dLat = toRad(parkLat - userLat);
        const dLng = toRad(parkLng - userLng);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(userLat)) * Math.cos(toRad(parkLat)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Generate random ID
    static generateId(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Sleep utility for async operations
    static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry function with exponential backoff
    static async retry<T>(
        fn: () => Promise<T>,
        maxAttempts: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === maxAttempts) {
                    throw lastError;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
            }
        }
        
        throw lastError!;
    }
}
