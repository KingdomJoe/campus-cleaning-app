'use client'

import { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Lock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  X,
  CreditCard,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Transaction, TransactionStatus } from '@/lib/types'
import { fetchTransactions, releasePayment } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Escrow', value: 'escrow' },
  { label: 'Released', value: 'released' },
  { label: 'Refunded', value: 'refunded' },
]

const STATUS_ICON: Record<TransactionStatus, React.ElementType> = {
  escrow: Lock,
  released: ArrowUpRight,
  refunded: RefreshCw,
  pending: ArrowDownRight,
}

function SummaryCard({
  label,
  value,
  sublabel,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  sublabel?: string
  accent?: 'green' | 'amber' | 'purple' | 'default'
  icon: React.ElementType
}) {
  const accentClasses = {
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    default: 'bg-[#f4f7f6] text-[#5c6c7a]',
  }
  return (
    <div className="bg-white rounded-xl border border-[#e1e5e8] p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accentClasses[accent ?? 'default'])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[13px] text-[#7c8c9a] font-medium">{label}</p>
        <p className="text-[22px] font-bold text-[#001e2b] tabular-nums leading-tight mt-0.5">{value}</p>
        {sublabel && <p className="text-[11px] text-[#a8b3bc] mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Transaction | null>(null)

  const { data } = useLiveData(fetchTransactions, { table: 'payments' })
  const transactions = data ?? []

  const filtered = transactions.filter((t) =>
    statusFilter === 'all' ? true : t.status === statusFilter
  )

  const totalReleased = transactions.filter((t) => t.status === 'released').reduce((s, t) => s + t.amount, 0)
  const totalEscrow = transactions.filter((t) => t.status === 'escrow').reduce((s, t) => s + t.amount, 0)
  const totalRefunded = transactions.filter((t) => t.status === 'refunded').reduce((s, t) => s + t.amount, 0)
  const totalFees = transactions.filter((t) => t.status === 'released').reduce((s, t) => s + t.platformFee, 0)

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Payments"
          description={`${transactions.length} transactions`}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Released" value={formatCurrency(totalReleased)} sublabel="to cleaners" icon={ArrowUpRight} accent="green" />
          <SummaryCard label="In Escrow" value={formatCurrency(totalEscrow)} sublabel="held pending" icon={Lock} accent="amber" />
          <SummaryCard label="Platform Fees" value={formatCurrency(totalFees)} sublabel="20% commission" icon={DollarSign} accent="default" />
          <SummaryCard label="Refunded" value={formatCurrency(totalRefunded)} sublabel="returned to clients" icon={RefreshCw} accent="purple" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1 mb-4 w-fit">
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Transaction</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Cleaner</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Platform Fee</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Payout</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-sm text-[#a8b3bc]">
                      No transactions match the filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const Icon = STATUS_ICON[t.status as TransactionStatus] ?? DollarSign
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={cn(
                          'border-b border-[#f0f4f2] hover:bg-[#f9fbfa] cursor-pointer transition-colors',
                          selected?.id === t.id && 'bg-[#f4f7f6]'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#f4f7f6] flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-[#5c6c7a]" />
                            </div>
                            <div>
                              <p className="font-mono text-xs text-[#001e2b] font-semibold">{t.id}</p>
                              <p className="text-[10px] text-[#a8b3bc]">{t.bookingId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Avatar name={t.clientName} size="xs" />
                            <span className="text-[#3d4f5b] truncate max-w-[100px]">{t.clientName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Avatar name={t.cleanerName} size="xs" />
                            <span className="text-[#3d4f5b] truncate max-w-[100px]">{t.cleanerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#001e2b] tabular-nums">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-3 text-right text-[#7c8c9a] tabular-nums">{formatCurrency(t.platformFee)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">{formatCurrency(t.cleanerPayout)}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-[#7c8c9a] text-xs">{formatDate(t.date)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[300px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <div>
              <p className="font-mono text-xs text-[#7c8c9a]">{selected.id}</p>
              <p className="font-semibold text-[#001e2b] text-sm mt-0.5">Transaction Detail</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <StatusBadge status={selected.status} />

            {/* Fee breakdown */}
            <div className="bg-[#f9fbfa] rounded-xl p-4 space-y-3">
              <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold">Breakdown</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6c7a]">Service Total</span>
                <span className="font-bold text-[#001e2b] tabular-nums">{formatCurrency(selected.amount)}</span>
              </div>
              <div className="border-t border-[#e1e5e8] pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7c8c9a]">Platform Fee (20%)</span>
                  <span className="text-[#7c8c9a] tabular-nums">− {formatCurrency(selected.platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-emerald-700">Cleaner Payout</span>
                  <span className="text-emerald-700 tabular-nums">{formatCurrency(selected.cleanerPayout)}</span>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={selected.clientName} size="sm" />
                <div>
                  <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold">Client</p>
                  <p className="text-sm text-[#001e2b] font-medium">{selected.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar name={selected.cleanerName} size="sm" />
                <div>
                  <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold">Cleaner</p>
                  <p className="text-sm text-[#001e2b] font-medium">{selected.cleanerName}</p>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-2 text-sm text-[#5c6c7a]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[#a8b3bc]" />
                Booking: <span className="font-mono text-[#001e2b]">{selected.bookingId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#a8b3bc]" />
                {formatDate(selected.date)}
              </div>
            </div>

            {selected.status === 'escrow' && (
              <button
                onClick={async () => {
                  const sb = createClient()
                  await releasePayment(sb, selected.id)
                }}
                className="w-full h-9 rounded-lg bg-[#00ed64] text-sm text-[#001e2b] hover:bg-[#00c853] transition-colors font-semibold"
              >
                Release to Cleaner
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
