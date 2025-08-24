# API Structure - Heimdall Media Manager

## API Route Organization

### Base Structure
```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── register/route.ts
│   └── refresh/route.ts
├── media/
│   ├── search/route.ts
│   ├── stream/route.ts
│   ├── download/route.ts
│   └── metadata/route.ts
├── debrid/
│   ├── providers/route.ts
│   ├── account/route.ts
│   ├── status/route.ts
│   └── [provider]/
│       ├── authenticate/route.ts
│       ├── torrents/route.ts
│       └── downloads/route.ts
└── user/
    ├── profile/route.ts
    ├── preferences/route.ts
    ├── history/route.ts
    └── stats/route.ts
```

## Naming Conventions

### Route Files
- Always use `route.ts` for API endpoints
- Use kebab-case for directory names
- Dynamic routes use square brackets: `[provider]`

### HTTP Methods
- `GET`: Retrieve data
- `POST`: Create new resources or complex operations
- `PUT`: Update entire resources
- `PATCH`: Partial updates
- `DELETE`: Remove resources

## Standard Response Format

### Success Response
```typescript
interface APIResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cached?: boolean;
    timestamp?: string;
  };
}
```

### Error Response
```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

## Authentication & Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string; // User ID
  email: string;
  iat: number;
  exp: number;
  role: 'user' | 'admin';
}
```

### Protected Route Pattern
```typescript
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Route logic here
    
  } catch (error) {
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}
```

## Rate Limiting

### Implementation Pattern
```typescript
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
  uniqueTokenPerInterval: 500
});

export async function POST(request: NextRequest) {
  const identifier = getClientId(request);
  const remaining = await limiter.check(identifier);
  
  if (remaining < 1) {
    return Response.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
        }
      }
    );
  }
  
  // Route logic here
}
```

### Rate Limits by Endpoint
- `/api/auth/*`: 5 requests/minute
- `/api/media/search`: 10 requests/minute
- `/api/media/stream`: 3 requests/minute
- `/api/debrid/*`: 20 requests/minute
- `/api/user/*`: 30 requests/minute

## Data Validation

### Using Zod Schemas
```typescript
import { z } from 'zod';

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    quality: z.enum(['4K', '1080p', '720p', '480p']).optional(),
    type: z.enum(['movie', 'tv', 'all']).default('all'),
    year: z.number().min(1900).max(new Date().getFullYear()).optional(),
    genre: z.string().optional()
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SearchRequestSchema.parse(body);
    
    // Use validated data
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }
    
    throw error;
  }
}
```

## Error Handling

### Standard Error Codes
- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: Access denied
- `VALIDATION_ERROR`: Request data validation failed
- `NOT_FOUND`: Resource doesn't exist
- `RATE_LIMITED`: Too many requests
- `EXTERNAL_API_ERROR`: Third-party service error
- `INSUFFICIENT_CREDITS`: Debrid service limits reached
- `INTERNAL_ERROR`: Server-side error

### Error Handler Utility
```typescript
export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof z.ZodError) {
    return Response.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors
      }
    }, { status: 400 });
  }
  
  if (error instanceof Error) {
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
  
  return Response.json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred'
    }
  }, { status: 500 });
}
```

## Caching Strategy

### Response Caching
```typescript
// Cache successful responses for 5 minutes
const response = Response.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
  }
});
```

### Redis Caching Pattern
```typescript
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const cacheKey = `search:${searchQuery}:${JSON.stringify(filters)}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json({
      success: true,
      data: JSON.parse(cached),
      meta: { cached: true }
    });
  }
  
  // Fetch fresh data
  const data = await searchMedia(query, filters);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return Response.json({
    success: true,
    data,
    meta: { cached: false }
  });
}
```

## Media Search API

### Search Endpoint
```typescript
// POST /api/media/search
interface SearchRequest {
  query: string;
  filters?: {
    quality?: '4K' | '1080p' | '720p' | '480p';
    type?: 'movie' | 'tv' | 'all';
    year?: number;
    genre?: string;
  };
  page?: number;
  limit?: number;
}

interface SearchResponse {
  success: true;
  data: SearchResult[];
  meta: {
    page: number;
    limit: number;
    total: number;
    cached: boolean;
  };
}
```

## Debrid Integration API

### Provider Authentication
```typescript
// POST /api/debrid/[provider]/authenticate
interface AuthRequest {
  apiKey: string;
}

interface AuthResponse {
  success: true;
  data: {
    provider: string;
    username: string;
    premium: boolean;
    expiresAt: string;
    points: number;
  };
}
```

### Stream Generation
```typescript
// POST /api/media/stream
interface StreamRequest {
  magnetLink?: string;
  torrentId?: string;
  fileIndex?: number;
  provider: string;
}

interface StreamResponse {
  success: true;
  data: {
    streamUrl: string;
    expires: string;
    quality: string;
    subtitles?: Array<{
      language: string;
      url: string;
    }>;
  };
}
```

## Logging & Monitoring

### Request Logging
```typescript
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  logger.info('API Request', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  });
  
  try {
    // Route logic
    
    logger.info('API Response', {
      requestId,
      status: 200,
      duration: Date.now() - startTime
    });
    
    return response;
  } catch (error) {
    logger.error('API Error', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}
```

## Testing Patterns

### API Route Testing
```typescript
import { POST } from '@/app/api/media/search/route';
import { NextRequest } from 'next/server';

describe('/api/media/search', () => {
  it('should search for media', async () => {
    const request = new NextRequest('http://localhost:3000/api/media/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'Inception',
        filters: { quality: '1080p' }
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(10);
  });
});
```