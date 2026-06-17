import type { ChatMessageDto, ChatResponseData } from '@/types'
import { HttpError } from '@/types'

const API_PREFIX = '/mj'

function buildUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_PREFIX}${normalized}`
}

export interface ChatStreamMeta {
  conversation_id: number
  conversation_title: string
  user_message: ChatMessageDto
}

export interface ChatStreamHandlers {
  onMeta?: (data: ChatStreamMeta) => void
  onDelta?: (content: string) => void
  onDone?: (data: ChatResponseData) => void
  onError?: (message: string, code?: number) => void
}

interface ParsedSSEEvent {
  event: string
  data: string
}

function parseSSEChunk(buffer: string): { events: ParsedSSEEvent[]; rest: string } {
  const events: ParsedSSEEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    if (!part.trim()) continue

    let event = 'message'
    let data = ''
    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim()
      }
    }

    if (data) {
      events.push({ event, data })
    }
  }

  return { events, rest }
}

function dispatchSSEEvents(events: ParsedSSEEvent[], handlers: ChatStreamHandlers) {
  for (const { event, data } of events) {
    const payload = JSON.parse(data) as Record<string, unknown>
    if (event === 'meta') {
      handlers.onMeta?.(payload as unknown as ChatStreamMeta)
    } else if (event === 'delta') {
      handlers.onDelta?.(String(payload.content ?? ''))
    } else if (event === 'done') {
      handlers.onDone?.(payload as unknown as ChatResponseData)
    } else if (event === 'error') {
      handlers.onError?.(
        String(payload.message ?? 'error'),
        typeof payload.code === 'number' ? payload.code : 500,
      )
    }
  }
}

export async function httpChatStream(
  path: string,
  body: unknown,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new HttpError('abort')
    }
    throw new HttpError('network')
  }

  if (!response.ok) {
    throw new HttpError('network')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new HttpError('network')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseSSEChunk(buffer)
    buffer = parsed.rest

    for (const { event, data } of parsed.events) {
      dispatchSSEEvents([{ event, data }], handlers)
    }
  }

  if (buffer.trim()) {
    const parsed = parseSSEChunk(`${buffer}\n\n`)
    dispatchSSEEvents(parsed.events, handlers)
  }
}
