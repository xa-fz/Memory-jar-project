import { Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { useIntl } from 'react-intl'

// TODO: 接入 auth 后替换为 useAuth()
const mockUser: { name: string } | null = null

export function AppHeaderAuth() {
  const intl = useIntl()

  const handleClick = () => {
    // TODO: 打开登录弹窗或跳转登录页
  }

  const label =
    mockUser?.name ?? intl.formatMessage({ id: 'auth.loginPrompt' })

  return (
    <UnstyledButton onClick={handleClick} style={{ flex: 1, minWidth: 0 }}>
      <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <ThemeIcon size={28} radius="xl" variant="light" color="blue">
          <IconUser size={16} stroke={1.5} />
        </ThemeIcon>
        <Text
          size="sm"
          fw={500}
          c={mockUser ? undefined : 'blue'}
          lineClamp={1}
        >
          {label}
        </Text>
      </Group>
    </UnstyledButton>
  )
}
