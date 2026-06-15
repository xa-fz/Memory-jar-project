const inFlight = new Map<string, Promise<unknown>>()

/** 合并相同 key 的并发请求（用于 StrictMode 下 effect 重复触发） */
export function dedupeAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fn().finally(() => {
    if (inFlight.get(key) === promise) {
      inFlight.delete(key)
    }
  })

  inFlight.set(key, promise)
  return promise
}

/** 强制重新请求前清除去重缓存 */
export function clearHttpDedupe(key: string) {
  inFlight.delete(key)
}

export function buildHttpDedupeKey(
  method: string,
  path: string,
  dedupeKey: string | true,
): string {
  if (typeof dedupeKey === 'string') {
    return dedupeKey
  }
  return `${method.toUpperCase()}:${path}`
}
