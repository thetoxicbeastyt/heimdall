'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/media-manager/SearchBar'
import { ResultsGrid } from '@/components/media-manager/ResultsGrid'
import { EmptyState } from '@/components/media-manager/EmptyState'

// Mock data for testing
const mockSearchResults = [
  {
    id: '1',
    title: 'Dune: Part Two',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    quality: '4K',
    size: '12.5 GB',
    seeders: 2847,
    leechers: 423,
    provider: 'real-debrid',
    category: 'movie' as const,
    resolution: '2160p',
    runtime: '2h 46m',
    rating: 8.7,
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    isInstantAvailable: true
  },
  {
    id: '2',
    title: 'The Bear S03E01-E10',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqVjVwh8sD5fGdWAyg.jpg',
    quality: '1080p',
    size: '8.2 GB',
    seeders: 1523,
    leechers: 287,
    provider: 'alldebrid',
    category: 'tv' as const,
    resolution: '1080p',
    runtime: '30m avg',
    rating: 9.1,
    genre: ['Comedy', 'Drama'],
    isInstantAvailable: true
  },
  {
    id: '3',
    title: 'Deadpool & Wolverine',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    quality: '1080p',
    size: '6.8 GB',
    seeders: 3241,
    leechers: 892,
    provider: 'real-debrid',
    category: 'movie' as const,
    resolution: '1080p',
    runtime: '2h 7m',
    rating: 7.9,
    genre: ['Action', 'Comedy', 'Superhero'],
    isInstantAvailable: true
  },
  {
    id: '4',
    title: 'Inside Out 2',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    quality: '720p',
    size: '3.4 GB',
    seeders: 1876,
    leechers: 234,
    provider: 'premiumize',
    category: 'movie' as const,
    resolution: '720p',
    runtime: '1h 36m',
    rating: 8.2,
    genre: ['Animation', 'Family', 'Comedy'],
    isInstantAvailable: false
  },
  {
    id: '5',
    title: 'House of the Dragon S02',
    year: 2024,
    poster: 'https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
    quality: '4K',
    size: '45.2 GB',
    seeders: 987,
    leechers: 156,
    provider: 'real-debrid',
    category: 'tv' as const,
    resolution: '2160p',
    runtime: '1h avg',
    rating: 8.5,
    genre: ['Fantasy', 'Drama', 'Action'],
    isInstantAvailable: true
  },
  {
    id: '6',
    title: 'Oppenheimer',
    year: 2023,
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    quality: '1080p',
    size: '4.2 GB',
    seeders: 2156,
    leechers: 445,
    provider: 'alldebrid',
    category: 'movie' as const,
    resolution: '1080p',
    runtime: '3h 0m',
    rating: 8.4,
    genre: ['Biography', 'Drama', 'History'],
    isInstantAvailable: true
  },
  {
    id: '7',
    title: 'Stranger Things S04',
    year: 2022,
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    quality: '1080p',
    size: '28.7 GB',
    seeders: 3456,
    leechers: 678,
    provider: 'real-debrid',
    category: 'tv' as const,
    resolution: '1080p',
    runtime: '1h 15m avg',
    rating: 8.7,
    genre: ['Sci-Fi', 'Horror', 'Drama'],
    isInstantAvailable: true
  },
  {
    id: '8',
    title: 'Avatar: The Way of Water',
    year: 2022,
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    quality: '4K',
    size: '18.9 GB',
    seeders: 1234,
    leechers: 289,
    provider: 'premiumize',
    category: 'movie' as const,
    resolution: '2160p',
    runtime: '3h 12m',
    rating: 7.6,
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    isInstantAvailable: false
  }
]

interface SearchFilters {
  quality: string
  provider: string
}

export default function MediaManagerPage() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({ quality: 'any', provider: 'all' })
  const [results, setResults] = useState<typeof mockSearchResults>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    setQuery(searchQuery)
    setFilters(searchFilters)
    setIsLoading(true)
    setHasSearched(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Filter mock results based on search query
    let filteredResults = mockSearchResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.genre?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Apply quality filter
    if (searchFilters.quality !== 'any') {
      filteredResults = filteredResults.filter(result => 
        result.quality === searchFilters.quality
      )
    }

    // Apply provider filter
    if (searchFilters.provider !== 'all') {
      filteredResults = filteredResults.filter(result => 
        result.provider === searchFilters.provider
      )
    }

    setResults(filteredResults)
    setIsLoading(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion, filters)
  }

  const handlePlay = (result: typeof mockSearchResults[0]) => {
    console.log('Playing:', result.title)
    // TODO: Implement play functionality
  }

  const handleDownload = (result: typeof mockSearchResults[0]) => {
    console.log('Downloading:', result.title)
    // TODO: Implement download functionality
  }

  return (
    <div className="min-h-screen">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Media Manager
          </h1>
          <p className="text-white/70 text-lg">
            Search and stream content from your debrid providers
          </p>
        </div>

        {/* Search section */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={isLoading}
          />
        </div>

        {/* Results section */}
        <div className="min-h-[400px]">
          {!hasSearched ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ResultsGrid
              results={results}
              isLoading={isLoading}
              onPlay={handlePlay}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="text-center text-white/50 text-sm">
            <p>
              Connected to your debrid providers for instant streaming and downloads
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}