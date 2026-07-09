'use client'

import { Bell, Search, Menu, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/shared/Avatar'
import { createClient } from '@/lib/supabase/client'

interface TopBarProps {
  onMenuToggle?: () => void
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)
  const [adminName, setAdmin] = useState('Admin')
  const [adminEmail, setEmail] = useState('')
  const [adminRole, setRole] = useState('Admin')
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const sb = createClient()
      const { data } = await sb.auth.getUser()
      if (data.user) {
        setEmail(data.user.email ?? '')
        const { data: p } = await sb
          .from('profiles')
          .select('full_name, role')
          .eq('id', data.user.id)
          .single()
        setAdmin(p?.full_name ?? 'Admin')
        setRole(p?.role === 'super_admin' ? 'Super Admin' : 'Admin')
      }
    })()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    if (showProfile) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showProfile])

  async function handleSignOut() {
    const sb = createClient()
    await sb.auth.signOut()
    document.cookie = "admin_bypass_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-[#e1e5e8] flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30">
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-[#5c6c7a] hover:text-[#001e2b] transition-colors p-1"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8b3bc]" />
          <input
            type="search"
            placeholder="Search bookings, users, cleaners…"
            className="w-full h-9 pl-9 pr-12 rounded-lg border border-[#e1e5e8] bg-[#f9fbfa] text-sm text-[#001e2b] placeholder:text-[#a8b3bc] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#a8b3bc] bg-white border border-[#e1e5e8] rounded px-1.5 py-0.5 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg border border-[#e1e5e8] flex items-center justify-center text-[#5c6c7a] hover:text-[#001e2b] hover:bg-[#f4f7f6] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[#f4f7f6] transition-all"
          >
            <Avatar name={adminName} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#001e2b] leading-none">{adminName}</p>
              <p className="text-[11px] text-[#7c8c9a] leading-none mt-0.5">{adminRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#a8b3bc] hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#e1e5e8] shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-[#e1e5e8]">
                <p className="text-sm font-medium text-[#001e2b]">{adminName}</p>
                <p className="text-xs text-[#7c8c9a]">{adminEmail}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-[#3d4f5b] hover:bg-[#f9fbfa] transition-colors">
                Profile Settings
              </button>
              <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
