import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
  tokensPerInterval: number
}

interface RateLimitResult {
  limit: number
  remaining: number
  reset: number
  success: boolean
}

class RateLimiter {
  private cache: LRUCache<string, number[]>
  private interval: number
  private tokensPerInterval: number

  constructor(options: RateLimitOptions) {
    this.interval = options.interval
    this.tokensPerInterval = options.tokensPerInterval
    
    this.cache = new LRUCache({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval
    })
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.interval
    
    // Get existing requests for this identifier
    const requests = this.cache.get(identifier) || []
    
    // Filter out requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    const remaining = Math.max(0, this.tokensPerInterval - validRequests.length)
    const success = remaining > 0
    
    if (success) {
      // Add current request timestamp
      validRequests.push(now)
      this.cache.set(identifier, validRequests)
    }
    
    // Calculate reset time (next window start)
    const oldestRequest = validRequests[0] || now
    const reset = oldestRequest + this.interval
    
    return {
      limit: this.tokensPerInterval,
      remaining: remaining - (success ? 1 : 0),
      reset: Math.ceil(reset / 1000), // Convert to seconds
      success
    }
  }

  reset(identifier: string): void {
    this.cache.delete(identifier)
  }
}

// Pre-configured rate limiters for different endpoints
export const searchRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique users per minute
  tokensPerInterval: 10 // 10 requests per minute per user
})

export const authRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
  tokensPerInterval: 5 // 5 auth requests per minute per user
})

export const debridRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200,
  tokensPerInterval: 20 // 20 debrid API calls per minute per user
})

export { RateLimiter }
export type { RateLimitOptions, RateLimitResult }