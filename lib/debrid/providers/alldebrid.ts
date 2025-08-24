import {
  DebridProvider,
  SearchResult,
  TorrentInfo,
  StreamLink,
  UserAccount,
  DebridResponse,
  ErrorCodes,
  SearchOptions,
  InstantAvailability,
  TorrentStatus
} from '../types'

interface AllDebridConfig {
  baseUrl: string
  apiKey: string
  timeout: number
}

interface AllDebridUser {
  username: string
  email: string
  isPremium: boolean
  premiumUntil: number
  lang: string
  preferedDomain: string
  fidelityPoints: number
  limitedHosters: string[]
  notifications: any[]
}

interface AllDebridMagnet {
  magnets: Array<{
    magnet: string
    hash: string
    name: string
    size: number
    ready: boolean
    id: number
    status: string
    statusCode: number
    downloaded: number
    uploaded: number
    seeders: number
    downloadSpeed: number
    processingPerc: number
    uploadSpeed: number
    uploadDate: number
    completionDate: number
    links: string[]
    type: string
    notified: boolean
    version: number
  }>
}

export class AllDebridProvider implements DebridProvider {
  public readonly name = 'AllDebrid'
  private config: AllDebridConfig
  private lastRequestTime = 0
  private requestCount = 0
  private readonly minRequestInterval = 200 // 200ms between requests

