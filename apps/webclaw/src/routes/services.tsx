import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/app-layout'
import { ServicesScreen } from '../screens/services/services-screen'

export const Route = createFileRoute('/services')({
  component: () => (
    <AppLayout>
      <ServicesScreen />
    </AppLayout>
  ),
})
