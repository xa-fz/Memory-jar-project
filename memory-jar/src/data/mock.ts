import type { ChatMessage, DocumentItem, HistoryItem } from '@/types'

export const recentChats = [
  '车位管理费到期时间查询',
  '本月待办未完成事项',
]

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: '车位管理费到几月到期？',
  },
  {
    id: '2',
    role: 'assistant',
    content: '根据你的记录，车位管理费缴纳至 2026 年 3 月。',
  },
  {
    id: '3',
    role: 'user',
    content: '本月还有哪些未完成的事项？',
  },
  {
    id: '4',
    role: 'assistant',
    content: '正在检索并生成回答…',
    loading: true,
  },
]

export const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    title: '物业缴费记录.md',
    file_type: '.md',
    preview: '车位管理费已缴纳至 2026 年 3 月，物业费缴至 2026 年 6 月，水电费已设置自动扣款。',
    date: '2026-03-01',
  },
  {
    id: 2,
    title: '本月待办.txt',
    file_type: '.txt',
    preview: '1. 预约体检 2. 联系装修公司 3. 缴纳车位管理费',
    date: '2026-02-28',
  },
  {
    id: 3,
    title: '体检报告摘要.pdf',
    file_type: '.pdf',
    preview: '血糖 5.2 mmol/L，血压 120/80 mmHg，总胆固醇 4.8 mmol/L，均在正常范围内。',
    date: '2025-12-10',
  },
]

export const historyItems: HistoryItem[] = [
  {
    id: 1,
    question: '车位管理费到几月到期？',
    answer: '根据你的记录，车位管理费缴纳至 2026 年 3 月。',
    datetime: '2026-06-01 14:30',
  },
  {
    id: 2,
    question: '什么是 RAG 技术？',
    answer: 'RAG（检索增强生成）是一种结合信息检索与文本生成的 AI 技术，通过检索相关文档来增强回答的准确性。',
    datetime: '2026-05-28 09:15',
  },
  {
    id: 3,
    question: '本月还有哪些未完成的事项？',
    answer: '根据你的待办记录：1. 预约体检 2. 联系装修公司 3. 缴纳车位管理费',
    datetime: '2026-05-25 16:42',
  },
  {
    id: 4,
    question: '体检报告里血糖正常吗？',
    answer: '根据体检报告摘要，你的空腹血糖为 5.2 mmol/L，在正常范围内。',
    datetime: '2026-05-20 11:08',
  },
]
