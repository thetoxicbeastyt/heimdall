// Generated TypeScript types for Supabase database schema
// This file is auto-generated based on the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database enums
export type DebridProvider = 'real-debrid' | 'alldebrid' | 'premiumize' | 'debrid-link'

export type DownloadStatus = 
  | 'queued' 
  | 'downloading' 
  | 'completed' 
  | 'error' 
  | 'paused' 
  | 'cancelled'

export type MediaType = 
  | 'movie'
  | 'tv_show' 
  | 'episode'
  | 'music'
  | 'game'
  | 'software'
  | 'book'
  | 'other'

// Database tables
export interface Database {
  public: {
    Tables: {
      user_debrid_accounts: {
        Row: {
          id: string
          user_id: string
          provider: DebridProvider
          api_key: string
          username: string | null
          is_active: boolean
          is_premium: boolean
          premium_expires_at: string | null
          points: number
          traffic_left: number
          last_verified_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: DebridProvider
          api_key: string
          username?: string | null
          is_active?: boolean
          is_premium?: boolean
          premium_expires_at?: string | null
          points?: number
          traffic_left?: number
          last_verified_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: DebridProvider
          api_key?: string
          username?: string | null
          is_active?: boolean
          is_premium?: boolean
          premium_expires_at?: string | null
          points?: number
          traffic_left?: number
          last_verified_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          results_count: number
          media_type: MediaType
          filters: Json
          provider: DebridProvider | null
          searched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          results_count?: number
          media_type?: MediaType
          filters?: Json
          provider?: DebridProvider | null
          searched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          results_count?: number
          media_type?: MediaType
          filters?: Json
          provider?: DebridProvider | null
          searched_at?: string
        }
      }
      user_downloads: {
        Row: {
          id: string
          user_id: string
          title: string
          magnet_hash: string
          magnet_link: string | null
          provider: DebridProvider
          status: DownloadStatus
          progress: number
          file_size: number
          download_speed: number
          eta_seconds: number
          torrent_id: string | null
          stream_link: string | null
          download_link: string | null
          quality: string | null
          media_type: MediaType
          year: number | null
          imdb_id: string | null
          tmdb_id: string | null
          season_number: number | null
          episode_number: number | null
          error_message: string | null
          metadata: Json
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          magnet_hash: string
          magnet_link?: string | null
          provider: DebridProvider
          status?: DownloadStatus
          progress?: number
          file_size?: number
          download_speed?: number
          eta_seconds?: number
          torrent_id?: string | null
          stream_link?: string | null
          download_link?: string | null
          quality?: string | null
          media_type?: MediaType
          year?: number | null
          imdb_id?: string | null
          tmdb_id?: string | null
          season_number?: number | null
          episode_number?: number | null
          error_message?: string | null
          metadata?: Json
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          magnet_hash?: string
          magnet_link?: string | null
          provider?: DebridProvider
          status?: DownloadStatus
          progress?: number
          file_size?: number
          download_speed?: number
          eta_seconds?: number
          torrent_id?: string | null
          stream_link?: string | null
          download_link?: string | null
          quality?: string | null
          media_type?: MediaType
          year?: number | null
          imdb_id?: string | null
          tmdb_id?: string | null
          season_number?: number | null
          episode_number?: number | null
          error_message?: string | null
          metadata?: Json
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_quality: string
          auto_select_files: boolean
          preferred_provider: DebridProvider | null
          download_path: string
          notifications_enabled: boolean
          auto_delete_completed: boolean
          auto_delete_after_days: number
          max_concurrent_downloads: number
          bandwidth_limit_mbps: number | null
          preferred_language: string
          subtitle_language: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_quality?: string
          auto_select_files?: boolean
          preferred_provider?: DebridProvider | null
          download_path?: string
          notifications_enabled?: boolean
          auto_delete_completed?: boolean
          auto_delete_after_days?: number
          max_concurrent_downloads?: number
          bandwidth_limit_mbps?: number | null
          preferred_language?: string
          subtitle_language?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_quality?: string
          auto_select_files?: boolean
          preferred_provider?: DebridProvider | null
          download_path?: string
          notifications_enabled?: boolean
          auto_delete_completed?: boolean
          auto_delete_after_days?: number
          max_concurrent_downloads?: number
          bandwidth_limit_mbps?: number | null
          preferred_language?: string
          subtitle_language?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      download_files: {
        Row: {
          id: string
          download_id: string
          file_index: number
          filename: string
          file_path: string
          file_size: number
          is_selected: boolean
          stream_link: string | null
          download_link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          download_id: string
          file_index: number
          filename: string
          file_path: string
          file_size: number
          is_selected?: boolean
          stream_link?: string | null
          download_link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          download_id?: string
          file_index?: number
          filename?: string
          file_path?: string
          file_size?: number
          is_selected?: boolean
          stream_link?: string | null
          download_link?: string | null
          created_at?: string
        }
      }
      api_usage_logs: {
        Row: {
          id: string
          user_id: string
          provider: DebridProvider
          endpoint: string
          method: string
          status_code: number
          response_time_ms: number | null
          error_message: string | null
          request_timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: DebridProvider
          endpoint: string
          method: string
          status_code: number
          response_time_ms?: number | null
          error_message?: string | null
          request_timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: DebridProvider
          endpoint?: string
          method?: string
          status_code?: number
          response_time_ms?: number | null
          error_message?: string | null
          request_timestamp?: string
        }
      }
    }
    Views: {
      user_download_stats: {
        Row: {
          user_id: string
          total_downloads: number
          completed_downloads: number
          active_downloads: number
          failed_downloads: number
          total_downloaded_bytes: number | null
          avg_download_speed: number | null
        }
      }
      provider_usage_stats: {
        Row: {
          provider: DebridProvider
          active_users: number
          total_downloads: number
          avg_file_size: number | null
          successful_downloads: number
          failed_downloads: number
        }
      }
    }
    Functions: {
      encrypt_api_key: {
        Args: { api_key: string }
        Returns: string
      }
      decrypt_api_key: {
        Args: { encrypted_key: string; encryption_key: string }
        Returns: string
      }
      get_user_active_providers: {
        Args: { p_user_id: string }
        Returns: Array<{
          provider: DebridProvider
          api_key: string
          username: string
          is_premium: boolean
        }>
      }
      cleanup_old_search_history: {
        Args: {}
        Returns: number
      }
      cleanup_old_api_logs: {
        Args: {}
        Returns: number
      }
    }
    Enums: {
      debrid_provider: DebridProvider
      download_status: DownloadStatus
      media_type: MediaType
    }
  }
}

// Helper types for common operations
export type UserDebridAccount = Database['public']['Tables']['user_debrid_accounts']['Row']
export type UserDebridAccountInsert = Database['public']['Tables']['user_debrid_accounts']['Insert']
export type UserDebridAccountUpdate = Database['public']['Tables']['user_debrid_accounts']['Update']

export type UserSearchHistory = Database['public']['Tables']['user_search_history']['Row']
export type UserSearchHistoryInsert = Database['public']['Tables']['user_search_history']['Insert']
export type UserSearchHistoryUpdate = Database['public']['Tables']['user_search_history']['Update']

export type UserDownload = Database['public']['Tables']['user_downloads']['Row']
export type UserDownloadInsert = Database['public']['Tables']['user_downloads']['Insert']
export type UserDownloadUpdate = Database['public']['Tables']['user_downloads']['Update']

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

export type DownloadFile = Database['public']['Tables']['download_files']['Row']
export type DownloadFileInsert = Database['public']['Tables']['download_files']['Insert']
export type DownloadFileUpdate = Database['public']['Tables']['download_files']['Update']

export type ApiUsageLog = Database['public']['Tables']['api_usage_logs']['Row']
export type ApiUsageLogInsert = Database['public']['Tables']['api_usage_logs']['Insert']
export type ApiUsageLogUpdate = Database['public']['Tables']['api_usage_logs']['Update']

// View types
export type UserDownloadStats = Database['public']['Views']['user_download_stats']['Row']
export type ProviderUsageStats = Database['public']['Views']['provider_usage_stats']['Row']

// Function return types
export type ActiveProvider = Database['public']['Functions']['get_user_active_providers']['Returns'][0]

// Extended types with computed properties
export interface UserDownloadWithFiles extends UserDownload {
  files?: DownloadFile[]
}

export interface UserDebridAccountWithStats extends UserDebridAccount {
  stats?: {
    totalDownloads: number
    successfulDownloads: number
    failedDownloads: number
    totalBytesDownloaded: number
  }
}

// Search filter types (for JSON columns)
export interface SearchFilters {
  quality?: string[]
  mediaType?: MediaType[]
  minSize?: number
  maxSize?: number
  year?: number
  genre?: string[]
  language?: string[]
}

// User preferences settings (for JSON column)
export interface UserPreferencesSettings {
  theme?: 'light' | 'dark' | 'system'
  autoPlay?: boolean
  skipIntros?: boolean
  autoNextEpisode?: boolean
  playbackSpeed?: number
  volume?: number
  subtitlesEnabled?: boolean
  subtitleSize?: 'small' | 'medium' | 'large'
  videoQualityPreference?: string[]
  downloadSettings?: {
    autoStart?: boolean
    maxRetries?: number
    retryDelay?: number
  }
}

// Download metadata types (for JSON column)
export interface DownloadMetadata {
  originalTitle?: string
  releaseGroup?: string
  codec?: string
  resolution?: string
  source?: string
  audio?: string[]
  subtitles?: string[]
  runtime?: number
  genres?: string[]
  actors?: string[]
  director?: string
  plot?: string
  poster?: string
  backdrop?: string
  rating?: number
  votes?: number
  certification?: string
}

// API response types for frontend consumption
export interface DebridAccountStatus {
  provider: DebridProvider
  username: string
  isPremium: boolean
  expiresAt?: string
  trafficLeft: number
  trafficLeftFormatted: string
  points: number
  isActive: boolean
}

export interface DownloadProgress {
  id: string
  title: string
  status: DownloadStatus
  progress: number
  speed: number
  speedFormatted: string
  eta: number
  etaFormatted: string
  size: number
  sizeFormatted: string
}

export interface SearchHistoryItem {
  id: string
  query: string
  mediaType: MediaType
  resultsCount: number
  searchedAt: string
  filters?: SearchFilters
}

// Utility types
export type DatabaseError = {
  code: string
  message: string
  details?: string
  hint?: string
}

export type DatabaseResponse<T> = {
  data: T | null
  error: DatabaseError | null
}

// Constants
export const DEBRID_PROVIDERS: readonly DebridProvider[] = [
  'real-debrid',
  'alldebrid', 
  'premiumize',
  'debrid-link'
] as const

export const DOWNLOAD_STATUSES: readonly DownloadStatus[] = [
  'queued',
  'downloading',
  'completed',
  'error',
  'paused', 
  'cancelled'
] as const

export const MEDIA_TYPES: readonly MediaType[] = [
  'movie',
  'tv_show',
  'episode', 
  'music',
  'game',
  'software',
  'book',
  'other'
] as const

export const DEFAULT_QUALITIES = [
  '4K',
  '2160p',
  '1080p',
  '720p',
  '480p',
  '360p'
] as const