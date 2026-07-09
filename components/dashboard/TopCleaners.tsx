'use client'

import { Star } from 'lucide-react'
import { fetchTopCleaners } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { formatCurrency } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'

export function TopCleaners() {
  const { data } = useLiveData(fetchTopCleaners, { table: 'cleaner_profiles' })
  const top = data ?? []

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#001e2b]">Top Cleaners</h3>
        <span className="text-[11px] text-[#7c8c9a] bg-[#f4f7f6] rounded-full px-2.5 py-0.5 font-medium">
          This month
        </span>
      </div>

      <ul className="space-y-3">
        {top.map((cleaner, i) => (
          <li key={cleaner.id} className="flex items-center gap-3">
            <span className="w-5 text-center text-[11px] font-bold text-[#a8b3bc] flex-shrink-0">
              {i + 1}
            </span>
            <Avatar name={cleaner.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#001e2b] truncate">{cleaner.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-[#7c8c9a]">{cleaner.rating}</span>
                <span className="text-[11px] text-[#c1ccd6]">·</span>
                <span className="text-[11px] text-[#7c8c9a]">{cleaner.jobsCompleted} jobs</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-[#001e2b] tabular-nums flex-shrink-0">
              {formatCurrency(cleaner.earnings)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
