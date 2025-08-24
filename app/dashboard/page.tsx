'use client'

import { useState, useEffect } from 'react'
import { AccountOverview } from '@/components/dashboard/AccountOverview'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { SettingsPanel } from '@/components/dashboard/SettingsPanel'

// Mock data for demonstration
const mockProviderAccounts = [
  {
    id: '1',
    provider: 'real-debrid' as const,
    username: 'user123',
    isPremium: true,
    isActive: true,
    expiresAt: '2024-12-31T23:59:59Z',
    trafficLeft: 2147483648000, // 2TB
    trafficLeftFormatted: '2.0 TB',
    points: 15420,
    lastVerified: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    provider: 'alldebrid' as const,
    username: 'myuser',
    isPremium: true,
    isActive: true,
    expiresAt: '2024-06-15T23:59:59Z',
    trafficLeft: 536870912000, // 500GB
    trafficLeftFormatted: '500 GB',
    points: 8750,
    lastVerified: '2024-01-15T09:45:00Z'
  }
]

const mockDownloadStats = {
  totalDownloads: 127,
  completedDownloads: 118,
  activeDownloads: 3,
  failedDownloads: 6,
  totalSize: '847 GB',
  todayDownloads: 5
}

const mockSearchHistory = [
  {
    id: '1',
    query: 'Dune Part Two 2024',
    resultsCount: 45,
    searchedAt: '2024-01-15T14:30:00Z',
    filters: { quality: '1080p', provider: 'real-debrid' }
  },
  {
    id: '2',
    query: 'The Bear Season 3',
    resultsCount: 23,
    searchedAt: '2024-01-15T12:15:00Z',
    filters: { quality: 'any', provider: 'all' }
  },
  {
    id: '3',
    query: 'Deadpool Wolverine',
    resultsCount: 67,
    searchedAt: '2024-01-15T10:45:00Z',
    filters: { quality: '4K', provider: 'alldebrid' }
  },
  {
    id: '4',
    query: 'House of Dragon S02',
    resultsCount: 34,
    searchedAt: '2024-01-14T20:22:00Z'
  },
  {
    id: '5',
    query: 'Inside Out 2',
    resultsCount: 28,
    searchedAt: '2024-01-14T18:10:00Z',
    filters: { quality: '720p' }
  }
]

const mockDownloadHistory = [
  {
    id: '1',
    title: 'Dune: Part Two (2024) 1080p BluRay',
    status: 'completed' as const,
    progress: 100,
    size: 13421772800, // 12.5GB
    provider: 'real-debrid',
    quality: '1080p',
    createdAt: '2024-01-15T14:35:00Z',
    completedAt: '2024-01-15T15:20:00Z',
    streamLink: 'https://stream.example.com/dune-part-two.mp4',
    downloadLink: 'https://download.example.com/dune-part-two.mp4'
  },
  {
    id: '2',
    title: 'The Bear S03E01-E10 Complete 720p',
    status: 'downloading' as const,
    progress: 67,
    size: 8589934592, // 8GB
    provider: 'alldebrid',
    quality: '720p',
    createdAt: '2024-01-15T13:20:00Z'
  },
  {
    id: '3',
    title: 'Deadpool & Wolverine 2024 4K UHD',
    status: 'queued' as const,
    progress: 0,
    size: 32212254720, // 30GB
    provider: 'real-debrid',
    quality: '4K',
    createdAt: '2024-01-15T16:10:00Z'
  },
  {
    id: '4',
    title: 'Inside Out 2 (2024) 1080p WEB-DL',
    status: 'completed' as const,
    progress: 100,
    size: 4294967296, // 4GB
    provider: 'alldebrid',
    quality: '1080p',
    createdAt: '2024-01-14T19:30:00Z',
    completedAt: '2024-01-14T20:15:00Z',
    streamLink: 'https://stream.example.com/inside-out-2.mp4'
  },
  {
    id: '5',
    title: 'House of the Dragon S02E08 Final',
    status: 'error' as const,
    progress: 23,
    size: 2147483648, // 2GB
    provider: 'real-debrid',
    quality: '1080p',
    createdAt: '2024-01-14T21:45:00Z'
  }
]

