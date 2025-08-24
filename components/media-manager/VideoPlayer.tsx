'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X, 
  Download,
  Settings,
  Rewind,
  FastForward,
  RotateCcw,
  Loader2,
  Subtitles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  streamUrl?: string
  title: string
  subtitle?: string
  quality?: string
  size?: string
  downloadUrl?: string
  subtitles?: Array<{
    language: string
    url: string
    label: string
  }>
  onError?: (error: string) => void
  className?: string
}

interface PlaybackState {
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  isPiP: boolean
  playbackRate: number
  isBuffering: boolean
  subtitlesEnabled: boolean
  currentSubtitleTrack?: number
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export function VideoPlayer({
  isOpen,
  onClose,
  streamUrl,
  title,
  subtitle,
  quality,
  size,
  downloadUrl,
  subtitles = [],
  onError,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isPiP: false,
    playbackRate: 1,
    isBuffering: false,
    subtitlesEnabled: false,
    currentSubtitleTrack: undefined
  })

  // Storage key for resume functionality
  const storageKey = `video-position-${encodeURIComponent(title)}`

  // Load saved position from localStorage
  const loadSavedPosition = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { position, duration } = JSON.parse(saved)
        if (position > 30 && position < duration - 60) { // Only resume if more than 30s and less than 1min from end
          return position
        }
      }
    } catch (error) {
      console.warn('Failed to load saved position:', error)
    }
    return 0
  }, [storageKey])

  // Save position to localStorage
  const savePosition = useCallback((currentTime: number, duration: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        position: currentTime,
        duration,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to save position:', error)
    }
  }, [storageKey])

  // Hide controls after delay
  const hideControlsDelayed = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      if (playbackState.isPlaying && !showSettings) {
        setShowControls(false)
      }
    }, 3000)
  }, [playbackState.isPlaying, showSettings])

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    hideControlsDelayed()
  }, [hideControlsDelayed])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!videoRef.current || !isOpen) return

    const video = videoRef.current
    
    switch (e.code) {
      case 'Space':
        e.preventDefault()
        togglePlayPause()
        break
      case 'ArrowLeft':
        e.preventDefault()
        video.currentTime = Math.max(0, video.currentTime - (e.shiftKey ? 30 : 10))
        break
      case 'ArrowRight':
        e.preventDefault()
        video.currentTime = Math.min(video.duration, video.currentTime + (e.shiftKey ? 30 : 10))
        break
      case 'ArrowUp':
        e.preventDefault()
        setVolume(Math.min(1, playbackState.volume + 0.1))
        break
      case 'ArrowDown':
        e.preventDefault()
        setVolume(Math.max(0, playbackState.volume - 0.1))
        break
      case 'KeyF':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'KeyM':
        e.preventDefault()
        toggleMute()
        break
      case 'KeyC':
        e.preventDefault()
        toggleSubtitles()
        break
      case 'Escape':
        if (playbackState.isFullscreen) {
          exitFullscreen()
        } else {
          onClose()
        }
        break
    }
  }, [isOpen, playbackState])

  // Event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isOpen])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setPlaybackState(prev => ({ ...prev, isBuffering: true }))
    const handlePlaying = () => setPlaybackState(prev => ({ ...prev, isBuffering: false }))
    
    const handleTimeUpdate = () => {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))
      
      // Save position periodically
      if (video.duration) {
        savePosition(video.currentTime, video.duration)
      }
    }

    const handleDurationChange = () => {
      setPlaybackState(prev => ({
        ...prev,
        duration: video.duration
      }))
    }

    const handleVolumeChange = () => {
      setPlaybackState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }))
    }

    const handleError = () => {
      const errorMsg = 'Failed to load video stream'
      setError(errorMsg)
      setIsLoading(false)
      onError?.(errorMsg)
    }

    const handleLoadedData = () => {
      const savedPosition = loadSavedPosition()
      if (savedPosition > 0) {
        video.currentTime = savedPosition
      }
    }

    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('error', handleError)
    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [loadSavedPosition, savePosition, onError])

  // Control functions
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setPlaybackState(prev => ({ ...prev, isPlaying: true }))
    } else {
      video.pause()
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = volume
    if (volume === 0) {
      video.muted = true
    } else if (video.muted) {
      video.muted = false
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }, [])

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackState(prev => ({ ...prev, playbackRate: rate }))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const player = playerRef.current
    if (!player) return

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen()
        setPlaybackState(prev => ({ ...prev, isFullscreen: true }))
      } else {
        await document.exitFullscreen()
        setPlaybackState(prev => ({ ...prev, isFullscreen: false }))
      }
    } catch (error) {
      console.warn('Fullscreen error:', error)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.warn('Exit fullscreen error:', error)
    }
  }, [])

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setPlaybackState(prev => ({ ...prev, isPiP: false }))
      } else {
        await video.requestPictureInPicture()
        setPlaybackState(prev => ({ ...prev, isPiP: true }))
      }
    } catch (error) {
      console.warn('Picture-in-picture error:', error)
    }
  }, [])

  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const tracks = video.textTracks
    if (tracks.length === 0) return

    if (playbackState.subtitlesEnabled) {
      // Disable all tracks
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled'
      }
      setPlaybackState(prev => ({ 
        ...prev, 
        subtitlesEnabled: false,
        currentSubtitleTrack: undefined
      }))
    } else {
      // Enable first track
      tracks[0].mode = 'showing'
      setPlaybackState(prev => ({ 
        ...prev, 
        subtitlesEnabled: true,
        currentSubtitleTrack: 0
      }))
    }
  }, [playbackState.subtitlesEnabled])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm',
        className
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={playerRef}
        className="relative w-full max-w-6xl mx-4 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
        onMouseMove={handleMouseMove}
      >
        {/* Video element */}
        {streamUrl && !error ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            crossOrigin="anonymous"
            preload="metadata"
          >
            <source src={streamUrl} type="video/mp4" />
            {subtitles.map((subtitle, index) => (
              <track
                key={index}
                kind="subtitles"
                src={subtitle.url}
                srcLang={subtitle.language}
                label={subtitle.label}
              />
            ))}
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            {error ? (
              <div className="text-center text-white">
                <X className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg mb-2">Failed to load video</p>
                <p className="text-white/60">{error}</p>
              </div>
            ) : (
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-400" />
                <p className="text-lg">Loading video...</p>
              </div>
            )}
          </div>
        )}

        {/* Buffering overlay */}
        {playbackState.isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Header overlay */}
        <div className={cn(
          'absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white truncate">{title}</h2>
              {subtitle && (
                <p className="text-white/70 text-sm truncate">{subtitle}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                {quality && <span>{quality}</span>}
                {size && <span>{size}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {downloadUrl && (
                <button
                  onClick={() => window.open(downloadUrl, '_blank')}
                  className="p-2 rounded-lg backdrop-blur-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls overlay */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group">
              <div 
                className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100 || 0}%` }}
              />
              <input
                type="range"
                min="0"
                max={playbackState.duration || 0}
                value={playbackState.currentTime || 0}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                disabled={isLoading || !!error}
              >
                {playbackState.isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>

              {/* Skip back/forward */}
              <button
                onClick={() => seekTo(Math.max(0, playbackState.currentTime - 10))}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                disabled={isLoading || !!error}
                title="Rewind 10s"
              >
                <Rewind className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => seekTo(Math.min(playbackState.duration, playbackState.currentTime + 10))}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                disabled={isLoading || !!error}
                title="Forward 10s"
              >
                <FastForward className="h-4 w-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                >
                  {playbackState.isMuted || playbackState.volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={playbackState.isMuted ? 0 : playbackState.volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Time display */}
              <div className="text-sm text-white/80 font-mono">
                {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Subtitles */}
              {subtitles.length > 0 && (
                <button
                  onClick={toggleSubtitles}
                  className={cn(
                    'p-2 rounded-lg backdrop-blur-xl border border-white/20 transition-all duration-300',
                    playbackState.subtitlesEnabled 
                      ? 'bg-blue-500/30 text-blue-300' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                  title="Toggle subtitles"
                >
                  <Subtitles className="h-4 w-4" />
                </button>
              )}

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    'p-2 rounded-lg backdrop-blur-xl border border-white/20 transition-all duration-300',
                    showSettings 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* Settings menu */}
                {showSettings && (
                  <div className="absolute bottom-12 right-0 backdrop-blur-xl bg-black/80 border border-white/20 rounded-lg p-3 min-w-48">
                    <div className="space-y-3">
                      <div>
                        <label className="text-white text-sm font-medium">Playback Speed</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {PLAYBACK_RATES.map(rate => (
                            <button
                              key={rate}
                              onClick={() => setPlaybackRate(rate)}
                              className={cn(
                                'px-2 py-1 rounded text-xs transition-all duration-300',
                                playbackState.playbackRate === rate
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              )}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button
                onClick={togglePictureInPicture}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                disabled={isLoading || !!error}
                title="Picture in Picture"
              >
                <Minimize className="h-4 w-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                title="Fullscreen"
              >
                {playbackState.isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Click to play/pause overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          {/* Center play button when paused */}
          {!playbackState.isPlaying && !isLoading && !error && (
            <div className="p-4 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-white transition-all duration-300 hover:bg-white/30 hover:scale-110">
              <Play className="h-8 w-8 ml-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}