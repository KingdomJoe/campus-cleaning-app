'use client'

import { useState } from 'react'
import { Search, X, ChevronRight, MapPin, Clock, CreditCard } from 'lucide-react'
import { fetchBookings, updateBookingStatus } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Booking, BookingStatus, ServiceType } from '@/lib/types'

const SERVICE_LABELS: Record<ServiceType, string> = {
  express_touchup: 'Express Touch-Up',
  deep_scrub: 'Deep Scrub',
  move_in_out: 'Move-In/Out',
  wash_only: 'Wash Only',
  wash_and_iron: 'Wash & Iron',
  iron_only: 'Iron Only',
}

const BOOKING_TIMELINE: BookingStatus[] = [
  'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed',
]

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Disputed', value: 'disputed' },
]

function isActiveStatus(s: BookingStatus) {
  return ['accepted', 'en_route', 'arrived', 'in_progress'].includes(s)
}

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)

  const { data: bookingsData } = useLiveData(fetchBookings, { table: 'bookings' })
  const bookings = bookingsData ?? []

  const filtered = bookings.filter((b) => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? isActiveStatus(b.status) : b.status === statusFilter)
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      b.id.toLowerCase().includes(q) ||
      b.clientName.toLowerCase().includes(q) ||
      b.cleanerName.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="flex gap-6">
      {/* Main table area */}
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Bookings"
          description={`${bookings.length} total bookings`}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8b3bc]" />
            <input
              type="search"
              placeholder="Search bookings, clients, cleaners…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-4 w-64 rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] placeholder:text-[#a8b3bc] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  statusFilter === f.value
                    ? 'bg-white text-[#001e2b] shadow-sm'
                    : 'text-[#5c6c7a] hover:text-[#001e2b]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Cleaner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-sm text-[#a8b3bc]">
                      No bookings match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className={cn(
                        'border-b border-[#f0f4f2] hover:bg-[#f9fbfa] cursor-pointer transition-colors',
                        selected?.id === b.id && 'bg-[#f4f7f6]'
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#5c6c7a]">{b.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={b.clientName} size="xs" />
                          <span className="font-medium text-[#001e2b]">{b.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={b.cleanerName} size="xs" />
                          <span className="text-[#3d4f5b]">{b.cleanerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.serviceType} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5c6c7a]">{formatDate(b.date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#001e2b] tabular-nums">
                        {formatCurrency(b.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-[#c1ccd6]" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[360px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <div>
              <p className="text-xs text-[#7c8c9a] font-mono">{selected.id}</p>
              <p className="font-semibold text-[#001e2b] text-sm mt-0.5">
                {SERVICE_LABELS[selected.serviceType]}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.paymentStatus} />
            </div>

            {/* People */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f9fbfa] rounded-lg p-3">
                <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-2">Client</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.clientName} size="sm" />
                  <p className="text-sm font-medium text-[#001e2b] leading-tight">{selected.clientName}</p>
                </div>
              </div>
              <div className="bg-[#f9fbfa] rounded-lg p-3">
                <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-2">Cleaner</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.cleanerName} size="sm" />
                  <p className="text-sm font-medium text-[#001e2b] leading-tight">{selected.cleanerName}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#a8b3bc]" />
                <span className="text-[#5c6c7a]">{formatDate(selected.date)} at {selected.scheduledTime}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[#a8b3bc] flex-shrink-0 mt-0.5" />
                <span className="text-[#5c6c7a]">{selected.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-[#a8b3bc]" />
                <span className="font-semibold text-[#001e2b]">{formatCurrency(selected.amount)}</span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold mb-3">Booking Timeline</p>
              <ol className="space-y-1">
                {BOOKING_TIMELINE.map((step) => {
                  const statusIndex = BOOKING_TIMELINE.indexOf(selected.status as BookingStatus)
                  const stepIndex = BOOKING_TIMELINE.indexOf(step)
                  const isDone = stepIndex <= statusIndex
                  const isCurrent = step === selected.status
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          isCurrent ? 'bg-[#00ed64] ring-2 ring-[#00ed64]/30' : isDone ? 'bg-[#00684a]' : 'bg-[#e1e5e8]'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs capitalize',
                          isCurrent ? 'text-[#001e2b] font-semibold' : isDone ? 'text-[#5c6c7a]' : 'text-[#c1ccd6]'
                        )}
                      >
                        {step.replace(/_/g, ' ')}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Review */}
            {selected.review && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[11px] text-amber-700 font-semibold uppercase mb-1">
                  Client Review · {'★'.repeat(selected.rating ?? 0)}
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">{selected.review}</p>
              </div>
            )}

            {/* Actions */}
            {['pending', 'accepted', 'in_progress'].includes(selected.status) && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={async () => {
                    const sb = createClient()
                    await updateBookingStatus(sb, selected.id, 'cancelled')
                  }}
                  className="flex-1 h-9 rounded-lg border border-[#e1e5e8] text-sm text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 h-9 rounded-lg bg-[#001e2b] text-sm text-white hover:bg-[#003d4f] transition-colors font-medium">
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
