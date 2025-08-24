// Core debrid service types and interfaces

export interface DebridProvider {
  name: string
  authenticate(apiKey: string): Promise<boolean>
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  addMagnet(magnetLink: string): Promise<string>
  getStreamLink(torrentId: string, fileIndex?: number): Promise<StreamLink>
  getUserInfo(): Promise<UserAccount>
  getTorrentInfo(torrentId: string): Promise<TorrentInfo>
  deleteTorrent(torrentId: string): Promise<boolean>
}

export interface SearchOptions {
  category?: 'all' | 'movies' | 'tv' | 'music' | 'games' | 'software' | 'books'
  quality?: '4K' | '1080p' | '720p' | '480p' | 'any'
  minSeeds?: number
  maxSize?: number // in GB
  sortBy?: 'relevance' | 'seeds' | 'size' | 'date'
  page?: number
  limit?: number
}

export interface SearchResult {
  id: string
  title: string
  hash: string
  magnetLink: string
  size: number // in bytes
  sizeFormatted: string // e.g., "2.5 GB"
  seeders: number
  leechers: number
  category: string
  quality?: string
  resolution?: string
  uploadDate: string
  provider: string
  files?: TorrentFile[]
  isInstantAvailable: boolean
}

export interface TorrentFile {
  id: string
  path: string
  size: number
  sizeFormatted: string
  selected: boolean
}

export interface TorrentInfo {
  id: string
  hash: string
  filename: string
  status: TorrentStatus
  progress: number // 0-100
  speed: number // bytes/sec
  speedFormatted: string
  eta: number // seconds
  etaFormatted: string
  size: number
  sizeFormatted: string
  files: TorrentFile[]
  addedDate: string
  completedDate?: string
  links?: string[]
}

export type TorrentStatus = 
  | 'waiting_files_selection'
  | 'queued'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'virus'
  | 'compressing'
  | 'uploading'
  | 'dead'

export interface StreamLink {
  url: string
  quality: string
  size: number
  sizeFormatted: string
  filename: string
  mimeType: string
  expires: string
  headers?: Record<string, string>
  subtitles?: SubtitleTrack[]
}

export interface SubtitleTrack {
  language: string
  languageCode: string
  url: string
  format: 'srt' | 'vtt' | 'ass'
}

export interface UserAccount {
  username: string
  email?: string
  isPremium: boolean
  premiumUntil?: string
  points?: number
  pointsUsed?: number
  trafficLeft?: number // in bytes
  trafficLeftFormatted?: string
  trafficTotal?: number // in bytes
  trafficTotalFormatted?: string
  avatar?: string
  type: 'free' | 'premium' | 'lifetime'
}

export interface DebridError {
  code: string
  message: string
  details?: any
}

export interface DebridResponse<T = any> {
  success: boolean
  data?: T
  error?: DebridError
}

// Provider-specific error codes
export enum ErrorCodes {
  // Authentication
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_API_KEY = 'EXPIRED_API_KEY',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Content
  MAGNET_NOT_FOUND = 'MAGNET_NOT_FOUND',
  TORRENT_NOT_READY = 'TORRENT_NOT_READY',
  TORRENT_NOT_FOUND = 'TORRENT_NOT_FOUND',
  FILE_NOT_AVAILABLE = 'FILE_NOT_AVAILABLE',
  
  // Service
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Content restrictions
  COPYRIGHT_VIOLATION = 'COPYRIGHT_VIOLATION',
  VIRUS_DETECTED = 'VIRUS_DETECTED',
  CONTENT_BLOCKED = 'CONTENT_BLOCKED',
  
  // Account
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  PREMIUM_REQUIRED = 'PREMIUM_REQUIRED',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// Rate limiting configuration
export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
}

// Provider configuration
export interface ProviderConfig {
  name: string
  baseUrl: string
  rateLimit: RateLimitConfig
  timeout: number // in milliseconds
  retries: number
  retryDelay: number // in milliseconds
}

// Instant availability check
export interface InstantAvailability {
  hash: string
  available: boolean
  files?: Array<{
    id: string
    filename: string
    size: number
  }>
}

// Search filters for advanced queries
export interface SearchFilters {
  minSize?: number // bytes
  maxSize?: number // bytes
  minSeeders?: number
  maxAge?: number // days
  verified?: boolean
  language?: string[]
  audioCodec?: string[]
  videoCodec?: string[]
  resolution?: string[]
  source?: string[] // e.g., 'BluRay', 'WEB-DL', 'HDTV'
}

// Torrent statistics
export interface TorrentStats {
  totalTorrents: number
  activeTorrents: number
  completedTorrents: number
  totalSize: number
  totalSizeFormatted: string
  downloadedToday: number
  downloadedTodayFormatted: string
}

// Provider capabilities
export interface ProviderCapabilities {
  instantAvailability: boolean
  torrentSearch: boolean
  magnetLinks: boolean
  directDownload: boolean
  streaming: boolean
  subtitles: boolean
  multipleFiles: boolean
  fileSelection: boolean
  zipDownload: boolean
  remoteUpload: boolean
}

export type ProviderName = 'real-debrid' | 'alldebrid' | 'premiumize' | 'debrid-link'