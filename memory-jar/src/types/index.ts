export type PageId = 'chat' | 'documents' | 'history'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

export interface DocumentItem {
  id: number
  title: string
  preview: string
  date: string
}

export interface HistoryItem {
  id: number
  question: string
  answer: string
  datetime: string
}
