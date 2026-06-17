import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useIntl } from 'react-intl'
import { httpDelete, httpGet, httpPatch, httpPost } from '@/components'
import type { ChatStreamMeta } from '@/components'
import { useAuth } from '@/context/AuthContext'
import type { ChatConversation, ChatConversationSummary, ChatResponseData, ChatSource } from '@/types'
import {
  mapConversationDetail,
  mapConversationSummary,
  sortConversations,
} from '@/utils/chatConversations'

interface ChatContextValue {
  conversations: ChatConversationSummary[]
  sortedConversations: ChatConversationSummary[]
  activeId: number | null
  activeConversation: ChatConversation | null
  loading: boolean
  defaultTitle: string
  selectConversation: (id: number) => Promise<void>
  createNewConversation: () => Promise<number>
  ensureActiveConversation: () => Promise<number>
  appendOptimisticMessages: (
    conversationId: number,
    messages: ChatConversation['messages'],
  ) => void
  removeLoadingMessages: (conversationId: number) => void
  removePendingExchange: (conversationId: number) => void
  truncateMessagesFrom: (conversationId: number, messageId: number) => void
  applyChatMeta: (conversationId: number, tempUserId: string | number, meta: ChatStreamMeta) => void
  patchAssistantMessage: (
    conversationId: number,
    messageId: string | number,
    patch:
      | Partial<ChatConversation['messages'][number]>
      | ((message: ChatConversation['messages'][number]) => Partial<ChatConversation['messages'][number]>),
  ) => void
  patchMessage: (
    conversationId: number,
    messageId: string | number,
    patch:
      | Partial<ChatConversation['messages'][number]>
      | ((message: ChatConversation['messages'][number]) => Partial<ChatConversation['messages'][number]>),
  ) => void
  applyChatResponse: (data: ChatResponseData) => void
  deleteConversation: (id: number) => Promise<boolean>
  renameConversation: (id: number, title: string) => Promise<boolean>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const intl = useIntl()
  const { user } = useAuth()
  const defaultTitle = intl.formatMessage({ id: 'chat.newConversationTitle' })

  const [conversations, setConversations] = useState<ChatConversationSummary[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
  const [loading, setLoading] = useState(false)

  const sortedConversations = useMemo(() => sortConversations(conversations), [conversations])

  const refreshConversationList = useCallback(async () => {
    if (!user) {
      setConversations([])
      return
    }

    const body = await httpGet<Array<{ id: number; title: string; updated_at: string }>>(
      '/chat/conversations',
      { dedupeKey: `chat/conversations:${user.id}` },
    )
    if (body.code !== 200 || !body.data) {
      setConversations([])
      return
    }
    setConversations(body.data.map(mapConversationSummary))
  }, [user])

  const loadConversationDetail = useCallback(async (id: number) => {
    const body = await httpGet<{
      id: number
      title: string
      updated_at: string
      messages: Array<{
        id: number
        role: string
        content: string
        created_at: string
        sources?: ChatSource[]
      }>
    }>(`/chat/conversations/${id}`, {
      dedupeKey: `chat/conversations/${id}`,
    })
    if (body.code !== 200 || !body.data) {
      return null
    }
    return mapConversationDetail(body.data)
  }, [])

  useEffect(() => {
    if (!user) {
      setConversations([])
      setActiveId(null)
      setActiveConversation(null)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        await refreshConversationList()
        if (cancelled) return
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, refreshConversationList])

  const selectConversation = useCallback(
    async (id: number) => {
      setActiveId(id)
      const detail = await loadConversationDetail(id)
      if (detail) {
        setActiveConversation(detail)
      }
    },
    [loadConversationDetail],
  )

  const createNewConversation = useCallback(async () => {
    const body = await httpPost<{
      id: number
      title: string
      updated_at: string
      messages: []
    }>('/chat/conversations', { title: defaultTitle })

    if (body.code !== 200 || !body.data) {
      throw new Error(body.message || 'Failed to create conversation')
    }

    const conversation = mapConversationDetail(body.data)
    setConversations((prev) =>
      sortConversations([mapConversationSummary(body.data!), ...prev]),
    )
    setActiveId(conversation.id)
    setActiveConversation(conversation)
    return conversation.id
  }, [defaultTitle])

  const ensureActiveConversation = useCallback(async () => {
    if (activeId != null && conversations.some((item) => item.id === activeId)) {
      return activeId
    }
    return createNewConversation()
  }, [activeId, conversations, createNewConversation])

  const appendOptimisticMessages = useCallback(
    (conversationId: number, messages: ChatConversation['messages']) => {
      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev
        return {
          ...prev,
          messages: [...prev.messages, ...messages],
        }
      })
    },
    [],
  )

  const removeLoadingMessages = useCallback((conversationId: number) => {
    setActiveConversation((prev) => {
      if (!prev || prev.id !== conversationId) return prev
      return {
        ...prev,
        messages: prev.messages.filter((message) => !message.loading),
      }
    })
  }, [])

  const removePendingExchange = useCallback((conversationId: number) => {
    setActiveConversation((prev) => {
      if (!prev || prev.id !== conversationId) return prev
      const messages = [...prev.messages]

      while (messages.length > 0 && messages[messages.length - 1]?.loading) {
        messages.pop()
      }

      const last = messages[messages.length - 1]
      if (last?.role === 'user' && typeof last.id === 'string') {
        messages.pop()
      }

      return { ...prev, messages }
    })
  }, [])

