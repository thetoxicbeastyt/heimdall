import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Server-side Supabase client (for API routes and server components)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client with elevated privileges (use sparingly)
export const createAdminClient = () => {
  return createServerClient()
}

// Typed database helpers
export class DatabaseService {
  constructor(private client: ReturnType<typeof createClient<Database>>) {}

  // User Debrid Accounts
  async getUserDebridAccounts(userId: string) {
    return await this.client
      .from('user_debrid_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
  }

  async addDebridAccount(account: Database['public']['Tables']['user_debrid_accounts']['Insert']) {
    return await this.client
      .from('user_debrid_accounts')
      .insert(account as any)
      .select()
      .single()
  }

  async updateDebridAccount(
    id: string, 
    updates: any
  ) {
    return await (this.client as any)
      .from('user_debrid_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deleteDebridAccount(id: string) {
    return await this.client
      .from('user_debrid_accounts')
      .delete()
      .eq('id', id)
  }

  // User Search History
  async getUserSearchHistory(userId: string, limit = 50) {
    return await this.client
      .from('user_search_history')
      .select('*')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit)
  }

  async addSearchHistory(search: Database['public']['Tables']['user_search_history']['Insert']) {
    return await this.client
      .from('user_search_history')
      .insert(search as any)
      .select()
      .single()
  }

  async clearSearchHistory(userId: string) {
    return await this.client
      .from('user_search_history')
      .delete()
      .eq('user_id', userId)
  }

  // User Downloads
  async getUserDownloads(userId: string, status?: Database['public']['Enums']['download_status']) {
    let query = this.client
      .from('user_downloads')
      .select(`
        *,
        download_files (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    return await query
  }

  async getDownloadById(id: string) {
    return await this.client
      .from('user_downloads')
      .select(`
        *,
        download_files (*)
      `)
      .eq('id', id)
      .single()
  }

  async addDownload(download: Database['public']['Tables']['user_downloads']['Insert']) {
    return await this.client
      .from('user_downloads')
      .insert(download as any)
      .select()
      .single()
  }

  async updateDownload(
    id: string, 
    updates: any
  ) {
    return await (this.client as any)
      .from('user_downloads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  async deleteDownload(id: string) {
    return await this.client
      .from('user_downloads')
      .delete()
      .eq('id', id)
  }

  // Download Files
  async addDownloadFiles(files: Database['public']['Tables']['download_files']['Insert'][]) {
    return await this.client
      .from('download_files')
      .insert(files as any)
      .select()
  }

  async updateDownloadFile(
    id: string,
    updates: any
  ) {
    return await (this.client as any)
      .from('download_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  // User Preferences
  async getUserPreferences(userId: string) {
    return await this.client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
  }

  async updateUserPreferences(
    userId: string,
    preferences: any
  ) {
    return await (this.client as any)
      .from('user_preferences')
      .upsert({ ...preferences, user_id: userId })
      .select()
      .single()
  }

  // API Usage Logs
  async logApiUsage(log: Database['public']['Tables']['api_usage_logs']['Insert']) {
    return await this.client
      .from('api_usage_logs')
      .insert(log as any)
  }

  async getApiUsageStats(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await this.client
      .from('api_usage_logs')
      .select('provider, status_code, count(*)')
      .eq('user_id', userId)
      .gte('request_timestamp', startDate.toISOString())
  }

  // Statistics Views
  async getUserDownloadStats(userId: string) {
    return await this.client
      .from('user_download_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
  }

  async getProviderUsageStats() {
    return await this.client
      .from('provider_usage_stats')
      .select('*')
      .order('active_users', { ascending: false })
  }

  // Real-time subscriptions
  subscribeToUserDownloads(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`user_downloads:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_downloads',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToDownloadProgress(downloadId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`download_progress:${downloadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_downloads',
          filter: `id=eq.${downloadId}`
        },
        callback
      )
      .subscribe()
  }
}

// Create service instances
export const dbService = new DatabaseService(supabase)
export const serverDbService = new DatabaseService(createServerClient())

// Utility functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password })
}

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
}

// Error handling utility
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST301') {
    return 'Resource not found'
  }
  
  if (error?.code === '23505') {
    return 'This item already exists'
  }
  
  if (error?.code === '23503') {
    return 'Referenced item not found'
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Type exports for convenience
export type {
  Database,
  UserDebridAccount,
  UserDownload,
  UserSearchHistory,
  UserPreferences,
  DownloadFile,
  ApiUsageLog,
  DebridProvider,
  DownloadStatus,
  MediaType
} from './types'