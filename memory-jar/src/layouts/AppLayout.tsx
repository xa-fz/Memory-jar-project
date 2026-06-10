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
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import type { PageId } from '@/types'
import { recentChats } from '@/data/mock'
import { AppHeaderAuth } from './AppHeaderAuth'

interface AppLayoutProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}

const navItems: { id: PageId; labelId: 'nav.chat' | 'nav.documents' | 'nav.history'; icon: typeof IconMessageCircle }[] = [
  { id: 'chat', labelId: 'nav.chat', icon: IconMessageCircle },
  { id: 'documents', labelId: 'nav.documents', icon: IconFileText },
  { id: 'history', labelId: 'nav.history', icon: IconClock },
]

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  const intl = useIntl()

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
                <Title order={4} lh={1.2}>
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
            {navItems.map(({ id, labelId, icon: Icon }) => (
              <NavLink
                key={id}
                label={intl.formatMessage({ id: labelId })}
                leftSection={<Icon size={18} stroke={1.5} />}
                active={activePage === id}
                onClick={() => onNavigate(id)}
                variant="light"
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
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
