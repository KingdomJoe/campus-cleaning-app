'use client'

import { Calendar, ShieldCheck, AlertTriangle, DollarSign, Star } from 'lucide-react'
import { fetchActivityFeed } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import type { ActivityItem } from '@/lib/types'
import { cn } from '@/lib/utils'

const iconMap: Record<ActivityItem['type'], { icon: React.ElementType; color: string; bg: string }> = {
  booking: { icon: Calendar, color: 'text-[#00684a]', bg: 'bg-emerald-50' },
  verification: { icon: ShieldCheck, color: 'text-[#3d4f9f]', bg: 'bg-blue-50' },
  dispute: { icon: AlertTriangle, color: 'text-[#fa6e39]', bg: 'bg-orange-50' },
  payment: { icon: DollarSign, color: 'text-[#7b3ff2]', bg: 'bg-purple-50' },
  review: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RecentActivity() {
  const { data } = useLiveData(fetchActivityFeed, { table: 'bookings' })
  const activityFeed = data ?? []

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#001e2b]">Recent Activity</h3>
        <button className="text-xs text-[#00684a] font-medium hover:underline">View all</button>
      </div>

      <ol className="relative">
        {activityFeed.slice(0, 8).map((item, i) => {
          const { icon: Icon, color, bg } = iconMap[item.type]
          return (
            <li key={item.id} className="flex gap-3 pb-4 last:pb-0 relative">
              {/* Connector line */}
              {i < 7 && (
                <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[#e1e5e8]" aria-hidden />
              )}

              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10', bg)}>
                <Icon className={cn('w-3.5 h-3.5', color)} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-[#001e2b] leading-snug">{item.description}</p>
                {item.meta && (
                  <p className="text-xs text-[#7c8c9a] mt-0.5">{item.meta}</p>
                )}
                <p className="text-[11px] text-[#a8b3bc] mt-1">{timeAgo(item.timestamp)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
