'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './client'

/**
 * Fetches initial data with `fetcher` and re-fetches whenever a row changes in
 * `realtimeTable` (Supabase Realtime postgres_changes). Returns the latest data
 * plus loading/error state.
 */
export function useLiveData<T>(
  fetcher: (sb: SupabaseClient) => Promise<T>,
  options?: { table?: string; deps?: unknown[] }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const sb = createClient()
    let active = true

    const load = () => {
      return fetcherRef
        .current(sb)
        .then((r) => {
          if (active) {
            setData(r)
            setLoading(false)
          }
        })
        .catch((e) => {
          if (active) {
            setError(e?.message ?? 'Failed to load data')
            setLoading(false)
          }
        })
    }

    load()

    let channel: ReturnType<SupabaseClient['channel']> | null = null
    if (options?.table) {
      channel = sb
        .channel(`admin-${options.table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: options.table! }, () => {
          load()
        })
        .subscribe()
    }

    return () => {
      active = false
      channel?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options?.deps ?? [])

  return { data, loading, error }
}
