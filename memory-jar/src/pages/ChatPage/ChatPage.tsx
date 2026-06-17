import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ActionIcon,
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
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowUp, IconBrain, IconChevronRight, IconEdit, IconFileText, IconSend, IconSquare } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { httpChatStream } from '@/components'
import { HttpError } from '@/types'
import { useChat } from '@/context/ChatContext'
import type { ChatMessage, ChatSource } from '@/types'
import { DocumentDetailModal } from '../DocumentDetailModal'
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
  onEdit,
  canEdit,
  isEditing,
  editDraft,
  onEditDraftChange,
  onEditSubmit,
  onEditCancel,
  editAreaRef,
}: {
  message: ChatMessage
  onSourceSelect: (documentId: number) => void
  onEdit?: (message: ChatMessage) => void
  canEdit?: boolean
  isEditing?: boolean
  editDraft?: string
  onEditDraftChange?: (value: string) => void
  onEditSubmit?: () => void
  onEditCancel?: () => void
  editAreaRef?: React.RefObject<HTMLDivElement | null>
}) {
  const intl = useIntl()
  const isUser = message.role === 'user'
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const contentMeasureRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [editBoxWidth, setEditBoxWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!isEditing) {
      setEditBoxWidth(null)
      return
    }

    if (!rowRef.current || !contentMeasureRef.current) return

    const maxBubbleWidth = Math.floor(rowRef.current.getBoundingClientRect().width * 0.7)
    const measureEl = contentMeasureRef.current
    measureEl.style.maxWidth = `${maxBubbleWidth}px`
    const style = window.getComputedStyle(measureEl)
    const lineHeight = parseFloat(style.lineHeight) || 20
    const naturalWidth = Math.ceil(measureEl.getBoundingClientRect().width)
    const isMultiline = measureEl.scrollHeight > lineHeight * 1.6
    const width = isMultiline
      ? maxBubbleWidth
      : Math.min(maxBubbleWidth, Math.max(naturalWidth, 120))
    setEditBoxWidth(width)
  }, [isEditing, editDraft, message.content])

  useEffect(() => {
    if (!isEditing) return

    textareaRef.current?.focus()
    const length = textareaRef.current?.value.length ?? 0
    textareaRef.current?.setSelectionRange(length, length)
  }, [isEditing])

  if (isUser) {
    return (
      <Group
        ref={rowRef}
        justify="flex-end"
        wrap="nowrap"
        align="flex-start"
        gap="xs"
        className={classes.userMessageRow}
      >
        {canEdit && typeof message.id === 'number' && onEdit && !isEditing ? (
          <Tooltip label={intl.formatMessage({ id: 'chat.edit' })}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={classes.editAction}
              aria-label={intl.formatMessage({ id: 'chat.edit' })}
              onClick={() => onEdit(message)}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
        ) : null}
        <Paper
          ref={isEditing ? editAreaRef : undefined}
          px="md"
          py="sm"
          radius="md"
          maw="70%"
          className={`${classes.userBubble} ${isEditing ? classes.userBubbleEditing : ''}`}
          style={
            isEditing && editBoxWidth
              ? { width: editBoxWidth, maxWidth: '70%' }
              : undefined
          }
        >
          {isEditing ? (
            <Stack gap="xs" className={classes.inlineEditWrap}>
              <div className={classes.editMeasureHost} aria-hidden>
                <div ref={contentMeasureRef} className={classes.editMeasureText}>
                  {editDraft || message.content || '\u00A0'}
                </div>
              </div>
              <Textarea
                ref={textareaRef}
                classNames={{ input: classes.inlineEditInput, wrapper: classes.inlineEditTextareaWrapper }}
                value={editDraft ?? ''}
                onChange={(e) => onEditDraftChange?.(e.currentTarget.value)}
                minRows={1}
                autosize
                maxRows={12}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    onEditCancel?.()
                  }
                }}
              />
              <Group justify="flex-end" className={classes.editActions}>
                <ActionIcon
                  size="lg"
                  radius="xl"
                  className={classes.editSendBtn}
                  aria-label={intl.formatMessage({ id: 'chat.send' })}
                  onClick={() => onEditSubmit?.()}
                  disabled={!editDraft?.trim()}
                >
                  <IconArrowUp size={18} stroke={2.2} />
                </ActionIcon>
              </Group>
            </Stack>
          ) : (
            <Text size="sm" className={classes.userMessageText}>
              {message.content}
            </Text>
          )}
        </Paper>
      </Group>
    )
  }

  return (
    <Group align="flex-start" wrap="nowrap" gap="sm">
      <ThemeIcon size={32} radius="xl" variant="light" color="indigo">
        <IconBrain size={18} />
      </ThemeIcon>
      <Paper
        px="md"
        py="sm"
        radius="md"
        withBorder
        maw="75%"
        className={`${classes.assistantBubble} ${message.loading || (message.streaming && !message.content.trim()) ? classes.assistantBubbleThinking : ''}`}
      >
        {message.loading || (message.streaming && !message.content.trim()) ? (
          <NeuralThinking
            label={
              message.content.trim() || intl.formatMessage({ id: 'chat.loading' })
            }
          />
        ) : (
          <>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
              {message.streaming ? <span className={classes.streamCursor}>▍</span> : null}
            </Text>
            {!message.streaming && message.sources?.length ? (
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
    selectConversation,
    appendOptimisticMessages,
    removePendingExchange,
    truncateMessagesFrom,
    applyChatMeta,
    patchAssistantMessage,
    patchMessage,
    applyChatResponse,
  } = useChat()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [previewDocId, setPreviewDocId] = useState<number | null>(null)
  const [previewOpened, setPreviewOpened] = useState(false)

  const requestGenRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeConversationIdRef = useRef<number | null>(null)
  const streamMetaReceivedRef = useRef(false)
  const editAreaRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const messages = activeConversation?.messages ?? []
  const headerTitle = activeConversation?.title ?? intl.formatMessage({ id: 'chat.title' })

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const openSourcePreview = (documentId: number) => {
    setPreviewDocId(documentId)
    setPreviewOpened(true)
  }

  const closeSourcePreview = () => {
    setPreviewOpened(false)
  }

  const cancelEdit = useCallback(async () => {
    setEditingMessageId(null)
    setEditDraft('')
    if (activeConversation) {
      await selectConversation(activeConversation.id)
    }
  }, [activeConversation, selectConversation])

  useEffect(() => {
    if (editingMessageId == null) return

    const handlePointerDown = (event: MouseEvent) => {
      if (editAreaRef.current?.contains(event.target as Node)) return
      void cancelEdit()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [editingMessageId, cancelEdit])

  const handleEditMessage = (message: ChatMessage) => {
    if (sending || typeof message.id !== 'number' || !activeConversation) return

    setEditingMessageId(message.id)
    setEditDraft(message.content)
    truncateMessagesFrom(activeConversation.id, message.id)
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    requestGenRef.current += 1

    const conversationId = activeConversationIdRef.current
    const metaReceived = streamMetaReceivedRef.current
    streamMetaReceivedRef.current = false

    if (conversationId != null) {
      if (metaReceived) {
        void selectConversation(conversationId)
      } else {
        removePendingExchange(conversationId)
      }
    }
    setSending(false)
  }

  const submitQuestion = async (question: string, editFromMessageId: number | null = null) => {
    const trimmed = question.trim()
    if (!trimmed || sending) return

    setEditingMessageId(null)
    setEditDraft('')
    setInput('')
    setSending(true)

    const requestGen = ++requestGenRef.current
    const controller = new AbortController()
    abortControllerRef.current = controller

    let conversationId: number
    try {
      conversationId = await ensureActiveConversation()
      if (requestGen !== requestGenRef.current) return
    } catch {
      setSending(false)
      abortControllerRef.current = null
      return
    }

    activeConversationIdRef.current = conversationId
    streamMetaReceivedRef.current = false

    const tempUserId = `user-${Date.now()}`
    const streamId = `stream-${Date.now()}`
    const loadingLabel = intl.formatMessage({ id: 'chat.loading' })

    if (editFromMessageId != null) {
      patchMessage(conversationId, editFromMessageId, { content: trimmed })
      appendOptimisticMessages(conversationId, [
        {
          id: streamId,
          role: 'assistant',
          content: loadingLabel,
          loading: true,
        },
      ])
    } else {
      appendOptimisticMessages(conversationId, [
        {
          id: tempUserId,
          role: 'user',
          content: trimmed,
        },
        {
          id: streamId,
          role: 'assistant',
          content: loadingLabel,
          loading: true,
        },
      ])
    }

    try {
      await httpChatStream(
        '/chat/stream',
        {
          question: trimmed,
          conversation_id: conversationId,
          ...(editFromMessageId != null ? { edit_from_message_id: editFromMessageId } : {}),
        },
        {
          onMeta: (meta) => {
            if (requestGen !== requestGenRef.current) return
            streamMetaReceivedRef.current = true
            activeConversationIdRef.current = meta.conversation_id
            if (editFromMessageId == null) {
              applyChatMeta(conversationId, tempUserId, meta)
            } else {
              applyChatMeta(conversationId, editFromMessageId, meta)
            }
          },
          onDelta: (content) => {
            if (requestGen !== requestGenRef.current) return
            if (!content) return
            const activeId = activeConversationIdRef.current ?? conversationId
            patchAssistantMessage(activeId, streamId, (prev) => ({
              loading: false,
              streaming: true,
              content: prev.loading ? content : `${prev.content}${content}`,
            }))
          },
          onDone: (data) => {
            if (requestGen !== requestGenRef.current) return
            applyChatResponse(data)
          },
          onError: () => {
            if (requestGen !== requestGenRef.current) return
            if (streamMetaReceivedRef.current) {
              void selectConversation(activeConversationIdRef.current ?? conversationId)
            } else {
              removePendingExchange(conversationId)
            }
          },
        },
        controller.signal,
      )

      if (requestGen !== requestGenRef.current) return
    } catch (err) {
      if (requestGen !== requestGenRef.current) return
      if (err instanceof HttpError && err.message === 'abort') {
        if (streamMetaReceivedRef.current) {
          await selectConversation(activeConversationIdRef.current ?? conversationId)
        }
        return
      }
      if (streamMetaReceivedRef.current) {
        await selectConversation(activeConversationIdRef.current ?? conversationId)
      } else {
        removePendingExchange(conversationId)
      }
    } finally {
      streamMetaReceivedRef.current = false
      if (requestGen === requestGenRef.current) {
        setSending(false)
        abortControllerRef.current = null
      }
    }
  }

  const handleSend = () => {
    void submitQuestion(input, null)
  }

  const handleEditSubmit = () => {
    if (editingMessageId == null) return
    void submitQuestion(editDraft, editingMessageId)
  }

  return (
    <Stack gap="md" className={`${theme.pageRoot} ${classes.chatPage}`}>
      <Box className={classes.chatHeader}>
        <Title order={2} className={theme.pageTitle} lineClamp={1}>
          {headerTitle}
        </Title>
        <Text size="sm" c="dimmed" mt={4} className={theme.pageSubtitle}>
          {intl.formatMessage({ id: 'chat.subtitle' })}
        </Text>
      </Box>

      <Box className={`${theme.surfacePanel} ${classes.messagePanel}`}>
        <ScrollArea
          flex={1}
          type="scroll"
          offsetScrollbars
          scrollbars="y"
          viewportRef={scrollViewportRef}
          className={classes.messageScroll}
        >
          <Stack gap="lg" p="md" pr="sm" pb="md">
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
                  onEdit={handleEditMessage}
                  canEdit={!sending && editingMessageId == null}
                  isEditing={
                    typeof message.id === 'number' && editingMessageId === message.id
                  }
                  editDraft={editDraft}
                  onEditDraftChange={setEditDraft}
                  onEditSubmit={handleEditSubmit}
                  onEditCancel={() => void cancelEdit()}
                  editAreaRef={editAreaRef}
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
            classNames={{ input: classes.composeInput }}
            placeholder={intl.formatMessage({ id: 'chat.placeholder' })}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={sending || editingMessageId != null}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          {sending ? (
            <Button
              variant="light"
              color="red"
              leftSection={<IconSquare size={16} />}
              onClick={handleStop}
            >
              {intl.formatMessage({ id: 'chat.stop' })}
            </Button>
          ) : (
            <Button
              className={theme.primaryBtn}
              leftSection={<IconSend size={16} />}
              onClick={handleSend}
              disabled={!input.trim() || editingMessageId != null}
            >
              {intl.formatMessage({ id: 'chat.send' })}
            </Button>
          )}
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
