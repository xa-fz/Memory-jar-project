import {
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconChevronRight, IconClock } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { historyItems } from '@/data/mock'
import theme from '@/styles/appTheme.module.css'

export function HistoryPage() {
  const intl = useIntl()

  return (
    <Stack gap="lg" className={theme.pageRoot}>
      <div>
        <Title order={2} className={theme.pageTitle}>
          {intl.formatMessage({ id: 'history.title' })}
        </Title>
        <Text size="sm" c="dimmed" mt={4}>
          {intl.formatMessage({ id: 'history.subtitle' })}
        </Text>
      </div>

      <Stack gap="md">
        {historyItems.map((item) => (
          <Card
            key={item.id}
            withBorder
            padding="lg"
            radius="md"
            className={theme.surfaceCard}
            style={{ cursor: 'pointer' }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600}>{item.question}</Text>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {item.answer}
                </Text>
              </Stack>

              <Group gap={6} wrap="nowrap" c="dimmed">
                <IconClock size={14} />
                <Text size="xs">{item.datetime}</Text>
                <IconChevronRight size={16} />
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
