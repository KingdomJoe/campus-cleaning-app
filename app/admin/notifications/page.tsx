'use client'

import { useState } from 'react'
import {
  Bell,
  Send,
  Users,
  Wrench,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { useLiveData } from '@/lib/supabase/hooks'
import { fetchBroadcasts, sendBroadcast } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'
import type { NotificationType, NotificationRecipient } from '@/lib/types'

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  booking: Bell,
  payment: DollarSign,
  system: Wrench,
  dispute: AlertTriangle,
}

const TYPE_COLOR: Record<NotificationType, string> = {
  booking: 'bg-blue-100 text-blue-600',
  payment: 'bg-emerald-100 text-emerald-600',
  system: 'bg-gray-100 text-gray-600',
  dispute: 'bg-red-100 text-red-600',
}

const RECIPIENT_LABELS: Record<NotificationRecipient, string> = {
  all: 'All Users',
  clients: 'Clients',
  cleaners: 'Cleaners',
  specific: 'Specific User',
}

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Failed', value: 'failed' },
]

const TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Booking', value: 'booking' },
  { label: 'Payment', value: 'payment' },
  { label: 'System', value: 'system' },
  { label: 'Dispute', value: 'dispute' },
]

function formatNotifDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Compose form state
  const [compose, setCompose] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'system' as NotificationType,
    recipient: 'all' as NotificationRecipient,
  })

  const { data } = useLiveData(fetchBroadcasts, { table: 'admin_broadcasts' })
  const notifications = data ?? []

  const filtered = notifications.filter((n) => {
    const matchStatus = statusFilter === 'all' || n.status === statusFilter
    const matchType = typeFilter === 'all' || n.type === typeFilter
    return matchStatus && matchType
  })

  const sentCount = notifications.filter((n) => n.status === 'sent').length
  const failedCount = notifications.filter((n) => n.status === 'failed').length
  const scheduledCount = notifications.filter((n) => n.status === 'scheduled').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Notifications"
          description={`${notifications.length} total · ${sentCount} sent · ${scheduledCount} scheduled`}
        />
        <button
          onClick={() => setCompose(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#001e2b] text-white text-sm font-semibold hover:bg-[#003d4f] transition-colors flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Send Notification
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e1e5e8] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#001e2b] tabular-nums">{sentCount}</p>
            <p className="text-xs text-[#7c8c9a]">Sent</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e1e5e8] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#001e2b] tabular-nums">{scheduledCount}</p>
            <p className="text-xs text-[#7c8c9a]">Scheduled</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e1e5e8] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-4.5 h-4.5 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#001e2b] tabular-nums">{failedCount}</p>
            <p className="text-xs text-[#7c8c9a]">Failed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
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
        <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                typeFilter === f.value
                  ? 'bg-white text-[#001e2b] shadow-sm'
                  : 'text-[#5c6c7a] hover:text-[#001e2b]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications table */}
      <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Recipient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-sm text-[#a8b3bc]">
                    No notifications match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => {
                  const Icon = TYPE_ICON[n.type as NotificationType] ?? Bell
                  const colorClass = TYPE_COLOR[n.type as NotificationType] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={n.id} className="border-b border-[#f0f4f2] hover:bg-[#f9fbfa] transition-colors">
                      <td className="px-4 py-3">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colorClass)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#001e2b] max-w-[160px]">
                        <p className="truncate">{n.title}</p>
                      </td>
                      <td className="px-4 py-3 text-[#5c6c7a] max-w-[280px]">
                        <p className="truncate text-xs">{n.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#5c6c7a]">
                          <Users className="w-3.5 h-3.5 text-[#a8b3bc]" />
                          {RECIPIENT_LABELS[n.recipient as NotificationRecipient] ?? n.recipient}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7c8c9a] whitespace-nowrap">
                        {formatNotifDate(n.sentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            n.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : n.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          )}
                        >
                          {n.status === 'sent' ? (
                            <CheckCircle className="w-2.5 h-2.5" />
                          ) : n.status === 'scheduled' ? (
                            <Clock className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5" />
                          )}
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e1e5e8]">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#00684a]" />
                <h2 className="font-bold text-[#001e2b]">Send Notification</h2>
              </div>
              <button
                onClick={() => setCompose(false)}
                className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5c6c7a] uppercase tracking-wide mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NotificationType }))}
                    className="w-full h-9 rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] px-3 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
                  >
                    <option value="system">System</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="dispute">Dispute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5c6c7a] uppercase tracking-wide mb-1.5">
                    Recipient
                  </label>
                  <select
                    value={form.recipient}
                    onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value as NotificationRecipient }))}
                    className="w-full h-9 rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] px-3 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
                  >
                    <option value="all">All Users</option>
                    <option value="clients">Clients Only</option>
                    <option value="cleaners">Cleaners Only</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c6c7a] uppercase tracking-wide mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title…"
                  className="w-full h-9 rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] px-3 placeholder:text-[#c1ccd6] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5c6c7a] uppercase tracking-wide mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Write the notification message…"
                  className="w-full rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] px-3 py-2.5 placeholder:text-[#c1ccd6] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCompose(false)}
                  className="flex-1 h-10 rounded-xl border border-[#e1e5e8] text-sm text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors font-medium"
                >
                  Discard
                </button>
                <button
                  onClick={async () => {
                    const sb = createClient()
                    await sendBroadcast(sb, {
                      title: form.title,
                      message: form.message,
                      type: form.type,
                      recipient: form.recipient,
                    })
                    setCompose(false)
                  }}
                  className="flex-1 h-10 rounded-xl bg-[#001e2b] text-sm text-white hover:bg-[#003d4f] transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
