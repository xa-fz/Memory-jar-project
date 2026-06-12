import { TextPreview } from './TextPreview'

export interface JsonPreviewProps {
  content: string
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

export function JsonPreview({ content }: JsonPreviewProps) {
  return <TextPreview content={formatJson(content)} />
}
