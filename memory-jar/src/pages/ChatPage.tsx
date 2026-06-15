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
  UnstyledButton,
} from '@mantine/core'
import { IconBrain, IconChevronRight, IconFileText, IconSend } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { httpPost } from '@/components'
import { useChat } from '@/context/ChatContext'
import type { ChatMessage, ChatResponseData, ChatSource } from '@/types'
import { DocumentDetailModal } from './DocumentDetailModal'
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

function MessageSources({
  sources,
  onSelect,
}: {
  sources: ChatSource[]
  onSelect: (documentId: number) => void
}) {
  const intl = useIntl()

  if (sources.length === 0) {
    return null
  }

  return (
    <Stack gap={6} mt="sm" className={classes.sourcesBlock}>
      <Group gap={6} wrap="nowrap">
        <IconFileText size={14} className={classes.sourcesIcon} />
        <Text size="xs" fw={600} c="dimmed">
          {intl.formatMessage({ id: 'chat.sourcesTitle' })}
        </Text>
      </Group>
      <Stack gap={4}>
        {sources.map((source) => (
          <UnstyledButton
            key={source.document_id}
            className={classes.sourceItem}
            aria-label={intl.formatMessage({ id: 'documents.viewAria' })}
            onClick={() => onSelect(source.document_id)}
          >
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text size="xs" fw={500} lineClamp={1} className={classes.sourceTitle}>
                {source.title || `#${source.document_id}`}
              </Text>
              <IconChevronRight size={14} className={classes.sourceChevron} aria-hidden />
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Stack>
  )
}

function MessageBubble({
  message,
  onSourceSelect,
}: {
  message: ChatMessage
  onSourceSelect: (documentId: number) => void
}) {
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
          <>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Text>
            {message.sources?.length ? (
              <MessageSources sources={message.sources} onSelect={onSourceSelect} />
            ) : null}
          </>
        )}
      </Paper>
    </Group>
  )
}

export function ChatPage() {
  const intl = useIntl()
  const {
    activeConversation,
    ensureActiveConversation,
    appendOptimisticMessages,
    removeLoadingMessages,
    applyChatResponse,
  } = useChat()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [previewDocId, setPreviewDocId] = useState<number | null>(null)
  const [previewOpened, setPreviewOpened] = useState(false)

  const messages = activeConversation?.messages ?? []
  const headerTitle = activeConversation?.title ?? intl.formatMessage({ id: 'chat.title' })

  const openSourcePreview = (documentId: number) => {
    setPreviewDocId(documentId)
    setPreviewOpened(true)
  }

  const closeSourcePreview = () => {
    setPreviewOpened(false)
  }

  const handleSend = async () => {
    const question = input.trim()
    if (!question || sending) return

    setInput('')
    setSending(true)

    let conversationId: number
    try {
      conversationId = await ensureActiveConversation()
    } catch {
      setSending(false)
      return
    }

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: intl.formatMessage({ id: 'chat.loading' }),
      loading: true,
    }

    appendOptimisticMessages(conversationId, [
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
      },
      loadingMsg,
    ])

    try {
      const body = await httpPost<ChatResponseData>(
        '/chat/',
        {
          question,
          conversation_id: conversationId,
        },
        { tip: { success: false } },
      )
      if (body.code !== 200 || !body.data?.answer) {
        removeLoadingMessages(conversationId)
        return
      }

      applyChatResponse(body.data)
    } catch {
      removeLoadingMessages(conversationId)
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack gap="md" className={theme.pageRoot}>
      <Box>
        <Title order={2} className={theme.pageTitle} lineClamp={1}>
          {headerTitle}
        </Title>
        <Text size="sm" c="dimmed" mt={4} className={theme.pageSubtitle}>
          {intl.formatMessage({ id: 'chat.subtitle' })}
        </Text>
      </Box>

      <Box className={`${theme.surfacePanel} ${classes.messagePanel}`}>
        <ScrollArea flex={1} type="auto" offsetScrollbars p="md">
          <Stack gap="lg" pr="sm" pb="md">
            {!activeConversation ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {intl.formatMessage({ id: 'chat.pickConversation' })}
              </Text>
            ) : messages.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {intl.formatMessage({ id: 'chat.placeholder' })}
              </Text>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSourceSelect={openSourcePreview}
                />
              ))
            )}
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
                void handleSend()
              }
            }}
          />
          <Button
            className={theme.primaryBtn}
            leftSection={<IconSend size={16} />}
            onClick={() => void handleSend()}
            loading={sending}
            disabled={!input.trim()}
          >
            {intl.formatMessage({ id: 'chat.send' })}
          </Button>
        </Group>
      </Paper>

      <DocumentDetailModal
        opened={previewOpened}
        documentId={previewDocId}
        onClose={closeSourcePreview}
        onExited={() => setPreviewDocId(null)}
      />
    </Stack>
  )
}
