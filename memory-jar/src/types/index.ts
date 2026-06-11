import type zhCN from '@/i18n/locales/zh-CN'

/** 页面路由 */
export type PageId = 'chat' | 'documents' | 'history'

/** 对话消息 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

/** 文档列表项 */
export interface DocumentItem {
  id: number
  title: string
  preview: string
  date: string
}

/** 历史记录项 */
export interface HistoryItem {
  id: number
  question: string
  answer: string
  datetime: string
}

/** 后端统一响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface HttpOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  credentials?: RequestCredentials
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
