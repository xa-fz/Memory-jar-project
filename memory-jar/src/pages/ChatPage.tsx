import { useState } from 'react'
import {
  Box,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconBrain, IconSend } from '@tabler/icons-react'
import type { ChatMessage } from '@/types'
import { initialMessages } from '@/data/mock'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <Group justify="flex-end" wrap="nowrap">
        <Paper
          px="md"
          py="sm"
          radius="md"
          bg="blue.0"
          maw="70%"
        >
          <Text size="sm">{message.content}</Text>
        </Paper>
      </Group>
    )
  }

  return (
    <Group align="flex-start" wrap="nowrap" gap="sm">
      <ThemeIcon size={32} radius="xl" variant="light" color="blue">
        <IconBrain size={18} />
      </ThemeIcon>
      <Paper
        px="md"
        py="sm"
        radius="md"
        withBorder
        bg="white"
        maw="75%"
      >
        {message.loading ? (
          <Group gap="xs">
            <Loader size="xs" color="blue" />
            <Text size="sm" c="dimmed">
              {message.content}
            </Text>
          </Group>
        ) : (
          <Text size="sm">{message.content}</Text>
        )}
      </Paper>
    </Group>
  )
}

export function ChatPage() {
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
      content: '正在检索并生成回答…',
      loading: true,
    }

    setMessages((prev) => [...prev, userMsg, loadingMsg])
    setInput('')
    setSending(true)

    // 模拟 AI 回答，后续接入 POST /api/chat
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === loadingMsg.id
          ? {
              ...msg,
              loading: false,
              content: '这是模拟回答。接入后端后，将基于你的文档内容生成真实回复。',
            }
          : msg,
      ),
    )
    setSending(false)
  }

  return (
    <Stack
      gap="md"
      style={{ height: 'calc(100dvh - 2 * var(--mantine-spacing-md))' }}
    >
      <Box>
        <Title order={2}>对话</Title>
        <Text size="sm" c="dimmed" mt={4}>
          优先检索你的文档，也支持日常问答
        </Text>
      </Box>

      <Box style={{ flex: 1, minHeight: 0 }}>
        <ScrollArea h="100%" type="auto" offsetScrollbars>
          <Stack gap="lg" pr="sm" pb="md">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      <Paper withBorder p="md" radius="md" bg="white">
        <Group align="flex-end" gap="sm" wrap="nowrap">
          <Textarea
            flex={1}
            placeholder="问待办、笔记内容，或任何日常问题…"
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
            color="blue"
            leftSection={<IconSend size={16} />}
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
          >
            发送
          </Button>
        </Group>
      </Paper>
    </Stack>
  )
}
