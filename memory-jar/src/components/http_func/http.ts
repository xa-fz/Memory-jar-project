import type { ApiResponse, HttpOptions } from '@/types'
import { HttpError } from '@/types'

const API_PREFIX = '/mj'

function buildUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_PREFIX}${normalized}`
}

/** 统一请求：默认带 Cookie，JSON body 自动序列化 */
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

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      credentials,
      headers: {
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
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

export function httpDelete<T = unknown>(
  path: string,
  options?: Omit<HttpOptions, 'method' | 'body'>,
) {
  return httpRequest<T>(path, { ...options, method: 'DELETE' })
}

export function httpUpload<T = unknown>(
  path: string,
  formData: FormData,
  options?: Omit<HttpOptions, 'method' | 'body'>,
) {
  return httpRequest<T>(path, { ...options, method: 'POST', body: formData })
}

export function httpPutUpload<T = unknown>(
  path: string,
  formData: FormData,
  options?: Omit<HttpOptions, 'method' | 'body'>,
) {
  return httpRequest<T>(path, { ...options, method: 'PUT', body: formData })
}

/** 下载二进制文件（如 PDF、图片），用于预览组件 */
export async function httpBlob(
  path: string,
  options?: Omit<HttpOptions, 'method' | 'body'>,
): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method: 'GET',
      credentials: options?.credentials ?? 'include',
      headers: options?.headers,
    })
  } catch {
    throw new HttpError('network')
  }

  if (!response.ok) {
    throw new HttpError('network')
  }

  return response.blob()
}

/** 触发浏览器下载原文件 */
export async function httpDownload(
  path: string,
  filename: string,
  options?: Omit<HttpOptions, 'method' | 'body'>,
): Promise<void> {
  const blob = await httpBlob(path, options)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
