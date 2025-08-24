'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, User, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-40 h-16 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border-b border-white/20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-white">
              Heimdall
            </div>
          </div>

          {/* Right side - Theme toggle and User menu */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 hover:border-white/40 transition-all duration-300 text-white/80 hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 hover:border-white/40 transition-all duration-300 text-white/80 hover:text-white"
                aria-label="User menu"
              >
                <User className="h-5 w-5" />
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg shadow-lg">
                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}