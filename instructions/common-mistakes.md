# Common AI Mistakes - Heimdall Media Manager Project

## Critical Security Mistakes

### 1. **API Key Exposure**
❌ **NEVER DO:**
```typescript
// Exposing API keys in client components
const RealDebridSearch = () => {
  const apiKey = 'YOUR_REAL_DEBRID_KEY'; // EXPOSED TO CLIENT!
  // ...
};
```

✅ **CORRECT:**
```typescript
// Keep API keys server-side only
// app/api/media/search/route.ts
const apiKey = process.env.REAL_DEBRID_API_KEY; // Server-side only
```

### 2. **Direct External API Calls from Client**
❌ **NEVER DO:**
```typescript
// Client-side direct API call
const searchRealDebrid = async (query: string) => {
  const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents/instantAvailability', {
    headers: { 'Authorization': `Bearer ${apiKey}` } // EXPOSED!
  });
};
```

✅ **CORRECT:**
```typescript
// Proxy through your API
const searchMedia = async (query: string) => {
  const response = await fetch('/api/media/search', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
};
```

## Frosted Glass Design Violations

### 3. **Forgetting Frosted Glass Consistency**
❌ **NEVER DO:**
```tsx
// Solid backgrounds break the aesthetic
<div className="bg-gray-800 rounded-lg p-4">
  {/* Content */}
</div>
```

✅ **CORRECT:**
```tsx
// Always use frosted glass effect
<div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4">
  {/* Content */}
</div>
```

### 4. **Inconsistent Hover States**
❌ **NEVER DO:**
```tsx
// Missing or wrong hover effects
<div className="hover:bg-blue-500"> {/* Solid color on hover */}
```

✅ **CORRECT:**
```tsx
// Consistent glass hover effects
<div className="hover:border-white/40 hover:scale-[1.02] transition-all duration-300">
```

## Loading States & UX

### 5. **Missing Loading States**
❌ **NEVER DO:**
```tsx
// No loading state shown
const SearchResults = () => {
  const { data, isLoading } = useQuery(['search'], searchMedia);
  
  return (
    <div>
      {data?.map(item => <ResultCard key={item.id} {...item} />)}
    </div>
  );
};
```

✅ **CORRECT:**
```tsx
// Always show loading states
const SearchResults = () => {
  const { data, isLoading } = useQuery(['search'], searchMedia);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.map(item => <ResultCard key={item.id} {...item} />)}
    </div>
  );
};
```

### 6. **Empty Content While Loading**
❌ **NEVER DO:**
```tsx
// Shows nothing while loading
{!isLoading && data && <ResultsList data={data} />}
```

✅ **CORRECT:**
```tsx
// Always show skeleton or content
{isLoading ? <SkeletonLoader /> : <ResultsList data={data} />}
```

## TypeScript Violations

### 7. **Using 'any' Types**
❌ **NEVER DO:**
```typescript
// Defeats the purpose of TypeScript
const processResults = (results: any) => {
  return results.map((item: any) => item.title);
};
```

✅ **CORRECT:**
```typescript
interface SearchResult {
  id: string;
  title: string;
  year: number;
  quality: string;
}

const processResults = (results: SearchResult[]) => {
  return results.map(item => item.title);
};
```

### 8. **Missing Interface Definitions**
❌ **NEVER DO:**
```typescript
// No type safety for API responses
const response = await fetch('/api/search');
const data = await response.json(); // Type is 'any'
```

✅ **CORRECT:**
```typescript
interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  meta: {
    total: number;
    page: number;
  };
}

const response = await fetch('/api/search');
const data: SearchResponse = await response.json();
```

## React Component Mistakes

### 9. **Server vs Client Components Confusion**
❌ **NEVER DO:**
```tsx
// Using useState in Server Component
export default function SearchPage() {
  const [query, setQuery] = useState(''); // ERROR!
  return <div>...</div>;
}
```

✅ **CORRECT:**
```tsx
// Server Component
export default function SearchPage() {
  return (
    <div>
      <SearchClient /> {/* Client Component handles state */}
    </div>
  );
}

// Client Component
'use client'
export function SearchClient() {
  const [query, setQuery] = useState('');
  // ...
}
```

### 10. **Missing Error Boundaries**
❌ **NEVER DO:**
```tsx
// No error handling for components that might fail
export default function MediaPlayer({ streamUrl }: { streamUrl: string }) {
  return <VideoPlayer src={streamUrl} />; // Can throw errors
}
```

✅ **CORRECT:**
```tsx
// Wrap in error boundary
export default function MediaPlayer({ streamUrl }: { streamUrl: string }) {
  return (
    <ErrorBoundary fallback={<PlayerError />}>
      <VideoPlayer src={streamUrl} />
    </ErrorBoundary>
  );
}
```

## API & Rate Limiting

### 11. **Ignoring Rate Limits**
❌ **NEVER DO:**
```typescript
// No rate limiting on API routes
export async function POST(request: NextRequest) {
  // Direct processing without limits
  return searchDebridService(query);
}
```

