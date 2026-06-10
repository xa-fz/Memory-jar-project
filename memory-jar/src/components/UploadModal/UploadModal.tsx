import { useState } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconCloudUpload, IconUpload, IconX } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { Modal } from '@/components/Modal'
import type { UploadModalProps } from './types'
import classes from './UploadModal.module.css'

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024

export function UploadModal({
  opened,
  onClose,
  onUpload,
  title,
  dropzoneHint,
  acceptHint,
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  confirmLabel,
  cancelLabel,
  selectedLabel,
  modalProps,
}: UploadModalProps) {
  const intl = useIntl()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const resolvedTitle = title ?? intl.formatMessage({ id: 'upload.title' })
  const resolvedDropzoneHint =
    dropzoneHint ?? intl.formatMessage({ id: 'upload.dropzoneHint' })
  const resolvedConfirmLabel =
    confirmLabel ?? intl.formatMessage({ id: 'upload.confirm' })
  const resolvedCancelLabel =
    cancelLabel ?? intl.formatMessage({ id: 'upload.cancel' })
  const resolvedSelectedLabel =
    selectedLabel ?? intl.formatMessage({ id: 'upload.selected' })

  const handleClose = () => {
    setFile(null)
    setUploading(false)
    onClose()
  }

  const handleDrop = (files: File[]) => {
    setFile(files[0] ?? null)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file)
      handleClose()
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={resolvedTitle}
      size="md"
      {...modalProps}
    >
      <Stack gap="md">
        <Dropzone
          onDrop={handleDrop}
          onReject={() => setFile(null)}
          maxSize={maxSize}
          accept={accept}
          multiple={multiple}
          classNames={{ root: classes.dropzone }}
        >
          <Stack align="center" gap="sm" py="lg">
            <Dropzone.Accept>
              <IconUpload size={40} color="var(--mantine-color-blue-6)" stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={40} color="var(--mantine-color-red-6)" stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload size={40} color="var(--mantine-color-blue-6)" stroke={1.5} />
            </Dropzone.Idle>

            <Text fw={500}>{resolvedDropzoneHint}</Text>
            {acceptHint && (
              <Text size="sm" c="dimmed" ta="center">
                {intl.formatMessage({ id: 'upload.acceptFormats' }, { formats: acceptHint })}
              </Text>
            )}
          </Stack>
        </Dropzone>

        {file && (
          <Text size="sm">
            {resolvedSelectedLabel}
            <Text span fw={500}>{file.name}</Text>
          </Text>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            {resolvedCancelLabel}
          </Button>
          <Button
            color="blue"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
          >
            {resolvedConfirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
