import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { MIME_TYPES } from '@mantine/dropzone'
import { useDisclosure } from '@mantine/hooks'
import { IconDownload, IconEye, IconFileText, IconTrash, IconUpload } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import type { DocumentItem } from '@/types'
import { httpDelete, httpDownload, httpGet, httpUpload, UploadModal, useMessageTip } from '@/components'
import { DocumentDetailModal } from './DocumentDetailModal'
import theme from '@/styles/appTheme.module.css'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function DocumentsPage() {
  const intl = useIntl()
  const { showTip } = useMessageTip()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const detailOpenedRef = useRef(detailOpened)
  detailOpenedRef.current = detailOpened

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const body = await httpGet<DocumentItem[]>('/documents/')
      if (body.code === 200 && body.data) {
        setDocuments(body.data)
        return
      }
      showTip({
        message: body.message ?? intl.formatMessage({ id: 'documents.loadError' }),
        type: 'error',
      })
    } catch {
      showTip({
        message: intl.formatMessage({ id: 'documents.loadError' }),
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [intl, showTip])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  const handleView = (id: number) => {
    setSelectedDocId(id)
    openDetail()
  }

  const handleCloseDetail = useCallback(() => {
    closeDetail()
  }, [closeDetail])

  const handleDetailExited = useCallback(() => {
    if (!detailOpenedRef.current) {
      setSelectedDocId(null)
    }
  }, [])

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await httpDownload(`/documents/${doc.id}/download`, doc.title)
    } catch {
      showTip({
        message: intl.formatMessage({ id: 'documents.downloadError' }),
        type: 'error',
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const body = await httpDelete(`/documents/${id}`)
      if (body.code === 200) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
        if (selectedDocId === id) handleCloseDetail()
        showTip({
          message: intl.formatMessage({ id: 'documents.deleteSuccess' }),
          type: 'success',
        })
        return
      }
      showTip({
        message: body.message ?? intl.formatMessage({ id: 'documents.deleteError' }),
        type: 'error',
      })
    } catch {
      showTip({
        message: intl.formatMessage({ id: 'documents.deleteError' }),
        type: 'error',
      })
    }
  }

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const body = await httpUpload<{ id: number; title: string; file_type: string }>(
        '/documents/upload/',
        formData,
      )

      if (body.code !== 200) {
        showTip({
          message: body.message ?? intl.formatMessage({ id: 'documents.uploadError' }),
          type: 'error',
        })
        throw new Error('upload failed')
      }

      showTip({
        message: intl.formatMessage({ id: 'documents.uploadSuccess' }),
        type: 'success',
      })
      await fetchDocuments()
    } catch (err) {
      if (err instanceof Error && err.message === 'upload failed') {
        throw err
      }
      showTip({
        message: intl.formatMessage({ id: 'documents.uploadError' }),
        type: 'error',
      })
      throw err
    }
  }

  return (
    <>
      <Stack gap="lg" className={theme.pageRoot}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} className={theme.pageTitle}>
              {intl.formatMessage({ id: 'documents.title' })}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {intl.formatMessage({ id: 'documents.subtitle' })}
            </Text>
          </div>
          <Button
            className={theme.primaryBtn}
            leftSection={<IconUpload size={16} />}
            onClick={openUpload}
          >
            {intl.formatMessage({ id: 'documents.upload' })}
          </Button>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="sm" color="indigo" />
          </Center>
        ) : (
          <Stack gap="md">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                withBorder
                padding="lg"
                radius="md"
                className={theme.surfaceCard}
                style={{ cursor: 'pointer' }}
                onClick={() => handleView(doc.id)}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                    <ThemeIcon size={40} radius="md" variant="light" color="indigo">
                      <IconFileText size={22} />
                    </ThemeIcon>
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={600} lineClamp={1}>
                        {doc.title}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {intl.formatMessage(
                          { id: 'documents.fileSize' },
                          { size: formatFileSize(doc.file_size) },
                        )}
                      </Text>
                    </Stack>
                  </Group>

                  <Group gap="xs" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                    {doc.file_type ? (
                      <Badge variant="light" color="indigo">
                        {doc.file_type.replace(/^\./, '').toUpperCase()}
                      </Badge>
                    ) : null}
                    <Badge variant="light" color="gray">
                      {doc.date}
                    </Badge>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label={intl.formatMessage({ id: 'documents.downloadAria' })}
                      onClick={() => void handleDownload(doc)}
                    >
                      <IconDownload size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="indigo"
                      aria-label={intl.formatMessage({ id: 'documents.viewAria' })}
                      onClick={() => handleView(doc.id)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={intl.formatMessage({ id: 'documents.deleteAria' })}
                      onClick={() => void handleDelete(doc.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}

            {documents.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                {intl.formatMessage({ id: 'documents.empty' })}
              </Text>
            )}
          </Stack>
        )}
      </Stack>

      <UploadModal
        opened={uploadOpened}
        onClose={closeUpload}
        onUpload={handleUpload}
        title={intl.formatMessage({ id: 'documents.upload' })}
        acceptHint={intl.formatMessage({ id: 'documents.acceptHint' })}
        accept={[
          MIME_TYPES.pdf,
          MIME_TYPES.csv,
          MIME_TYPES.xls,
          MIME_TYPES.xlsx,
          MIME_TYPES.png,
          MIME_TYPES.jpeg,
          MIME_TYPES.gif,
          MIME_TYPES.webp,
          'text/plain',
          'text/markdown',
          'application/json',
          'application/xml',
          'text/xml',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]}
      />

      <DocumentDetailModal
        opened={detailOpened}
        documentId={selectedDocId}
        onClose={handleCloseDetail}
        onExited={handleDetailExited}
      />
    </>
  )
}
