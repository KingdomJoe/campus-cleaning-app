'use client'

import { useState } from 'react'
import { Star, Flag, EyeOff, Eye, Filter } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatDate, cn } from '@/lib/utils'
import type { Review } from '@/lib/types'
import { fetchReviews, setReviewFlag } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'

const RATING_FILTERS = [
  { label: 'All', value: 0 },
  { label: '5 Stars', value: 5 },
  { label: '4 Stars', value: 4 },
  { label: '3 Stars', value: 3 },
  { label: '1-2 Stars', value: 2 },
]

function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#7c8c9a] w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#f4f7f6] rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-[#5c6c7a] w-5 text-right">{value}</span>
    </div>
  )
}

function StarDisplay({ rating, small }: { rating: number; small?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            small ? 'w-3 h-3' : 'w-3.5 h-3.5',
            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#e1e5e8]'
          )}
        />
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const [ratingFilter, setRatingFilter] = useState(0)
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [selected, setSelected] = useState<Review | null>(null)

  const { data } = useLiveData(fetchReviews, { table: 'reviews' })
  const reviews = data ?? []

  const totalReviews = reviews.length
  const safeAvg = (key: keyof Review) =>
    totalReviews === 0 ? '0.0' : (reviews.reduce((s, r) => s + (r[key] as number), 0) / totalReviews).toFixed(1)
  const avgRating = safeAvg('rating')
  const avgQuality = safeAvg('qualityRating')
  const avgPunctuality = safeAvg('punctualityRating')
  const avgProfessionalism = safeAvg('professionalismRating')
  const avgCommunication = safeAvg('communicationRating')

  const filtered = reviews.filter((r) => {
    if (flaggedOnly && !r.flagged) return false
    if (ratingFilter === 0) return true
    if (ratingFilter === 2) return r.rating <= 2
    return r.rating === ratingFilter
  })

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader title="Feedback" description={`${totalReviews} reviews collected`} />

        {/* Summary card */}
        <div className="bg-white rounded-xl border border-[#e1e5e8] p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Overall score */}
            <div className="flex flex-col items-center justify-center px-6 py-2 border-r border-[#f4f7f6]">
              <p className="text-5xl font-bold text-[#001e2b] tabular-nums">{avgRating}</p>
              <StarDisplay rating={Math.round(Number(avgRating))} />
              <p className="text-xs text-[#a8b3bc] mt-1.5">{totalReviews} reviews</p>
            </div>

            {/* Rating breakdown */}
            <div className="flex-1 space-y-2.5 py-1">
              <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold mb-3">Category Averages</p>
              <StarRow label="Quality" value={Number(avgQuality)} />
              <StarRow label="Punctuality" value={Number(avgPunctuality)} />
              <StarRow label="Professionalism" value={Number(avgProfessionalism)} />
              <StarRow label="Communication" value={Number(avgCommunication)} />
            </div>

            {/* Distribution */}
            <div className="space-y-1.5 py-1 min-w-[140px]">
              <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold mb-3">Distribution</p>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length
                const pct = totalReviews === 0 ? 0 : (count / totalReviews) * 100
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#7c8c9a] w-4">{star}</span>
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-1.5 bg-[#f4f7f6] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-[#a8b3bc] w-4">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1">
            {RATING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRatingFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  ratingFilter === f.value
                    ? 'bg-white text-[#001e2b] shadow-sm'
                    : 'text-[#5c6c7a] hover:text-[#001e2b]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFlaggedOnly((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all',
              flaggedOnly
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-[#e1e5e8] text-[#5c6c7a] hover:bg-[#f4f7f6]'
            )}
          >
            <Flag className="w-3.5 h-3.5" />
            Flagged Only
          </button>
        </div>

        {/* Review cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              className={cn(
                'bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
                r.flagged ? 'border-red-200' : 'border-[#e1e5e8]',
                selected?.id === r.id && 'ring-1 ring-[#00684a]/20 shadow-md'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Avatar name={r.clientName} size="sm" />
                  <div>
                    <p className="font-semibold text-sm text-[#001e2b]">{r.clientName}</p>
                    <p className="text-[11px] text-[#7c8c9a]">for {r.cleanerName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarDisplay rating={r.rating} small />
                  {r.flagged && (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                      <Flag className="w-2.5 h-2.5" />
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#5c6c7a] leading-relaxed line-clamp-2">{r.text}</p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f4f7f6]">
                <StatusBadge status={r.serviceType} />
                <span className="text-[10px] text-[#a8b3bc]">{formatDate(r.date)}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-sm text-[#a8b3bc] bg-white rounded-xl border border-[#e1e5e8]">
              No reviews match the current filter.
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[320px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <p className="font-semibold text-[#001e2b] text-sm">Review Detail</p>
            <button onClick={() => setSelected(null)} className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors text-xs">
              Close
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Score */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn('w-6 h-6', s <= selected.rating ? 'text-amber-400 fill-amber-400' : 'text-[#e1e5e8]')}
                  />
                ))}
              </div>
              <p className="text-3xl font-bold text-[#001e2b]">{selected.rating}.0</p>
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
                  <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold">Cleaner Reviewed</p>
                  <p className="text-sm text-[#001e2b] font-medium">{selected.cleanerName}</p>
                </div>
              </div>
            </div>

            {/* Category ratings */}
            <div className="space-y-2">
              <StarRow label="Quality" value={selected.qualityRating} />
              <StarRow label="Punctuality" value={selected.punctualityRating} />
              <StarRow label="Professionalism" value={selected.professionalismRating} />
              <StarRow label="Communication" value={selected.communicationRating} />
            </div>

            {/* Review text */}
            <div className="bg-[#f9fbfa] rounded-lg p-3">
              <p className="text-xs text-[#3d4f5b] leading-relaxed">{selected.text}</p>
            </div>

            {/* Service + date */}
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.serviceType} />
              <span className="text-xs text-[#a8b3bc]">{formatDate(selected.date)}</span>
            </div>

            {/* Moderation actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  const sb = createClient()
                  if (selected.flagged) {
                    await setReviewFlag(sb, selected.id, false, selected.hidden ?? false)
                  } else {
                    await setReviewFlag(sb, selected.id, true, selected.hidden ?? false)
                  }
                }}
                className={cn(
                  'flex-1 h-9 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
                  selected.flagged
                    ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                    : 'border-[#e1e5e8] text-[#5c6c7a] hover:bg-[#f4f7f6]'
                )}
              >
                <Flag className="w-3.5 h-3.5" />
                {selected.flagged ? 'Unflag' : 'Flag'}
              </button>
              <button
                onClick={async () => {
                  const sb = createClient()
                  if (selected.hidden) {
                    await setReviewFlag(sb, selected.id, selected.flagged ?? false, false)
                  } else {
                    await setReviewFlag(sb, selected.id, selected.flagged ?? false, true)
                  }
                }}
                className="flex-1 h-9 rounded-lg border border-[#e1e5e8] text-xs text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors font-medium flex items-center justify-center gap-1.5"
              >
                {selected.hidden ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Unhide
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
