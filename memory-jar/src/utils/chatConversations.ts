import type { ChatConversation, ChatConversationSummary, ChatSource } from '@/types'

export function sortConversations(
  conversations: ChatConversationSummary[],
): ChatConversationSummary[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function mapConversationSummary(item: {
  id: number
  title: string
  updated_at: string
}): ChatConversationSummary {
  return {
    id: item.id,
    title: item.title,
    updatedAt: item.updated_at,
  }
}

export function mapConversationDetail(item: {
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
}): ChatConversation {
  return {
    id: item.id,
    title: item.title,
    updatedAt: item.updated_at,
    messages: item.messages.map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      sources: message.sources?.length ? message.sources : undefined,
    })),
  }
}
