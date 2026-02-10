import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiCloud02Icon,
  Folder01Icon,
  ComputerIcon,
  SmartPhone01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { WebClawIconBig } from '@/components/icons/webclaw-big'

const navItems = [
  { to: '/agents', icon: AiCloud02Icon, label: 'Agents' },
  { to: '/files', icon: Folder01Icon, label: 'Files' },
  { to: '/bots', icon: SmartPhone01Icon, label: 'Bots' },
  { to: '/services', icon: ComputerIcon, label: 'Services' },
]

type AppLayoutProps = {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const currentPath = router.state.location.pathname

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r border-primary-200 dark:border-primary-800 h-full overflow-hidden bg-primary-50 dark:bg-primary-950 flex flex-col transition-all duration-150',
          collapsed ? 'w-12' : 'w-[200px]',
        )}
      >
        {/* Top bar */}
        <div className="flex items-center h-12 px-2 justify-between">
          {!collapsed && (
            <Link
              to="/chat/$sessionKey"
              params={{ sessionKey: 'main' }}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'pl-1.5 justify-start',
              )}
            >
              <WebClawIconBig className="size-5 rounded-sm" />
              WebClaw
            </Link>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
          >
            <HugeiconsIcon
              icon={SidebarLeft01Icon}
              size={20}
              strokeWidth={1.5}
            />
          </Button>
        </div>

        {/* New Session shortcut */}
        <div className="px-2 mb-2">
          <Link
            to="/chat/$sessionKey"
            params={{ sessionKey: 'main' }}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start pl-1.5',
            )}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={20}
              strokeWidth={1.5}
              className="min-w-5"
            />
            {!collapsed && <span>Chat</span>}
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav links */}
        <div className="px-2 py-2 border-t border-primary-200 dark:border-primary-800 flex flex-col gap-px">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'w-full justify-start pl-1.5',
                  isActive &&
                    'bg-primary-200 dark:bg-primary-800 text-primary-900 dark:text-primary-100',
                )}
                title={collapsed ? item.label : undefined}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  strokeWidth={1.5}
                  className="min-w-5"
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  )
}
