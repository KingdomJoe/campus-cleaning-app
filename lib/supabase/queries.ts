import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Client,
  Cleaner,
  Booking,
  BookingStatus,
  Transaction,
  TransactionStatus,
  Dispute,
  DisputeStatus,
  DisputeType,
  Review,
  Notification,
  ServiceArea,
  ServicePricing,
  AdminUser,
  KPIData,
  ChartPoint,
  ActivityItem,
  ServiceType,
  VerificationStatus,
  UserStatus,
  AdminRole,
} from '@/lib/types'

type SB = SupabaseClient

// ─── Enum / name mappers ─────────────────────────────────────────────────────

const SERVICE_NAME_TO_SLUG: Record<string, ServiceType> = {
  'express touch-up': 'express_touchup',
  'deep scrub': 'deep_scrub',
  'move-in / move-out': 'move_in_out',
  'move-in/move-out': 'move_in_out',
  'wash only': 'wash_only',
  'wash & iron': 'wash_and_iron',
  'iron only': 'iron_only',
}

export function slugFromName(name: string): ServiceType {
  const key = name.trim().toLowerCase()
  if (SERVICE_NAME_TO_SLUG[key]) return SERVICE_NAME_TO_SLUG[key]
  return key.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') as ServiceType
}

export function mapBookingStatus(raw: string): BookingStatus {
  switch (raw) {
    case 'requested':
      return 'pending'
    case 'accepted':
      return 'accepted'
    case 'en_route':
      return 'en_route'
    case 'arrived':
      return 'arrived'
    case 'started':
      return 'in_progress'
    case 'completed':
    case 'verified':
    case 'closed':
      return 'completed'
    case 'cancelled':
    case 'declined':
      return 'cancelled'
    default:
      return raw as BookingStatus
  }
}

export function mapPaymentStatus(raw?: string | null): TransactionStatus {
  if (raw === 'held') return 'escrow'
  if (raw === 'released') return 'released'
  if (raw === 'refunded') return 'refunded'
  return 'pending'
}

export function mapDisputeStatus(raw: string): DisputeStatus {
  if (raw === 'under_review') return 'in_progress'
  return raw as DisputeStatus
}

const DISPUTE_TYPE_FROM_DB: Record<string, DisputeType> = {
  no_show: 'cleaner_no_show',
  poor_quality: 'poor_quality',
  property_damage: 'property_damage',
  theft: 'theft',
  overcharge: 'overcharge',
}

export function mapDisputeType(raw: string): DisputeType {
  return DISPUTE_TYPE_FROM_DB[raw] ?? (raw as DisputeType)
}

export function mapUserStatus(raw?: string | null): UserStatus {
  return raw === 'suspended' ? 'suspended' : 'active'
}

// ─── Profiles helpers ────────────────────────────────────────────────────────

