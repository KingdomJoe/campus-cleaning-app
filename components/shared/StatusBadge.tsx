'use client'

import { cn } from '@/lib/utils'
import type {
  BookingStatus,
  VerificationStatus,
  UserStatus,
  TransactionStatus,
  DisputeStatus,
  DisputePriority,
} from '@/lib/types'

type StatusVariant =
  | BookingStatus
  | VerificationStatus
  | UserStatus
  | TransactionStatus
  | DisputeStatus
  | DisputePriority

const variantStyles: Record<string, string> = {
  // Booking statuses
  pending:     'bg-orange-50 text-orange-700 border border-orange-200',
  accepted:    'bg-teal-50 text-teal-700 border border-teal-200',
  en_route:    'bg-cyan-50 text-cyan-700 border border-cyan-200',
  arrived:     'bg-violet-50 text-violet-700 border border-violet-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled:   'bg-gray-100 text-gray-600 border border-gray-200',
  disputed:    'bg-red-50 text-red-700 border border-red-200',

  // Verification statuses
  approved:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected:    'bg-red-50 text-red-700 border border-red-200',
  incomplete:  'bg-gray-100 text-gray-600 border border-gray-200',

  // User statuses
  active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  suspended:   'bg-red-50 text-red-700 border border-red-200',
  inactive:    'bg-gray-100 text-gray-600 border border-gray-200',

  // Transaction statuses
  escrow:      'bg-orange-50 text-orange-700 border border-orange-200',
  released:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  refunded:    'bg-purple-50 text-purple-700 border border-purple-200',

  // Dispute statuses
  open:        'bg-red-50 text-red-700 border border-red-200',
  resolved:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  escalated:   'bg-purple-50 text-purple-700 border border-purple-200',

  // Priority
  high:        'bg-red-50 text-red-700 border border-red-200',
  medium:      'bg-orange-50 text-orange-700 border border-orange-200',
  low:         'bg-gray-100 text-gray-600 border border-gray-200',
}

const labelMap: Record<string, string> = {
  in_progress: 'In Progress',
  en_route: 'En Route',
  cleaner_no_show: 'No-Show',
  poor_quality: 'Poor Quality',
  property_damage: 'Property Damage',
  wash_and_iron: 'Wash & Iron',
  wash_only: 'Wash Only',
  iron_only: 'Iron Only',
  express_touchup: 'Express Touch-Up',
  deep_scrub: 'Deep Scrub',
  move_in_out: 'Move-In/Out',
  super_admin: 'Super Admin',
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const style = variantStyles[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  const label = labelMap[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        style,
        className
      )}
    >
      {label}
    </span>
  )
}
