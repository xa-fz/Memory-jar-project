import {
  AppShell,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconClock,
  IconFileText,
  IconMessageCircle,
} from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import type { PageId } from '@/types'
import { recentChats } from '@/data/mock'
import theme from '@/styles/appTheme.module.css'
import { AppHeaderAuth } from './AppHeaderAuth'

const navItems: {
  id: PageId
  path: string
  labelId: 'nav.chat' | 'nav.documents' | 'nav.history'
  icon: typeof IconMessageCircle
}[] = [
  { id: 'chat', path: '/chat', labelId: 'nav.chat', icon: IconMessageCircle },
  { id: 'documents', path: '/documents', labelId: 'nav.documents', icon: IconFileText },
  { id: 'history', path: '/history', labelId: 'nav.history', icon: IconClock },
]

export function AppLayout() {
  const intl = useIntl()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="md" withBorder>
        <Stack gap="lg" h="100%">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
              <AppHeaderAuth />
              <LanguageSwitcher />
            </Group>

            <Stack gap={2}>
              <Group gap={6} wrap="nowrap" align="center">
                <Text
                  span
                  style={{ flexShrink: 0, fontSize: 16, lineHeight: 1 }}
                  aria-hidden
                >
                  🧠
                </Text>
                <Title order={4} lh={1.2} className={theme.brandTitle}>
                  Memory Jar
                </Title>
              </Group>
              <Text size="xs" c="dimmed" lh={1.4} pl={22}>
                {intl.formatMessage({ id: 'app.tagline' })}
              </Text>
            </Stack>
          </Stack>

          <Divider />

          <Stack gap={4}>
            {navItems.map(({ path, labelId, icon: Icon }) => (
              <NavLink
                key={path}
                label={intl.formatMessage({ id: labelId })}
                leftSection={<Icon size={18} stroke={1.5} />}
                active={location.pathname === path}
                onClick={() => navigate(path)}
                variant="light"
                color="indigo"
              />
            ))}
          </Stack>

          <Stack gap="xs" mt="auto" pt="md">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              {intl.formatMessage({ id: 'nav.recentChats' })}
            </Text>
            {recentChats.map((title) => (
              <Text key={title} size="sm" c="dimmed" lineClamp={1}>
                {title}
              </Text>
            ))}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" style={{ display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
