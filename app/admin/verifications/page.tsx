'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { fetchCleaners, setCleanerVerification, fetchCleanerDocuments } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatDate, cn } from '@/lib/utils'
import type { Cleaner, VerificationStatus } from '@/lib/types'

const VERIFICATION_FILTERS: { label: string; value: string; count?: number }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const CHECKLIST_ITEMS = [
  { key: 'id_card', label: 'National ID / Passport' },
  { key: 'guarantor', label: 'Guarantor Form' },
  { key: 'background', label: 'Background Check' },
  { key: 'training', label: 'Platform Orientation' },
  { key: 'photo', label: 'Profile Photo' },
]

/**
 * Infers document completion from actual cleaner profile fields.
 * Approved cleaners have all items done; for others, we check real data.
 */
function buildChecklist(cleaner: Cleaner, docs: any[] = []) {
  if (cleaner.verificationStatus === 'approved') {
    return CHECKLIST_ITEMS.map((item) => ({ ...item, done: true, fileUrl: undefined }))
  }
  return CHECKLIST_ITEMS.map((item) => {
    let done = false
    let fileUrl: string | undefined = undefined
    switch (item.key) {
      case 'id_card': {
        const found = docs.find((d) => d.document_type === 'ghana_card' || d.document_type === 'student_id')
        done = !!found || cleaner.verificationStatus === 'pending' || cleaner.verificationStatus === 'approved'
        fileUrl = found?.file_url
        break
      }
      case 'guarantor': {
        const found = docs.find((d) => d.document_type === 'guarantor_doc')
        done = !!found || (!!cleaner.guarantorName && !!cleaner.guarantorPhone)
        fileUrl = found?.file_url
        break
      }
      case 'background':
        // Background check is done if verification is pending or approved
        done = cleaner.verificationStatus === 'pending' || cleaner.verificationStatus === 'approved'
        break
      case 'training':
        // Infer training completion from having completed at least 1 job
        done = cleaner.jobsCompleted > 0 || cleaner.verificationStatus === 'approved'
        break
      case 'photo': {
        const found = docs.find((d) => d.document_type === 'selfie')
        done = !!found || !!cleaner.avatar
        fileUrl = found?.file_url ?? cleaner.avatar
        break
      }
    }
    return { ...item, done, fileUrl }
  })
}

