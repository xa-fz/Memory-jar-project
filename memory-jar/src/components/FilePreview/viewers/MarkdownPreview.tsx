import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import classes from '../FilePreview.module.css'

export interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className={classes.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
