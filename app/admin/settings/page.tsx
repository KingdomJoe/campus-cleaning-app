'use client'

import { useState, useEffect } from 'react'
import {
  MapPin,
  DollarSign,
  Users,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useLiveData } from '@/lib/supabase/hooks'
import {
  fetchServiceAreas,
  fetchServicePricing,
  fetchAdminUsers,
  updateServiceTypePrice,
  toggleServiceArea,
  fetchPlatformSettings,
  updatePlatformSetting,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { ServiceArea, ServicePricing, AdminUser } from '@/lib/types'

const TABS = [
  { id: 'pricing', label: 'Service Pricing', icon: DollarSign },
  { id: 'areas', label: 'Service Areas', icon: MapPin },
  { id: 'team', label: 'Admin Team', icon: Users },
  { id: 'platform', label: 'Platform', icon: Shield },
] as const

type TabId = typeof TABS[number]['id']

// ─── Pricing Tab ────────────────────────────────────────────────────────────

function PricingTab({ servicePricing }: { servicePricing: ServicePricing[] }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ServicePricing>>({})

  function startEdit(item: ServicePricing) {
    setEditId(item.id)
    setEditValues({ basePrice: item.basePrice, expressPrice: item.expressPrice })
  }

  function cancelEdit() {
    setEditId(null)
    setEditValues({})
  }

  async function saveEdit(id: string) {
    const sb = createClient()
    await updateServiceTypePrice(sb, id, Number(editValues.basePrice))
    setEditId(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#7c8c9a]">
        Set base and express prices for each service type. Commission is fixed at 20%.
      </p>
      <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Duration</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Base Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Express</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {servicePricing.map((item) => {
              const isEditing = editId === item.id
              return (
                <tr key={item.id} className="border-b border-[#f0f4f2]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#001e2b]">{item.name}</p>
                    <StatusBadge status={item.serviceType} className="mt-1" />
                  </td>
                  <td className="px-4 py-3 text-[#5c6c7a] max-w-[200px]">
                    <p className="truncate">{item.description}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5c6c7a]">{item.duration}</td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.basePrice ?? item.basePrice}
                        onChange={(e) => setEditValues((v) => ({ ...v, basePrice: Number(e.target.value) }))}
                        className="w-24 h-8 rounded-lg border border-[#00684a] text-right text-sm px-2 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 text-[#001e2b] font-semibold tabular-nums"
                      />
                    ) : (
                      <span className="font-semibold text-[#001e2b] tabular-nums">{formatCurrency(item.basePrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.expressPrice ?? item.expressPrice ?? ''}
                        onChange={(e) => setEditValues((v) => ({ ...v, expressPrice: Number(e.target.value) || undefined }))}
                        placeholder="N/A"
                        className="w-24 h-8 rounded-lg border border-[#00684a] text-right text-sm px-2 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 text-[#001e2b] tabular-nums"
                      />
                    ) : (
                      <span className="text-[#7c8c9a] tabular-nums">
                        {item.expressPrice ? formatCurrency(item.expressPrice) : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 rounded-lg bg-[#f4f7f6] text-[#5c6c7a] hover:bg-[#e1e5e8] flex items-center justify-center transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="w-7 h-7 rounded-lg bg-[#f4f7f6] text-[#5c6c7a] hover:bg-[#e1e5e8] flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Areas Tab ───────────────────────────────────────────────────────────────

function AreasTab({ serviceAreas }: { serviceAreas: ServiceArea[] }) {
  async function toggleArea(id: string, active: boolean) {
    const sb = createClient()
    await toggleServiceArea(sb, id, active)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7c8c9a]">Manage the geographic zones where Uber for Cleaning operates.</p>
        <button
          title="Coming soon — this feature is under development"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#001e2b]/50 text-white/70 text-xs font-semibold cursor-not-allowed"
          disabled
        >
          <Plus className="w-3.5 h-3.5" />
          Add Area
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {serviceAreas.map((area) => (
          <div
            key={area.id}
            className={cn(
              'bg-white rounded-xl border p-4 transition-all',
              area.active ? 'border-[#e1e5e8]' : 'border-[#f0f4f2] opacity-60'
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-[#001e2b]">{area.name}</p>
                <p className="text-xs text-[#7c8c9a] mt-0.5">{area.description}</p>
              </div>
              <button
                onClick={() => toggleArea(area.id, !area.active)}
                className="flex-shrink-0 transition-colors"
                aria-label={area.active ? 'Deactivate area' : 'Activate area'}
              >
                {area.active ? (
                  <ToggleRight className="w-6 h-6 text-[#00684a]" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-[#c1ccd6]" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-[#f9fbfa] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-[#001e2b]">{area.radius}km</p>
                <p className="text-[10px] text-[#a8b3bc]">Radius</p>
              </div>
              <div className="bg-[#f9fbfa] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-[#001e2b]">{area.cleanerCount}</p>
                <p className="text-[10px] text-[#a8b3bc]">Cleaners</p>
              </div>
              <div className="bg-[#f9fbfa] rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-[#001e2b]">{area.bookingCount}</p>
                <p className="text-[10px] text-[#a8b3bc]">Bookings</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Team Tab ────────────────────────────────────────────────────────────────

function TeamTab({ adminUsers }: { adminUsers: AdminUser[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7c8c9a]">Manage admin access and roles for the Uber for Cleaning team.</p>
        <button
          title="Coming soon — this feature is under development"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#001e2b]/50 text-white/70 text-xs font-semibold cursor-not-allowed"
          disabled
        >
          <Plus className="w-3.5 h-3.5" />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Admin</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Last Login</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((admin) => (
              <tr key={admin.id} className="border-b border-[#f0f4f2] hover:bg-[#f9fbfa] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={admin.name} size="sm" />
                    <div>
                      <p className="font-semibold text-[#001e2b]">{admin.name}</p>
                      <p className="text-xs text-[#7c8c9a]">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={admin.role} />
                </td>
                <td className="px-4 py-3 text-[#5c6c7a]">{formatDate(admin.joinDate)}</td>
                <td className="px-4 py-3 text-[#5c6c7a] text-xs">
                  {new Date(admin.lastLogin).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3"><StatusBadge status={admin.status} /></td>
                <td className="px-4 py-3">
                  <button className="w-7 h-7 rounded-lg bg-[#f4f7f6] text-[#5c6c7a] hover:bg-[#e1e5e8] flex items-center justify-center transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Platform Tab ────────────────────────────────────────────────────────────

function ToggleSetting({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[#f4f7f6] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#001e2b]">{label}</p>
        <p className="text-xs text-[#7c8c9a] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        className={cn("flex-shrink-0 mt-0.5", disabled && "opacity-50 cursor-not-allowed")}
        aria-label={value ? `Disable ${label}` : `Enable ${label}`}
        disabled={disabled}
      >
        {value ? (
          <ToggleRight className="w-7 h-7 text-[#00684a]" />
        ) : (
          <ToggleLeft className="w-7 h-7 text-[#c1ccd6]" />
        )}
      </button>
    </div>
  )
}

function PlatformTab() {
  const { data: settings, loading } = useLiveData(fetchPlatformSettings, { table: 'platform_settings' })
  const [isEditingComm, setIsEditingComm] = useState(false)
  const [commRate, setCommRate] = useState<string>('20')

  useEffect(() => {
    if (settings) {
      setCommRate(String(settings.commission_rate ?? '20'))
    }
  }, [settings])

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-sm text-[#7c8c9a]">
        Loading settings...
      </div>
    )
  }

  async function handleToggle(field: string, val: boolean) {
    const sb = createClient()
    await updatePlatformSetting(sb, field, val)
  }

  async function handleSaveCommission() {
    const sb = createClient()
    const rateVal = parseFloat(commRate)
    if (!isNaN(rateVal)) {
      await updatePlatformSetting(sb, 'commission_rate', rateVal)
    }
    setIsEditingComm(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
        <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold tracking-wide mb-1">Booking Settings</p>
        <ToggleSetting
          label="Auto-Accept Bookings"
          description="Allow verified cleaners to auto-accept bookings without manual confirmation."
          value={!!settings.auto_accept_bookings}
          onChange={(val) => handleToggle('auto_accept_bookings', val)}
        />
        <ToggleSetting
          label="Guest Bookings"
          description="Allow clients to book without creating an account."
          value={!!settings.guest_bookings}
          onChange={(val) => handleToggle('guest_bookings', val)}
        />
        <ToggleSetting
          label="Booking Reminders"
          description="Send automated reminders to clients and cleaners 24h before a booking."
          value={!!settings.booking_reminders}
          onChange={(val) => handleToggle('booking_reminders', val)}
        />
        <ToggleSetting
          label="Real-time Tracking"
          description="Enable GPS tracking for cleaners during active bookings."
          value={!!settings.real_time_tracking}
          onChange={(val) => handleToggle('real_time_tracking', val)}
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
        <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold tracking-wide mb-1">Payment Settings</p>
        <ToggleSetting
          label="Auto-Release Payments"
          description="Automatically release escrow payments 24h after booking completion if no dispute is filed."
          value={!!settings.auto_release_payments}
          onChange={(val) => handleToggle('auto_release_payments', val)}
        />
        <ToggleSetting
          label="Instant Payouts"
          description="Enable instant payout option for cleaners (additional processing fee applies)."
          value={!!settings.instant_payouts}
          onChange={(val) => handleToggle('instant_payouts', val)}
        />
        <ToggleSetting
          label="Refund Policy Enforcement"
          description="Automatically enforce the 48-hour refund policy for cancellations."
          value={!!settings.refund_policy_enforcement}
          onChange={(val) => handleToggle('refund_policy_enforcement', val)}
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
        <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold tracking-wide mb-1">Platform Health</p>
        <ToggleSetting
          label="Maintenance Mode"
          description="Take the platform offline for scheduled maintenance. Users will see a maintenance notice."
          value={!!settings.maintenance_mode}
          onChange={(val) => handleToggle('maintenance_mode', val)}
        />
        <ToggleSetting
          label="New Registrations"
          description="Allow new client and cleaner registrations."
          value={!!settings.new_registrations}
          onChange={(val) => handleToggle('new_registrations', val)}
        />
        <ToggleSetting
          label="Push Notifications"
          description="Enable push notifications across the platform."
          value={!!settings.push_notifications}
          onChange={(val) => handleToggle('push_notifications', val)}
        />
      </div>

      {/* Commission rate */}
      <div className="bg-white rounded-xl border border-[#e1e5e8] p-5">
        <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold tracking-wide mb-3">Commission Rate</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {isEditingComm ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={commRate}
                  onChange={(e) => setCommRate(e.target.value)}
                  className="w-20 h-9 rounded-lg border border-[#00684a] text-center text-sm px-2 focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 text-[#001e2b] font-semibold"
                />
                <span className="text-xl font-bold text-[#001e2b]">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-[#001e2b] tabular-nums">{settings.commission_rate ?? 20}</span>
                <span className="text-xl font-bold text-[#001e2b]">%</span>
              </div>
            )}
            <p className="text-xs text-[#7c8c9a] mt-1">Deducted from each completed booking</p>
          </div>
          {isEditingComm ? (
            <div className="flex gap-2">
              <button
                onClick={handleSaveCommission}
                className="h-9 px-4 rounded-lg bg-[#001e2b] text-sm text-white hover:bg-[#003d4f] transition-colors font-semibold flex items-center justify-center"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingComm(false)}
                className="h-9 px-4 rounded-lg border border-[#e1e5e8] text-sm text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingComm(true)}
              className="h-9 px-4 rounded-lg border border-[#e1e5e8] text-sm text-[#5c6c7a] hover:bg-[#f4f7f6] transition-colors font-medium flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Rate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pricing')

  const { data: areasData } = useLiveData(fetchServiceAreas, { table: 'service_areas' })
  const serviceAreas = areasData ?? []
  const { data: pricingData } = useLiveData(fetchServicePricing, { table: 'service_types' })
  const servicePricing = pricingData ?? []
  const { data: adminData } = useLiveData(fetchAdminUsers, { table: 'profiles' })
  const adminUsers = adminData ?? []

  return (
    <div>
      <PageHeader title="Settings" description="Manage pricing, service areas, team access, and platform configuration." />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-[#e1e5e8] mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === id
                ? 'text-[#001e2b] border-[#001e2b]'
                : 'text-[#7c8c9a] border-transparent hover:text-[#3d4f5b] hover:border-[#c1ccd6]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'pricing' && <PricingTab servicePricing={servicePricing} />}
      {activeTab === 'areas' && <AreasTab serviceAreas={serviceAreas} />}
      {activeTab === 'team' && <TeamTab adminUsers={adminUsers} />}
      {activeTab === 'platform' && <PlatformTab />}
    </div>
  )
}
