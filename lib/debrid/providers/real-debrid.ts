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

interface RealDebridConfig {
  baseUrl: string
  apiKey: string
  timeout: number
}

interface RealDebridUser {
  id: number
  username: string
  email: string
  points: number
  locale: string
  avatar: string
  type: string
  premium: number
  expiration: string
}

interface RealDebridTorrent {
  id: string
  filename: string
  hash: string
  bytes: number
  host: string
  split: number
  progress: number
  status: string
  added: string
  files: Array<{
    id: number
    path: string
    bytes: number
    selected: number
  }>
  links: string[]
  ended?: string
  speed?: number
  seeders?: number
}

export class RealDebridProvider implements DebridProvider {
  public readonly name = 'Real-Debrid'
  private config: RealDebridConfig
  private lastRequestTime = 0
  private requestCount = 0
  private readonly minRequestInterval = 100 // 100ms between requests

  constructor(apiKey: string) {
    this.config = {
      baseUrl: 'https://api.real-debrid.com/rest/1.0',
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

    const url = `${this.config.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        return this.handleError(response.status, await response.text())
      }

      const data = await response.json()
      return { success: true, data }

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
          message = errorData.error || errorData.message || message
        } catch {
          message = body || message
        }
        return {
          success: false,
          error: { code: ErrorCodes.UNKNOWN_ERROR, message }
        }
    }
  }

  private mapTorrentStatus(status: string): TorrentStatus {
    const statusMap: Record<string, TorrentStatus> = {
      'waiting_files_selection': 'waiting_files_selection',
      'queued': 'queued',
      'downloading': 'downloading',
      'downloaded': 'downloaded',
      'error': 'error',
      'virus': 'virus',
      'compressing': 'compressing',
      'uploading': 'uploading',
      'dead': 'dead'
    }
    return statusMap[status] || 'error'
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
    const response = await this.makeRequest<RealDebridUser>('/user')
    return response.success
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Real-Debrid doesn't have a built-in search API
    // This would typically integrate with external torrent APIs
    // and then check instant availability with Real-Debrid
    
    // For now, return empty array as this requires external torrent search APIs
    return []
  }

  async checkInstantAvailability(hashes: string[]): Promise<Record<string, InstantAvailability>> {
    const hashString = hashes.join('/')
    const response = await this.makeRequest<Record<string, any>>(`/torrents/instantAvailability/${hashString}`)
    
    if (!response.success) {
      return {}
    }

    const result: Record<string, InstantAvailability> = {}
    
    for (const hash of hashes) {
      const availability = response.data?.[hash]
      result[hash] = {
        hash,
        available: !!availability && Object.keys(availability).length > 0,
        files: availability ? Object.values(availability).flat().map((file: any) => ({
          id: file.filename,
          filename: file.filename,
          size: file.filesize
        })) : undefined
      }
    }

    return result
  }

  async addMagnet(magnetLink: string): Promise<string> {
    const response = await this.makeRequest<{ id: string, uri: string }>('/torrents/addMagnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ magnet: magnetLink })
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add magnet')
    }

    return response.data!.id
  }

  async selectFiles(torrentId: string, fileIds: string): Promise<void> {
    await this.makeRequest(`/torrents/selectFiles/${torrentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ files: fileIds })
    })
  }

  async getTorrentInfo(torrentId: string): Promise<TorrentInfo> {
    const response = await this.makeRequest<RealDebridTorrent>(`/torrents/info/${torrentId}`)
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get torrent info')
    }

    const torrent = response.data!
    return {
      id: torrent.id,
      hash: torrent.hash,
      filename: torrent.filename,
      status: this.mapTorrentStatus(torrent.status),
      progress: torrent.progress,
      speed: torrent.speed || 0,
      speedFormatted: this.formatSpeed(torrent.speed || 0),
      eta: 0, // Calculate based on remaining bytes and speed
      etaFormatted: 'Unknown',
      size: torrent.bytes,
      sizeFormatted: this.formatBytes(torrent.bytes),
      files: torrent.files.map(file => ({
        id: file.id.toString(),
        path: file.path,
        size: file.bytes,
        sizeFormatted: this.formatBytes(file.bytes),
        selected: file.selected === 1
      })),
      addedDate: torrent.added,
      completedDate: torrent.ended,
      links: torrent.links
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

    const response = await this.makeRequest<{ download: string, filename: string, mimeType: string, filesize: number }>(`/unrestrict/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ link: linkUrl })
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get stream link')
    }

    const unrestricted = response.data!
    
    return {
      url: unrestricted.download,
      quality: this.extractQuality(unrestricted.filename),
      size: unrestricted.filesize,
      sizeFormatted: this.formatBytes(unrestricted.filesize),
      filename: unrestricted.filename,
      mimeType: unrestricted.mimeType || 'application/octet-stream',
      expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
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

  async getUserInfo(): Promise<UserAccount> {
    const response = await this.makeRequest<RealDebridUser>('/user')
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get user info')
    }

    const user = response.data!
    
    return {
      username: user.username,
      email: user.email,
      isPremium: user.type === 'premium',
      premiumUntil: user.expiration,
      points: user.points,
      avatar: user.avatar,
      type: user.type === 'premium' ? 'premium' : 'free'
    }
  }

  async deleteTorrent(torrentId: string): Promise<boolean> {
    const response = await this.makeRequest(`/torrents/delete/${torrentId}`, {
      method: 'DELETE'
    })
    
    return response.success
  }

  async getTorrents(): Promise<TorrentInfo[]> {
    const response = await this.makeRequest<RealDebridTorrent[]>('/torrents')
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get torrents')
    }

    return response.data!.map(torrent => ({
      id: torrent.id,
      hash: torrent.hash,
      filename: torrent.filename,
      status: this.mapTorrentStatus(torrent.status),
      progress: torrent.progress,
      speed: torrent.speed || 0,
      speedFormatted: this.formatSpeed(torrent.speed || 0),
      eta: 0,
      etaFormatted: 'Unknown',
      size: torrent.bytes,
      sizeFormatted: this.formatBytes(torrent.bytes),
      files: torrent.files.map(file => ({
        id: file.id.toString(),
        path: file.path,
        size: file.bytes,
        sizeFormatted: this.formatBytes(file.bytes),
        selected: file.selected === 1
      })),
      addedDate: torrent.added,
      completedDate: torrent.ended,
      links: torrent.links
    }))
  }
}