export type FilePreviewKind =
  | 'markdown'
  | 'pdf'
  | 'json'
  | 'image'
  | 'docx'
  | 'text'
  | 'unsupported'

export function normalizeFileType(fileType: string): string {
  const trimmed = fileType.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
}

export function getFilePreviewKind(fileType: string): FilePreviewKind {
  switch (normalizeFileType(fileType)) {
    case '.md':
    case '.markdown':
      return 'markdown'
    case '.pdf':
      return 'pdf'
    case '.json':
      return 'json'
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.webp':
    case '.svg':
      return 'image'
    case '.docx':
      return 'docx'
    case '.txt':
    case '.csv':
    case '.xml':
    case '.log':
    case '.xlsx':
      return 'text'
    case '.doc':
      return 'unsupported'
    default:
      return 'text'
  }
}

export function needsBinarySource(kind: FilePreviewKind): boolean {
  return kind === 'pdf' || kind === 'image' || kind === 'docx'
}
