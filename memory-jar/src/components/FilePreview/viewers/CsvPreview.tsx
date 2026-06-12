import { useMemo } from 'react'
import { parseCsv } from '../parseCsv'
import classes from '../FilePreview.module.css'
import { TextPreview } from './TextPreview'
import { TablePreview } from './TablePreview'

export interface CsvPreviewProps {
  content: string
}

export function CsvPreview({ content }: CsvPreviewProps) {
  const rows = useMemo(() => parseCsv(content), [content])

  if (rows.length === 0) {
    return <TextPreview content={content} />
  }

  return (
    <div className={classes.csvWrap}>
      <TablePreview rows={rows} />
    </div>
  )
}
