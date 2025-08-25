import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthentication, createRateLimitIdentifier } from '@/lib/auth'
import { searchRateLimiter } from '@/lib/rate-limiter'
import { searchCache, generateCacheKey } from '@/lib/cache'
import { serverDbService } from '@/lib/supabase/client'
import { debridManager } from '@/lib/debrid'
import type { DebridProvider, ProviderName, SearchResult as DebridSearchResult, UserDebridAccount } from '@/lib/debrid/types'

// Request validation schema
const SearchRequestSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(100, 'Query too long')
    .trim(),
  filters: z.object({
    quality: z.enum(['any', '4K', '2160p', '1080p', '720p', '480p']).optional().default('any'),
    provider: z.enum(['all', 'real-debrid', 'alldebrid', 'premiumize']).optional().default('all'),
    category: z.enum(['all', 'movies', 'tv', 'music', 'games', 'software', 'other']).optional().default('all')
  }).optional().default({}),
  page: z.number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(100, 'Page cannot exceed 100')
    .optional()
    .default(1),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .optional()
    .default(20)
})

type SearchRequest = z.infer<typeof SearchRequestSchema>

// Response types
interface SearchResponse {
  success: boolean
  data?: SearchResultItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  cached?: boolean
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    searchTime: number
    providers: string[]
    cached: boolean
  }
}

interface SearchResultItem {
  id: string
  title: string
  year?: number
  quality?: string
  size: string
  sizeBytes: number
  seeders: number
  leechers: number
  provider: string
  category: string
  magnetLink: string
  hash: string
  isInstantAvailable: boolean
  files?: Array<{
    name: string
    size: number
    sizeFormatted: string
  }>
  metadata?: {
    resolution?: string
    codec?: string
    audio?: string
    source?: string
    releaseGroup?: string
  }
}

// Helper function to map debrid results to API format
function mapDebridResultToAPI(result: DebridSearchResult): SearchResultItem {
  return {
    id: result.id,
    title: result.title,
    year: extractYear(result.title),
    quality: result.quality,
    size: result.sizeFormatted,
    sizeBytes: result.size,
    seeders: result.seeders,
    leechers: result.leechers,
    provider: result.provider,
    category: result.category,
    magnetLink: result.magnetLink,
    hash: result.hash,
    isInstantAvailable: result.isInstantAvailable,
    files: result.files?.map(file => ({
      name: file.path,
      size: file.size,
      sizeFormatted: formatBytes(file.size)
    })),
    metadata: {
      resolution: extractResolution(result.title),
      codec: extractCodec(result.title),
      audio: extractAudio(result.title),
      source: extractSource(result.title),
      releaseGroup: extractReleaseGroup(result.title)
    }
  }
}

// Utility functions for metadata extraction
function extractYear(title: string): number | undefined {
  const yearMatch = title.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? parseInt(yearMatch[0]) : undefined
}

function extractResolution(title: string): string | undefined {
  const resolutionMatch = title.match(/\b(2160p|1080p|720p|480p|4K|UHD)\b/i)
  return resolutionMatch ? resolutionMatch[0] : undefined
}

function extractCodec(title: string): string | undefined {
  const codecMatch = title.match(/\b(x264|x265|H\.?264|H\.?265|HEVC|AVC|XviD|DivX)\b/i)
  return codecMatch ? codecMatch[0] : undefined
}

function extractAudio(title: string): string | undefined {
  const audioMatch = title.match(/\b(DTS|AC3|AAC|MP3|FLAC|TrueHD|Atmos|DD|EAC3)\b/i)
  return audioMatch ? audioMatch[0] : undefined
}

function extractSource(title: string): string | undefined {
  const sourceMatch = title.match(/\b(BluRay|BDRip|WEB-DL|WEBRip|HDTV|DVDRip|CAM|TS|TC)\b/i)
  return sourceMatch ? sourceMatch[0] : undefined
}

