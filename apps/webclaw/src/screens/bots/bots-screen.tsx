import { Link } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'

type CronJob = {
  id: string
  name?: string
  enabled: boolean
  schedule: Record<string, unknown>
  payload: Record<string, unknown>
  sessionTarget?: string
  lastRunAt?: string
  nextRunAt?: string
}

function useCronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/cron')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setJobs(Array.isArray(data.jobs) ? data.jobs : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, refetch: fetchJobs }
}

function formatSchedule(schedule: Record<string, unknown>): string {
  if (schedule.kind === 'cron' && schedule.expr) return `cron: ${schedule.expr}`
  if (schedule.kind === 'every' && schedule.everyMs)
    return `every ${Math.round(Number(schedule.everyMs) / 60000)}min`
  if (schedule.kind === 'at' && schedule.at) return `at: ${schedule.at}`
  return JSON.stringify(schedule)
}

export function BotsScreen() {
  const { jobs, loading, error, refetch } = useCronJobs()

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-primary-950">
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
            Bots & Cron Jobs
          </h1>
          {!loading && (
            <span className="inline-flex items-center rounded-md bg-primary-200 dark:bg-primary-800 px-1.5 py-0.5 text-[10px] font-mono text-primary-600 dark:text-primary-400">
              {jobs.length}
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

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-64 text-sm text-primary-500">
            Loading cron jobs…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            Failed to load cron jobs: {error}
          </div>
        )}
        {!loading && !error && (
          <div className="max-w-4xl mx-auto space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-2 rounded-full ${job.enabled ? 'bg-emerald-500' : 'bg-zinc-500'}`}
                    />
                    <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                      {job.name || job.id}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      job.enabled
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                    }`}
                  >
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="text-xs text-primary-500 dark:text-primary-400 space-y-1">
                  <p>Schedule: {formatSchedule(job.schedule)}</p>
                  <p>Target: {job.sessionTarget || '—'}</p>
                  {job.id && (
                    <p className="font-mono text-[10px] text-primary-400">
                      {job.id}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-16 text-sm text-primary-500">
                No cron jobs found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
