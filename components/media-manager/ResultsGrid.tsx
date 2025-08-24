'use client'

import { cn } from '@/lib/utils'
import { ResultCard } from './ResultCard'

interface SearchResult {
  id: string
  title: string
  year?: number
  poster?: string
  quality?: string
  size: string
  seeders: number
  leechers: number
  provider: string
  category: 'movie' | 'tv' | 'music' | 'game' | 'software' | 'other'
  resolution?: string
  runtime?: string
  rating?: number
  genre?: string[]
  isInstantAvailable?: boolean
}

interface ResultsGridProps {
  results: SearchResult[]
  isLoading: boolean
  onPlay?: (result: SearchResult) => void
  onDownload?: (result: SearchResult) => void
  className?: string
}

function ResultCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg overflow-hidden',
      className
    )}>
      {/* Poster skeleton */}
      <div className="aspect-[2/3] bg-white/5 animate-pulse relative">
        <div className="absolute top-2 right-2">
          <div className="w-12 h-5 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
        </div>
        
        {/* Genre tags */}
        <div className="flex gap-2">
          <div className="h-6 bg-white/10 rounded-full animate-pulse w-16" />
          <div className="h-6 bg-white/10 rounded-full animate-pulse w-12" />
        </div>
        
        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-white/5 rounded animate-pulse w-8" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-12" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-white/5 rounded animate-pulse w-12" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-16" />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="h-3 bg-white/5 rounded animate-pulse w-8" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-8" />
            </div>
            <div className="h-5 bg-white/10 rounded-full animate-pulse w-16" />
          </div>
        </div>
        
        {/* Provider */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex justify-between">
            <div className="h-3 bg-white/5 rounded animate-pulse w-12" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ResultCardSkeleton key={index} />
      ))}
    </div>
  )
}

function ResultsHeader({ count, isLoading }: { count: number; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-6 bg-white/10 rounded animate-pulse w-32" />
          <div className="h-5 bg-white/5 rounded-full animate-pulse w-16" />
        </div>
        <div className="h-5 bg-white/10 rounded animate-pulse w-24" />
      </div>
    )
  }

  if (count === 0) return null

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-white">
          Search Results
        </h2>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-white/10 text-white/80 border border-white/20">
          {count} {count === 1 ? 'result' : 'results'}
        </span>
      </div>
      
      {/* Sort options placeholder - can be expanded */}
      <div className="text-sm text-white/60">
        Sorted by relevance
      </div>
    </div>
  )
}

function NoResults() {
  return (
    <div className="text-center py-12">
      <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-8 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full backdrop-blur-xl bg-white/10 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No results found
        </h3>
        <p className="text-white/70 text-sm mb-4">
          Try adjusting your search terms or filters
        </p>
        <div className="text-xs text-white/50">
          <p>Tips:</p>
          <ul className="mt-1 space-y-1 text-left">
            <li>• Check your spelling</li>
            <li>• Try different keywords</li>
            <li>• Remove quality filters</li>
            <li>• Try searching for the original title</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export function ResultsGrid({ 
  results, 
  isLoading, 
  onPlay, 
  onDownload, 
  className 
}: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <ResultsHeader count={0} isLoading={true} />
        <LoadingGrid />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={className}>
        <NoResults />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <ResultsHeader count={results.length} isLoading={false} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            {...result}
            onPlay={onPlay ? () => onPlay(result) : undefined}
            onDownload={onDownload ? () => onDownload(result) : undefined}
          />
        ))}
      </div>

      {/* Load more placeholder */}
      {results.length > 0 && results.length % 24 === 0 && (
        <div className="text-center pt-8">
          <button className={cn(
            'px-6 py-3 rounded-lg',
            'backdrop-blur-xl bg-white/10 border border-white/20',
            'text-white hover:bg-white/15 hover:border-white/30',
            'transition-all duration-300'
          )}>
            Load More Results
          </button>
        </div>
      )}
    </div>
  )
}

// Export skeleton component for external use
export { ResultCardSkeleton }