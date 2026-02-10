import { useState } from 'react'

type SessionActionsProps = {
  sessionKey: string
  friendlyId?: string
  onAction?: () => void
}

async function deleteSession(sessionKey: string) {
  const params = new URLSearchParams({ sessionKey })
  const res = await fetch(`/api/sessions?${params}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function sendToSession(sessionKey: string, message: string) {
  const res = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionKey, message }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function SessionActions({
  sessionKey,
  friendlyId,
  onAction,
}: SessionActionsProps) {
  const [confirming, setConfirming] = useState<'reset' | null>(null)
  const [sending, setSending] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleReset() {
    if (confirming !== 'reset') {
      setConfirming('reset')
      return
    }
    try {
      setStatus('Resetting…')
      await deleteSession(sessionKey)
      setStatus('✓ Reset')
      setConfirming(null)
      onAction?.()
    } catch (err) {
      setStatus(`✗ ${err instanceof Error ? err.message : 'Failed'}`)
    }
    setTimeout(() => setStatus(null), 2000)
  }

  async function handleSend() {
    if (!messageInput.trim()) return
    try {
      setSending(true)
      setStatus('Sending…')
      await sendToSession(sessionKey, messageInput.trim())
      setStatus('✓ Sent')
      setMessageInput('')
      setShowSend(false)
      onAction?.()
    } catch (err) {
      setStatus(`✗ ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setSending(false)
    }
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
      {status && (
        <p className="text-[10px] text-primary-500 mb-2">{status}</p>
      )}

      {showSend && (
        <div className="flex gap-1.5 mb-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send a message…"
            className="flex-1 text-xs rounded-md border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-900 px-2 py-1 text-primary-900 dark:text-primary-100 placeholder:text-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !messageInput.trim()}
            className="text-[10px] px-2 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
          <button
            onClick={() => {
              setShowSend(false)
              setMessageInput('')
            }}
            className="text-[10px] px-1.5 py-1 text-primary-500 hover:text-primary-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-1.5">
        {!showSend && (
          <button
            onClick={() => setShowSend(true)}
            className="text-[10px] px-2 py-1 rounded-md bg-primary-200 dark:bg-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-300 dark:hover:bg-primary-700 transition-colors"
          >
            💬 Send Message
          </button>
        )}
        <button
          onClick={handleReset}
          className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
            confirming === 'reset'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-primary-200 dark:bg-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-300 dark:hover:bg-primary-700'
          }`}
        >
          {confirming === 'reset' ? '⚠ Confirm Reset?' : '🔄 Reset Context'}
        </button>
        {confirming === 'reset' && (
          <button
            onClick={() => setConfirming(null)}
            className="text-[10px] px-1.5 py-1 text-primary-500 hover:text-primary-300"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