async function fetchProfilesMap(sb: SB, ids: string[]) {
  if (ids.length === 0) return new Map<string, any>()
  const { data } = await sb
    .from('profiles')
    .select('id,full_name,email,phone,location,created_at,status,avatar_url')
    .in('id', ids)
  const m = new Map<string, any>()
  ;(data ?? []).forEach((p) => m.set(p.id, p))
  return m
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function fetchBookings(sb: SB): Promise<Booking[]> {
  const { data: bks } = await sb
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
  if (!bks || bks.length === 0) return []

  const { data: sts } = await sb.from('service_types').select('id,name')
  const { data: pays } = await sb
    .from('payments')
    .select('booking_id,status,amount')
    .in('booking_id', bks.map((b: any) => b.id))
  const { data: ds } = await sb.from('disputes').select('booking_id')
  const { data: revs } = await sb
    .from('reviews')
    .select('booking_id,overall_rating,comment')
    .in('booking_id', bks.map((b: any) => b.id))

  const clientIds = [...new Set(bks.map((b: any) => b.client_id))]
  const cleanerIds = [
    ...new Set(bks.map((b: any) => b.cleaner_id).filter(Boolean)),
  ] as string[]
  const profMap = await fetchProfilesMap(sb, [...clientIds, ...cleanerIds])
  const stMap = new Map((sts ?? []).map((s: any) => [s.id, s.name]))
  const payMap = new Map((pays ?? []).map((p: any) => [p.booking_id, p]))
  const revMap = new Map((revs ?? []).map((r: any) => [r.booking_id, r]))
  const disputedIds = new Set((ds ?? []).map((d: any) => d.booking_id))

  return (bks as any[]).map((b) => {
    const client = profMap.get(b.client_id)
    const cleaner = b.cleaner_id ? profMap.get(b.cleaner_id) : null
    const pay = payMap.get(b.id)
    const rev = revMap.get(b.id)
    let status = mapBookingStatus(b.status)
    if (disputedIds.has(b.id)) status = 'disputed'
    return {
      id: b.id,
      clientId: b.client_id,
      clientName: client?.full_name ?? 'Unknown',
      cleanerId: b.cleaner_id ?? '',
      cleanerName: cleaner?.full_name ?? 'Unassigned',
      serviceType: slugFromName(stMap.get(b.service_type_id) ?? ''),
      status,
      date: b.scheduled_date,
      scheduledTime: (b.scheduled_time ?? '').toString().slice(0, 5),
      amount: Number(pay?.amount ?? b.total_price ?? 0),
      location: b.location ?? '',
      notes: b.description ?? undefined,
      rating: rev ? Number(rev.overall_rating) : undefined,
      review: rev?.comment ?? undefined,
      paymentStatus: mapPaymentStatus(pay?.status),
    }
  })
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function fetchClients(sb: SB): Promise<Client[]> {
  const { data: profiles } = await sb
    .from('profiles')
    .select('id,full_name,email,phone,location,created_at,status,avatar_url')
    .eq('role', 'client')
  if (!profiles || profiles.length === 0) return []

  const ids = profiles.map((p: any) => p.id)
  const { data: bks } = await sb
    .from('bookings')
    .select('client_id,total_price')
    .in('client_id', ids)

  const bookingsMap = new Map<string, { count: number; spent: number }>()
  ;(bks ?? []).forEach((b: any) => {
    const cur = bookingsMap.get(b.client_id) ?? { count: 0, spent: 0 }
    cur.count += 1
    cur.spent += Number(b.total_price ?? 0)
    bookingsMap.set(b.client_id, cur)
  })

  return (profiles as any[]).map((p) => {
    const agg = bookingsMap.get(p.id) ?? { count: 0, spent: 0 }
    return {
      id: p.id,
      name: p.full_name,
      phone: p.phone ?? '',
      email: p.email ?? '',
      location: p.location ?? '',
      joinDate: (p.created_at ?? '').slice(0, 10),
      totalBookings: agg.count,
      totalSpent: agg.spent,
      status: mapUserStatus(p.status),
      avatar: p.avatar_url ?? undefined,
    }
  })
}

// ─── Cleaners ───────────────────────────────────────────────────────────────

export async function fetchCleaners(sb: SB): Promise<Cleaner[]> {
  const { data: profiles } = await sb
    .from('profiles')
    .select('id,full_name,email,phone,location,created_at,status,avatar_url')
    .eq('role', 'cleaner')
  if (!profiles || profiles.length === 0) return []

  const ids = profiles.map((p: any) => p.id)
  const { data: cps } = await sb
    .from('cleaner_profiles')
    .select('user_id,verification_status,guarantor_name,guarantor_phone,avg_rating,total_jobs')
    .in('user_id', ids)
  const cpMap = new Map((cps ?? []).map((c: any) => [c.user_id, c]))

  const { data: pays } = await sb
    .from('payments')
    .select('cleaner_id,cleaner_payout,status')
    .in('cleaner_id', ids)
  const earningsMap = new Map<string, number>()
  ;(pays ?? []).forEach((p: any) => {
    if (p.status === 'released') {
      earningsMap.set(p.cleaner_id, (earningsMap.get(p.cleaner_id) ?? 0) + Number(p.cleaner_payout ?? 0))
    }
  })

  const { data: bks } = await sb
    .from('bookings')
    .select('cleaner_id,status')
    .in('cleaner_id', ids)
  const totalMap = new Map<string, number>()
  const doneMap = new Map<string, number>()
  ;(bks ?? []).forEach((b: any) => {
    totalMap.set(b.cleaner_id, (totalMap.get(b.cleaner_id) ?? 0) + 1)
    if (['completed', 'verified', 'closed'].includes(b.status))
      doneMap.set(b.cleaner_id, (doneMap.get(b.cleaner_id) ?? 0) + 1)
  })

  const { data: apps } = await sb
    .from('booking_applications')
    .select('cleaner_id,status')
    .in('cleaner_id', ids)
  const appTotal = new Map<string, number>()
  const appAcc = new Map<string, number>()
  ;(apps ?? []).forEach((a: any) => {
    appTotal.set(a.cleaner_id, (appTotal.get(a.cleaner_id) ?? 0) + 1)
    if (a.status === 'accepted') appAcc.set(a.cleaner_id, (appAcc.get(a.cleaner_id) ?? 0) + 1)
  })

  return (profiles as any[]).map((p) => {
    const cp = cpMap.get(p.id)
    const total = totalMap.get(p.id) ?? 0
    const done = doneMap.get(p.id) ?? 0
    const aTotal = appTotal.get(p.id) ?? 0
    const aAcc = appAcc.get(p.id) ?? 0
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
    const acceptanceRate = aTotal > 0 ? Math.round((aAcc / aTotal) * 100) : 0
    return {
      id: p.id,
      name: p.full_name,
      phone: p.phone ?? '',
      email: p.email ?? '',
      rating: Number(cp?.avg_rating ?? 0),
      jobsCompleted: Number(cp?.total_jobs ?? 0),
      earnings: earningsMap.get(p.id) ?? 0,
      verificationStatus: (cp?.verification_status ?? 'pending') as VerificationStatus,
      status: mapUserStatus(p.status),
      joinDate: (p.created_at ?? '').slice(0, 10),
      acceptanceRate,
      completionRate,
      avatar: p.avatar_url ?? undefined,
      serviceArea: p.location ?? '—',
      guarantorName: cp?.guarantor_name ?? undefined,
      guarantorPhone: cp?.guarantor_phone ?? undefined,
    }
  })
}

// ─── Transactions / Payments ──────────────────────────────────────────────────

export async function fetchTransactions(sb: SB): Promise<Transaction[]> {
  const { data: pays } = await sb
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
  if (!pays || pays.length === 0) return []

  const bookingIds = pays.map((p: any) => p.booking_id)
  const { data: bks } = await sb
    .from('bookings')
    .select('id,client_id,cleaner_id')
    .in('id', bookingIds)
  const bkMap = new Map((bks ?? []).map((b: any) => [b.id, b]))

  const clientIds = pays.map((p: any) => p.client_id)
  const cleanerIds = pays.map((p: any) => p.cleaner_id).filter(Boolean)
  const profMap = await fetchProfilesMap(sb, [...clientIds, ...cleanerIds])

  return (pays as any[]).map((p) => {
    const bk = bkMap.get(p.booking_id) ?? {}
    const client = profMap.get(p.client_id)
    const cleaner = p.cleaner_id ? profMap.get(p.cleaner_id) : null
    return {
      id: p.id,
      bookingId: p.booking_id,
      clientName: client?.full_name ?? 'Unknown',
      cleanerName: cleaner?.full_name ?? 'Unassigned',
      amount: Number(p.amount ?? 0),
      platformFee: Number(p.platform_fee ?? 0),
      cleanerPayout: Number(p.cleaner_payout ?? 0),
      status: mapPaymentStatus(p.status),
      date: (p.created_at ?? '').slice(0, 10),
    }
  })
}

// ─── Disputes ───────────────────────────────────────────────────────────────

export async function fetchDisputes(sb: SB): Promise<Dispute[]> {
  const { data: ds } = await sb
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false })
  if (!ds || ds.length === 0) return []

  const bookingIds = ds.map((d: any) => d.booking_id)
  const { data: bks } = await sb
    .from('bookings')
    .select('id,client_id,cleaner_id,total_price')
    .in('id', bookingIds)
  const bkMap = new Map((bks ?? []).map((b: any) => [b.id, b]))

  const clientIds = ds.map((d: any) => d.raised_by)
  const cleanerIds = (bks ?? []).map((b: any) => b.cleaner_id).filter(Boolean)
  const profMap = await fetchProfilesMap(sb, [...clientIds, ...cleanerIds])

  return (ds as any[]).map((d) => {
    const bk = bkMap.get(d.booking_id) ?? {}
    const client = profMap.get(d.raised_by)
    const cleaner = bk.cleaner_id ? profMap.get(bk.cleaner_id) : null
    return {
      id: d.id,
      bookingId: d.booking_id,
      type: mapDisputeType(d.type),
      clientName: client?.full_name ?? 'Unknown',
      cleanerName: cleaner?.full_name ?? 'Unassigned',
      filedDate: (d.created_at ?? '').slice(0, 10),
      priority: (d.priority ?? 'medium') as Dispute['priority'],
      status: mapDisputeStatus(d.status),
      description: d.description ?? '',
      resolution: d.resolution ?? undefined,
      amount: Number(bk.total_price ?? 0),
    }
  })
}

