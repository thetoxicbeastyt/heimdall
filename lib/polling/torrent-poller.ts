import { debridManager } from '@/lib/debrid'
import { debridCache } from '@/lib/cache'
import type { DebridProvider, TorrentInfo } from '@/lib/debrid/types'

interface PollingJob {
  id: string
  torrentId: string
  provider: DebridProvider
  userId: string
  startTime: number
  retryCount: number
  onComplete?: (streamLink: string) => void
  onError?: (error: string) => void
}

class TorrentPoller {
  private jobs: Map<string, PollingJob> = new Map()
  private intervalId: NodeJS.Timeout | null = null
  private readonly pollInterval = 5000 // 5 seconds
  private readonly maxRetries = 60 // 5 minutes total
  private readonly maxJobs = 100

  constructor() {
    this.startPolling()
  }

  private startPolling() {
    if (this.intervalId) return

    this.intervalId = setInterval(async () => {
      await this.processJobs()
    }, this.pollInterval)
  }

  private stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  addJob(job: Omit<PollingJob, 'startTime' | 'retryCount'>): string {
    // Cleanup old jobs if we're at capacity
    if (this.jobs.size >= this.maxJobs) {
      this.cleanupOldJobs()
    }

    const pollingJob: PollingJob = {
      ...job,
      startTime: Date.now(),
      retryCount: 0
    }

    this.jobs.set(job.id, pollingJob)
    console.log(`Added polling job ${job.id} for torrent ${job.torrentId}`)
    
    return job.id
  }

  removeJob(jobId: string) {
    const removed = this.jobs.delete(jobId)
    if (removed) {
      console.log(`Removed polling job ${jobId}`)
    }
    
    // Stop polling if no more jobs
    if (this.jobs.size === 0) {
      this.stopPolling()
    }
  }

  private async processJobs() {
    const promises = Array.from(this.jobs.values()).map(job => this.processJob(job))
    await Promise.allSettled(promises)
  }

  private async processJob(job: PollingJob) {
    try {
      job.retryCount++
      
      // Check if job has exceeded max retries or time
      const elapsed = Date.now() - job.startTime
      if (job.retryCount > this.maxRetries || elapsed > 5 * 60 * 1000) {
        console.log(`Job ${job.id} timed out after ${job.retryCount} retries`)
        job.onError?.('Torrent processing timeout')
        this.removeJob(job.id)
        return
      }

      // Get torrent info from debrid service
      const torrentInfo = await debridManager.getTorrentInfo(job.torrentId, job.provider)
      
      console.log(`Job ${job.id} - Status: ${torrentInfo.status}, Progress: ${torrentInfo.progress}%`)

      switch (torrentInfo.status) {
        case 'downloaded':
        case 'completed':
          try {
            const streamLink = await debridManager.getStreamLink(job.torrentId, 0, job.provider)
            
            // Cache the stream link
            const cacheKey = `stream:${job.provider}:${job.torrentId}:0`
            const expiresIn = new Date(streamLink.expires).getTime() - Date.now()
            debridCache.set(cacheKey, streamLink, Math.max(0, expiresIn))
            
            console.log(`Job ${job.id} completed successfully`)
            job.onComplete?.(streamLink.url)
            this.removeJob(job.id)
          } catch (error) {
            console.error(`Failed to get stream link for job ${job.id}:`, error)
            job.onError?.('Failed to generate stream link')
            this.removeJob(job.id)
          }
          break

        case 'error':
        case 'virus':
        case 'dead':
          console.log(`Job ${job.id} failed with status: ${torrentInfo.status}`)
          job.onError?.(`Torrent ${torrentInfo.status}`)
          this.removeJob(job.id)
          break

        case 'waiting_files_selection':
          // Auto-select all files if possible
          try {
            const provider = debridManager['getProvider'](job.provider)
            if (provider && 'selectFiles' in provider) {
              const fileIds = torrentInfo.files
                .filter(f => f.selected || torrentInfo.files.length === 1)
                .map(f => f.id)
                .join(',')
              
              if (fileIds) {
                await (provider as any).selectFiles(job.torrentId, fileIds)
                console.log(`Auto-selected files for job ${job.id}`)
              }
            }
          } catch (error) {
            console.warn(`Failed to auto-select files for job ${job.id}:`, error)
          }
          break

        case 'downloading':
        case 'queued':
        case 'compressing':
        case 'uploading':
          // Continue polling - torrent is in progress
          break

        default:
          console.warn(`Unknown torrent status for job ${job.id}: ${torrentInfo.status}`)
      }

    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
      
      // Only fail the job if we've exceeded retries
      if (job.retryCount >= this.maxRetries) {
        job.onError?.('Failed to check torrent status')
        this.removeJob(job.id)
      }
    }
  }

  private cleanupOldJobs() {
    const now = Date.now()
    const oldJobs = Array.from(this.jobs.entries())
      .filter(([, job]) => now - job.startTime > 10 * 60 * 1000) // 10 minutes old
      .sort(([, a], [, b]) => a.startTime - b.startTime) // Oldest first
      .slice(0, 10) // Remove up to 10 old jobs

    for (const [jobId, job] of oldJobs) {
      console.log(`Cleaning up old job ${jobId}`)
      job.onError?.('Job cleanup timeout')
      this.removeJob(jobId)
    }
  }

  getJobStatus(jobId: string): { 
    exists: boolean
    retryCount?: number
    elapsed?: number
    status?: string
  } {
    const job = this.jobs.get(jobId)
    if (!job) {
      return { exists: false }
    }

    return {
      exists: true,
      retryCount: job.retryCount,
      elapsed: Date.now() - job.startTime,
      status: 'polling'
    }
  }

  getAllJobs(): Array<{
    id: string
    torrentId: string
    provider: string
    userId: string
    retryCount: number
    elapsed: number
  }> {
    return Array.from(this.jobs.values()).map(job => ({
      id: job.id,
      torrentId: job.torrentId,
      provider: job.provider,
      userId: job.userId,
      retryCount: job.retryCount,
      elapsed: Date.now() - job.startTime
    }))
  }

  // Graceful shutdown
  shutdown() {
    console.log('Shutting down torrent poller...')
    this.stopPolling()
    
    // Notify all pending jobs
    for (const [jobId, job] of this.jobs.entries()) {
      job.onError?.('Server shutting down')
    }
    
    this.jobs.clear()
  }
}

// Global poller instance
export const torrentPoller = new TorrentPoller()

// Graceful shutdown on process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => torrentPoller.shutdown())
  process.on('SIGTERM', () => torrentPoller.shutdown())
}

export { TorrentPoller }
export type { PollingJob }