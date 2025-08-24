'use client'

import { useState } from 'react'
import { 
  Search, 
  Download, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RotateCcw,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { cn, formatFileSize, formatDuration } from '@/lib/utils'
import { FixedSizeList as List } from 'react-window'

interface SearchHistoryItem {
  id: string
  query: string
  resultsCount: number
  searchedAt: string
  filters?: {
    quality?: string
    provider?: string
    category?: string
  }
}

interface DownloadHistoryItem {
  id: string
  title: string
  status: 'queued' | 'downloading' | 'completed' | 'error' | 'paused'
  progress: number
  size: number
  provider: string
  quality?: string
  createdAt: string
  completedAt?: string
  streamLink?: string
  downloadLink?: string
}

interface WatchHistoryItem {
  id: string
  title: string
  poster?: string
  progress: number // 0-100
  duration: number // seconds
  lastWatched: string
  quality?: string
  episode?: string
}

interface RecentActivityProps {
  searchHistory: SearchHistoryItem[]
  downloadHistory: DownloadHistoryItem[]
  watchHistory: WatchHistoryItem[]
  onSearch?: (query: string, filters?: any) => void
  onPlayVideo?: (item: WatchHistoryItem) => void
  onDownloadAction?: (item: DownloadHistoryItem, action: 'play' | 'download' | 'delete') => void
  onClearSearchHistory?: () => void
  onClearWatchHistory?: () => void
  className?: string
}

const statusColors = {
  queued: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
  downloading: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  completed: 'bg-green-500/20 text-green-300 border-green-400/30',
  error: 'bg-red-500/20 text-red-300 border-red-400/30',
  paused: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
}

const statusIcons = {
  queued: Clock,
  downloading: Loader2,
  completed: CheckCircle,
  error: XCircle,
  paused: Clock
}

export function RecentActivity({
  searchHistory,
  downloadHistory,
  watchHistory,
  onSearch,
  onPlayVideo,
  onDownloadAction,
  onClearSearchHistory,
  onClearWatchHistory,
  className
}: RecentActivityProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'downloads' | 'watching'>('search')

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Search History Item Component
  const SearchHistoryRow = ({ index, style }: { index: number; style: any }) => {
    const item = searchHistory[index]
    if (!item) return null

    return (
      <div style={style} className="px-4">
        <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white font-medium truncate">{item.query}</span>
            </div>
            <span className="text-white/50 text-xs whitespace-nowrap ml-2">
              {formatTimeAgo(item.searchedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span>{item.resultsCount} results</span>
              {item.filters?.quality && item.filters.quality !== 'any' && (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {item.filters.quality}
                </span>
              )}
              {item.filters?.provider && item.filters.provider !== 'all' && (
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30 capitalize">
                  {item.filters.provider.replace('-', ' ')}
                </span>
              )}
            </div>
            {onSearch && (
              <button
                onClick={() => onSearch(item.query, item.filters)}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                title="Search again"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Download History Item Component
  const DownloadHistoryRow = ({ index, style }: { index: number; style: any }) => {
    const item = downloadHistory[index]
    if (!item) return null

    const StatusIcon = statusIcons[item.status]

    return (
      <div style={style} className="px-4">
        <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all duration-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">{item.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                <span>{formatFileSize(item.size)}</span>
                {item.quality && <span>{item.quality}</span>}
                <span className="capitalize">{item.provider.replace('-', ' ')}</span>
              </div>
            </div>
            <span className="text-white/50 text-xs whitespace-nowrap ml-2">
              {formatTimeAgo(item.createdAt)}
            </span>
          </div>

          {/* Status and Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl border',
                  statusColors[item.status]
                )}>
                  <StatusIcon className={cn(
                    'h-3 w-3',
                    item.status === 'downloading' && 'animate-spin'
                  )} />
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              </div>
              <span className="text-xs text-white/60">{item.progress}%</span>
            </div>
            
            {item.status === 'downloading' && (
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {item.streamLink && item.status === 'completed' && (
              <button
                onClick={() => onDownloadAction?.(item, 'play')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-all duration-300 text-xs"
              >
                <Play className="h-3 w-3" />
                Play
              </button>
            )}
            {item.downloadLink && item.status === 'completed' && (
              <button
                onClick={() => onDownloadAction?.(item, 'download')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all duration-300 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                Download
              </button>
            )}
            <button
              onClick={() => onDownloadAction?.(item, 'delete')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all duration-300 text-xs ml-auto"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Watch History Item Component
  const WatchHistoryRow = ({ index, style }: { index: number; style: any }) => {
    const item = watchHistory[index]
    if (!item) return null

    return (
      <div style={style} className="px-4">
        <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all duration-300 cursor-pointer"
             onClick={() => onPlayVideo?.(item)}>
          <div className="flex items-start gap-4">
            {/* Poster/Thumbnail */}
            <div className="w-16 h-24 bg-gray-800/50 rounded-lg overflow-hidden flex-shrink-0">
              {item.poster ? (
                <img 
                  src={item.poster} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-white/30" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">{item.title}</h4>
              {item.episode && (
                <p className="text-white/60 text-sm truncate">{item.episode}</p>
              )}
              
              <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                {item.quality && <span>{item.quality}</span>}
                <span>{formatTimeAgo(item.lastWatched)}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">
                    {Math.round(item.progress)}% watched
                  </span>
                  <span className="text-xs text-white/60">
                    {formatDuration(item.duration)}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'search', label: 'Search History', count: searchHistory.length },
    { id: 'downloads', label: 'Downloads', count: downloadHistory.length },
    { id: 'watching', label: 'Continue Watching', count: watchHistory.length }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        
        {/* Clear buttons */}
        {activeTab === 'search' && searchHistory.length > 0 && onClearSearchHistory && (
          <button
            onClick={onClearSearchHistory}
            className="text-white/60 hover:text-red-400 text-sm transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
        {activeTab === 'watching' && watchHistory.length > 0 && onClearWatchHistory && (
          <button
            onClick={onClearWatchHistory}
            className="text-white/60 hover:text-red-400 text-sm transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-1">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center',
                activeTab === tab.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {tab.label}
              <span className="text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg overflow-hidden">
        {activeTab === 'search' && (
          <div className="h-[400px]">
            {searchHistory.length > 0 ? (
              <List
                height={400}
                itemCount={searchHistory.length}
                itemSize={100}
                className="scrollbar-thin"
              >
                {SearchHistoryRow}
              </List>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <p className="text-white/60">No search history yet</p>
                  <p className="text-white/40 text-sm">Your searches will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="h-[400px]">
            {downloadHistory.length > 0 ? (
              <List
                height={400}
                itemCount={downloadHistory.length}
                itemSize={140}
                className="scrollbar-thin"
              >
                {DownloadHistoryRow}
              </List>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Download className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <p className="text-white/60">No downloads yet</p>
                  <p className="text-white/40 text-sm">Your downloads will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'watching' && (
          <div className="h-[400px]">
            {watchHistory.length > 0 ? (
              <List
                height={400}
                itemCount={watchHistory.length}
                itemSize={120}
                className="scrollbar-thin"
              >
                {WatchHistoryRow}
              </List>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <p className="text-white/60">Nothing watched yet</p>
                  <p className="text-white/40 text-sm">Continue watching shows and movies</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}