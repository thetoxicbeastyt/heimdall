'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  isActive: boolean
  comingSoon?: boolean
  className?: string
}

export function ModuleCard({
  title,
  description,
  icon,
  href,
  isActive,
  comingSoon = false,
  className
}: ModuleCardProps) {
  const CardWrapper = comingSoon ? 'div' : Link

  return (
    <CardWrapper
      {...(comingSoon ? {} : { href }) as any}
      className={cn(
        'group relative block',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg p-6 h-48',
          'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
          'border border-white/20',
          'transition-all duration-300',
          !comingSoon && 'hover:border-white/40 hover:scale-[1.02] cursor-pointer',
          comingSoon && 'cursor-not-allowed opacity-75',
          isActive && !comingSoon && 'shadow-lg shadow-white/10'
        )}
      >
        {/* Icon container */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'p-3 rounded-lg',
              'backdrop-blur-xl bg-white/20 dark:bg-gray-900/20',
              'border border-white/30',
              'transition-all duration-300',
              !comingSoon && 'group-hover:bg-white/30 group-hover:border-white/50'
            )}
          >
            <div className="text-white/90 text-xl">
              {icon}
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex flex-col gap-2">
            {comingSoon && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                Coming Soon
              </span>
            )}
            {isActive && !comingSoon && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-green-500/20 text-green-300 border border-green-400/30">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Active glow effect */}
        {isActive && !comingSoon && (
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20 pointer-events-none" />
        )}
      </div>
    </CardWrapper>
  )
}