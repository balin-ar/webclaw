import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/app-layout'
import { BotsScreen } from '../screens/bots/bots-screen'

export const Route = createFileRoute('/bots')({
  component: () => (
    <AppLayout>
      <BotsScreen />
    </AppLayout>
  ),
})
