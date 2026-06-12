import { useEffect, useState } from 'react'
import { Center, Loader, Text } from '@mantine/core'
import { Document, Page, pdfjs } from 'react-pdf'
import { useIntl } from 'react-intl'
import classes from '../FilePreview.module.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PdfPreviewProps {
  file: Blob | ArrayBuffer | string
}

export function PdfPreview({ file }: PdfPreviewProps) {
  const intl = useIntl()
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(640)

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(window.innerWidth - 96, 880))
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <Document
      file={file}
      loading={
        <Center py="xl">
          <Loader size="sm" color="indigo" />
        </Center>
      }
      error={
        <Center py="xl">
          <Text size="sm" c="dimmed">
            {intl.formatMessage({ id: 'filePreview.pdfError' })}
          </Text>
        </Center>
      }
      onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
    >
      <div className={classes.pdfPages}>
        {Array.from({ length: numPages }, (_, index) => (
          <Page
            key={`page-${index + 1}`}
            className={classes.pdfPage}
            pageNumber={index + 1}
            width={containerWidth}
            renderTextLayer
            renderAnnotationLayer
          />
        ))}
      </div>
    </Document>
  )
}
