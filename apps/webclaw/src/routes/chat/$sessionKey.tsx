import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../components/app-layout'
import { ChatSessionList } from '../../components/chat-session-list'
import { ChatScreen } from '../../screens/chat/chat-screen'
import { moveHistoryMessages } from '../../screens/chat/chat-queries'

export const Route = createFileRoute('/chat/$sessionKey')({
  component: ChatRoute,
})

function ChatRoute() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [forcedSession, setForcedSession] = useState<{
    friendlyId: string
    sessionKey: string
  } | null>(null)
  const params = Route.useParams()
  const activeFriendlyId =
    typeof params.sessionKey === 'string' ? params.sessionKey : 'main'
  const isNewChat = activeFriendlyId === 'new'
  const forcedSessionKey =
    forcedSession?.friendlyId === activeFriendlyId
      ? forcedSession.sessionKey
      : undefined
  const handleSessionResolved = useCallback(
    function handleSessionResolved(payload: {
      friendlyId: string
      sessionKey: string
    }) {
      setForcedSession({
        friendlyId: payload.friendlyId,
        sessionKey: payload.sessionKey,
      })
      void moveHistoryMessages(queryClient, {
        from: 'new',
        to: payload.friendlyId,
      })
      navigate({
        to: '/chat/$sessionKey',
        params: { sessionKey: payload.friendlyId },
        replace: true,
      })
    },
    [navigate, queryClient],
  )

  return (
    <AppLayout sidebarContent={<ChatSessionList />}>
      <ChatScreen
        activeFriendlyId={activeFriendlyId}
        isNewChat={isNewChat}
        forcedSessionKey={forcedSessionKey}
        onSessionResolved={isNewChat ? handleSessionResolved : undefined}
        hideSidebar
      />
    </AppLayout>
  )
}
