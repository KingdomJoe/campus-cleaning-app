'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  X,
  Clock,
  CheckCircle2,
  MessageSquare,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Dispute, DisputeStatus, DisputePriority } from '@/lib/types'
import { fetchDisputes, escalateDispute, resolveDispute } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Resolved', value: 'resolved' },
]

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  cleaner_no_show: 'Cleaner No-Show',
  poor_quality: 'Poor Quality',
  property_damage: 'Property Damage',
  theft: 'Theft',
  overcharge: 'Overcharge',
}

const PRIORITY_BORDER: Record<DisputePriority, string> = {
  high: 'border-l-red-400',
  medium: 'border-l-amber-400',
  low: 'border-l-gray-300',
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('bg-white rounded-xl border p-4 flex items-center gap-3', color)}>
      <span className="text-2xl font-bold text-[#001e2b] tabular-nums">{value}</span>
      <span className="text-sm text-[#5c6c7a]">{label}</span>
    </div>
  )
}

export default function DisputesPage() {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')

  const { data } = useLiveData(fetchDisputes, { table: 'disputes' })
  const disputes = data ?? []

  const filtered = disputes.filter((d) =>
    filter === 'all' ? true : d.status === filter
  )

  const openCount = disputes.filter((d) => d.status === 'open').length
  const inProgressCount = disputes.filter((d) => d.status === 'in_progress').length
  const escalatedCount = disputes.filter((d) => d.status === 'escalated').length
  const resolvedCount = disputes.filter((d) => d.status === 'resolved').length

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Disputes"
          description={`${disputes.length} total · ${openCount + escalatedCount} require action`}
        />

        {/* Summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryPill label="Open" value={openCount} color="border border-red-200" />
          <SummaryPill label="In Progress" value={inProgressCount} color="border border-amber-200" />
          <SummaryPill label="Escalated" value={escalatedCount} color="border border-purple-200" />
          <SummaryPill label="Resolved" value={resolvedCount} color="border border-emerald-200" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1 mb-4 w-fit">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === f.value
                  ? 'bg-white text-[#001e2b] shadow-sm'
                  : 'text-[#5c6c7a] hover:text-[#001e2b]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dispute cards */}
        <div className="space-y-2.5">
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected(d)}
              className={cn(
                'bg-white rounded-xl border-l-4 border border-[#e1e5e8] p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
                PRIORITY_BORDER[d.priority as DisputePriority],
                selected?.id === d.id && 'ring-1 ring-[#00684a]/20 shadow-md'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-semibold text-[#5c6c7a]">{d.id}</span>
                    <StatusBadge status={d.status} />
                    <StatusBadge status={d.priority} />
                  </div>
                  <p className="font-semibold text-sm text-[#001e2b]">
                    {DISPUTE_TYPE_LABELS[d.type] ?? d.type}
                  </p>
                  <p className="text-xs text-[#7c8c9a] mt-1 line-clamp-1">{d.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-[#001e2b] tabular-nums text-sm">{formatCurrency(d.amount)}</p>
                  <p className="text-[10px] text-[#a8b3bc] mt-0.5">{formatDate(d.filedDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#f4f7f6]">
                <div className="flex items-center gap-1.5">
                  <Avatar name={d.clientName} size="xs" />
                  <span className="text-xs text-[#5c6c7a]">{d.clientName}</span>
                </div>
                <span className="text-[#c1ccd6] text-xs">vs</span>
                <div className="flex items-center gap-1.5">
                  <Avatar name={d.cleanerName} size="xs" />
                  <span className="text-xs text-[#5c6c7a]">{d.cleanerName}</span>
                </div>
                <span className="text-[10px] font-mono text-[#a8b3bc] ml-auto">{d.bookingId}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-[#a8b3bc] bg-white rounded-xl border border-[#e1e5e8]">
              No disputes match the current filter.
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[360px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <div>
              <p className="font-mono text-xs text-[#7c8c9a]">{selected.id}</p>
              <p className="font-semibold text-sm text-[#001e2b] mt-0.5">
                {DISPUTE_TYPE_LABELS[selected.type] ?? selected.type}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.priority} />
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f9fbfa] rounded-lg p-3">
                <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-1.5">Client</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.clientName} size="xs" />
                  <p className="text-sm font-medium text-[#001e2b] leading-tight">{selected.clientName}</p>
                </div>
              </div>
              <div className="bg-[#f9fbfa] rounded-lg p-3">
                <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-1.5">Cleaner</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.cleanerName} size="xs" />
                  <p className="text-sm font-medium text-[#001e2b] leading-tight">{selected.cleanerName}</p>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-2 text-sm text-[#5c6c7a]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#a8b3bc]" />
                Filed {formatDate(selected.filedDate)}
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#a8b3bc]" />
                Booking: <span className="font-mono text-[#001e2b]">{selected.bookingId}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#a8b3bc]" />
                Amount in dispute:{' '}
                <span className="font-bold text-[#001e2b]">{formatCurrency(selected.amount)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#f9fbfa] rounded-lg p-4">
              <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-2">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Complaint
              </p>
              <p className="text-sm text-[#3d4f5b] leading-relaxed">{selected.description}</p>
            </div>

            {/* Resolution (if exists) */}
            {selected.resolution && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-[10px] text-emerald-700 uppercase font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolution
                </p>
                <p className="text-sm text-emerald-800 leading-relaxed">{selected.resolution}</p>
              </div>
            )}

            {/* Resolution input */}
            {selected.status !== 'resolved' && (
              <div>
                <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold mb-2">Add Resolution Note</p>
                <textarea
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the resolution action taken…"
                  className="w-full rounded-lg border border-[#e1e5e8] bg-[#f9fbfa] text-sm text-[#001e2b] placeholder:text-[#c1ccd6] p-3 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] resize-none transition-all"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      const sb = createClient()
                      await escalateDispute(sb, selected.id)
                    }}
                    className="flex-1 h-9 rounded-lg border border-amber-200 text-sm text-amber-700 hover:bg-amber-50 transition-colors font-medium flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    In Progress
                  </button>
                  <button
                    onClick={async () => {
                      const sb = createClient()
                      await resolveDispute(sb, selected.id, resolution)
                    }}
                    className="flex-1 h-9 rounded-lg bg-emerald-600 text-sm text-white hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
