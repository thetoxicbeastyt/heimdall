'use client'

import { useState } from 'react'
import { Search, Filter, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchFilters {
  quality: string
  provider: string
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void
  isLoading?: boolean
  className?: string
}

const qualityOptions = [
  { value: 'any', label: 'Any Quality' },
  { value: '4K', label: '4K / 2160p' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' }
]

const providerOptions = [
  { value: 'all', label: 'All Providers' },
  { value: 'real-debrid', label: 'Real-Debrid' },
  { value: 'alldebrid', label: 'AllDebrid' },
  { value: 'premiumize', label: 'Premiumize' }
]

export function SearchBar({ onSearch, isLoading = false, className }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    quality: 'any',
    provider: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), filters)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main search form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
              ) : (
                <Search className="h-6 w-6 text-white/50" />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search for movies, TV shows, or any content..."
              className={cn(
                'w-full pl-12 pr-20 py-4 text-lg',
                'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
                'border border-white/20 rounded-xl',
                'text-white placeholder-white/50',
                'focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20',
                'transition-all duration-300',
                'group-hover:border-white/30'
              )}
              disabled={isLoading}
            />
            {/* Filter toggle button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'absolute inset-y-0 right-0 pr-4 flex items-center z-10',
                'text-white/70 hover:text-white transition-colors'
              )}
              disabled={isLoading}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Search button overlay */}
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute inset-0 w-full rounded-xl bg-transparent cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-white/70" />
            <span className="text-sm font-medium text-white/90">Search Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quality filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Quality
              </label>
              <div className="relative">
                <select
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 pr-8',
                    'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
                    'border border-white/20 rounded-lg',
                    'text-white text-sm',
                    'focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20',
                    'transition-all duration-300',
                    'appearance-none cursor-pointer'
                  )}
                >
                  {qualityOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              </div>
            </div>

            {/* Provider filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Provider
              </label>
              <div className="relative">
                <select
                  value={filters.provider}
                  onChange={(e) => handleFilterChange('provider', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 pr-8',
                    'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
                    'border border-white/20 rounded-lg',
                    'text-white text-sm',
                    'focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20',
                    'transition-all duration-300',
                    'appearance-none cursor-pointer'
                  )}
                >
                  {providerOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setFilters({ quality: 'any', provider: 'all' })
              }}
              className="text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              Clear filters
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg',
                  'backdrop-blur-xl bg-white/10 border border-white/20',
                  'text-white/80 hover:text-white hover:border-white/30',
                  'transition-all duration-300'
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (query.trim()) {
                    onSearch(query.trim(), filters)
                  }
                  setShowFilters(false)
                }}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg',
                  'backdrop-blur-xl bg-white/20 border border-white/30',
                  'text-white hover:bg-white/25 hover:border-white/40',
                  'transition-all duration-300'
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filters display */}
      {(filters.quality !== 'any' || filters.provider !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white/60">Filters:</span>
          {filters.quality !== 'any' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {qualityOptions.find(opt => opt.value === filters.quality)?.label}
            </span>
          )}
          {filters.provider !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-green-500/20 text-green-300 border border-green-400/30">
              {providerOptions.find(opt => opt.value === filters.provider)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}