function extractReleaseGroup(title: string): string | undefined {
  const groupMatch = title.match(/-([A-Za-z0-9_]+)$/)
  return groupMatch ? groupMatch[1] : undefined
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Parse and validate request body
    let requestBody: SearchRequest
    try {
      const body = await request.json()
      requestBody = SearchRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid JSON in request body'
        }
      }, { status: 400 })
    }

    // Authenticate user
    let user
    try {
      user = await requireAuthentication(request)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 })
    }

    // Rate limiting
    const rateLimitId = createRateLimitIdentifier(request, user.id)
    const rateLimit = searchRateLimiter.check(rateLimitId)
    
    if (!rateLimit.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.'
        }
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString()
        }
      })
    }

    // Check user has active debrid accounts
    const { data: debridAccounts, error: dbError }: { data: UserDebridAccount[] | null, error: any } = await serverDbService.getUserDebridAccounts(user.id)
    
    if (dbError || !debridAccounts || debridAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DEBRID_ACCOUNTS',
          message: 'No active debrid accounts found. Please configure your debrid providers.'
        }
      }, { status: 400 })
    }

    // Generate cache key
    const cacheKey = generateCacheKey.search(requestBody.query, requestBody.filters, user.id)
    
    // Check cache first
    const cachedResults = searchCache.get<SearchResultItem[]>(cacheKey)
    if (cachedResults) {
      // Apply pagination to cached results
      const { page, limit } = requestBody
      const offset = (page - 1) * limit
      const paginatedResults = cachedResults.slice(offset, offset + limit)
      
      return NextResponse.json({
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: cachedResults.length,
          hasNext: offset + limit < cachedResults.length,
          hasPrev: page > 1
        },
        cached: true,
        meta: {
          searchTime: Date.now() - startTime,
          providers: debridAccounts.map(acc => acc.provider),
          cached: true
        }
      })
    }

    // Initialize debrid providers
    const activeProviders: string[] = []
    for (const account of debridAccounts) {
      try {
        await debridManager.initializeProvider(account.provider as ProviderName, account.api_key)
        activeProviders.push(account.provider)
      } catch (error) {
        console.error(`Failed to initialize ${account.provider}:`, error)
      }
    }

    if (activeProviders.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_INIT_FAILED',
          message: 'Failed to initialize debrid providers. Please check your API keys.'
        }
      }, { status: 500 })
    }

    // Perform search
    try {
      // Filter provider if specified
      const targetProvider = requestBody.filters.provider !== 'all' 
        ? requestBody.filters.provider as ProviderName
        : undefined

      const searchOptions = {
        category: requestBody.filters.category !== 'all' ? requestBody.filters.category : undefined,
        quality: requestBody.filters.quality !== 'any' ? requestBody.filters.quality : undefined,
        page: requestBody.page,
        limit: requestBody.limit * 2 // Get more results to filter and paginate
      }

      const searchResults = await debridManager.search(
        requestBody.query, 
        searchOptions,
        targetProvider
      )

      // Map to API format
      let apiResults = searchResults.map(mapDebridResultToAPI)

      // Additional filtering by quality if specified
      if (requestBody.filters.quality !== 'any') {
        apiResults = apiResults.filter(result => 
          result.quality === requestBody.filters.quality ||
          result.metadata?.resolution === requestBody.filters.quality
        )
      }

      // Sort by seeders and instant availability
      apiResults.sort((a, b) => {
        if (a.isInstantAvailable && !b.isInstantAvailable) return -1
        if (!a.isInstantAvailable && b.isInstantAvailable) return 1
        return b.seeders - a.seeders
      })

      // Cache results for 5 minutes
      searchCache.set(cacheKey, apiResults, 5 * 60 * 1000)

      // Apply pagination
      const { page, limit } = requestBody
      const offset = (page - 1) * limit
      const paginatedResults = apiResults.slice(offset, offset + limit)

      // Log search to database
      await serverDbService.addSearchHistory({
        user_id: user.id,
        query: requestBody.query,
        results_count: apiResults.length,
        filters: requestBody.filters,
        searched_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: apiResults.length,
          hasNext: offset + limit < apiResults.length,
          hasPrev: page > 1
        },
        cached: false,
        meta: {
          searchTime: Date.now() - startTime,
          providers: activeProviders,
          cached: false
        }
      })

    } catch (searchError) {
      console.error('Search error:', searchError)
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Search operation failed. Please try again.'
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred'
      }
    }, { status: 500 })
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are allowed'
    }
  }, { status: 405 })
}