'use client'

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Settings, 
  Key, 
  Globe, 
  Volume2, 
  Play, 
  HardDrive,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DebridAccount {
  id: string
  provider: 'real-debrid' | 'alldebrid' | 'premiumize'
  username: string
  isActive: boolean
}

interface UserSettings {
  defaultQuality: string
  autoPlay: boolean
  autoSelectFiles: boolean
  notifications: boolean
  autoDeleteCompleted: boolean
  autoDeleteAfterDays: number
  maxConcurrentDownloads: number
  defaultProvider?: string
}

interface SettingsPanelProps {
  accounts: DebridAccount[]
  settings: UserSettings
  onAddAccount?: (provider: string, apiKey: string) => Promise<void>
  onRemoveAccount?: (accountId: string) => Promise<void>
  onUpdateSettings?: (settings: Partial<UserSettings>) => Promise<void>
  onClearCache?: () => Promise<void>
  onClearHistory?: (type: 'search' | 'watch' | 'all') => Promise<void>
  className?: string
}

const providerInfo = {
  'real-debrid': { name: 'Real-Debrid', icon: '🔵', url: 'https://real-debrid.com/apitoken' },
  'alldebrid': { name: 'AllDebrid', icon: '🟢', url: 'https://alldebrid.fr/apikeys' },
  'premiumize': { name: 'Premiumize', icon: '🟣', url: 'https://premiumize.me/account' }
}

