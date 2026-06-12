import classes from '../FilePreview.module.css'

export interface TextPreviewProps {
  content: string
}

export function TextPreview({ content }: TextPreviewProps) {
  return <pre className={classes.textContent}>{content}</pre>
}
