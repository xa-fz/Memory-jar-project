import { useEffect, useState } from 'react'
import { ActionIcon, Badge, Center, Group, Loader, Stack, Text } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { FilePreview, httpDownload, httpGet, Modal, useMessageTip } from '@/components'
import type { DocumentDetail } from '@/types'
import { formatUtcToLocal } from '@/utils/formatDateTime'
import classes from './DocumentDetailModal.module.css'

export interface DocumentDetailModalProps {
  opened: boolean
  documentId: number | null
  refreshKey?: number
  onClose: () => void
  /** 关闭动画结束后再清理外部状态（如 selectedDocId） */
  onExited?: () => void
}

const MODAL_WIDTH = 960
const PREVIEW_HEIGHT = 560
const PREVIEW_HEIGHT_WITH_SUMMARY = 440

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function DocumentDetailModal({
  opened,
  documentId,
  refreshKey = 0,
  onClose,
  onExited,
}: DocumentDetailModalProps) {
  const intl = useIntl()
  const { showTip } = useMessageTip()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<DocumentDetail | null>(null)

  useEffect(() => {
    if (!opened || documentId === null) {
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const body = await httpGet<DocumentDetail>(`/documents/${documentId}`)
        if (cancelled) return

        if (body.code === 200 && body.data) {
          setDetail(body.data)
          return
        }

        showTip({
          message: body.message ?? intl.formatMessage({ id: 'documents.detailError' }),
          type: 'error',
        })
        onClose()
      } catch {
        if (!cancelled) {
          showTip({
            message: intl.formatMessage({ id: 'documents.detailError' }),
            type: 'error',
          })
          onClose()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [opened, documentId, refreshKey, intl, showTip, onClose])

  const handleDownload = async () => {
    if (!detail) return
    try {
      await httpDownload(`/documents/${detail.id}/download`, detail.title)
    } catch {
      showTip({
        message: intl.formatMessage({ id: 'documents.downloadError' }),
        type: 'error',
      })
    }
  }

  const handleExitTransitionEnd = () => {
    setDetail(null)
    setLoading(false)
    onExited?.()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={detail?.title ?? intl.formatMessage({ id: 'documents.detailTitle' })}
      width={MODAL_WIDTH}
      height={680}
      transitionProps={{ onExited: handleExitTransitionEnd }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="sm" color="indigo" />
        </Center>
      ) : detail ? (
        <Stack gap="md">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              {detail.file_type ? (
                <Badge variant="light" color="indigo">
                  {detail.file_type.replace(/^\./, '').toUpperCase()}
                </Badge>
              ) : null}
              <Badge variant="light" color="gray">
                {formatUtcToLocal(detail.date)}
              </Badge>
              <Text size="xs" c="dimmed">
                {intl.formatMessage(
                  { id: 'documents.fileSize' },
                  { size: formatFileSize(detail.file_size) },
                )}
              </Text>
            </Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={intl.formatMessage({ id: 'documents.downloadAria' })}
              onClick={() => void handleDownload()}
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Group>

          {detail.summary?.trim() ? (
            <Stack gap={6} className={classes.summaryBox}>
              <Text className={classes.summaryTitle}>
                {intl.formatMessage({ id: 'documents.summaryTitle' })}
              </Text>
              <Text component="p" className={classes.summaryText}>
                {detail.summary}
              </Text>
            </Stack>
          ) : null}

          <div
            className={classes.previewWrap}
            style={{
              ['--preview-height' as string]: `${
                detail.summary?.trim() ? PREVIEW_HEIGHT_WITH_SUMMARY : PREVIEW_HEIGHT
              }px`,
            }}
          >
            <FilePreview
              fileType={detail.file_type}
              content={detail.content}
              filePath={`/documents/${detail.id}/file`}
              fileName={detail.title}
              height="100%"
            />
          </div>
        </Stack>
      ) : null}
    </Modal>
  )
}
