import type { ApiResponse, HttpOptions } from './types'
import { HttpError } from './types'

const API_PREFIX = '/mj'

function buildUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_PREFIX}${normalized}`
}

/** 统一请求：默认带 Cookie，JSON  body 自动序列化 */
export async function httpRequest<T = unknown>(
  path: string,
  options: HttpOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    credentials = 'include',
  } = options

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      credentials,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new HttpError('network')
  }

  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    throw new HttpError('parse')
  }
}

export function httpGet<T = unknown>(path: string, options?: Omit<HttpOptions, 'method' | 'body'>) {
  return httpRequest<T>(path, { ...options, method: 'GET' })
}

export function httpPost<T = unknown>(
  path: string,
  body?: unknown,
  options?: Omit<HttpOptions, 'method' | 'body'>,
) {
  return httpRequest<T>(path, { ...options, method: 'POST', body })
}
