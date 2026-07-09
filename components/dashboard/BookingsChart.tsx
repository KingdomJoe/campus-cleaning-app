'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { fetchBookingsChart } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e1e5e8] rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-[#5c6c7a] text-xs mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-[#3d4f5b] capitalize">{p.name}:</span>
          <span className="font-semibold text-[#001e2b]">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function BookingsChart() {
  const { data } = useLiveData(fetchBookingsChart, { table: 'bookings' })
  const chartData = data ?? []

  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#001e2b]">Bookings by Service</h3>
          <p className="text-xs text-[#7c8c9a] mt-0.5">Monthly comparison</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#a8b3bc' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a8b3bc' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f7f6' }} />
          <Bar dataKey="cleaning" name="Cleaning" fill="#00684a" radius={[3, 3, 0, 0]} />
          <Bar dataKey="laundry" name="Laundry" fill="#00ed64" radius={[3, 3, 0, 0]} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#5c6c7a', paddingTop: '12px' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
