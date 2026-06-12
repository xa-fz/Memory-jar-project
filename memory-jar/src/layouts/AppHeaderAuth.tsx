import { Group, Menu, Text, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { useAuth } from '@/context'

export function AppHeaderAuth() {
  const intl = useIntl()
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <Menu shadow="md" width={160} position="bottom-start">
      <Menu.Target>
        <UnstyledButton style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <ThemeIcon size={28} radius="xl" variant="light" color="indigo">
              <IconUser size={16} stroke={1.5} />
            </ThemeIcon>
            <Text size="sm" fw={500} lineClamp={1}>
              {user.username}
            </Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() => void logout()}
        >
          {intl.formatMessage({ id: 'auth.logout' })}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
