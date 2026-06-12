import { useMemo } from 'react'
import { Stack, Text } from '@mantine/core'
import { parseXlsxContent } from '../parseXlsxContent'
import classes from '../FilePreview.module.css'
import { TextPreview } from './TextPreview'
import { TablePreview } from './TablePreview'

export interface XlsxPreviewProps {
  content: string
}

export function XlsxPreview({ content }: XlsxPreviewProps) {
  const sheets = useMemo(() => parseXlsxContent(content), [content])

  if (sheets.length === 0) {
    return <TextPreview content={content} />
  }

  return (
    <div className={classes.csvWrap}>
      <Stack gap="lg">
        {sheets.map((sheet) => (
          <Stack key={sheet.title} gap="xs">
            <Text size="sm" fw={600} c="indigo.8">
              {sheet.title}
            </Text>
            <TablePreview rows={sheet.rows} />
          </Stack>
        ))}
      </Stack>
    </div>
  )
}
