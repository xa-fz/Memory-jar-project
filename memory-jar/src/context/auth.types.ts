export interface AuthUser {
  id: number
  username: string
  created_at: string
}

export type FetchMeResult = 'ok' | 'unauthorized' | 'error'