✅ **CORRECT:**
```typescript
// Implement rate limiting
const limiter = new RateLimiter({ tokensPerInterval: 10, interval: 'minute' });

export async function POST(request: NextRequest) {
  const remaining = await limiter.check(getClientId(request));
  if (remaining < 1) {
    return Response.json({ error: 'Rate limited' }, { status: 429 });
  }
  // Process request
}
```

### 12. **Not Caching API Responses**
❌ **NEVER DO:**
```typescript
// Always fetching fresh data
export async function GET() {
  const results = await searchRealDebrid(query); // Slow, expensive
  return Response.json(results);
}
```

✅ **CORRECT:**
```typescript
// Cache frequently accessed data
export async function GET() {
  const cacheKey = `search:${query}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return Response.json(JSON.parse(cached));
  }
  
  const results = await searchRealDebrid(query);
  await redis.setex(cacheKey, 300, JSON.stringify(results));
  return Response.json(results);
}
```

## Responsive Design Failures

### 13. **Breaking Mobile Layout**
❌ **NEVER DO:**
```tsx
// Fixed desktop-only layouts
<div className="grid grid-cols-4 gap-8"> {/* Breaks on mobile */}
```

✅ **CORRECT:**
```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
```

### 14. **Forgetting Touch Targets**
❌ **NEVER DO:**
```tsx
// Too small for mobile interaction
<button className="p-1 text-xs"> {/* < 44px touch target */}
```

✅ **CORRECT:**
```tsx
// Adequate touch targets
<button className="p-3 min-h-[44px] min-w-[44px]">
```

## Performance Issues

### 15. **Not Using React Query Properly**
❌ **NEVER DO:**
```tsx
// Fetching in useEffect without caching
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/api/search').then(res => res.json()).then(setData);
}, [query]); // Re-fetches on every query change
```

✅ **CORRECT:**
```tsx
// Use React Query for caching and deduplication
const { data, isLoading } = useQuery({
  queryKey: ['search', query],
  queryFn: () => searchMedia(query),
  staleTime: 5 * 60 * 1000, // 5 minutes
  enabled: !!query
});
```

### 16. **Large Bundle Sizes**
❌ **NEVER DO:**
```tsx
// Importing entire libraries unnecessarily
import * as icons from 'lucide-react'; // Imports everything
```

✅ **CORRECT:**
```tsx
// Import only what you need
import { Search, Play, Download } from 'lucide-react';
```

## State Management Mistakes

### 17. **Duplicating Server State**
❌ **NEVER DO:**
```tsx
// Storing server state in useState
const [searchResults, setSearchResults] = useState([]);
const [isLoading, setIsLoading] = useState(false);

// Manual state management for server data
```

✅ **CORRECT:**
```tsx
// Let React Query handle server state
const { data: searchResults, isLoading } = useQuery({
  queryKey: ['search', query],
  queryFn: () => searchMedia(query)
});
```

### 18. **Overusing Context**
❌ **NEVER DO:**
```tsx
// Using Context for server state
const SearchContext = createContext();

// Provider wraps entire app with search results
```

✅ **CORRECT:**
```tsx
// Use Context only for UI state, React Query for server state
const ThemeContext = createContext(); // UI state only
const { data } = useQuery(['search'], searchFn); // Server state
```

## File Creation Violations

### 19. **Creating Unnecessary Files**
❌ **NEVER DO:**
- Creating README.md without explicit request
- Creating documentation files proactively
- Adding files not specifically requested

✅ **CORRECT:**
- Only create files explicitly mentioned in requirements
- Edit existing files when possible
- Ask before creating additional files

### 20. **Removing Existing Features**
❌ **NEVER DO:**
```tsx
// Removing existing functionality during updates
export default function Header() {
  return (
    <nav>
      {/* Removed existing navigation items */}
      <NewFeature />
    </nav>
  );
}
```

✅ **CORRECT:**
```tsx
// Preserve existing functionality, only add requested features
export default function Header() {
  return (
    <nav>
      {/* Keep all existing navigation items */}
      <ExistingNav />
      <NewFeature />
    </nav>
  );
}
```

## Accessibility Oversights

### 21. **Missing ARIA Labels**
❌ **NEVER DO:**
```tsx
<button onClick={handleSearch}>
  <SearchIcon />
</button>
```

✅ **CORRECT:**
```tsx
<button onClick={handleSearch} aria-label="Search for media">
  <SearchIcon />
</button>
```

### 22. **Poor Keyboard Navigation**
❌ **NEVER DO:**
```tsx
<div onClick={handleClick}>Clickable div</div>
```

✅ **CORRECT:**
```tsx
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Accessible button
</button>
```

## Testing Oversights

### 23. **Not Testing Error States**
❌ **NEVER DO:**
```tsx
// Only testing happy path
it('should display search results', async () => {
  render(<SearchResults />);
  // Test only successful case
});
```

✅ **CORRECT:**
```tsx
// Test error states too
it('should display error message on failure', async () => {
  server.use(/* mock error response */);
  render(<SearchResults />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

Remember: Always follow the established patterns, maintain consistency, and prioritize user experience and security!