  const truncateMessagesFrom = useCallback((conversationId: number, messageId: number) => {
    setActiveConversation((prev) => {
      if (!prev || prev.id !== conversationId) return prev
      const index = prev.messages.findIndex((message) => message.id === messageId)
      if (index < 0) return prev
      return { ...prev, messages: prev.messages.slice(0, index + 1) }
    })
  }, [])

  const applyChatMeta = useCallback(
    (conversationId: number, tempUserId: string | number, meta: ChatStreamMeta) => {
      const summary: ChatConversationSummary = {
        id: meta.conversation_id,
        title: meta.conversation_title,
        updatedAt: meta.user_message.created_at,
      }

      setConversations((prev) => {
        const others = prev.filter((item) => item.id !== summary.id && item.id !== conversationId)
        return sortConversations([summary, ...others])
      })

      setActiveId(meta.conversation_id)
      setActiveConversation((prev) => {
        if (!prev || (prev.id !== conversationId && prev.id !== meta.conversation_id)) {
          return prev
        }

        return {
          id: meta.conversation_id,
          title: meta.conversation_title,
          updatedAt: summary.updatedAt,
          messages: prev.messages.map((message) =>
            message.id === tempUserId
              ? {
                  id: meta.user_message.id,
                  role: 'user',
                  content: meta.user_message.content,
                }
              : message,
          ),
        }
      })
    },
    [],
  )

  const patchMessage = useCallback(
    (
      conversationId: number,
      messageId: string | number,
      patch:
        | Partial<ChatConversation['messages'][number]>
        | ((message: ChatConversation['messages'][number]) => Partial<ChatConversation['messages'][number]>),
    ) => {
      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev
        return {
          ...prev,
          messages: prev.messages.map((message) => {
            if (message.id !== messageId) return message
            const nextPatch = typeof patch === 'function' ? patch(message) : patch
            return { ...message, ...nextPatch }
          }),
        }
      })
    },
    [],
  )

  const patchAssistantMessage = useCallback(
    (
      conversationId: number,
      messageId: string | number,
      patch:
        | Partial<ChatConversation['messages'][number]>
        | ((message: ChatConversation['messages'][number]) => Partial<ChatConversation['messages'][number]>),
    ) => {
      patchMessage(conversationId, messageId, patch)
    },
    [patchMessage],
  )

  const applyChatResponse = useCallback((data: ChatResponseData) => {
    const summary: ChatConversationSummary = {
      id: data.conversation_id,
      title: data.conversation_title,
      updatedAt: data.assistant_message.created_at,
    }

    setConversations((prev) => {
      const others = prev.filter((item) => item.id !== summary.id)
      return sortConversations([summary, ...others])
    })

    setActiveId(data.conversation_id)
    setActiveConversation((prev) => {
      const base =
        prev && prev.id === data.conversation_id
          ? prev.messages.filter(
              (message) =>
                typeof message.id === 'number' && message.id !== data.user_message.id,
            )
          : []

      return {
        id: data.conversation_id,
        title: data.conversation_title,
        updatedAt: summary.updatedAt,
        messages: [
          ...base,
          {
            id: data.user_message.id,
            role: 'user',
            content: data.user_message.content,
          },
          {
            id: data.assistant_message.id,
            role: 'assistant',
            content: data.assistant_message.content,
            sources: data.sources?.length ? data.sources : undefined,
          },
        ],
      }
    })
  }, [])

  const deleteConversation = useCallback(async (id: number) => {
    const body = await httpDelete<{ id: number }>(`/chat/conversations/${id}`, {
      tip: { success: intl.formatMessage({ id: 'chat.deleteSuccess' }) },
    })
    if (body.code !== 200) {
      return false
    }

    setConversations((prev) => prev.filter((item) => item.id !== id))
    if (activeId === id) {
      setActiveId(null)
      setActiveConversation(null)
    }
    return true
  }, [activeId, intl])

  const renameConversation = useCallback(async (id: number, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) {
      return false
    }

    const body = await httpPatch<{ id: number; title: string; updated_at: string }>(
      `/chat/conversations/${id}`,
      { title: trimmed },
      { tip: { success: intl.formatMessage({ id: 'chat.renameSuccess' }) } },
    )
    if (body.code !== 200 || !body.data) {
      return false
    }

    const summary = mapConversationSummary(body.data)
    setConversations((prev) =>
      sortConversations(prev.map((item) => (item.id === id ? summary : item))),
    )
    setActiveConversation((prev) =>
      prev && prev.id === id ? { ...prev, title: summary.title } : prev,
    )
    return true
  }, [intl])

  const value = useMemo(
    () => ({
      conversations,
      sortedConversations,
      activeId,
      activeConversation,
      loading,
      defaultTitle,
      selectConversation,
      createNewConversation,
      ensureActiveConversation,
      appendOptimisticMessages,
      removeLoadingMessages,
      removePendingExchange,
      truncateMessagesFrom,
      applyChatMeta,
      patchAssistantMessage,
      patchMessage,
      applyChatResponse,
      deleteConversation,
      renameConversation,
    }),
    [
      conversations,
      sortedConversations,
      activeId,
      activeConversation,
      loading,
      defaultTitle,
      selectConversation,
      createNewConversation,
      ensureActiveConversation,
      appendOptimisticMessages,
      removeLoadingMessages,
      removePendingExchange,
      truncateMessagesFrom,
      applyChatMeta,
      patchAssistantMessage,
      patchMessage,
      applyChatResponse,
      deleteConversation,
      renameConversation,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return ctx
}
