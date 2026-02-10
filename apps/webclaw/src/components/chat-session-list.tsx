import { useEffect, useState, useCallback } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

type SessionItem = {
  key: string
  friendlyId: string
  label?: string
  title?: string
  derivedTitle?: string
  updatedAt?: number
}

export function ChatSessionList() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) return
      const data = await res.json()
      setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const getTitle = (s: SessionItem) =>
    s.label || s.title || s.derivedTitle || s.friendlyId || 'Untitled'

  const activeId = currentPath.startsWith('/chat/')
    ? currentPath.replace('/chat/', '')
    : null

  if (loading) {
    return (
      <div className="px-3 py-4 text-xs text-primary-500">Loading…</div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <Link
          to="/chat/$sessionKey"
          params={{ sessionKey: 'new' }}
          className="block w-full text-xs text-center py-1.5 rounded-md border border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
        >
          + New Session
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5">
        {sessions.map((session) => {
          const isActive = activeId === session.friendlyId
          return (
            <Link
              key={session.key}
              to="/chat/$sessionKey"
              params={{ sessionKey: session.friendlyId }}
              className={cn(
                'block px-2 py-1.5 rounded-md text-xs truncate transition-colors mb-0.5',
                isActive
                  ? 'bg-primary-200 dark:bg-primary-800 text-primary-900 dark:text-primary-100'
                  : 'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900',
              )}
            >
              {getTitle(session)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