// ─── Reviews / Feedback ──────────────────────────────────────────────────────

export async function fetchReviews(sb: SB): Promise<Review[]> {
  const { data: revs } = await sb
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (!revs || revs.length === 0) return []

  const bookingIds = revs.map((r: any) => r.booking_id)
  const { data: bks } = await sb
    .from('bookings')
    .select('id,client_id,cleaner_id,service_type_id')
    .in('id', bookingIds)
  const bkMap = new Map((bks ?? []).map((b: any) => [b.id, b]))
  const { data: sts } = await sb.from('service_types').select('id,name')
  const stMap = new Map((sts ?? []).map((s: any) => [s.id, s.name]))

  const clientIds = revs.map((r: any) => r.client_id)
  const cleanerIds = revs.map((r: any) => r.cleaner_id)
  const profMap = await fetchProfilesMap(sb, [...clientIds, ...cleanerIds])

  return (revs as any[]).map((r) => {
    const bk = bkMap.get(r.booking_id) ?? {}
    const client = profMap.get(r.client_id)
    const cleaner = profMap.get(r.cleaner_id)
    return {
      id: r.id,
      bookingId: r.booking_id,
      clientName: client?.full_name ?? 'Unknown',
      cleanerName: cleaner?.full_name ?? 'Unassigned',
      rating: Number(r.overall_rating ?? 0),
      text: r.comment ?? '',
      qualityRating: Number(r.quality_rating ?? 0),
      punctualityRating: Number(r.punctuality_rating ?? 0),
      professionalismRating: Number(r.professionalism_rating ?? 0),
      communicationRating: Number(r.communication_rating ?? 0),
      serviceType: slugFromName(stMap.get(bk.service_type_id) ?? ''),
      date: (r.created_at ?? '').slice(0, 10),
      flagged: !!r.flagged,
      hidden: !!r.hidden,
    }
  })
}

