import type { ApiResponse, HttpTipOption } from '@/types'
import { HttpError } from '@/types'

type TipHandler = (options: {
  message: string
  type?: 'success' | 'error'
  onDone?: () => void
}) => void

interface HttpTipDefaults {
  success: string
  error: string
  network: string
}

let tipHandler: TipHandler | null = null

const defaults: HttpTipDefaults = {
  success: '操作成功',
  error: '操作失败',
  network: '无法连接服务器，请稍后重试',
}

interface ResolvedHttpTip {
  showSuccess: boolean
  showError: boolean
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
}

export function registerHttpTipHandler(handler: TipHandler | null) {
  tipHandler = handler
}

export function setHttpTipDefaultMessages(messages: Partial<HttpTipDefaults>) {
  Object.assign(defaults, messages)
}

function resolveHttpTip(tip?: HttpTipOption): ResolvedHttpTip | null {
  if (!tip) {
    return null
  }

  if (tip === true) {
    return { showSuccess: true, showError: true }
  }

  return {
    showSuccess: tip.success !== false,
    showError: tip.error !== false,
    successMessage: typeof tip.success === 'string' ? tip.success : undefined,
    errorMessage: typeof tip.error === 'string' ? tip.error : undefined,
    onSuccess: tip.onSuccess,
  }
}

function normalizeApiMessage(message: string | undefined, fallback: string): string {
  const trimmed = message?.trim()
  if (!trimmed || trimmed.toLowerCase() === 'success') {
    return fallback
  }
  return trimmed
}

function pickMessage(
  custom: string | undefined,
  apiMessage: string | undefined,
  fallback: string,
): string {
  if (custom) {
    return custom
  }
  return normalizeApiMessage(apiMessage, fallback)
}

function emitTip(options: {
  message: string
  type?: 'success' | 'error'
  onDone?: () => void
}) {
  tipHandler?.(options)
}

export function applyHttpResponseTip(body: ApiResponse<unknown>, tip?: HttpTipOption) {
  const resolved = resolveHttpTip(tip)
  if (!resolved) {
    return
  }

  if (body.code === 200) {
    if (!resolved.showSuccess) {
      return
    }
    emitTip({
      message: pickMessage(resolved.successMessage, body.message, defaults.success),
      type: 'success',
      onDone: resolved.onSuccess,
    })
    return
  }

  if (!resolved.showError) {
    return
  }

  emitTip({
    message: pickMessage(resolved.errorMessage, body.message, defaults.error),
    type: 'error',
  })
}

export function handleHttpRequestError(error: unknown, tip?: HttpTipOption) {
  const resolved = resolveHttpTip(tip)
  if (!resolved?.showError) {
    return
  }

  const fallback =
    error instanceof HttpError && error.message === 'network'
      ? defaults.network
      : defaults.error

  emitTip({
    message: pickMessage(resolved.errorMessage, undefined, fallback),
    type: 'error',
  })
}
