import { 
  DebridProvider, 
  ProviderName, 
  SearchResult, 
  TorrentInfo, 
  StreamLink, 
  UserAccount,
  DebridError,
  ErrorCodes,
  SearchOptions,
  InstantAvailability
} from './types'
import { RealDebridProvider } from './providers/real-debrid'
import { AllDebridProvider } from './providers/alldebrid'

export class DebridManager {
  private providers: Map<ProviderName, DebridProvider> = new Map()
  private activeProvider: ProviderName | null = null

  constructor() {
    // Initialize providers will be called when API keys are available
  }

  /**
   * Initialize a debrid provider with API key
   */
  async initializeProvider(providerName: ProviderName, apiKey: string): Promise<boolean> {
    try {
      let provider: DebridProvider

      switch (providerName) {
        case 'real-debrid':
          provider = new RealDebridProvider(apiKey)
          break
        case 'alldebrid':
          provider = new AllDebridProvider(apiKey)
          break
        default:
          throw new Error(`Unsupported provider: ${providerName}`)
      }

      // Test authentication
      const isAuthenticated = await provider.authenticate(apiKey)
      if (!isAuthenticated) {
        throw new Error('Authentication failed')
      }

      this.providers.set(providerName, provider)
      
      // Set as active provider if it's the first one
      if (!this.activeProvider) {
        this.activeProvider = providerName
      }

      return true
    } catch (error) {
      console.error(`Failed to initialize ${providerName}:`, error)
      return false
    }
  }

  /**
   * Remove a provider
   */
  removeProvider(providerName: ProviderName): void {
    this.providers.delete(providerName)
    
    if (this.activeProvider === providerName) {
      // Set a new active provider if available
      const availableProviders = Array.from(this.providers.keys())
      this.activeProvider = availableProviders.length > 0 ? availableProviders[0] : null
    }
  }

  /**
   * Set active provider
   */
  setActiveProvider(providerName: ProviderName): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} is not initialized`)
    }
    this.activeProvider = providerName
  }

  /**
   * Get active provider
   */
  getActiveProvider(): ProviderName | null {
    return this.activeProvider
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): ProviderName[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get provider instance
   */
  private getProvider(providerName?: ProviderName): DebridProvider {
    const targetProvider = providerName || this.activeProvider
    
    if (!targetProvider) {
      throw new Error('No active provider set')
    }

    const provider = this.providers.get(targetProvider)
    if (!provider) {
      throw new Error(`Provider ${targetProvider} is not initialized`)
    }

    return provider
  }

  /**
   * Search for content across providers or specific provider
   */
  async search(
    query: string, 
    options: SearchOptions = {}, 
    providerName?: ProviderName
  ): Promise<SearchResult[]> {
    try {
      if (providerName) {
        const provider = this.getProvider(providerName)
        return await provider.search(query, options)
      }

      // Search across all providers and combine results
      const searchPromises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
        try {
          const results = await provider.search(query, options)
          return results.map(result => ({ ...result, provider: name }))
        } catch (error) {
          console.error(`Search failed for ${name}:`, error)
          return []
        }
      })

      const allResults = await Promise.all(searchPromises)
      return allResults.flat()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Check instant availability across providers
   */
  async checkInstantAvailability(
    hashes: string[],
    providerName?: ProviderName
  ): Promise<Record<string, Record<ProviderName, InstantAvailability>>> {
    const result: Record<string, Record<ProviderName, InstantAvailability>> = {}
    
    // Initialize result structure
    for (const hash of hashes) {
      result[hash] = {}
    }

    const providersToCheck = providerName 
      ? [providerName]
      : Array.from(this.providers.keys())

    const checkPromises = providersToCheck.map(async (name) => {
      try {
        const provider = this.providers.get(name)!
        
        // Check if provider supports instant availability
        if ('checkInstantAvailability' in provider) {
          const availability = await (provider as any).checkInstantAvailability(hashes)
          
          for (const hash of hashes) {
            if (availability[hash]) {
              result[hash][name] = availability[hash]
            }
          }
        }
      } catch (error) {
        console.error(`Instant availability check failed for ${name}:`, error)
      }
    })

    await Promise.all(checkPromises)
    return result
  }

  /**
   * Add magnet link to specific provider
   */
  async addMagnet(magnetLink: string, providerName?: ProviderName): Promise<string> {
    try {
      const provider = this.getProvider(providerName)
      return await provider.addMagnet(magnetLink)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get torrent information
   */
  async getTorrentInfo(torrentId: string, providerName?: ProviderName): Promise<TorrentInfo> {
    try {
      const provider = this.getProvider(providerName)
      return await provider.getTorrentInfo(torrentId)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get stream link for torrent
   */
  async getStreamLink(
    torrentId: string, 
    fileIndex?: number, 
    providerName?: ProviderName
  ): Promise<StreamLink> {
    try {
      const provider = this.getProvider(providerName)
      return await provider.getStreamLink(torrentId, fileIndex)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get user account information
   */
  async getUserInfo(providerName?: ProviderName): Promise<UserAccount> {
    try {
      const provider = this.getProvider(providerName)
      return await provider.getUserInfo()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Delete torrent
   */
  async deleteTorrent(torrentId: string, providerName?: ProviderName): Promise<boolean> {
    try {
      const provider = this.getProvider(providerName)
      return await provider.deleteTorrent(torrentId)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get all torrents from a provider
   */
  async getTorrents(providerName?: ProviderName): Promise<TorrentInfo[]> {
    try {
      const provider = this.getProvider(providerName)
      
      if ('getTorrents' in provider) {
        return await (provider as any).getTorrents()
      }
      
      throw new Error('Provider does not support listing torrents')
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get torrents from all providers
   */
  async getAllTorrents(): Promise<Record<ProviderName, TorrentInfo[]>> {
    const result: Record<ProviderName, TorrentInfo[]> = {} as any
    
    const promises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        if ('getTorrents' in provider) {
          result[name] = await (provider as any).getTorrents()
        } else {
          result[name] = []
        }
      } catch (error) {
        console.error(`Failed to get torrents from ${name}:`, error)
        result[name] = []
      }
    })

    await Promise.all(promises)
    return result
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<ProviderName, boolean>> {
    const result: Record<ProviderName, boolean> = {} as any
    
    const promises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        await provider.getUserInfo()
        result[name] = true
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error)
        result[name] = false
      }
    })

    await Promise.all(promises)
    return result
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown): DebridError {
    if (error instanceof Error) {
      return {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: error.message,
        details: error.stack
      }
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as DebridError
    }
    
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      details: error
    }
  }
}

// Singleton instance for global use
export const debridManager = new DebridManager()

// Export types and classes for external use
export * from './types'
export { RealDebridProvider } from './providers/real-debrid'
export { AllDebridProvider } from './providers/alldebrid'

// Utility functions
export function createDebridManager(): DebridManager {
  return new DebridManager()
}

export function isValidMagnetLink(magnetLink: string): boolean {
  return magnetLink.startsWith('magnet:?xt=urn:btih:') && magnetLink.length >= 40
}

export function extractHashFromMagnet(magnetLink: string): string | null {
  const match = magnetLink.match(/xt=urn:btih:([a-fA-F0-9]{40}|[a-fA-F0-9]{32})/)
  return match ? match[1].toLowerCase() : null
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }
  
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}