// ─── Broadcasts (Notifications page) ──────────────────────────────────────────

export async function fetchBroadcasts(sb: SB): Promise<Notification[]> {
  const { data } = await sb
    .from('admin_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    recipient: n.recipient,
    sentDate: (n.sent_at ?? n.created_at ?? '').slice(0, 19),
    status: n.status,
  }))
}

// ─── Service Areas (Settings) ────────────────────────────────────────────────

export async function fetchServiceAreas(sb: SB): Promise<ServiceArea[]> {
  const { data: areas } = await sb.from('service_areas').select('*').order('name')
  if (!areas) return []
  const { data: bks } = await sb.from('bookings').select('location')
  const { data: cleaners } = await sb.from('profiles').select('location').eq('role', 'cleaner')
  const bookingCount = (name: string) =>
    (bks ?? []).filter((b: any) => (b.location ?? '').includes(name.split(' ')[0])).length
  const cleanerCount = (name: string) =>
    (cleaners ?? []).filter((c: any) => (c.location ?? '').includes(name.split(' ')[0])).length
  return (areas as any[]).map((a) => ({
    id: a.id,
    name: a.name,
    active: a.active,
    radius: Number(a.radius_km),
    description: a.description ?? '',
    cleanerCount: cleanerCount(a.name),
    bookingCount: bookingCount(a.name),
  }))
}

// ─── Service Pricing (Settings) ──────────────────────────────────────────────

export async function fetchServicePricing(sb: SB): Promise<ServicePricing[]> {
  const { data } = await sb.from('service_types').select('*').order('name')
  return (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    serviceType: slugFromName(s.name),
    basePrice: Number(s.base_price ?? 0),
    description: s.description ?? '',
  }))
}

// ─── Admin Users (Settings) ──────────────────────────────────────────────────

export async function fetchAdminUsers(sb: SB): Promise<AdminUser[]> {
  const { data } = await sb
    .from('profiles')
    .select('id,full_name,email,role,created_at,updated_at,status')
    .in('role', ['admin', 'super_admin'])
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.full_name,
    email: p.email ?? '',
    role: (p.role === 'super_admin' ? 'super_admin' : 'admin') as AdminRole,
    joinDate: (p.created_at ?? '').slice(0, 10),
    lastLogin: (p.updated_at ?? '').slice(0, 19),
    status: mapUserStatus(p.status),
  }))
}

// ─── KPI + Charts ────────────────────────────────────────────────────────────

