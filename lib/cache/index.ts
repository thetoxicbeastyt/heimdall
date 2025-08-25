import { LRUCache } from 'lru-cache'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  max?: number // Maximum number of items
  updateAgeOnGet?: boolean
}

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: LRUCache<string, CacheItem<any>>

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 1000,
      ttl: options.ttl || 5 * 60 * 1000, // Default 5 minutes
      updateAgeOnGet: options.updateAgeOnGet || true,
      allowStale: false
    })
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000
    }
    this.cache.set(key, item)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if item has expired
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    // Check if item has expired
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl,
      calculatedSize: this.cache.calculatedSize
    }
  }
}

// Create global cache instances
export const searchCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  max: 500,
  updateAgeOnGet: true
})

export const debridCache = new MemoryCache({
  ttl: 60 * 1000, // 1 minute for debrid API responses
  max: 200,
  updateAgeOnGet: false
})

export const userCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes for user data
  max: 100,
  updateAgeOnGet: true
});

export const streamCache = new MemoryCache({
  ttl: 2 * 60 * 60 * 1000, // 2 hours
  max: 100,
  updateAgeOnGet: false
});

// Utility functions for cache key generation
export const generateCacheKey = {
  search: (query: string, filters: Record<string, any>, userId?: string) => {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')
    return `search:${query.toLowerCase().trim()}:${filterStr}:${userId || 'anon'}`
  },
  
  debridAccount: (userId: string, provider: string) => {
    return `debrid:${userId}:${provider}`
  },
  
  instantAvailability: (hashes: string[], provider: string) => {
    const hashStr = hashes.sort().join(',')
    return `instant:${provider}:${hashStr}`
  },
  
  user: (userId: string) => {
    return `user:${userId}`
  },

  stream: (id: string, fileIndex: number, provider: string) => {
    return `stream:${provider}:${id}:${fileIndex}`
  }
}

export { MemoryCache }
export type { CacheOptions, CacheItem }