import { useState } from 'react'
import { ChannelIcon } from './channel-icon'
import { SessionActions } from './session-actions'
import {
  type Session,
  type SessionType,
  getSessionType,
  getChannelFromKey,
  isActiveRecently,
} from '../hooks/use-sessions'

type SessionCardProps = {
  session: Session
  onAction?: () => void
}

const typeBadgeStyles: Record<SessionType, string> = {
  main: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  group: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cron: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  subagent: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  dm: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  unknown: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

const typeLabels: Record<SessionType, string> = {
  main: 'Main',
  group: 'Group',
  cron: 'Cron Job',
  subagent: 'Sub-agent',
  dm: 'DM',
  unknown: 'Unknown',
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

function getLastMessageText(session: Session): string | null {
  const msgs = session.messages ?? []
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i]
    for (const block of msg.content) {
      if (block.type === 'text' && block.text) {
        return block.text
      }
    }
  }
  return null
}

function getLastCost(session: Session): number | null {
  const msgs = session.messages ?? []
  for (let i = msgs.length - 1; i >= 0; i--) {
    const cost = msgs[i].usage?.cost?.total
    if (cost != null && cost > 0) return cost
  }
  return null
}

export function SessionCard({ session, onAction }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const type = getSessionType(session.key)
  const channel = getChannelFromKey(session.key)
  const active = isActiveRecently(session.updatedAt)
  const lastMsg = getLastMessageText(session)
  const lastCost = getLastCost(session)
  const contextPct =
    session.contextTokens > 0
      ? Math.min(100, Math.round((session.totalTokens / session.contextTokens) * 100))
      : 0

  const displayName =
    session.label || session.displayName || session.friendlyId || session.key

  return (
    <div
      className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ChannelIcon channel={channel} className="text-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary-900 dark:text-primary-100 truncate">
              {displayName}
            </p>
            <p className="text-xs text-primary-500 dark:text-primary-500 font-mono truncate">
              {session.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeBadgeStyles[type]}`}
          >
            {typeLabels[type]}
          </span>
          <div className="flex items-center gap-1">
            <div
              className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-500'}`}
            />
            <span className="text-[10px] text-primary-500 dark:text-primary-500">
              {relativeTime(session.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Context bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-primary-500 dark:text-primary-500 uppercase tracking-wider">
            Context
          </span>
          <span className="text-[10px] text-primary-500 dark:text-primary-500 font-mono">
            {contextPct}%
            {lastCost != null && (
              <span className="ml-2 text-primary-400">
                ${lastCost.toFixed(4)}
              </span>
            )}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-primary-200 dark:bg-primary-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              contextPct > 90
                ? 'bg-red-500'
                : contextPct > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${contextPct}%` }}
          />
        </div>
      </div>

      {/* Last message */}
      {lastMsg && (
        <p className="text-xs text-primary-500 dark:text-primary-400 leading-relaxed line-clamp-2">
          {truncateText(lastMsg, 150)}
        </p>
      )}

      {/* Actions (expandable) */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()}>
          <SessionActions
            sessionKey={session.key}
            friendlyId={session.friendlyId}
            onAction={onAction}
          />
        </div>
      )}
    </div>
  )
}
