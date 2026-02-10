import { Link } from '@tanstack/react-router'
import { useSessions } from './hooks/use-sessions'
import { StatsOverview } from './components/stats-overview'
import { SessionCard } from './components/session-card'

export function AgentsScreen() {
  const { sessions, loading, error, refetch } = useSessions(30000)

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-primary-950">
      {/* Top bar */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/chat/$sessionKey"
            params={{ sessionKey: 'main' }}
            className="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            ← Back to chat
          </Link>
          <h1 className="text-sm font-medium text-primary-900 dark:text-primary-100">
            Active Agents
          </h1>
          {!loading && (
            <span className="inline-flex items-center rounded-md bg-primary-200 dark:bg-primary-800 px-1.5 py-0.5 text-[10px] font-mono text-primary-600 dark:text-primary-400">
              {sessions.length}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-64 text-sm text-primary-500">
            Loading sessions…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            Failed to load sessions: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="max-w-6xl mx-auto space-y-6">
            <StatsOverview sessions={sessions} />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {sessions
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((session) => (
                  <SessionCard key={session.key} session={session} onAction={refetch} />
                ))}
            </div>

            {sessions.length === 0 && (
              <div className="text-center py-16 text-sm text-primary-500">
                No active sessions found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
