'use client'

import { DollarSign, Calendar, Users, Wrench } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { BookingsChart } from '@/components/dashboard/BookingsChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { ServiceBreakdown } from '@/components/dashboard/ServiceBreakdown'
import { TopCleaners } from '@/components/dashboard/TopCleaners'
import { LiveFeedback } from '@/components/dashboard/LiveFeedback'
import { PageHeader } from '@/components/shared/PageHeader'
import { fetchKpi } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { formatCurrency } from '@/lib/utils'

export default function OverviewPage() {
  const { data: kpi } = useLiveData(fetchKpi, { table: 'payments' })

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Platform-wide activity and performance metrics."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Revenue"
          value={formatCurrency(kpi?.totalRevenue ?? 0)}
          trend={kpi?.revenueTrend ?? 0}
          trendLabel="vs last month"
          icon={<DollarSign className="w-4 h-4" />}
          accent="#00684a"
        />
        <StatsCard
          label="Active Bookings"
          value={(kpi?.activeBookings ?? 0).toString()}
          trend={kpi?.bookingsTrend ?? 0}
          trendLabel="vs last week"
          icon={<Calendar className="w-4 h-4" />}
          accent="#3d4f9f"
        />
        <StatsCard
          label="Registered Users"
          value={(kpi?.registeredUsers ?? 0).toString()}
          trend={kpi?.usersTrend ?? 0}
          trendLabel="vs last month"
          icon={<Users className="w-4 h-4" />}
          accent="#fa6e39"
        />
        <StatsCard
          label="Active Cleaners"
          value={(kpi?.activeCleaners ?? 0).toString()}
          trend={kpi?.cleanersTrend ?? 0}
          trendLabel="vs last month"
          icon={<Wrench className="w-4 h-4" />}
          accent="#7b3ff2"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <RevenueChart />
        <BookingsChart />
      </div>

      {/* Middle Row: Live Feedback & Service Areas & Top Cleaners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <LiveFeedback />
        <ServiceBreakdown />
        <TopCleaners />
      </div>

      {/* Bottom Row: Recent Activity */}
      <div className="grid grid-cols-1">
        <RecentActivity />
      </div>
    </div>
  )
}