export default function VerificationsPage() {
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Cleaner | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [cleanerDocs, setCleanerDocs] = useState<any[]>([])

  useEffect(() => {
    if (selected) {
      const sb = createClient()
      fetchCleanerDocuments(sb, selected.id).then((docs) => {
        setCleanerDocs(docs)
      })
    } else {
      setCleanerDocs([])
    }
  }, [selected])

  const { data: cleanersData } = useLiveData(fetchCleaners, { table: 'cleaner_profiles' })
  const cleaners = cleanersData ?? []

  const pendingCount = cleaners.filter((c) => c.verificationStatus === 'pending').length
  const incompleteCount = cleaners.filter((c) => c.verificationStatus === 'incomplete').length

  const filtered = cleaners.filter((c) => {
    if (filter === 'all') return true
    return c.verificationStatus === filter
  })

  const checklist = selected ? buildChecklist(selected, cleanerDocs) : []
  const checklistDone = checklist.filter((i) => i.done).length

  return (
    <div className="flex gap-6">
      {/* Left panel */}
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Verifications"
          description={`${pendingCount} pending · ${incompleteCount} incomplete`}
        />

        {/* Alert banner */}
        {(pendingCount > 0 || incompleteCount > 0) && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{pendingCount + incompleteCount} cleaners</span> require
              verification attention.
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 bg-[#f4f7f6] rounded-lg p-1 mb-4 w-fit">
          {VERIFICATION_FILTERS.map((f) => {
            const count = f.value === 'all' ? cleaners.length : cleaners.filter((c) => c.verificationStatus === f.value).length
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  filter === f.value
                    ? 'bg-white text-[#001e2b] shadow-sm'
                    : 'text-[#5c6c7a] hover:text-[#001e2b]'
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                    filter === f.value ? 'bg-[#e1e5e8] text-[#001e2b]' : 'text-[#a8b3bc]'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Cards grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cleaner) => {
            const cl = buildChecklist(cleaner)
            const done = cl.filter((i) => i.done).length
            const isSelected = selected?.id === cleaner.id
            return (
              <button
                key={cleaner.id}
                onClick={() => setSelected(cleaner)}
                className={cn(
                  'text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5',
                  isSelected
                    ? 'border-[#00684a] ring-1 ring-[#00684a]/20'
                    : 'border-[#e1e5e8]'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={cleaner.name} size="sm" />
                    <div>
                      <p className="font-semibold text-sm text-[#001e2b] leading-tight">{cleaner.name}</p>
                      <p className="text-[11px] text-[#7c8c9a] mt-0.5">{cleaner.serviceArea}</p>
                    </div>
                  </div>
                  <StatusBadge status={cleaner.verificationStatus} />
                </div>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-[#a8b3bc]">Documents</span>
                    <span className="text-[11px] font-semibold text-[#5c6c7a]">{done}/{cl.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f4f7f6] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        done === cl.length ? 'bg-emerald-500' : done >= 3 ? 'bg-amber-400' : 'bg-red-400'
                      )}
                      style={{ width: `${(done / cl.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#a8b3bc]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Joined {formatDate(cleaner.joinDate)}
                  </span>
                  {cleaner.guarantorName && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      Guarantor
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right detail panel */}
      {selected && (
        <div className="w-[340px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00684a]" />
              <p className="font-semibold text-[#001e2b] text-sm">Verification Review</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors text-xs"
            >
              Close
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Profile */}
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#001e2b]">{selected.name}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <StatusBadge status={selected.verificationStatus} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#5c6c7a]">
                <Phone className="w-3.5 h-3.5 text-[#a8b3bc]" />
                {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-[#5c6c7a]">
                <MapPin className="w-3.5 h-3.5 text-[#a8b3bc]" />
                {selected.serviceArea}
              </div>
              <div className="flex items-center gap-2 text-[#5c6c7a]">
                <Clock className="w-3.5 h-3.5 text-[#a8b3bc]" />
                Applied {formatDate(selected.joinDate)}
              </div>
            </div>

            {/* Guarantor */}
            {selected.guarantorName ? (
              <div className="bg-[#f9fbfa] rounded-lg p-3 text-sm">
                <p className="text-[10px] text-[#a8b3bc] uppercase font-semibold mb-1.5">
                  <User className="w-3 h-3 inline mr-1" />
                  Guarantor
                </p>
                <p className="font-medium text-[#001e2b]">{selected.guarantorName}</p>
                <p className="text-[#7c8c9a]">{selected.guarantorPhone}</p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
                <p className="text-red-700 font-medium text-xs">No guarantor on file</p>
              </div>
            )}

            {/* Document checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Document Checklist
                </p>
                <span className="text-[11px] font-semibold text-[#5c6c7a]">
                  {checklistDone}/{checklist.length}
                </span>
              </div>
               <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.done ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#c1ccd6] flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-sm truncate',
                          item.done ? 'text-[#3d4f5b]' : 'text-[#a8b3bc]'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 text-xs text-[#00684a] hover:underline hover:text-[#008c34] font-medium flex-shrink-0 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            {selected.verificationStatus !== 'approved' && selected.verificationStatus !== 'rejected' ? (
              <>
                {confirmAction ? (
                  <div
                    className={cn(
                      'rounded-lg border p-4 text-sm',
                      confirmAction === 'approve'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    )}
                  >
                    <p
                      className={cn(
                        'font-semibold mb-2',
                        confirmAction === 'approve' ? 'text-emerald-800' : 'text-red-800'
                      )}
                    >
                      Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
                    </p>
                    <p className={cn('text-xs mb-3', confirmAction === 'approve' ? 'text-emerald-700' : 'text-red-700')}>
                      {confirmAction === 'approve'
                        ? `${selected.name} will be approved and can start accepting bookings.`
                        : `${selected.name} will be rejected and notified with a reason.`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 h-8 rounded-lg border border-[#e1e5e8] bg-white text-xs text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          const sb = createClient()
                          await setCleanerVerification(
                            sb,
                            selected.id,
                            confirmAction === 'approve' ? 'approved' : 'rejected'
                          )
                          setConfirmAction(null)
                        }}
                        className={cn(
                          'flex-1 h-8 rounded-lg text-xs font-semibold transition-colors',
                          confirmAction === 'approve'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        )}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmAction('reject')}
                      className="flex-1 h-9 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => setConfirmAction('approve')}
                      className="flex-1 h-9 rounded-lg bg-[#00ed64] text-sm text-[#001e2b] hover:bg-[#00c853] transition-colors font-semibold flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                className={cn(
                  'rounded-lg p-3 text-center text-sm font-medium',
                  selected.verificationStatus === 'approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {selected.verificationStatus === 'approved' ? 'Verified & Approved' : 'Application Rejected'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
