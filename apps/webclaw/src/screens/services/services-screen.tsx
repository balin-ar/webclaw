import { Link } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'

type Service = {
  name: string
  url: string
  status?: 'up' | 'down' | 'unknown'
  description?: string
  port?: number
}

function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data.services) ? data.services : Array.isArray(data) ? data : []
      setServices(list)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return { services, loading, error, refetch: fetchServices }
}

export function ServicesScreen() {
  const { services, loading, error, refetch } = useServices()

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
            Apps & Services
          </h1>
          {!loading && (
            <span className="inline-flex items-center rounded-md bg-primary-200 dark:bg-primary-800 px-1.5 py-0.5 text-[10px] font-mono text-primary-600 dark:text-primary-400">
              {services.length}
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
            Loading services…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            Failed to load services: {error}
          </div>
        )}
        {!loading && !error && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                    {svc.name}
                  </span>
                  <div
                    className={`size-2 rounded-full ${
                      svc.status === 'up'
                        ? 'bg-emerald-500'
                        : svc.status === 'down'
                          ? 'bg-red-500'
                          : 'bg-zinc-500'
                    }`}
                  />
                </div>
                {svc.description && (
                  <p className="text-xs text-primary-500 dark:text-primary-400 mb-1">
                    {svc.description}
                  </p>
                )}
                <p className="text-[10px] font-mono text-primary-400">
                  {svc.url}
                </p>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full text-center py-16 text-sm text-primary-500">
                No services configured.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
