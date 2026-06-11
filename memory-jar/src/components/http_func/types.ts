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
