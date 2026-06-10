import type zhCN from './locales/zh-CN'

export type Locale = 'zh-CN' | 'en-US'

export type MessageKey = keyof typeof zhCN
