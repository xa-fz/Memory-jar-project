const DISPLAY_TIMEZONE = 'Asia/Shanghai'

/** 接口返回的 UTC 时间（无后缀时按 UTC 解析） */
function parseApiDateTime(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00Z`)
  }

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
  const parsed = new Date(hasTimezone ? normalized : `${normalized}Z`)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pad(value: string) {
  return value.padStart(2, '0')
}

/** 将接口 UTC 时间格式化为东八区：YYYY-MM-DD HH:mm:ss */
export function formatUtcToLocal(value: string | null | undefined): string {
  if (!value?.trim()) return ''

  const date = parseApiDateTime(value)
  if (!date) return value

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${get('year')}-${pad(get('month'))}-${pad(get('day'))} ${pad(get('hour'))}:${pad(get('minute'))}:${pad(get('second'))}`
}
