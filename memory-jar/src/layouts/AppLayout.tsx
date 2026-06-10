import {
  AppShell,
  Divider,
  NavLink,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconBrain,
  IconClock,
  IconFileText,
  IconMessageCircle,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { PageId } from '@/types'
import { recentChats } from '@/data/mock'

interface AppLayoutProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}

const navItems: { id: PageId; label: string; icon: typeof IconMessageCircle }[] = [
  { id: 'chat', label: '对话', icon: IconMessageCircle },
  { id: 'documents', label: '文档', icon: IconFileText },
  { id: 'history', label: '历史记录', icon: IconClock },
]

export function AppLayout({ activePage, onNavigate, children }: AppLayoutProps) {
  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="md" withBorder>
        <Stack gap="lg" h="100%">
          <div>
            <Stack gap={4}>
              <ThemeIcon size={36} radius="md" variant="light" color="blue">
                <IconBrain size={22} />
              </ThemeIcon>
              <Title order={4}>Memory Jar</Title>
              <Text size="sm" c="dimmed">
                存入一切，随时召回
              </Text>
            </Stack>
          </div>

          <Divider />

          <Stack gap={4}>
            {navItems.map(({ id, label, icon: Icon }) => (
              <NavLink
                key={id}
                label={label}
                leftSection={<Icon size={18} stroke={1.5} />}
                active={activePage === id}
                onClick={() => onNavigate(id)}
                variant="light"
              />
            ))}
          </Stack>

          <Divider />

          <Stack gap="xs" mt="auto">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              最近对话
            </Text>
            {recentChats.map((title) => (
              <Text key={title} size="sm" c="dimmed" lineClamp={1}>
                {title}
              </Text>
            ))}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">{children}</AppShell.Main>
    </AppShell>
  )
}
