'use client'

import { useState } from 'react'
import { Play, Download, Calendar, HardDrive, Users, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultCardProps {
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
  onPlay?: () => void
  onDownload?: () => void
  className?: string
}

export function ResultCard({
  id,
  title,
  year,
  poster,
  quality,
  size,
  seeders,
  leechers,
  provider,
  category,
  resolution,
  runtime,
  rating,
  genre,
  isInstantAvailable = false,
  onPlay,
  onDownload,
  className
}: ResultCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const categoryColors = {
    movie: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    tv: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    music: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
    game: 'bg-green-500/20 text-green-300 border-green-400/30',
    software: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    other: 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  }

  const qualityColors = {
    '4K': 'bg-red-500/20 text-red-300 border-red-400/30',
    '2160p': 'bg-red-500/20 text-red-300 border-red-400/30',
    '1080p': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    '720p': 'bg-green-500/20 text-green-300 border-green-400/30',
    '480p': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
  }

  const getQualityColor = (quality?: string) => {
    if (!quality) return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    return qualityColors[quality as keyof typeof qualityColors] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div
      className={cn(
        'group relative',
        'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
        'border border-white/20 rounded-lg overflow-hidden',
        'hover:border-white/40 hover:scale-[1.02]',
        'transition-all duration-300 cursor-pointer',
        isInstantAvailable && 'ring-1 ring-green-400/30 shadow-lg shadow-green-500/10',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Instant availability indicator */}
      {isInstantAvailable && (
        <div className="absolute top-2 left-2 z-20">
          <div className="backdrop-blur-xl bg-green-500/20 text-green-300 border border-green-400/30 px-2 py-1 rounded-full text-xs font-medium">
            Instant
          </div>
        </div>
      )}

      {/* Poster section */}
      <div className="aspect-[2/3] relative bg-gray-800/20">
        {poster && !imageError ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <div className="text-center">
              <HardDrive className="h-12 w-12 mx-auto mb-2" />
              <p className="text-xs">{category.toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Quality badge */}
        {quality && (
          <div className="absolute top-2 right-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl border',
              getQualityColor(quality)
            )}>
              {quality}
            </span>
          </div>
        )}

        {/* Action buttons overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/60 flex items-center justify-center gap-2',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}>
          {onPlay && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlay()
              }}
              className={cn(
                'p-3 rounded-full',
                'backdrop-blur-xl bg-white/20 border border-white/30',
                'text-white hover:bg-white/30 hover:scale-110',
                'transition-all duration-300'
              )}
              title="Stream now"
            >
              <Play className="h-5 w-5 fill-current" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
              className={cn(
                'p-3 rounded-full',
                'backdrop-blur-xl bg-white/20 border border-white/30',
                'text-white hover:bg-white/30 hover:scale-110',
                'transition-all duration-300'
              )}
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-white/90 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1">
            {year && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Calendar className="h-3 w-3" />
                {year}
              </div>
            )}
            {rating && (
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
              </div>
            )}
            {runtime && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock className="h-3 w-3" />
                {runtime}
              </div>
            )}
          </div>
        </div>

        {/* Genre tags */}
        {genre && genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {genre.slice(0, 2).map((g) => (
              <span
                key={g}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs backdrop-blur-xl bg-white/10 text-white/70 border border-white/20"
              >
                {g}
              </span>
            ))}
            {genre.length > 2 && (
              <span className="text-xs text-white/50">+{genre.length - 2}</span>
            )}
          </div>
        )}

        {/* Stats section */}
        <div className="space-y-2">
          {/* Size and resolution */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Size</span>
            <span className="text-white font-medium">{size}</span>
          </div>
          
          {resolution && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Resolution</span>
              <span className="text-white font-medium">{resolution}</span>
            </div>
          )}

          {/* Seeders and leechers */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-green-400" />
                <span className="text-green-400">{formatNumber(seeders)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-red-400" />
                <span className="text-red-400">{formatNumber(leechers)}</span>
              </div>
            </div>
            
            {/* Category badge */}
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl border',
              categoryColors[category]
            )}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
        </div>

        {/* Provider */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Provider</span>
            <span className="text-xs text-white/80 capitalize">
              {provider.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Hover details overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="text-xs text-white/80 space-y-1">
              <p className="font-medium">Quick Info</p>
              <div className="grid grid-cols-2 gap-2">
                <span>Seeders: {seeders}</span>
                <span>Leechers: {leechers}</span>
                <span>Size: {size}</span>
                <span>Quality: {quality || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}