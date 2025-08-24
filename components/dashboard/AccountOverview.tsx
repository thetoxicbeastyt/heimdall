'use client'

import { useState } from 'react'
import { 
  Server, 
  Calendar, 
  HardDrive, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Crown,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProviderAccount {
  id: string
  provider: 'real-debrid' | 'alldebrid' | 'premiumize'
  username: string
  isPremium: boolean
  isActive: boolean
  expiresAt?: string
  trafficLeft: number
  trafficLeftFormatted: string
  points?: number
  lastVerified: string
}

interface DownloadStats {
  totalDownloads: number
  completedDownloads: number
  activeDownloads: number
  failedDownloads: number
  totalSize: string
  todayDownloads: number
}

interface AccountOverviewProps {
  accounts: ProviderAccount[]
  downloadStats: DownloadStats
  isLoading?: boolean
  onRefreshAccount?: (accountId: string) => void
  className?: string
}

const providerInfo = {
  'real-debrid': {
    name: 'Real-Debrid',
    color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    icon: '🔵'
  },
  'alldebrid': {
    name: 'AllDebrid',
    color: 'bg-green-500/20 text-green-300 border-green-400/30',
    icon: '🟢'
  },
  'premiumize': {
    name: 'Premiumize',
    color: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    icon: '🟣'
  }
}

export function AccountOverview({
  accounts,
  downloadStats,
  isLoading = false,
  onRefreshAccount,
  className
}: AccountOverviewProps) {
  const [refreshingAccounts, setRefreshingAccounts] = useState<Set<string>>(new Set())

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return 'Expired'
    } else if (diffDays === 0) {
      return 'Expires today'
    } else if (diffDays === 1) {
      return 'Expires tomorrow'
    } else if (diffDays <= 30) {
      return `Expires in ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleRefreshAccount = async (accountId: string) => {
    if (!onRefreshAccount) return
    
    setRefreshingAccounts(prev => new Set(prev).add(accountId))
    try {
      await onRefreshAccount(accountId)
    } finally {
      setRefreshingAccounts(prev => {
        const next = new Set(prev)
        next.delete(accountId)
        return next
      })
    }
  }

  const getAccountStatusColor = (account: ProviderAccount) => {
    if (!account.isActive) return 'text-gray-400'
    if (!account.isPremium) return 'text-yellow-400'
    if (account.expiresAt) {
      const expiresAt = new Date(account.expiresAt)
      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 7) return 'text-red-400'
      if (daysLeft <= 30) return 'text-yellow-400'
    }
    return 'text-green-400'
  }

  const getAccountStatusIcon = (account: ProviderAccount) => {
    if (!account.isActive) return <XCircle className="h-4 w-4" />
    if (!account.isPremium) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded mb-4 w-3/4" />
            <div className="h-8 bg-white/10 rounded mb-2" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Provider Accounts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Active Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.length > 0 ? (
            accounts.map((account) => {
              const provider = providerInfo[account.provider]
              const statusColor = getAccountStatusColor(account)
              const statusIcon = getAccountStatusIcon(account)
              const isRefreshing = refreshingAccounts.has(account.id)

              return (
                <div
                  key={account.id}
                  className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4 hover:border-white/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{provider.icon}</span>
                      <span className="font-medium text-white">{provider.name}</span>
                    </div>
                    <div className={cn('flex items-center gap-1', statusColor)}>
                      {statusIcon}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Username</span>
                      <span className="text-white font-medium">{account.username}</span>
                    </div>

                    {account.isPremium && (
                      <div className="flex justify-between">
                        <span className="text-white/70">Plan</span>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Crown className="h-3 w-3" />
                          <span className="font-medium">Premium</span>
                        </div>
                      </div>
                    )}

                    {account.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-white/70">Expires</span>
                        <span className={cn('font-medium', statusColor)}>
                          {formatDate(account.expiresAt)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-white/70">Traffic Left</span>
                      <span className="text-white font-medium">{account.trafficLeftFormatted}</span>
                    </div>

                    {account.points && (
                      <div className="flex justify-between">
                        <span className="text-white/70">Points</span>
                        <span className="text-white font-medium">{account.points.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleRefreshAccount(account.id)}
                      disabled={isRefreshing}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-sm font-medium',
                        'backdrop-blur-xl bg-white/10 border border-white/20',
                        'text-white hover:bg-white/20 hover:border-white/30',
                        'transition-all duration-300 disabled:opacity-50',
                        'flex items-center justify-center gap-2'
                      )}
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        'Refresh Status'
                      )}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-8 text-center">
              <Server className="h-12 w-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/70 mb-2">No debrid accounts configured</p>
              <p className="text-white/50 text-sm">Add a provider to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Downloads */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg backdrop-blur-xl bg-blue-500/20 border border-blue-400/30">
                <Download className="h-4 w-4 text-blue-300" />
              </div>
              <span className="text-2xl font-bold text-white">{downloadStats.totalDownloads}</span>
            </div>
            <p className="text-white/70 text-sm">Total Downloads</p>
            <p className="text-white/50 text-xs mt-1">
              {downloadStats.todayDownloads} today
            </p>
          </div>

          {/* Completed Downloads */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg backdrop-blur-xl bg-green-500/20 border border-green-400/30">
                <CheckCircle className="h-4 w-4 text-green-300" />
              </div>
              <span className="text-2xl font-bold text-white">{downloadStats.completedDownloads}</span>
            </div>
            <p className="text-white/70 text-sm">Completed</p>
            <p className="text-white/50 text-xs mt-1">
              {downloadStats.totalDownloads > 0 
                ? Math.round((downloadStats.completedDownloads / downloadStats.totalDownloads) * 100) 
                : 0}% success rate
            </p>
          </div>

          {/* Active Downloads */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg backdrop-blur-xl bg-yellow-500/20 border border-yellow-400/30">
                <Zap className="h-4 w-4 text-yellow-300" />
              </div>
              <span className="text-2xl font-bold text-white">{downloadStats.activeDownloads}</span>
            </div>
            <p className="text-white/70 text-sm">Active</p>
            <p className="text-white/50 text-xs mt-1">Currently downloading</p>
          </div>

          {/* Storage Used */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg backdrop-blur-xl bg-purple-500/20 border border-purple-400/30">
                <HardDrive className="h-4 w-4 text-purple-300" />
              </div>
              <span className="text-2xl font-bold text-white">{downloadStats.totalSize}</span>
            </div>
            <p className="text-white/70 text-sm">Total Downloaded</p>
            <p className="text-white/50 text-xs mt-1">Across all providers</p>
          </div>
        </div>
      </div>
    </div>
  )
}