const qualityOptions = [
  { value: 'any', label: 'Any Quality' },
  { value: '4K', label: '4K / 2160p' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' }
]

export function SettingsPanel({
  accounts,
  settings,
  onAddAccount,
  onRemoveAccount,
  onUpdateSettings,
  onClearCache,
  onClearHistory,
  className
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<'accounts' | 'preferences' | 'privacy'>('accounts')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountProvider, setNewAccountProvider] = useState<string>('')
  const [newAccountApiKey, setNewAccountApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  const handleAddAccount = async () => {
    if (!newAccountProvider || !newAccountApiKey.trim()) return
    
    setIsLoading(true)
    try {
      await onAddAccount?.(newAccountProvider, newAccountApiKey.trim())
      setShowAddAccount(false)
      setNewAccountProvider('')
      setNewAccountApiKey('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return
    
    setIsLoading(true)
    try {
      await onRemoveAccount?.(accountId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSettings = async () => {
    setIsLoading(true)
    try {
      await onUpdateSettings?.(localSettings)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async (type: 'search' | 'watch' | 'all') => {
    const confirmMessages = {
      search: 'Clear all search history?',
      watch: 'Clear all watch history?',
      all: 'Clear all history data?'
    }
    
    if (!confirm(confirmMessages[type])) return
    
    setIsLoading(true)
    try {
      await onClearHistory?.(type)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Clear all cached data? This will remove temporary files and may slow down initial loading.')) return
    
    setIsLoading(true)
    try {
      await onClearCache?.()
    } finally {
      setIsLoading(false)
    }
  }

  const sections = [
    { id: 'accounts', label: 'Debrid Accounts', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy & Data', icon: Globe }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
      </div>

      {/* Tab Navigation */}
      <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-1">
        <div className="flex">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1 justify-center',
                  activeSection === section.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-6">
        
        {/* Debrid Accounts Section */}
        {activeSection === 'accounts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Debrid Accounts</h3>
              <button
                onClick={() => setShowAddAccount(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Account
              </button>
            </div>

            {/* Existing Accounts */}
            <div className="space-y-3">
              {accounts.length > 0 ? (
                accounts.map((account) => {
                  const provider = providerInfo[account.provider]
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{provider.icon}</span>
                        <div>
                          <p className="text-white font-medium">{provider.name}</p>
                          <p className="text-white/60 text-sm">{account.username}</p>
                        </div>
                        {account.isActive && (
                          <span className="px-2 py-1 rounded-full text-xs backdrop-blur-xl bg-green-500/20 text-green-300 border border-green-400/30">
                            Active
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAccount(account.id)}
                        disabled={isLoading}
                        className="p-2 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                        title="Remove account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <p className="text-white/60 mb-2">No debrid accounts configured</p>
                  <p className="text-white/40 text-sm">Add an account to get started</p>
                </div>
              )}
            </div>

            {/* Add Account Modal */}
            {showAddAccount && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Add Debrid Account</h3>
                    <button
                      onClick={() => setShowAddAccount(false)}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Provider Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Provider
                      </label>
                      <div className="space-y-2">
                        {Object.entries(providerInfo).map(([key, provider]) => (
                          <button
                            key={key}
                            onClick={() => setNewAccountProvider(key)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
                              newAccountProvider === key
                                ? 'backdrop-blur-xl bg-blue-500/20 border-blue-400/30 text-blue-300'
                                : 'backdrop-blur-xl bg-white/5 border-white/10 text-white hover:border-white/20'
                            )}
                          >
                            <span className="text-lg">{provider.icon}</span>
                            <div className="text-left">
                              <p className="font-medium">{provider.name}</p>
                              <p className="text-xs opacity-60">Click to get API key</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* API Key Input */}
                    {newAccountProvider && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-white/90">
                            API Key
                          </label>
                          <a
                            href={providerInfo[newAccountProvider as keyof typeof providerInfo].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            Get API Key
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={newAccountApiKey}
                            onChange={(e) => setNewAccountApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-3 py-2 pr-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/80"
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowAddAccount(false)}
                        className="flex-1 px-4 py-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAccount}
                        disabled={!newAccountProvider || !newAccountApiKey.trim() || isLoading}
                        className="flex-1 px-4 py-2 rounded-lg backdrop-blur-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-all duration-300 disabled:opacity-50"
                      >
                        Add Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preferences Section */}
        {activeSection === 'preferences' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Quality */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Default Quality
                </label>
                <select
                  value={localSettings.defaultQuality}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultQuality: e.target.value }))}
                  className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none appearance-none"
                >
                  {qualityOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-800">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Provider */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Default Provider
                </label>
                <select
                  value={localSettings.defaultProvider || ''}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultProvider: e.target.value }))}
                  className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none appearance-none"
                >
                  <option value="" className="bg-gray-800">Auto (First available)</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.provider} className="bg-gray-800">
                      {providerInfo[account.provider].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Concurrent Downloads */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Max Concurrent Downloads
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localSettings.maxConcurrentDownloads}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, maxConcurrentDownloads: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              {/* Auto Delete After Days */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Auto Delete After (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={localSettings.autoDeleteAfterDays}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, autoDeleteAfterDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:border-white/40 focus:outline-none"
                  disabled={!localSettings.autoDeleteCompleted}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium">Auto Play</p>
                    <p className="text-white/60 text-sm">Automatically start playback when opening videos</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoPlay}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium">Auto Select Files</p>
                    <p className="text-white/60 text-sm">Automatically select all files in torrents</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoSelectFiles}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoSelectFiles: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium">Auto Delete Completed</p>
                    <p className="text-white/60 text-sm">Automatically delete completed downloads after specified days</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoDeleteCompleted}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoDeleteCompleted: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={handleUpdateSettings}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-xl bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30 transition-all duration-300 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </button>
          </div>
        )}

        {/* Privacy & Data Section */}
        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Privacy & Data</h3>
            
            <div className="space-y-4">
              <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-white font-medium mb-2">Clear Search History</h4>
                <p className="text-white/60 text-sm mb-4">Remove all your search queries and results</p>
                <button
                  onClick={() => handleClearHistory('search')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  Clear Search History
                </button>
              </div>

              <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-white font-medium mb-2">Clear Watch History</h4>
                <p className="text-white/60 text-sm mb-4">Remove all viewing history and progress</p>
                <button
                  onClick={() => handleClearHistory('watch')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  Clear Watch History
                </button>
              </div>

              <div className="p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-white font-medium mb-2">Clear Cache</h4>
                <p className="text-white/60 text-sm mb-4">Remove temporary files and cached data</p>
                <button
                  onClick={handleClearCache}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg backdrop-blur-xl bg-orange-500/20 border border-orange-400/30 text-orange-300 hover:bg-orange-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  Clear Cache
                </button>
              </div>

              <div className="p-4 backdrop-blur-xl bg-red-500/10 border border-red-400/20 rounded-lg">
                <h4 className="text-red-300 font-medium mb-2">Clear All Data</h4>
                <p className="text-red-400/80 text-sm mb-4">Remove all history, cache, and personal data (irreversible)</p>
                <button
                  onClick={() => handleClearHistory('all')}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}