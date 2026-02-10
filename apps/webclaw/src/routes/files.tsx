import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../components/app-layout'
import { FileExplorerScreen } from '../screens/files/file-explorer-screen'

export const Route = createFileRoute('/files')({
  component: () => (
    <AppLayout>
      <FileExplorerScreen />
    </AppLayout>
  ),
})
