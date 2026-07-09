'use client'

import { useState } from 'react'
import { Search, Star, X, Phone, Mail, MapPin, TrendingUp } from 'lucide-react'
import { fetchClients, fetchCleaners, setProfileStatus, setCleanerVerification } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Client, Cleaner } from '@/lib/types'

type Tab = 'clients' | 'cleaners'

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('clients')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null)

  const { data: cData } = useLiveData(fetchClients, { table: 'profiles' })
  const { data: clData } = useLiveData(fetchCleaners, { table: 'cleaner_profiles' })
  const clients = cData ?? []
  const cleaners = clData ?? []

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
  })

  const filteredCleaners = cleaners.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Users"
          description={`${clients.length} clients · ${cleaners.length} cleaners`}
        />

        {/* Tab Toggle + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 bg-[#f4f7f6] rounded-lg p-1">
            {(['clients', 'cleaners'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch('') }}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all',
                  tab === t ? 'bg-white text-[#001e2b] shadow-sm' : 'text-[#5c6c7a] hover:text-[#001e2b]'
                )}
              >
                {t} <span className="ml-1 text-[11px] text-[#a8b3bc]">
                  ({t === 'clients' ? clients.length : cleaners.length})
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8b3bc]" />
            <input
              type="search"
              placeholder={`Search ${tab}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-4 w-56 rounded-lg border border-[#e1e5e8] bg-white text-sm text-[#001e2b] placeholder:text-[#a8b3bc] focus:outline-none focus:ring-2 focus:ring-[#00684a]/30 focus:border-[#00684a] transition-all"
            />
          </div>
        </div>

        {/* Clients Table */}
        {tab === 'clients' && (
          <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Bookings</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Spent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={cn(
                        'border-b border-[#f0f4f2] hover:bg-[#f9fbfa] cursor-pointer transition-colors',
                        selectedClient?.id === c.id && 'bg-[#f4f7f6]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} size="sm" />
                          <div>
                            <p className="font-medium text-[#001e2b]">{c.name}</p>
                            <p className="text-xs text-[#7c8c9a]">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#5c6c7a]">{c.phone}</td>
                      <td className="px-4 py-3 text-[#5c6c7a] max-w-[160px] truncate">{c.location}</td>
                      <td className="px-4 py-3 text-[#5c6c7a]">{formatDate(c.joinDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#001e2b] tabular-nums">{c.totalBookings}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#001e2b] tabular-nums">{formatCurrency(c.totalSpent)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cleaners Table */}
        {tab === 'cleaners' && (
          <div className="bg-white rounded-xl border border-[#e1e5e8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e1e5e8] bg-[#f9fbfa]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Rating</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Jobs</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Earnings</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Verification</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#7c8c9a] uppercase tracking-wide">Area</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCleaners.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCleaner(c)}
                      className={cn(
                        'border-b border-[#f0f4f2] hover:bg-[#f9fbfa] cursor-pointer transition-colors',
                        selectedCleaner?.id === c.id && 'bg-[#f4f7f6]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} size="sm" />
                          <div>
                            <p className="font-medium text-[#001e2b]">{c.name}</p>
                            <p className="text-xs text-[#7c8c9a]">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-[#001e2b]">{c.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#001e2b] tabular-nums">{c.jobsCompleted}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#001e2b] tabular-nums">{formatCurrency(c.earnings)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.verificationStatus} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-sm text-[#5c6c7a]">{c.serviceArea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {(selectedClient || selectedCleaner) && (
        <div className="w-[320px] flex-shrink-0 bg-white rounded-xl border border-[#e1e5e8] h-fit sticky top-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e5e8]">
            <p className="font-semibold text-[#001e2b] text-sm">
              {tab === 'clients' ? 'Client' : 'Cleaner'} Profile
            </p>
            <button
              onClick={() => { setSelectedClient(null); setSelectedCleaner(null) }}
              className="text-[#a8b3bc] hover:text-[#5c6c7a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {selectedClient && (
              <>
                <div className="flex flex-col items-center gap-2 py-2">
                  <Avatar name={selectedClient.name} size="lg" />
                  <p className="font-semibold text-[#001e2b]">{selectedClient.name}</p>
                  <StatusBadge status={selectedClient.status} />
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-[#5c6c7a]">
                    <Mail className="w-4 h-4 text-[#a8b3bc]" />
                    {selectedClient.email}
                  </div>
                  <div className="flex items-center gap-2 text-[#5c6c7a]">
                    <Phone className="w-4 h-4 text-[#a8b3bc]" />
                    {selectedClient.phone}
                  </div>
                  <div className="flex items-center gap-2 text-[#5c6c7a]">
                    <MapPin className="w-4 h-4 text-[#a8b3bc]" />
                    {selectedClient.location}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#f9fbfa] rounded-lg p-3 text-center">
                    <p className="text-[20px] font-bold text-[#001e2b] tabular-nums">{selectedClient.totalBookings}</p>
                    <p className="text-[11px] text-[#7c8c9a] mt-0.5">Bookings</p>
                  </div>
                  <div className="bg-[#f9fbfa] rounded-lg p-3 text-center">
                    <p className="text-[15px] font-bold text-[#001e2b] tabular-nums">{formatCurrency(selectedClient.totalSpent)}</p>
                    <p className="text-[11px] text-[#7c8c9a] mt-0.5">Total Spent</p>
                  </div>
                </div>
                <p className="text-xs text-[#a8b3bc]">Member since {formatDate(selectedClient.joinDate)}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      const sb = createClient()
                      await setProfileStatus(sb, selectedClient.id, 'suspended')
                    }}
                    className="flex-1 h-9 rounded-lg border border-[#e1e5e8] text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    Suspend
                  </button>
                  <button className="flex-1 h-9 rounded-lg bg-[#001e2b] text-sm text-white hover:bg-[#003d4f] transition-colors font-medium">
                    Message
                  </button>
                </div>
              </>
            )}

            {selectedCleaner && (
              <>
                <div className="flex flex-col items-center gap-2 py-2">
                  <Avatar name={selectedCleaner.name} size="lg" />
                  <p className="font-semibold text-[#001e2b]">{selectedCleaner.name}</p>
                  <div className="flex gap-2">
                    <StatusBadge status={selectedCleaner.verificationStatus} />
                    <StatusBadge status={selectedCleaner.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f9fbfa] rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <p className="text-[18px] font-bold text-[#001e2b]">{selectedCleaner.rating}</p>
                    </div>
                    <p className="text-[11px] text-[#7c8c9a] mt-0.5">Rating</p>
                  </div>
                  <div className="bg-[#f9fbfa] rounded-lg p-3 text-center">
                    <p className="text-[18px] font-bold text-[#001e2b] tabular-nums">{selectedCleaner.jobsCompleted}</p>
                    <p className="text-[11px] text-[#7c8c9a] mt-0.5">Jobs Done</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#5c6c7a]">Acceptance Rate</span>
                    <span className="font-semibold text-[#001e2b]">{selectedCleaner.acceptanceRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e1e5e8] rounded-full">
                    <div className="h-1.5 bg-[#00684a] rounded-full" style={{ width: `${selectedCleaner.acceptanceRate}%` }} />
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-[#5c6c7a]">Completion Rate</span>
                    <span className="font-semibold text-[#001e2b]">{selectedCleaner.completionRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e1e5e8] rounded-full">
                    <div className="h-1.5 bg-[#00684a] rounded-full" style={{ width: `${selectedCleaner.completionRate}%` }} />
                  </div>
                </div>
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-[#5c6c7a]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#a8b3bc]" />
                    Total earnings: <span className="font-semibold text-[#001e2b]">{formatCurrency(selectedCleaner.earnings)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5c6c7a]">
                    <MapPin className="w-3.5 h-3.5 text-[#a8b3bc]" />
                    {selectedCleaner.serviceArea}
                  </div>
                </div>
                {selectedCleaner.guarantorName && (
                  <div className="bg-[#f9fbfa] rounded-lg p-3 text-sm">
                    <p className="text-[11px] text-[#a8b3bc] uppercase font-semibold mb-1">Guarantor</p>
                    <p className="text-[#3d4f5b]">{selectedCleaner.guarantorName}</p>
                    <p className="text-[#7c8c9a]">{selectedCleaner.guarantorPhone}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      const sb = createClient()
                      await setProfileStatus(sb, selectedCleaner.id, 'suspended')
                    }}
                    className="flex-1 h-9 rounded-lg border border-[#e1e5e8] text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={async () => {
                      const sb = createClient()
                      await setCleanerVerification(sb, selectedCleaner.id, 'approved')
                    }}
                    className="flex-1 h-9 rounded-lg bg-[#00ed64] text-sm text-[#001e2b] hover:bg-[#00c853] transition-colors font-semibold"
                  >
                    Verify
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
