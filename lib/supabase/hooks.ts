'use client'

import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './client'

/**
 * Default polling interval (ms). Supabase Realtime is unreliable / gated on the
 * free tier, so we poll the database at a fixed cadence to keep the admin
 * dashboard's live data fresh. Override per-hook via `options.intervalMs`.
 */
const DEFAULT_POLL_INTERVAL_MS = 10_000

/**
 * Fetches initial data with `fetcher`, then re-fetches on a fixed polling
 * interval so the admin dashboard reflects near-live data from Supabase without
 * depending on Realtime. Polling pauses while the browser tab is hidden and
 * resumes (with an immediate refresh) when it becomes visible again.
 */
export function useLiveData<T>(
  fetcher: (sb: SupabaseClient) => Promise<T>,
  options?: { table?: string; deps?: unknown[]; intervalMs?: number }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS

  useEffect(() => {
    const sb = createClient()
    let active = true
    let timer: ReturnType<typeof setInterval> | null = null

    const load = () => {
      return fetcherRef
        .current(sb)
        .then((r) => {
          if (active) {
            setData(r)
            setError(null)
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

    const startPolling = () => {
      if (timer) return
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return
        load()
      }, intervalMs)
    }

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        load()
      }
    }

    // Initial fetch + begin polling
    load()
    startPolling()

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      active = false
      stopPolling()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options?.deps ?? [])

  return { data, loading, error }
}
