'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fetchRevenueChart } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e1e5e8] rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-[#5c6c7a] text-xs mb-1">{label}</p>
      <p className="font-semibold text-[#001e2b]">GH₵{payload[0].value.toLocaleString()}</p>
      <p className="text-[#7c8c9a] text-xs">{payload[0].payload.bookings} bookings</p>
    </div>
  )
}

export function RevenueChart() {
  const { data } = useLiveData(fetchRevenueChart, { table: 'payments' })
  const revenueChartData = data ?? []

  const ticks = revenueChartData
    .filter((_, i) => i % 5 === 0)
    .map((d) => {
      const date = new Date(d.date)
      return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`
    })

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#001e2b]">Revenue Over Time</h3>
          <p className="text-xs text-[#7c8c9a] mt-0.5">Last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#5c6c7a]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00684a]" />
            Revenue (GH₵)
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00684a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00684a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v)
              return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`
            }}
            tick={{ fontSize: 11, fill: '#a8b3bc' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a8b3bc' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₵${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e1e5e8', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#00684a"
            strokeWidth={2}
            fill="url(#revGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#00684a', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
