// Simple in-memory cache for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; keys: string[]; hitRate?: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Check if a key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Extend TTL for frequently accessed items
  touch(key: string, newTTL?: number): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    item.timestamp = Date.now();
    if (newTTL) item.ttl = newTTL;
    
    return true;
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// Cache key generators
export const cacheKeys = {
  allSkateparks: () => 'skateparks:all',
  paginatedSkateparks: (page: number, limit: number) => `skateparks:paginated:${page}:${limit}`,
  skateparkById: (id: string) => `skatepark:${id}`,
  skateparksByTag: (tags: string[]) => `skateparks:tags:${tags.sort().join(',')}`,
  nearLocation: (lat: number, lng: number, radius: number) => `skateparks:near:${lat}:${lng}:${radius}`,
  topRated: (limit?: number) => `skateparks:toprated:${limit || 'all'}`,
  recent: (limit: number) => `skateparks:recent:${limit}`,
  totalCount: () => 'skateparks:count',
};

// Auto cleanup every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}