  constructor(apiKey: string) {
    this.config = {
      baseUrl: 'https://api.alldebrid.com/v4',
      apiKey,
      timeout: 10000
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      )
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<DebridResponse<T>> {
    await this.rateLimit()

    const url = new URL(`${this.config.baseUrl}${endpoint}`)
    url.searchParams.set('agent', 'Heimdall')
    url.searchParams.set('apikey', this.config.apiKey)

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        return this.handleError(response.status, await response.text())
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        return { success: true, data: result.data }
      } else {
        return {
          success: false,
          error: { 
            code: result.error?.code || ErrorCodes.UNKNOWN_ERROR, 
            message: result.error?.message || 'Unknown error' 
          }
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            success: false,
            error: { code: ErrorCodes.TIMEOUT, message: 'Request timeout' }
          }
        }
        return {
          success: false,
          error: { code: ErrorCodes.NETWORK_ERROR, message: error.message }
        }
      }
      return {
        success: false,
        error: { code: ErrorCodes.UNKNOWN_ERROR, message: 'Unknown error occurred' }
      }
    }
  }

  private handleError(status: number, body: string): DebridResponse {
    switch (status) {
      case 401:
        return {
          success: false,
          error: { code: ErrorCodes.INVALID_API_KEY, message: 'Invalid API key' }
        }
      case 403:
        return {
          success: false,
          error: { code: ErrorCodes.INSUFFICIENT_PERMISSIONS, message: 'Insufficient permissions' }
        }
      case 429:
        return {
          success: false,
          error: { code: ErrorCodes.RATE_LIMITED, message: 'Rate limit exceeded' }
        }
      case 503:
        return {
          success: false,
          error: { code: ErrorCodes.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable' }
        }
      default:
        let message = 'Unknown error'
        try {
          const errorData = JSON.parse(body)
          message = errorData.error?.message || errorData.message || message
        } catch {
          message = body || message
        }
        return {
          success: false,
          error: { code: ErrorCodes.UNKNOWN_ERROR, message }
        }
    }
  }

  private mapTorrentStatus(statusCode: number): TorrentStatus {
    const statusMap: Record<number, TorrentStatus> = {
      0: 'waiting_files_selection',
      1: 'queued',
      2: 'downloading', 
      3: 'downloaded',
      4: 'downloaded', // Completed
      5: 'error',
      6: 'virus',
      7: 'compressing',
      8: 'uploading',
      9: 'dead',
      10: 'error'
    }
    return statusMap[statusCode] || 'error'
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  private formatSpeed(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  async authenticate(apiKey: string): Promise<boolean> {
    this.config.apiKey = apiKey
    const response = await this.makeRequest<AllDebridUser>('/user')
    return response.success
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // AllDebrid doesn't have a built-in search API
    // This would typically integrate with external torrent APIs
    // For now, return empty array
    return []
  }

  async checkInstantAvailability(magnets: string[]): Promise<Record<string, InstantAvailability>> {
    const response = await this.makeRequest<{
      magnets: Array<{
        magnet: string
        hash: string
        instant: boolean
        files?: Array<{
          n: string // filename
          s: number // size
        }>
      }>
    }>('/magnet/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        magnets: JSON.stringify(magnets)
      })
    })

    if (!response.success) {
      return {}
    }

    const result: Record<string, InstantAvailability> = {}
    
    for (const magnet of response.data!.magnets) {
      result[magnet.hash] = {
        hash: magnet.hash,
        available: magnet.instant,
        files: magnet.files?.map(file => ({
          id: file.n,
          filename: file.n,
          size: file.s
        }))
      }
    }

    return result
  }

  async addMagnet(magnetLink: string): Promise<string> {
    const response = await this.makeRequest<{ magnet: { id: number } }>('/magnet/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 
        magnets: JSON.stringify([magnetLink])
      })
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add magnet')
    }

    return response.data!.magnet.id.toString()
  }

  async getTorrentInfo(torrentId: string): Promise<TorrentInfo> {
    const response = await this.makeRequest<AllDebridMagnet>(`/magnet/status?id=${torrentId}`)
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get torrent info')
    }

    const magnet = response.data!.magnets[0]
    if (!magnet) {
      throw new Error('Torrent not found')
    }

    const eta = magnet.downloadSpeed > 0 
      ? (magnet.size - magnet.downloaded) / magnet.downloadSpeed 
      : 0

    return {
      id: magnet.id.toString(),
      hash: magnet.hash,
      filename: magnet.name,
      status: this.mapTorrentStatus(magnet.statusCode),
      progress: magnet.processingPerc,
      speed: magnet.downloadSpeed,
      speedFormatted: this.formatSpeed(magnet.downloadSpeed),
      eta,
      etaFormatted: this.formatTime(eta),
      size: magnet.size,
      sizeFormatted: this.formatBytes(magnet.size),
      files: [], // Would need additional API call to get file details
      addedDate: new Date(magnet.uploadDate * 1000).toISOString(),
      completedDate: magnet.completionDate ? new Date(magnet.completionDate * 1000).toISOString() : undefined,
      links: magnet.links
    }
  }

  async getStreamLink(torrentId: string, fileIndex = 0): Promise<StreamLink> {
    const torrentInfo = await this.getTorrentInfo(torrentId)
    
    if (torrentInfo.status !== 'downloaded') {
      throw new Error('Torrent not ready for streaming')
    }

    if (!torrentInfo.links || torrentInfo.links.length === 0) {
      throw new Error('No download links available')
    }

    const linkUrl = torrentInfo.links[fileIndex]
    if (!linkUrl) {
      throw new Error('File index out of range')
    }

    // AllDebrid links are typically direct download links
    return {
      url: linkUrl,
      quality: this.extractQuality(torrentInfo.filename),
      size: torrentInfo.size,
      sizeFormatted: torrentInfo.sizeFormatted,
      filename: torrentInfo.filename,
      mimeType: this.getMimeType(torrentInfo.filename),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      headers: {
        'User-Agent': 'Heimdall/1.0.0'
      }
    }
  }

  private extractQuality(filename: string): string {
    const qualities = ['2160p', '4K', '1080p', '720p', '480p', '360p']
    for (const quality of qualities) {
      if (filename.toLowerCase().includes(quality.toLowerCase())) {
        return quality === '2160p' ? '4K' : quality
      }
    }
    return 'Unknown'
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'mkv': 'video/x-matroska',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'flac': 'audio/flac',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg'
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  async getUserInfo(): Promise<UserAccount> {
    const response = await this.makeRequest<AllDebridUser>('/user')
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get user info')
    }

    const user = response.data!
    
    return {
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil ? new Date(user.premiumUntil * 1000).toISOString() : undefined,
      points: user.fidelityPoints,
      type: user.isPremium ? 'premium' : 'free'
    }
  }

  async deleteTorrent(torrentId: string): Promise<boolean> {
    const response = await this.makeRequest(`/magnet/delete?id=${torrentId}`, {
      method: 'GET'
    })
    
    return response.success
  }

  async getTorrents(): Promise<TorrentInfo[]> {
    const response = await this.makeRequest<AllDebridMagnet>('/magnet/status')
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get torrents')
    }

    return response.data!.magnets.map(magnet => {
      const eta = magnet.downloadSpeed > 0 
        ? (magnet.size - magnet.downloaded) / magnet.downloadSpeed 
        : 0

      return {
        id: magnet.id.toString(),
        hash: magnet.hash,
        filename: magnet.name,
        status: this.mapTorrentStatus(magnet.statusCode),
        progress: magnet.processingPerc,
        speed: magnet.downloadSpeed,
        speedFormatted: this.formatSpeed(magnet.downloadSpeed),
        eta,
        etaFormatted: this.formatTime(eta),
        size: magnet.size,
        sizeFormatted: this.formatBytes(magnet.size),
        files: [],
        addedDate: new Date(magnet.uploadDate * 1000).toISOString(),
        completedDate: magnet.completionDate ? new Date(magnet.completionDate * 1000).toISOString() : undefined,
        links: magnet.links
      }
    })
  }

  async restartTorrent(torrentId: string): Promise<boolean> {
    const response = await this.makeRequest(`/magnet/restart?id=${torrentId}`, {
      method: 'GET'
    })
    
    return response.success
  }
}