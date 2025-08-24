# Tech Stack - Heimdall Debrid Media Manager

## Core Framework & Language
- **Next.js 14+**: React framework with App Router for server-side rendering and API routes
- **TypeScript**: Strict mode enabled for type safety and better developer experience
- **React 18+**: Latest React features including Server Components and Suspense

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality, accessible component library built on Radix UI
- **Framer Motion**: Production-ready motion library for React animations
- **next-themes**: Theme switching support for dark/light modes
- **Lucide React**: Beautiful & consistent icon set

## Database & Authentication
- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & user management
  - Storage for media metadata

## Data Fetching & State Management
- **React Query (TanStack Query)**: Powerful data synchronization for React
  - Server state management
  - Caching and background updates
  - Optimistic updates
  - Error handling and retry logic
- **Zustand**: Lightweight state management for client-side global state
- **React Hook Form**: Performant forms with easy validation

## External APIs & Services
- **Real-Debrid API**: Premium link generation service
- **AllDebrid API**: Alternative debrid service
- **TMDB API**: Movie and TV show metadata
- **OpenSubtitles API**: Subtitle services

## Development & Build Tools
- **ESLint**: Code linting with Next.js and TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **TypeScript Compiler**: Type checking and compilation
- **PostCSS**: CSS processing with Tailwind

## Validation & Security
- **Zod**: TypeScript-first schema validation
- **bcryptjs**: Password hashing for security
- **jose**: JSON Web Token utilities
- **rate-limiter-flexible**: API rate limiting

## Media & Streaming
- **Video.js**: HTML5 video player
- **HLS.js**: HTTP Live Streaming support
- **Sharp**: High-performance image processing (via Next.js)

## Monitoring & Analytics
- **Vercel Analytics**: Web vitals and performance monitoring
- **Sentry**: Error tracking and performance monitoring (optional)

## Deployment & Hosting
- **Vercel**: Recommended hosting platform for Next.js
- **Supabase Cloud**: Managed database and backend services
- **CDN**: Automatic asset optimization and global distribution

## Development Dependencies
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "typescript": "^5.0.0"
}
```

## Version Requirements
- Node.js: >= 18.0.0
- npm: >= 9.0.0
- Next.js: >= 14.0.0
- React: >= 18.0.0
- TypeScript: >= 5.0.0

## Key Features Enabled by Tech Stack
1. **Server-Side Rendering**: Fast initial page loads
2. **Static Generation**: Pre-built pages for optimal performance
3. **API Routes**: Full-stack application in single codebase
4. **Type Safety**: End-to-end TypeScript integration
5. **Real-time Updates**: Supabase subscriptions for live data
6. **Responsive Design**: Mobile-first with Tailwind CSS
7. **Accessibility**: Built-in with shadcn/ui components
8. **Performance**: Optimized with React Query caching
9. **Security**: Row-level security with Supabase
10. **Scalability**: Serverless architecture with Vercel