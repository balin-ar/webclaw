import { useState } from 'react'

type SessionActionsProps = {
  sessionKey: string
  friendlyId?: string
  onAction?: () => void
}

async function resetSession(sessionKey: string) {
  const res = await fetch('/api/sessions/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionKey }),
  })
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

async function fetchHistory(sessionKey: string, limit = 5) {
  const params = new URLSearchParams({ sessionKey, limit: String(limit) })
  const res = await fetch(`/api/history?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function extractTextFromMessage(msg: any): string | null {
  if (!msg?.content) return null
  if (typeof msg.content === 'string') return msg.content
  if (Array.isArray(msg.content)) {
    for (const block of msg.content) {
      if (block.type === 'text' && block.text) return block.text
    }
  }
  return null
}

async function pollForResponse(
  sessionKey: string,
  maxAttempts = 20,
  intervalMs = 3000,
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    try {
      const data = await fetchHistory(sessionKey, 3)
      const msgs = data.messages ?? []
      // Find the last assistant message
      for (let j = msgs.length - 1; j >= 0; j--) {
        if (msgs[j].role === 'assistant') {
          const text = extractTextFromMessage(msgs[j])
          if (text && text !== 'NO_REPLY') return text
        }
      }
    } catch {
      // keep polling
    }
  }
  return null
}

export function SessionActions({
  sessionKey,
  onAction,
}: SessionActionsProps) {
  const [confirming, setConfirming] = useState<'reset' | null>(null)
  const [sending, setSending] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)

  async function handleReset() {
    if (confirming !== 'reset') {
      setConfirming('reset')
      return
    }
    try {
      setStatus('Resetting…')
      await resetSession(sessionKey)
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
      setResponse(null)
      await sendToSession(sessionKey, messageInput.trim())
      setStatus('⏳ Waiting for response…')
      setMessageInput('')

      const reply = await pollForResponse(sessionKey)
      if (reply) {
        setResponse(reply)
        setStatus(null)
      } else {
        setStatus('⏳ Agent still working… check back later')
        setTimeout(() => setStatus(null), 5000)
      }
      onAction?.()
    } catch (err) {
      setStatus(`✗ ${err instanceof Error ? err.message : 'Failed'}`)
      setTimeout(() => setStatus(null), 3000)
    } finally {
      setSending(false)
    }
  }

  async function handleViewHistory() {
    try {
      setStatus('Loading history…')
      const data = await fetchHistory(sessionKey, 5)
      const msgs = data.messages ?? []
      const lastAssistant = [...msgs]
        .reverse()
        .find((m: any) => m.role === 'assistant')
      const text = lastAssistant ? extractTextFromMessage(lastAssistant) : null
      if (text) {
        setResponse(text)
        setStatus(null)
      } else {
        setStatus('No messages found')
        setTimeout(() => setStatus(null), 2000)
      }
    } catch (err) {
      setStatus(`✗ ${err instanceof Error ? err.message : 'Failed'}`)
      setTimeout(() => setStatus(null), 2000)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
      {status && (
        <p className="text-[10px] text-primary-500 mb-2 animate-pulse">
          {status}
        </p>
      )}

      {response && (
        <div className="mb-3 rounded-md bg-primary-100 dark:bg-primary-900 p-2.5 border border-primary-200 dark:border-primary-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-primary-500 uppercase tracking-wider">
              Response
            </span>
            <button
              onClick={() => setResponse(null)}
              className="text-[10px] text-primary-500 hover:text-primary-300"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-primary-800 dark:text-primary-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {response.length > 500 ? response.slice(0, 500) + '…' : response}
          </p>
        </div>
      )}

      {showSend && (
        <div className="flex gap-1.5 mb-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
            placeholder="Send a message…"
            className="flex-1 text-xs rounded-md border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-900 px-2 py-1 text-primary-900 dark:text-primary-100 placeholder:text-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !messageInput.trim()}
            className="text-[10px] px-2 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
          >
            {sending ? '…' : 'Send'}
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

      <div className="flex gap-1.5 flex-wrap">
        {!showSend && (
          <button
            onClick={() => setShowSend(true)}
            disabled={sending}
            className="text-[10px] px-2 py-1 rounded-md bg-primary-200 dark:bg-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-300 dark:hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            💬 Send Message
          </button>
        )}
        <button
          onClick={handleViewHistory}
          className="text-[10px] px-2 py-1 rounded-md bg-primary-200 dark:bg-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-300 dark:hover:bg-primary-700 transition-colors"
        >
          📜 Last Response
        </button>
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