const mockWatchHistory = [
  {
    id: '1',
    title: 'Dune: Part Two',
    poster: 'https://image.tmdb.org/t/p/w200/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    progress: 45,
    duration: 9960, // 2h 46m
    lastWatched: '2024-01-15T20:30:00Z',
    quality: '1080p'
  },
  {
    id: '2',
    title: 'The Bear',
    poster: 'https://image.tmdb.org/t/p/w200/sHFlbKS3WLqVjVwh8sD5fGdWAyg.jpg',
    progress: 78,
    duration: 1800, // 30m
    lastWatched: '2024-01-15T19:15:00Z',
    quality: '720p',
    episode: 'S03E05 - Children'
  },
  {
    id: '3',
    title: 'Inside Out 2',
    poster: 'https://image.tmdb.org/t/p/w200/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    progress: 92,
    duration: 5760, // 1h 36m
    lastWatched: '2024-01-14T22:45:00Z',
    quality: '1080p'
  }
]

const mockUserSettings = {
  defaultQuality: '1080p',
  autoPlay: true,
  autoSelectFiles: true,
  notifications: true,
  autoDeleteCompleted: false,
  autoDeleteAfterDays: 30,
  maxConcurrentDownloads: 3,
  defaultProvider: 'real-debrid'
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState(mockProviderAccounts)
  const [settings, setSettings] = useState(mockUserSettings)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleRefreshAccount = async (accountId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Refreshed account:', accountId)
  }

  const handleSearch = (query: string, filters?: any) => {
    console.log('Searching for:', query, filters)
    // Navigate to search page with query
  }

  const handlePlayVideo = (item: any) => {
    console.log('Playing video:', item.title)
    // Open video player
  }

  const handleDownloadAction = (item: any, action: 'play' | 'download' | 'delete') => {
    console.log('Download action:', action, item.title)
    switch (action) {
      case 'play':
        // Open video player
        break
      case 'download':
        // Open download link
        window.open(item.downloadLink, '_blank')
        break
      case 'delete':
        // Delete download
        break
    }
  }

  const handleAddAccount = async (provider: string, apiKey: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newAccount = {
      id: Date.now().toString(),
      provider: provider as any,
      username: 'newuser',
      isPremium: true,
      isActive: true,
      expiresAt: '2024-12-31T23:59:59Z',
      trafficLeft: 1073741824000, // 1TB
      trafficLeftFormatted: '1.0 TB',
      points: 5000,
      lastVerified: new Date().toISOString()
    }
    
    setAccounts(prev => [...prev, newAccount])
  }

  const handleRemoveAccount = async (accountId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setAccounts(prev => prev.filter(acc => acc.id !== accountId))
  }

  const handleUpdateSettings = async (newSettings: Partial<typeof settings>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const handleClearCache = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log('Cache cleared')
  }

  const handleClearHistory = async (type: 'search' | 'watch' | 'all') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Cleared history:', type)
  }

  const handleClearSearchHistory = async () => {
    await handleClearHistory('search')
  }

  const handleClearWatchHistory = async () => {
    await handleClearHistory('watch')
  }

  return (
    <div className="min-h-screen">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-8 py-8 space-y-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-white/70 text-lg">
            Manage your debrid accounts, downloads, and preferences
          </p>
        </div>

        {/* Account Overview Section */}
        <AccountOverview
          accounts={accounts}
          downloadStats={mockDownloadStats}
          isLoading={isLoading}
          onRefreshAccount={handleRefreshAccount}
        />

        {/* Recent Activity Section */}
        <RecentActivity
          searchHistory={mockSearchHistory}
          downloadHistory={mockDownloadHistory}
          watchHistory={mockWatchHistory}
          onSearch={handleSearch}
          onPlayVideo={handlePlayVideo}
          onDownloadAction={handleDownloadAction}
          onClearSearchHistory={handleClearSearchHistory}
          onClearWatchHistory={handleClearWatchHistory}
        />

        {/* Settings Panel */}
        <SettingsPanel
          accounts={accounts}
          settings={settings}
          onAddAccount={handleAddAccount}
          onRemoveAccount={handleRemoveAccount}
          onUpdateSettings={handleUpdateSettings}
          onClearCache={handleClearCache}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  )
}