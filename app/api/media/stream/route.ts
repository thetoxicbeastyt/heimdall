import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthentication, createRateLimitIdentifier } from '@/lib/auth';
import { debridManager, extractHashFromMagnet } from '@/lib/debrid';
// TODO: Create a separate rate limiter for streaming
import { searchRateLimiter as streamRateLimiter } from '@/lib/rate-limiter';
import { streamCache, generateCacheKey } from '@/lib/cache';
import { serverDbService } from '@/lib/supabase/client';
import type { DebridProvider, ProviderName } from '@/lib/debrid/types';

const StreamRequestSchema = z.object({
  magnetLink: z.string().optional(),
  torrentId: z.string().optional(),
  fileIndex: z.number().int().min(0),
  provider: z.enum(['real-debrid', 'alldebrid']),
}).refine(data => data.magnetLink || data.torrentId, {
  message: 'Either magnetLink or torrentId must be provided',
});

type StreamRequest = z.infer<typeof StreamRequestSchema>;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: StreamRequest | undefined;
  try {
    try {
      const body = await request.json();
      requestBody = StreamRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors
          }
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid JSON in request body'
        }
      }, { status: 400 });
    }

    let user;
    try {
      user = await requireAuthentication(request);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    const rateLimitId = createRateLimitIdentifier(request, user.id);
    const rateLimit = streamRateLimiter.check(rateLimitId);

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
      });
    }

    const { data: debridAccounts, error: dbError } = await serverDbService.getUserDebridAccounts(user.id);

    if (dbError || !debridAccounts || debridAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NO_DEBRID_ACCOUNTS',
          message: 'No active debrid accounts found. Please configure your debrid providers.'
        }
      }, { status: 400 });
    }

    if (!requestBody) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request body is missing'
        }
      }, { status: 400 });
    }

    const providerName = requestBody.provider;
    const account = debridAccounts.find((acc: any) => acc.provider === providerName);

    if (!account) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `Provider '${requestBody.provider}' not found or not configured for your account.`
        }
      }, { status: 400 });
    }

    try {
      await debridManager.initializeProvider((account as any).provider as ProviderName, (account as any).api_key);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_INIT_FAILED',
          message: 'Failed to initialize debrid provider. Please check your API key.'
        }
      }, { status: 500 });
    }

    const cacheKey = generateCacheKey.stream(requestBody.magnetLink || requestBody.torrentId!, requestBody.fileIndex, requestBody.provider);
    const cachedStream = streamCache.get(cacheKey);

    if (cachedStream) {
      return NextResponse.json({
        success: true,
        data: cachedStream,
        cached: true
      });
    }

    try {
      let torrentId = requestBody.torrentId;

      if (requestBody.magnetLink) {
        const hash = extractHashFromMagnet(requestBody.magnetLink);
        if (!hash) {
          return NextResponse.json({ success: false, error: { code: 'INVALID_MAGNET_LINK', message: 'Invalid magnet link provided.' } }, { status: 400 });
        }

        const availability = await debridManager.checkInstantAvailability([hash], requestBody.provider as ProviderName);
        if (!availability[hash] || !availability[hash][requestBody.provider]) {
          torrentId = await debridManager.addMagnet(requestBody.magnetLink, requestBody.provider as ProviderName);
        } else {
          // If it's instantly available, we still need to add it to get a torrent ID for streaming
          torrentId = await debridManager.addMagnet(requestBody.magnetLink, requestBody.provider as ProviderName);
        }
      }

      if (!torrentId) {
        return NextResponse.json({ success: false, error: { code: 'TORRENT_ADD_FAILED', message: 'Failed to add torrent to debrid service.' } }, { status: 500 });
      }

      // Poll for completion
      let torrentInfo;
      for (let i = 0; i < 6; i++) { // Poll for 30 seconds (6 * 5s)
        torrentInfo = await debridManager.getTorrentInfo(torrentId, requestBody.provider as ProviderName);
        if (torrentInfo.status === 'downloaded') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (torrentInfo?.status !== 'downloaded') {
        return NextResponse.json({ success: false, error: { code: 'TORRENT_NOT_READY', message: 'Torrent is not ready for streaming after 30 seconds.' } }, { status: 500 });
      }

      const streamLink = await debridManager.getStreamLink(torrentId, requestBody.fileIndex, requestBody.provider as ProviderName);

      const responseData = {
        streamUrl: streamLink.url,
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
        quality: torrentInfo.files[requestBody.fileIndex]?.path.match(/(1080p|720p|4k)/i)?.[0] ?? 'unknown',
      };

      streamCache.set(cacheKey, responseData, 2 * 60 * 60 * 1000);

      return NextResponse.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Streaming Error:', error);
      return NextResponse.json({ success: false, error: { code: 'STREAMING_FAILED', message: 'Failed to get stream link.' } }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred'
      }
    }, { status: 500 });
  }
}
