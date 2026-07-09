'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Star,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/feedback', label: 'Feedback', icon: Star },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapseToggle?: () => void
}

export function Sidebar({ collapsed = false, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname()
  const [adminName, setAdmin] = useState('Admin')
  const [adminRole, setRole] = useState('Admin')

  useEffect(() => {
    ;(async () => {
      const sb = createClient()
      const { data } = await sb.auth.getUser()
      if (data.user) {
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

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-[#001e2b] text-white transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00ed64] flex items-center justify-center flex-shrink-0 p-1">
            <Image src="/ufc-logo.svg" alt="Uber for Cleaning logo" width={24} height={24} className="w-full h-full" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-[15px] text-white leading-tight truncate">Uber for Cleaning</div>
              <div className="text-[11px] text-white/50 font-medium">Admin Portal</div>
            </div>
          )}
        </div>
        {onCollapseToggle && (
          <button
            onClick={onCollapseToggle}
            className="flex-shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && (
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Management
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                    isActive
                      ? 'bg-[#00ed64]/10 text-[#00ed64]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {/* Active left border indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00ed64] rounded-full" />
                  )}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                      isActive ? 'text-[#00ed64]' : 'text-white/40 group-hover:text-white/70'
                    )}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom profile */}
      <div className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar name={adminName} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminName}</p>
              <p className="text-[11px] text-white/40 truncate">{adminRole}</p>
            </div>
          )}
          {!collapsed && (
            <Link href="/login" className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
