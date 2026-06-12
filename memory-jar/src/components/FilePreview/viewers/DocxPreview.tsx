import { useEffect, useState } from 'react'
import { Center, Loader, Text } from '@mantine/core'
import mammoth from 'mammoth'
import { useIntl } from 'react-intl'
import classes from '../FilePreview.module.css'

export interface DocxPreviewProps {
  file: Blob
}

export function DocxPreview({ file }: DocxPreviewProps) {
  const intl = useIntl()
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    setError(false)

    void (async () => {
      try {
        const buffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        if (!cancelled) setHtml(result.value)
      } catch {
        if (!cancelled) setError(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [file])

  if (error) {
    return (
      <Center py="xl">
        <Text size="sm" c="dimmed">
          {intl.formatMessage({ id: 'filePreview.docxError' })}
        </Text>
      </Center>
    )
  }

  if (!html) {
    return (
      <Center py="xl">
        <Loader size="sm" color="indigo" />
      </Center>
    )
  }

  return (
    <div
      className={classes.docxHtml}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
