'use client'

import { Search, Film, Monitor, Music, Gamepad2, Package, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onSuggestionClick?: (query: string) => void
  className?: string
}

const popularSearches = [
  { query: 'Dune 2024', category: 'movie', icon: Film, description: 'Latest blockbuster' },
  { query: 'The Bear', category: 'tv', icon: Monitor, description: 'Popular TV series' },
  { query: 'Deadpool Wolverine', category: 'movie', icon: Film, description: 'Action comedy' },
  { query: 'House of Dragon', category: 'tv', icon: Monitor, description: 'Fantasy drama' },
  { query: 'Inside Out 2', category: 'movie', icon: Film, description: 'Animated film' },
  { query: 'The Boys Season 4', category: 'tv', icon: Monitor, description: 'Superhero series' }
]

const categoryExamples = [
  { 
    name: 'Movies', 
    icon: Film, 
    examples: ['Oppenheimer', 'Barbie', 'Spider-Man', 'Avatar'],
    color: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
  },
  { 
    name: 'TV Shows', 
    icon: Monitor, 
    examples: ['Stranger Things', 'Breaking Bad', 'The Office', 'Game of Thrones'],
    color: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
  },
  { 
    name: 'Music', 
    icon: Music, 
    examples: ['Taylor Swift', 'Drake', 'Beatles', 'Led Zeppelin'],
    color: 'bg-pink-500/20 text-pink-300 border-pink-400/30'
  },
  { 
    name: 'Games', 
    icon: Gamepad2, 
    examples: ['Cyberpunk 2077', 'GTA V', 'Minecraft', 'Call of Duty'],
    color: 'bg-green-500/20 text-green-300 border-green-400/30'
  }
]

const searchTips = [
  'Use specific titles for better results',
  'Include year for movies (e.g. "Avatar 2009")',
  'Try different quality filters',
  'Search by actor or director names',
  'Use original language titles'
]

export function EmptyState({ onSuggestionClick, className }: EmptyStateProps) {
  const handleSuggestionClick = (query: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(query)
    }
  }

  return (
    <div className={cn('max-w-4xl mx-auto py-16', className)}>
      {/* Hero section */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Search className="h-12 w-12 text-white/60" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">
          Discover Amazing Content
        </h2>
        
        <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
          Search through millions of movies, TV shows, music, games, and more. 
          Get instant access to high-quality content from your favorite debrid providers.
        </p>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Pro tip</span>
          </div>
          <p className="text-white/80 text-sm">
            Use the filters to narrow down results by quality and provider for the best streaming experience.
          </p>
        </div>
      </div>

      {/* Popular searches */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Popular Searches
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularSearches.map((search, index) => {
            const Icon = search.icon
            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(search.query)}
                className={cn(
                  'p-4 rounded-lg text-left',
                  'backdrop-blur-xl bg-white/5 border border-white/10',
                  'hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]',
                  'transition-all duration-300 group'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg backdrop-blur-xl bg-white/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white group-hover:text-white/90 transition-colors">
                      {search.query}
                    </h4>
                  </div>
                </div>
                <p className="text-white/60 text-sm">
                  {search.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category examples */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Browse by Category
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryExamples.map((category, index) => {
            const Icon = category.icon
            return (
              <div
                key={index}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg backdrop-blur-xl border flex items-center justify-center',
                    category.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-white text-lg">
                    {category.name}
                  </h4>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {category.examples.map((example) => (
                    <button
                      key={example}
                      onClick={() => handleSuggestionClick(example)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm',
                        'backdrop-blur-xl bg-white/10 border border-white/20',
                        'text-white/80 hover:text-white hover:bg-white/15',
                        'transition-all duration-300'
                      )}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search tips */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Search Tips
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchTips.map((tip, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full backdrop-blur-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-white/70 text-xs font-medium">
                  {index + 1}
                </span>
              </div>
              <p className="text-white/80 text-sm">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center mt-12">
        <p className="text-white/60 text-sm">
          Ready to start? Use the search bar above to find your favorite content.
        </p>
      </div>
    </div>
  )
}