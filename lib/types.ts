// ─── Enums & Unions ────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  // Raw DB values (mapped to the UI vocabulary in lib/supabase/queries)
  | 'requested'
  | 'started'
  | 'verified'
  | 'closed'
  | 'declined'

export type ServiceType =
  | 'express_touchup'
  | 'deep_scrub'
  | 'move_in_out'
  | 'wash_only'
  | 'wash_and_iron'
  | 'iron_only'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'incomplete'

export type UserStatus = 'active' | 'suspended' | 'inactive'

export type TransactionStatus = 'escrow' | 'released' | 'refunded' | 'pending'

export type DisputeType =
  | 'cleaner_no_show'
  | 'poor_quality'
  | 'property_damage'
  | 'theft'
  | 'overcharge'

export type DisputeStatus = 'open' | 'in_progress' | 'resolved' | 'escalated' | 'under_review'

export type DisputePriority = 'high' | 'medium' | 'low'

export type NotificationType = 'booking' | 'payment' | 'system' | 'dispute'

export type NotificationRecipient = 'all' | 'clients' | 'cleaners' | 'specific'

export type AdminRole = 'super_admin' | 'admin' | 'support'

// ─── Core Entities ─────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  location: string
  joinDate: string
  totalBookings: number
  totalSpent: number
  status: UserStatus
  avatar?: string
}

export interface Cleaner {
  id: string
  name: string
  phone: string
  email: string
  rating: number
  jobsCompleted: number
  earnings: number
  verificationStatus: VerificationStatus
  status: UserStatus
  joinDate: string
  acceptanceRate: number
  completionRate: number
  avatar?: string
  serviceArea: string
  guarantorName?: string
  guarantorPhone?: string
}

export interface Booking {
  id: string
  clientId: string
  clientName: string
  cleanerId: string
  cleanerName: string
  serviceType: ServiceType
  status: BookingStatus
  date: string
  scheduledTime: string
  amount: number
  location: string
  notes?: string
  rating?: number
  review?: string
  paymentStatus: TransactionStatus
}

export interface Transaction {
  id: string
  bookingId: string
  clientName: string
  cleanerName: string
  amount: number
  platformFee: number
  cleanerPayout: number
  status: TransactionStatus
  date: string
}

export interface Dispute {
  id: string
  bookingId: string
  type: DisputeType
  clientName: string
  cleanerName: string
  filedDate: string
  priority: DisputePriority
  status: DisputeStatus
  description: string
  resolution?: string
  amount: number
}

export interface Review {
  id: string
  bookingId: string
  clientName: string
  cleanerName: string
  rating: number
  text: string
  qualityRating: number
  punctualityRating: number
  professionalismRating: number
  communicationRating: number
  serviceType: ServiceType
  date: string
  flagged?: boolean
  hidden?: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  recipient: NotificationRecipient
  sentDate: string
  status: 'sent' | 'failed' | 'scheduled'
}

export interface ServiceArea {
  id: string
  name: string
  active: boolean
  radius: number
  description: string
  cleanerCount: number
  bookingCount: number
}

export interface ServicePricing {
  id: string
  name: string
  serviceType: ServiceType
  basePrice: number
  expressPrice?: number
  duration?: string
  description: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  joinDate: string
  lastLogin: string
  status: UserStatus
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface KPIData {
  totalRevenue: number
  revenueTrend: number
  activeBookings: number
  bookingsTrend: number
  registeredUsers: number
  usersTrend: number
  activeCleaners: number
  cleanersTrend: number
  pipelineValue?: number
}

export interface ChartPoint {
  date: string
  revenue: number
  bookings: number
}

export interface ActivityItem {
  id: string
  type: 'booking' | 'verification' | 'dispute' | 'payment' | 'review'
  description: string
  timestamp: string
  meta?: string
}
