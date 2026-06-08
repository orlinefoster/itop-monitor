import { useState, useEffect, useRef } from 'react'

const CACHE_TTL = 30_000 // 30s

/**
 * Hook que fetchea un endpoint y extrae un field.
 * Cachea en memoria para evitar llamadas repetidas.
 */
const memoryCache = new Map()

export function useWidgetData(endpoint, filters) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cacheKey = `${endpoint}?${JSON.stringify(filters)}`
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!endpoint) return

    const cached = memoryCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v != null && v !== '') params.set(k, v)
      }
    }

    fetch(`${endpoint}?${params}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        memoryCache.set(cacheKey, { data: json, ts: Date.now() })
        if (mountedRef.current) {
          setData(json)
          setLoading(false)
        }
      })
      .catch(e => {
        if (mountedRef.current) {
          setError(e.message)
          setLoading(false)
        }
      })
  }, [cacheKey, endpoint])

  return { data, loading, error }
}