export async function fetchKpi(sb: SB): Promise<KPIData> {
  const [usersRes, cleanersRes, bookingsRes, paymentsRes, bookingsAggRes] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }).or('role.eq.client,role.eq.cleaner'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cleaner').eq('status', 'active'),
    sb.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['accepted', 'en_route', 'arrived', 'started']),
    sb.from('payments').select('amount,status').eq('status', 'released'),
    sb.from('bookings').select('total_price'),
  ])

  const revenue = (paymentsRes.data ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const pipeline = (bookingsAggRes.data ?? []).reduce((s: number, b: any) => s + Number(b.total_price ?? 0), 0)

  return {
    totalRevenue: Math.round(revenue),
    revenueTrend: 12.4,
    activeBookings: bookingsRes.count ?? 0,
    bookingsTrend: -3.2,
    registeredUsers: usersRes.count ?? 0,
    usersTrend: 18.6,
    activeCleaners: cleanersRes.count ?? 0,
    cleanersTrend: 8.3,
    pipelineValue: Math.round(pipeline),
  }
}

export async function fetchRevenueChart(sb: SB): Promise<ChartPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - 29)
  const { data } = await sb
    .from('payments')
    .select('amount,created_at,status')
    .gte('created_at', since.toISOString())
    .eq('status', 'released')
  const byDay = new Map<string, { revenue: number; bookings: number }>()
  ;(data ?? []).forEach((p: any) => {
    const day = (p.created_at ?? '').slice(0, 10)
    const cur = byDay.get(day) ?? { revenue: 0, bookings: 0 }
    cur.revenue += Number(p.amount ?? 0)
    cur.bookings += 1
    byDay.set(day, cur)
  })
  const points: ChartPoint[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const cur = byDay.get(key) ?? { revenue: 0, bookings: 0 }
    points.push({ date: key, revenue: Math.round(cur.revenue), bookings: cur.bookings })
  }
  return points
}

export async function fetchBookingsChart(sb: SB): Promise<
  { month: string; cleaning: number; laundry: number }[]
> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const out: { month: string; cleaning: number; laundry: number }[] = []
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
    const { data: bks } = await sb
      .from('bookings')
      .select('service_type_id')
      .gte('created_at', start)
      .lt('created_at', end)
    const { data: sts } = await sb.from('service_types').select('id,category')
    const catMap = new Map((sts ?? []).map((s: any) => [s.id, s.category]))
    let cleaning = 0
    let laundry = 0
    ;(bks ?? []).forEach((b: any) => {
      if (catMap.get(b.service_type_id) === 'laundry') laundry++
      else cleaning++
    })
    out.push({ month: months[d.getMonth()], cleaning, laundry })
  }
  return out
}

export async function fetchServiceBreakdown(sb: SB): Promise<
  { name: string; value: number; color: string }[]
> {
  const { data: areas } = await sb.from('service_areas').select('name').eq('active', true)
  const { data: bks } = await sb.from('bookings').select('location')
  const colors = ['#00684a', '#00ed64', '#003d4f', '#3d4f9f', '#7b3ff2']
  return (areas ?? []).map((a: any, i: number) => {
    const value = (bks ?? []).filter((b: any) => (b.location ?? '').includes(a.name.split(' ')[0])).length
    return { name: a.name, value, color: colors[i % colors.length] }
  })
}

export async function fetchTopCleaners(sb: SB) {
  const cleaners = await fetchCleaners(sb)
  return cleaners
    .filter((c) => c.verificationStatus === 'approved' && c.status === 'active')
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5)
}

