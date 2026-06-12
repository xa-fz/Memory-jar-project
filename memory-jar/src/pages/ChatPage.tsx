import { useState } from 'react'
import {
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconBrain, IconSend } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import type { ChatMessage } from '@/types'
import { initialMessages } from '@/data/mock'
import theme from '@/styles/appTheme.module.css'
import classes from './ChatPage.module.css'

function NeuralThinking({ label }: { label: string }) {
  return (
    <div className={classes.thinking}>
      <svg className={classes.thinkingSvg} viewBox="0 0 48 14" aria-hidden>
        <line className={classes.thinkingLine} x1="4" y1="7" x2="44" y2="7" />
        <circle className={classes.thinkingNode} cx="10" cy="7" r="2.5" />
        <circle className={classes.thinkingNode} cx="24" cy="7" r="2.5" />
        <circle className={classes.thinkingNode} cx="38" cy="7" r="2.5" />
      </svg>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <Group justify="flex-end" wrap="nowrap">
        <Paper px="md" py="sm" radius="md" maw="70%" className={classes.userBubble}>
          <Text size="sm">{message.content}</Text>
        </Paper>
      </Group>
    )
  }

  return (
    <Group align="flex-start" wrap="nowrap" gap="sm">
      <ThemeIcon size={32} radius="xl" variant="light" color="indigo">
        <IconBrain size={18} />
      </ThemeIcon>
      <Paper px="md" py="sm" radius="md" withBorder maw="75%" className={classes.assistantBubble}>
        {message.loading ? (
          <NeuralThinking label={message.content} />
        ) : (
          <Text size="sm">{message.content}</Text>
        )}
      </Paper>
    </Group>
  )
}

export function ChatPage() {
  const intl = useIntl()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const question = input.trim()
    if (!question || sending) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: intl.formatMessage({ id: 'chat.loading' }),
      loading: true,
    }

    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setSending(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === loadingMsg.id
          ? {
              ...msg,
              loading: false,
              content: intl.formatMessage({ id: 'chat.mockReply' }),
            }
          : msg,
      ),
    )
    setSending(false)
  }

  return (
    <Stack gap="md" className={theme.pageRoot}>
      <Box>
        <Title order={2} className={theme.pageTitle}>
          {intl.formatMessage({ id: 'chat.title' })}
        </Title>
        <Text size="sm" c="dimmed" mt={4} className={theme.pageSubtitle}>
          {intl.formatMessage({ id: 'chat.subtitle' })}
        </Text>
      </Box>

      <Box className={`${theme.surfacePanel} ${classes.messagePanel}`}>
        <ScrollArea flex={1} type="auto" offsetScrollbars p="md">
          <Stack gap="lg" pr="sm" pb="md">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      <Paper withBorder p="md" radius="md" bg="white" className={classes.composePanel}>
        <div className={theme.accentTopLine} aria-hidden />
        <Group align="flex-end" gap="sm" wrap="nowrap">
          <Textarea
            flex={1}
            placeholder={intl.formatMessage({ id: 'chat.placeholder' })}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            minRows={2}
            autosize
            maxRows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            className={theme.primaryBtn}
            leftSection={<IconSend size={16} />}
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
          >
            {intl.formatMessage({ id: 'chat.send' })}
          </Button>
        </Group>
      </Paper>
    </Stack>
  )
}
