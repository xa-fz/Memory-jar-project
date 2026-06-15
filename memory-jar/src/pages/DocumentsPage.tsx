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
  Tooltip,
} from '@mantine/core'
import { MIME_TYPES } from '@mantine/dropzone'
import { useDisclosure } from '@mantine/hooks'
import { IconDownload, IconEye, IconFileText, IconRefresh, IconSparkles, IconTrash, IconUpload } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import type { DocumentItem } from '@/types'
import { formatUtcToLocal } from '@/utils/formatDateTime'
import {
  httpDelete,
  httpDownload,
  httpGet,
  httpPost,
  httpPutUpload,
  httpUpload,
  Modal,
  UploadModal,
  useMessageTip,
} from '@/components'
import { DocumentDetailModal } from './DocumentDetailModal'
import theme from '@/styles/appTheme.module.css'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const DOCUMENT_ACCEPT = [
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
] as const

export function DocumentsPage() {
  const intl = useIntl()
  const { showTip } = useMessageTip()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DocumentItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingDoc, setUpdatingDoc] = useState<DocumentItem | null>(null)
  const [vectorizingId, setVectorizingId] = useState<number | null>(null)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)
  const detailOpenedRef = useRef(detailOpened)
  detailOpenedRef.current = detailOpened

  const loadErrorTip = intl.formatMessage({ id: 'documents.loadError' })

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const body = await httpGet<DocumentItem[]>('/documents/', {
        tip: { success: false, error: loadErrorTip },
        dedupeKey: 'documents/list',
      })
      if (body.code === 200 && body.data) {
        setDocuments(body.data)
      }
    } catch {
      // 提示已由 http 层处理
    } finally {
      setLoading(false)
    }
  }, [loadErrorTip])

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
    setDeleting(true)
    try {
      const body = await httpDelete(`/documents/${id}`, {
        tip: {
          success: intl.formatMessage({ id: 'documents.deleteSuccess' }),
          error: intl.formatMessage({ id: 'documents.deleteError' }),
        },
      })
      if (body.code === 200) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
        if (selectedDocId === id) handleCloseDetail()
        setPendingDelete(null)
      }
    } catch {
      // 提示已由 http 层处理
    } finally {
      setDeleting(false)
    }
  }

  const handleUpload = async (file: File, options: { enableSummary: boolean }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('enable_summary', options.enableSummary ? 'true' : 'false')

    try {
      const body = await httpUpload<{ id: number; title: string; file_type: string }>(
        '/documents/upload/',
        formData,
        {
          tip: {
            success: intl.formatMessage({ id: 'documents.uploadSuccess' }),
            error: intl.formatMessage({ id: 'documents.uploadError' }),
          },
        },
      )

      if (body.code !== 200) {
        throw new Error('upload failed')
      }

      await fetchDocuments()
    } catch (err) {
      if (err instanceof Error && err.message === 'upload failed') {
        throw err
      }
      throw err
    }
  }

  const handleVectorize = async (doc: DocumentItem) => {
    setVectorizingId(doc.id)
    try {
      const body = await httpPost<{ id: number; vectorized: boolean; chunks: number }>(
        `/documents/${doc.id}/vectorize`,
        undefined,
        {
          tip: {
            success: intl.formatMessage({ id: 'documents.vectorizeSuccess' }),
            error: intl.formatMessage({ id: 'documents.vectorizeFailed' }),
          },
        },
      )
      if (body.code === 200) {
        setDocuments((prev) =>
          prev.map((item) => (item.id === doc.id ? { ...item, vectorized: true } : item)),
        )
      }
    } catch {
      // 提示已由 http 层处理
    } finally {
      setVectorizingId(null)
    }
  }

  const handleUpdate = async (file: File, options: { enableSummary: boolean }) => {
    if (!updatingDoc) return

    const docId = updatingDoc.id
    const formData = new FormData()
    formData.append('file', file)
    formData.append('enable_summary', options.enableSummary ? 'true' : 'false')

    try {
      const body = await httpPutUpload<{ id: number; title: string; file_type: string }>(
        `/documents/${docId}`,
        formData,
        {
          tip: {
            success: intl.formatMessage({ id: 'documents.updateSuccess' }),
            error: intl.formatMessage({ id: 'documents.updateError' }),
          },
        },
      )

      if (body.code !== 200) {
        throw new Error('update failed')
      }

      setUpdatingDoc(null)
      await fetchDocuments()
      if (selectedDocId === docId) {
        setDetailRefreshKey((key) => key + 1)
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'update failed') {
        throw err
      }
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
                    <Badge variant="light" color={doc.vectorized ? 'teal' : 'gray'}>
                      {intl.formatMessage({
                        id: doc.vectorized ? 'documents.vectorized' : 'documents.notVectorized',
                      })}
                    </Badge>
                    <Badge variant="light" color="gray">
                      {formatUtcToLocal(doc.date)}
                    </Badge>
                    <Tooltip
                      label={intl.formatMessage({
                        id:
                          vectorizingId === doc.id
                            ? 'documents.vectorizing'
                            : doc.vectorized
                              ? 'documents.revectorize'
                              : 'documents.vectorize',
                      })}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color={doc.vectorized ? 'teal' : 'indigo'}
                        aria-label={intl.formatMessage({
                          id:
                            vectorizingId === doc.id
                              ? 'documents.vectorizing'
                              : doc.vectorized
                                ? 'documents.revectorize'
                                : 'documents.vectorize',
                        })}
                        loading={vectorizingId === doc.id}
                        onClick={() => void handleVectorize(doc)}
                      >
                        <IconSparkles size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={intl.formatMessage({ id: 'documents.downloadAria' })}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={intl.formatMessage({ id: 'documents.downloadAria' })}
                        onClick={() => void handleDownload(doc)}
                      >
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={intl.formatMessage({ id: 'documents.updateAria' })}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color="orange"
                        aria-label={intl.formatMessage({ id: 'documents.updateAria' })}
                        onClick={() => setUpdatingDoc(doc)}
                      >
                        <IconRefresh size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={intl.formatMessage({ id: 'documents.viewAria' })}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color="indigo"
                        aria-label={intl.formatMessage({ id: 'documents.viewAria' })}
                        onClick={() => handleView(doc.id)}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={intl.formatMessage({ id: 'documents.deleteAria' })}
                      withArrow
                    >
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={intl.formatMessage({ id: 'documents.deleteAria' })}
                        onClick={() => setPendingDelete(doc)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
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
        showSummarySwitch
        title={intl.formatMessage({ id: 'documents.upload' })}
        acceptHint={intl.formatMessage({ id: 'documents.acceptHint' })}
        accept={[...DOCUMENT_ACCEPT]}
      />

      <UploadModal
        opened={updatingDoc !== null}
        onClose={() => setUpdatingDoc(null)}
        onUpload={handleUpdate}
        showSummarySwitch
        title={intl.formatMessage({ id: 'documents.updateTitle' })}
        warningText={intl.formatMessage({ id: 'documents.updateWarning' })}
        confirmLabel={intl.formatMessage({ id: 'documents.updateConfirm' })}
        acceptHint={intl.formatMessage({ id: 'documents.acceptHint' })}
        accept={[...DOCUMENT_ACCEPT]}
      />

      <DocumentDetailModal
        opened={detailOpened}
        documentId={selectedDocId}
        refreshKey={detailRefreshKey}
        onClose={handleCloseDetail}
        onExited={handleDetailExited}
      />

      <Modal
        opened={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={intl.formatMessage({ id: 'documents.deleteConfirmTitle' })}
        width={440}
      >
        <Stack gap="md">
          <Text size="sm">
            {intl.formatMessage(
              { id: 'documents.deleteConfirmMessage' },
              { name: pendingDelete?.title ?? '' },
            )}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPendingDelete(null)}>
              {intl.formatMessage({ id: 'documents.deleteCancel' })}
            </Button>
            <Button
              color="red"
              loading={deleting}
              onClick={() => pendingDelete && void handleDelete(pendingDelete.id)}
            >
              {intl.formatMessage({ id: 'documents.deleteConfirm' })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
