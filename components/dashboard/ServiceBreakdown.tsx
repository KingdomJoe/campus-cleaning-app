'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchServiceBreakdown } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const t = total || 1
  return (
    <div className="bg-white border border-[#e1e5e8] rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-[#001e2b]">{d.name}</p>
      <p className="text-[#5c6c7a] text-xs">{d.value} bookings ({((d.value / t) * 100).toFixed(1)}%)</p>
    </div>
  )
}

export function ServiceBreakdown() {
  const { data } = useLiveData(fetchServiceBreakdown, { table: 'service_areas' })
  const chartData = data ?? []
  const total = chartData.reduce((s: number, d: { value: number }) => s + d.value, 0) || 1

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
      <h3 className="text-sm font-semibold text-[#001e2b] mb-1">Service Areas</h3>
      <p className="text-xs text-[#7c8c9a] mb-4">Booking distribution</p>

      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                dataKey="value"
                strokeWidth={2}
                stroke="white"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[15px] font-bold text-[#001e2b]">{total}</span>
            <span className="text-[9px] text-[#7c8c9a] font-medium">total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5">
          {chartData.map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-[#3d4f5b] truncate">{d.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-[#001e2b] tabular-nums">{d.value}</span>
                <span className="text-[10px] text-[#a8b3bc] w-8 text-right tabular-nums">
                  {((d.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
