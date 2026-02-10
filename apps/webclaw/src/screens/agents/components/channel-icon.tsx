type ChannelIconProps = {
  channel: string
  className?: string
}

const channelEmoji: Record<string, string> = {
  whatsapp: '💬',
  telegram: '✈️',
  discord: '🎮',
  signal: '🔒',
  webchat: '🌐',
  cron: '⏰',
  subagent: '🤖',
  unknown: '📡',
}

const channelLabel: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  discord: 'Discord',
  signal: 'Signal',
  webchat: 'WebChat',
  cron: 'Cron',
  subagent: 'Sub-agent',
  unknown: 'Unknown',
}

export function ChannelIcon({ channel, className }: ChannelIconProps) {
  const emoji = channelEmoji[channel] ?? channelEmoji.unknown
  const label = channelLabel[channel] ?? channel

  return (
    <span className={className} title={label} role="img" aria-label={label}>
      {emoji}
    </span>
  )
}
