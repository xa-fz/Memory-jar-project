import type zhCN from '@/i18n/locales/zh-CN'

/** 页面路由 */
export type PageId = 'chat' | 'documents'

/** 对话消息 */
export interface ChatMessage {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
  sources?: ChatSource[]
}

/** 会话摘要（列表） */
export interface ChatConversationSummary {
  id: number
  title: string
  updatedAt: string
}

/** 会话详情（含消息） */
export interface ChatConversation extends ChatConversationSummary {
  messages: ChatMessage[]
}

/** 后端消息 */
export interface ChatMessageDto {
  id: number
  role: string
  content: string
  created_at: string
  sources?: ChatSource[]
}

/** 问答接口引用来源 */
export interface ChatSource {
  document_id: number
  title: string
  snippet: string
}

/** 问答接口响应 */
export interface ChatResponseData {
  answer: string
  sources: ChatSource[]
  conversation_id: number
  conversation_title: string
  user_message: ChatMessageDto
  assistant_message: ChatMessageDto
}

/** 文档列表项 */
export interface DocumentItem {
  id: number
  title: string
  file_type: string
  file_size: number
  date: string
  vectorized: boolean
}

/** 文档详情 */
export interface DocumentDetail {
  id: number
  title: string
  file_type: string
  content: string
  summary?: string | null
  file_size: number
  date: string
}

/** 后端统一响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/** HTTP 自动提示：true 表示成功/失败都提示；可单独关闭 success/error */
export type HttpTipOption =
  | boolean
  | {
      success?: boolean | string
      error?: boolean | string
      onSuccess?: () => void
    }

export interface HttpOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  credentials?: RequestCredentials
  /** 传入后由 http 层自动弹出左上角提示；文案可自定义，未传则用接口 message 或全局默认 */
  tip?: HttpTipOption
  /** 合并并发相同请求；传 true 时用 method+path 作为 key，或传自定义 key */
  dedupeKey?: string | true
}

export class HttpError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

/** 登录用户 */
export interface AuthUser {
  id: number
  username: string
  created_at: string
}

/** i18n */
export type Locale = 'zh-CN' | 'en-US'

export type MessageKey = keyof typeof zhCN
