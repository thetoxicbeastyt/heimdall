import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthentication, createRateLimitIdentifier } from '@/lib/auth'
import { debridRateLimiter } from '@/lib/rate-limiter'
import { debridCache, generateCacheKey } from '@/lib/cache'
import { serverDbService } from '@/lib/supabase/client'
import { debridManager, extractHashFromMagnet, isValidMagnetLink } from '@/lib/debrid'
import { torrentPoller } from '@/lib/polling/torrent-poller'
import type { DebridProvider, StreamLink } from '@/lib/debrid/types'

// Request validation schema
const StreamRequestSchema = z.object({
  magnetLink: z.string().optional(),
  torrentId: z.string().optional(),
  fileIndex: z.number().int().min(0).optional().default(0),
  provider: z.enum(['real-debrid', 'alldebrid', 'premiumize']).optional(),
  quality: z.string().optional()
}).refine(
  (data) => data.magnetLink || data.torrentId,
  {
    message: "Either magnetLink or torrentId must be provided",
    path: ["magnetLink", "torrentId"]
  }
)

type StreamRequest = z.infer<typeof StreamRequestSchema>

// Response types
interface StreamResponse {
  success: boolean
  data?: {
    streamUrl: string
    expires: string
    quality: string
    size?: string
    filename?: string
    mimeType?: string
    subtitles?: Array<{
      language: string
      url: string
      label: string
    }>
    headers?: Record<string, string>
  }
  polling?: {
    jobId: string
    status: 'processing' | 'ready' | 'failed'
    progress?: number
    eta?: string
  }
  cached?: boolean
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Helper function to extract quality from filename
function extractQualityFromFilename(filename: string): string {
  const qualities = ['2160p', '4K', '1080p', '720p', '480p', '360p']
  const lowerFilename = filename.toLowerCase()
  
  for (const quality of qualities) {
    if (lowerFilename.includes(quality.toLowerCase())) {
      return quality === '2160p' ? '4K' : quality
    }
  }
  
  return 'Unknown'
}

// Helper function to find subtitle files
function findSubtitles(files: any[], baseFilename: string): Array<{
  language: string
  url: string
  label: string
}> {
  const subtitles: Array<{ language: string; url: string; label: string }> = []
  const subtitleExtensions = ['.srt', '.vtt', '.ass', '.ssa']
  const baseName = baseFilename.replace(/\.[^/.]+$/, '') // Remove extension
  
  for (const file of files) {
    const filename = file.path || file.filename || ''
    const isSubtitle = subtitleExtensions.some(ext => filename.toLowerCase().endsWith(ext))
    
    if (isSubtitle && filename.toLowerCase().includes(baseName.toLowerCase().substring(0, 20))) {
      // Extract language from filename (common patterns: .en.srt, .english.srt, etc.)
      let language = 'en'
      let label = 'Unknown'
      
      const langMatches = filename.match(/\.(en|eng|english|es|esp|spanish|fr|fre|french|de|ger|german|it|ita|italian|pt|por|portuguese|ru|rus|russian|zh|chi|chinese|ja|jap|japanese|ko|kor|korean)\./i)
      if (langMatches) {
        const lang = langMatches[1].toLowerCase()
        const langMap: Record<string, { code: string, label: string }> = {
          'en': { code: 'en', label: 'English' },
          'eng': { code: 'en', label: 'English' },
          'english': { code: 'en', label: 'English' },
          'es': { code: 'es', label: 'Spanish' },
          'esp': { code: 'es', label: 'Spanish' },
          'spanish': { code: 'es', label: 'Spanish' },
          'fr': { code: 'fr', label: 'French' },
          'fre': { code: 'fr', label: 'French' },
          'french': { code: 'fr', label: 'French' },
          'de': { code: 'de', label: 'German' },
          'ger': { code: 'de', label: 'German' },
          'german': { code: 'de', label: 'German' }
        }
        
        const langInfo = langMap[lang]
        if (langInfo) {
          language = langInfo.code
          label = langInfo.label
        }
      }
      
      subtitles.push({
        language,
        url: file.stream_link || file.download_link || '',
        label
      })
    }
  }
  
  return subtitles
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Parse and validate request body
    let requestBody: StreamRequest
    try {
      const body = await request.json()
      requestBody = StreamRequestSchema.parse(body)
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

    // Validate magnet link if provided
    if (requestBody.magnetLink && !isValidMagnetLink(requestBody.magnetLink)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_MAGNET',
          message: 'Invalid magnet link format'
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
    const rateLimit = debridRateLimiter.check(rateLimitId)
    
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

    // Get user's active debrid accounts
    const { data: debridAccounts, error: dbError } = await serverDbService.getUserDebridAccounts(user.id)
    
    if (dbError || !debridAccounts || debridAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DEBRID_ACCOUNTS',
          message: 'No active debrid accounts found. Please configure your debrid providers.'
        }
      }, { status: 400 })
    }

