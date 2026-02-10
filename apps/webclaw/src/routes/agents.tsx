import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/app-layout'
import { AgentsScreen } from '../screens/agents/agents-screen'

export const Route = createFileRoute('/agents')({
  component: () => (
    <AppLayout>
      <AgentsScreen />
    </AppLayout>
  ),
})
