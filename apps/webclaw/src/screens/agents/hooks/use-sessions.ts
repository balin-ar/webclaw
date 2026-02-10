import { useEffect, useState, useCallback, useRef } from 'react'

export type SessionUsage = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  cost: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
    total: number
  }
}

export type SessionMessage = {
  role: string
  content: Array<{ type: string; text?: string }>
  model?: string
  usage?: SessionUsage
  stopReason?: string
  timestamp?: number
}

export type Session = {
  key: string
  kind: string
  channel: string
  label?: string
  displayName?: string
  friendlyId?: string
  updatedAt: number
  sessionId: string
  model: string
  contextTokens: number
  totalTokens: number
  lastChannel?: string
  messages?: SessionMessage[]
}

export type SessionType = 'main' | 'group' | 'cron' | 'subagent' | 'dm' | 'unknown'

export function getSessionType(key: string): SessionType {
  if (key === 'agent:main:main') return 'main'
  if (key.includes(':subagent:')) return 'subagent'
  if (key.includes(':cron:')) return 'cron'
  if (key.includes(':group:')) return 'group'
  if (key.includes(':dm:') || key.includes(':whatsapp:') || key.includes(':telegram:') || key.includes(':signal:')) return 'dm'
  return 'unknown'
}

export function getChannelFromKey(key: string): string {
  if (key.includes(':whatsapp:')) return 'whatsapp'
  if (key.includes(':telegram:')) return 'telegram'
  if (key.includes(':discord:')) return 'discord'
  if (key.includes(':signal:')) return 'signal'
  if (key.includes(':webchat:') || key === 'agent:main:main') return 'webchat'
  if (key.includes(':cron:')) return 'cron'
  if (key.includes(':subagent:')) return 'subagent'
  return 'unknown'
}

export function isActiveRecently(updatedAt: number, minutes = 30): boolean {
  return Date.now() - updatedAt < minutes * 60 * 1000
}

export function useSessions(refreshIntervalMs = 30000) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.sessions) ? data.sessions : []
      setSessions(list)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    intervalRef.current = setInterval(fetchSessions, refreshIntervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchSessions, refreshIntervalMs])

  return { sessions, loading, error, refetch: fetchSessions }
}