    // Determine provider
    let targetProvider: DebridProvider
    if (requestBody.provider) {
      targetProvider = requestBody.provider as DebridProvider
      const hasProvider = debridAccounts.some(acc => acc.provider === targetProvider)
      if (!hasProvider) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'PROVIDER_NOT_CONFIGURED',
            message: `${targetProvider} is not configured for your account`
          }
        }, { status: 400 })
      }
    } else {
      // Use first available provider
      targetProvider = debridAccounts[0].provider as DebridProvider
    }

    // Initialize debrid provider
    const account = debridAccounts.find(acc => acc.provider === targetProvider)!
    try {
      await debridManager.initializeProvider(targetProvider, account.api_key)
    } catch (error) {
      console.error(`Failed to initialize ${targetProvider}:`, error)
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_INIT_FAILED',
          message: `Failed to initialize ${targetProvider}. Please check your API key.`
        }
      }, { status: 500 })
    }

    let torrentId = requestBody.torrentId
    let magnetHash: string | undefined

    // If we have a magnet link, extract hash and check cache first
    if (requestBody.magnetLink) {
      magnetHash = extractHashFromMagnet(requestBody.magnetLink)
      if (!magnetHash) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_MAGNET_HASH',
            message: 'Could not extract hash from magnet link'
          }
        }, { status: 400 })
      }
    }

    // Check if we already have a cached stream link
    if (torrentId) {
      const cacheKey = `stream:${targetProvider}:${torrentId}:${requestBody.fileIndex}`
      const cachedStream = debridCache.get<StreamLink>(cacheKey)
      
      if (cachedStream) {
        // Verify the cached link hasn't expired
        const expiresAt = new Date(cachedStream.expires).getTime()
        if (expiresAt > Date.now()) {
          return NextResponse.json({
            success: true,
            data: {
              streamUrl: cachedStream.url,
              expires: cachedStream.expires,
              quality: cachedStream.quality,
              size: cachedStream.sizeFormatted,
              filename: cachedStream.filename,
              mimeType: cachedStream.mimeType,
              headers: cachedStream.headers,
              subtitles: cachedStream.subtitles || []
            },
            cached: true
          })
        } else {
          // Remove expired cache entry
          debridCache.delete(cacheKey)
        }
      }
    }

    try {
      // If no torrentId, add magnet to debrid service
      if (!torrentId && requestBody.magnetLink) {
        console.log(`Adding magnet to ${targetProvider} for user ${user.id}`)
        torrentId = await debridManager.addMagnet(requestBody.magnetLink, targetProvider)
        
        // Save download record to database
        await serverDbService.addDownload({
          user_id: user.id,
          title: `Torrent ${torrentId}`,
          magnet_hash: magnetHash!,
          magnet_link: requestBody.magnetLink,
          provider: targetProvider,
          status: 'queued',
          torrent_id: torrentId
        })
      }

      if (!torrentId) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NO_TORRENT_ID',
            message: 'Could not obtain torrent ID'
          }
        }, { status: 500 })
      }

      // Check torrent status
      const torrentInfo = await debridManager.getTorrentInfo(torrentId, targetProvider)
      
      // Update download record
      if (requestBody.magnetLink) {
        await serverDbService.updateDownload(torrentId, {
          title: torrentInfo.filename || `Torrent ${torrentId}`,
          status: torrentInfo.status as any,
          progress: torrentInfo.progress,
          file_size: torrentInfo.size,
          download_speed: torrentInfo.speed,
          eta_seconds: torrentInfo.eta,
          updated_at: new Date().toISOString()
        })
      }

      if (torrentInfo.status === 'downloaded' || torrentInfo.status === 'completed') {
        // Torrent is ready, get stream link immediately
        try {
          const streamLink = await debridManager.getStreamLink(torrentId, requestBody.fileIndex, targetProvider)
          
          // Cache the stream link
          const cacheKey = `stream:${targetProvider}:${torrentId}:${requestBody.fileIndex}`
          const expiresIn = new Date(streamLink.expires).getTime() - Date.now()
          debridCache.set(cacheKey, streamLink, Math.max(0, expiresIn))
          
          // Find subtitles if available
          const subtitles = torrentInfo.files ? findSubtitles(torrentInfo.files, streamLink.filename) : []
          
          // Update download record with stream link
          await serverDbService.updateDownload(torrentId, {
            status: 'completed',
            stream_link: streamLink.url,
            completed_at: new Date().toISOString()
          })
          
          return NextResponse.json({
            success: true,
            data: {
              streamUrl: streamLink.url,
              expires: streamLink.expires,
              quality: streamLink.quality || extractQualityFromFilename(streamLink.filename),
              size: streamLink.sizeFormatted,
              filename: streamLink.filename,
              mimeType: streamLink.mimeType,
              headers: streamLink.headers,
              subtitles
            },
            cached: false
          })
          
        } catch (streamError) {
          console.error('Failed to get stream link:', streamError)
          return NextResponse.json({
            success: false,
            error: {
              code: 'STREAM_GENERATION_FAILED',
              message: 'Failed to generate stream link'
            }
          }, { status: 500 })
        }
        
      } else if (torrentInfo.status === 'error' || torrentInfo.status === 'virus' || torrentInfo.status === 'dead') {
        // Torrent failed
        await serverDbService.updateDownload(torrentId, {
          status: 'error',
          error_message: `Torrent ${torrentInfo.status}`,
          updated_at: new Date().toISOString()
        })
        
        return NextResponse.json({
          success: false,
          error: {
            code: 'TORRENT_FAILED',
            message: `Torrent ${torrentInfo.status}`
          }
        }, { status: 400 })
        
      } else {
        // Torrent is still processing, start polling
        const jobId = `${user.id}:${torrentId}:${Date.now()}`
        
        torrentPoller.addJob({
          id: jobId,
          torrentId,
          provider: targetProvider,
          userId: user.id
        })
        
        return NextResponse.json({
          success: true,
          polling: {
            jobId,
            status: 'processing',
            progress: torrentInfo.progress,
            eta: torrentInfo.etaFormatted
          }
        })
      }
      
    } catch (debridError: any) {
      console.error('Debrid service error:', debridError)
      
      // Map common debrid errors to user-friendly messages
      let errorMessage = 'Failed to process request'
      let errorCode = 'DEBRID_ERROR'
      
      if (debridError.message?.includes('magnet not found')) {
        errorMessage = 'Magnet link not found or invalid'
        errorCode = 'MAGNET_NOT_FOUND'
      } else if (debridError.message?.includes('insufficient credits')) {
        errorMessage = 'Insufficient credits on debrid account'
        errorCode = 'INSUFFICIENT_CREDITS'
      } else if (debridError.message?.includes('premium required')) {
        errorMessage = 'Premium account required'
        errorCode = 'PREMIUM_REQUIRED'
      }
      
      return NextResponse.json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        }
      }, { status: 400 })
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

// GET endpoint to check polling status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_JOB_ID',
          message: 'Job ID is required'
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
    
    // Verify job belongs to user
    if (!jobId.startsWith(`${user.id}:`)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JOB',
          message: 'Invalid job ID'
        }
      }, { status: 403 })
    }
    
    const jobStatus = torrentPoller.getJobStatus(jobId)
    
    if (!jobStatus.exists) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Polling job not found or completed'
        }
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      polling: {
        jobId,
        status: 'processing',
        retryCount: jobStatus.retryCount,
        elapsed: jobStatus.elapsed
      }
    })
    
  } catch (error) {
    console.error('Polling status error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check polling status'
      }
    }, { status: 500 })
  }
}

// Method not allowed for other HTTP methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST and GET requests are allowed'
    }
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST and GET requests are allowed'
    }
  }, { status: 405 })
}