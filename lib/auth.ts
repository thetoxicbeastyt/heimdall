import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedUser extends User {
  id: string
  email?: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createServerClient()
    
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user as AuthenticatedUser
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function requireAuthentication(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.ip
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return clientIP || 'unknown'
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

export function createRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  const ip = getClientIP(request)
  return `ip:${ip}`
}