export async function fetchActivityFeed(sb: SB): Promise<ActivityItem[]> {
  const items: ActivityItem[] = []

  const { data: bks } = await sb
    .from('bookings')
    .select('id,created_at,service_type_id,total_price')
    .order('created_at', { ascending: false })
    .limit(6)
  const { data: sts } = await sb.from('service_types').select('id,name')
  const stMap = new Map((sts ?? []).map((s: any) => [s.id, s.name]))
  ;(bks ?? []).forEach((b: any) => {
    items.push({
      id: `bk-${b.id}`,
      type: 'booking',
      description: `New booking ${b.id.slice(0, 8)} placed`,
      timestamp: (b.created_at ?? '').slice(0, 19),
      meta: `${slugFromName(stMap.get(b.service_type_id) ?? '')} · GH₵${Number(b.total_price ?? 0)}`,
    })
  })

  const { data: ds } = await sb
    .from('disputes')
    .select('id,created_at,type')
    .order('created_at', { ascending: false })
    .limit(4)
  ;(ds ?? []).forEach((d: any) => {
    items.push({
      id: `ds-${d.id}`,
      type: 'dispute',
      description: `Dispute ${d.id.slice(0, 8)} filed`,
      timestamp: (d.created_at ?? '').slice(0, 19),
      meta: mapDisputeType(d.type),
    })
  })

  const { data: revs } = await sb
    .from('reviews')
    .select('id,created_at,overall_rating')
    .order('created_at', { ascending: false })
    .limit(4)
  ;(revs ?? []).forEach((r: any) => {
    items.push({
      id: `rv-${r.id}`,
      type: 'review',
      description: `New ${Number(r.overall_rating ?? 0)}-star review submitted`,
      timestamp: (r.created_at ?? '').slice(0, 19),
    })
  })

  const { data: pays } = await sb
    .from('payments')
    .select('id,created_at,amount,status')
    .in('status', ['released', 'held'])
    .order('created_at', { ascending: false })
    .limit(4)
  ;(pays ?? []).forEach((p: any) => {
    items.push({
      id: `py-${p.id}`,
      type: 'payment',
      description:
        p.status === 'released'
          ? `Payout of GH₵${Number(p.amount ?? 0)} released`
          : `Escrow payment held`,
      timestamp: (p.created_at ?? '').slice(0, 19),
      meta: p.status === 'released' ? 'Released' : 'Escrow',
    })
  })

  const { data: verifs } = await sb
    .from('cleaner_profiles')
    .select('user_id,updated_at')
    .eq('verification_status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(4)
  ;(verifs ?? []).forEach((v: any) => {
    items.push({
      id: `vf-${v.user_id}`,
      type: 'verification',
      description: `Cleaner submitted verification documents`,
      timestamp: (v.updated_at ?? '').slice(0, 19),
      meta: 'Pending Review',
    })
  })

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)
}

// ─── Mutations (admin actions) ───────────────────────────────────────────────

export async function releasePayment(sb: SB, paymentId: string) {
  return sb.from('payments').update({ status: 'released' }).eq('id', paymentId)
}

export async function updateBookingStatus(sb: SB, bookingId: string, status: string) {
  return sb.from('bookings').update({ status }).eq('id', bookingId)
}

export async function resolveDispute(sb: SB, disputeId: string, resolution: string, status = 'resolved') {
  return sb.from('disputes').update({ status, resolution }).eq('id', disputeId)
}

export async function escalateDispute(sb: SB, disputeId: string) {
  return sb.from('disputes').update({ status: 'escalated' }).eq('id', disputeId)
}

export async function setCleanerVerification(sb: SB, cleanerId: string, verificationStatus: string) {
  return sb.from('cleaner_profiles').update({ verification_status: verificationStatus }).eq('user_id', cleanerId)
}

export async function setProfileStatus(sb: SB, profileId: string, status: string) {
  return sb.from('profiles').update({ status }).eq('id', profileId)
}

export async function setReviewFlag(sb: SB, reviewId: string, flagged: boolean, hidden: boolean) {
  return sb.from('reviews').update({ flagged, hidden }).eq('id', reviewId)
}

export async function updateServiceTypePrice(sb: SB, id: string, basePrice: number) {
  return sb.from('service_types').update({ base_price: basePrice }).eq('id', id)
}

export async function toggleServiceArea(sb: SB, id: string, active: boolean) {
  return sb.from('service_areas').update({ active }).eq('id', id)
}

export async function sendBroadcast(sb: SB, payload: {
  title: string
  message: string
  type: string
  recipient: string
}) {
  const { data: auth } = await sb.auth.getUser()
  const { error } = await sb.from('admin_broadcasts').insert({
    title: payload.title,
    message: payload.message,
    type: payload.type,
    recipient: payload.recipient,
    status: 'sent',
    created_by: auth.user?.id ?? null,
    sent_at: new Date().toISOString(),
  })
  if (error) return { error }

  const { data: recipients } = await sb.from('profiles').select('id,role')
  if (recipients) {
    const targets = recipients
      .filter((p: any) => {
        if (payload.recipient === 'all') return true
        if (payload.recipient === 'clients') return p.role === 'client'
        if (payload.recipient === 'cleaners') return p.role === 'cleaner'
        return false
      })
      .map((p: any) => ({
        user_id: p.id,
        title: payload.title,
        body: payload.message,
        data: { type: payload.type },
      }))
    if (targets.length > 0) {
      await sb.from('notifications').insert(targets)
    }
  }
  return { error: null }
}
