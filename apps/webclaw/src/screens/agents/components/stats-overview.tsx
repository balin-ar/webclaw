import type { Session } from '../hooks/use-sessions'
import { isActiveRecently } from '../hooks/use-sessions'

type StatsOverviewProps = {
  sessions: Session[]
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 p-4">
      <p className="text-xs text-primary-500 dark:text-primary-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-primary-900 dark:text-primary-100">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  )
}

export function StatsOverview({ sessions }: StatsOverviewProps) {
  const activeNow = sessions.filter((s) => isActiveRecently(s.updatedAt)).length

  let totalCost = 0
  for (const s of sessions) {
    const msgs = s.messages ?? []
    for (const m of msgs) {
      if (m.usage?.cost?.total) {
        totalCost += m.usage.cost.total
      }
    }
  }

  const models = new Map<string, number>()
  for (const s of sessions) {
    if (s.model) {
      models.set(s.model, (models.get(s.model) ?? 0) + 1)
    }
  }
  let primaryModel = '—'
  let maxCount = 0
  for (const [model, count] of models) {
    if (count > maxCount) {
      primaryModel = model
      maxCount = count
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Sessions" value={sessions.length} />
      <StatCard
        label="Active Now"
        value={activeNow}
        sub="last 30 min"
      />
      <StatCard
        label="Last Interaction Cost"
        value={`$${totalCost.toFixed(4)}`}
      />
      <StatCard label="Primary Model" value={primaryModel} />
    </div>
  )
}
