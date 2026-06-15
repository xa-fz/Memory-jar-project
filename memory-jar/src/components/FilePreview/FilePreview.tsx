import { useEffect, useMemo, useState } from 'react'
import { Center, Loader, ScrollArea, Text } from '@mantine/core'
import clsx from 'clsx'
import { useIntl } from 'react-intl'
import { httpBlob } from '@/components/http_func'
import classes from './FilePreview.module.css'
import {
  getFilePreviewKind,
  needsBinarySource,
} from './filePreviewUtils'
import { XlsxPreview } from './viewers/XlsxPreview'
import { CsvPreview } from './viewers/CsvPreview'
import { DocxPreview } from './viewers/DocxPreview'
import { ImagePreview } from './viewers/ImagePreview'
import { JsonPreview } from './viewers/JsonPreview'
import { MarkdownPreview } from './viewers/MarkdownPreview'
import { PdfPreview } from './viewers/PdfPreview'
import { TextPreview } from './viewers/TextPreview'

export interface FilePreviewProps {
  fileType: string
  /** Extracted or plain text — used for text/md/json and as fallback */
  content?: string
  /** API path to fetch the original file, e.g. `/documents/1/file` */
  filePath?: string
  fileName?: string
  height?: number | string
  className?: string
}

export function FilePreview({
  fileType,
  content = '',
  filePath,
  fileName,
  height = 360,
  className,
}: FilePreviewProps) {
  const intl = useIntl()
  const kind = useMemo(() => getFilePreviewKind(fileType), [fileType])
  const requiresBinary = needsBinarySource(kind)

  const [binaryBlob, setBinaryBlob] = useState<Blob | null>(null)
  const [binaryUrl, setBinaryUrl] = useState<string | null>(null)
  const [loadingBinary, setLoadingBinary] = useState(requiresBinary && !!filePath)
  const [binaryError, setBinaryError] = useState(false)

  useEffect(() => {
    if (!requiresBinary || !filePath) {
      setBinaryBlob(null)
      setBinaryUrl(null)
      setLoadingBinary(false)
      setBinaryError(false)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    setLoadingBinary(true)
    setBinaryError(false)
    setBinaryBlob(null)
    setBinaryUrl(null)

    void (async () => {
      try {
        const blob = await httpBlob(filePath)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBinaryBlob(blob)
        setBinaryUrl(objectUrl)
      } catch {
        if (!cancelled) setBinaryError(true)
      } finally {
        if (!cancelled) setLoadingBinary(false)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [requiresBinary, filePath])

  const renderPreview = () => {
    if (loadingBinary) {
      return (
        <Center py="xl">
          <Loader size="sm" color="indigo" />
        </Center>
      )
    }

    if (binaryError && requiresBinary) {
      if (content.trim()) {
        return <TextPreview content={content} />
      }
      return (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            {intl.formatMessage({ id: 'filePreview.loadError' })}
          </Text>
        </Center>
      )
    }

    switch (kind) {
      case 'markdown':
        return <MarkdownPreview content={content} />
      case 'json':
        return <JsonPreview content={content} />
      case 'csv':
        return <CsvPreview content={content} />
      case 'xlsx':
        return <XlsxPreview content={content} />
      case 'pdf':
        if (binaryBlob) return <PdfPreview file={binaryBlob} />
        return <TextPreview content={content} />
      case 'image':
        if (binaryUrl) return <ImagePreview src={binaryUrl} alt={fileName} />
        return <TextPreview content={content} />
      case 'docx':
        if (binaryBlob) return <DocxPreview file={binaryBlob} />
        return <TextPreview content={content} />
      case 'text':
      default:
        return <TextPreview content={content} />
    }
  }

  return (
    <div className={clsx(classes.frame, className)} style={{ height }}>
      <ScrollArea
        className={classes.scrollArea}
        h="100%"
        type="scroll"
        scrollbarSize={8}
      >
        {renderPreview()}
      </ScrollArea>
    </div>
  )
}
