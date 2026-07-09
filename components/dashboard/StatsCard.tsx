import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  trend: number
  trendLabel: string
  icon: React.ReactNode
  accent?: string
}

export function StatsCard({ label, value, trend, trendLabel, icon, accent }: StatsCardProps) {
  const isPositive = trend >= 0

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5 flex flex-col gap-4 hover:shadow-[0px_4px_12px_rgba(0,30,43,0.08)] transition-shadow duration-150">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[#5c6c7a] font-medium">{label}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent ? `${accent}14` : '#00ed6414' }}
        >
          <span style={{ color: accent ?? '#00684a' }}>{icon}</span>
        </div>
      </div>

      <div>
        <p className="text-[28px] font-bold text-[#001e2b] tabular-nums leading-none">{value}</p>
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-500')}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
          <span className="text-[#a8b3bc] font-normal">{trendLabel}</span>
        </div>
      </div>
    </div>
  )
}
