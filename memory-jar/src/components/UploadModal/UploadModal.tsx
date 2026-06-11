import { useState } from 'react'
import type { ModalProps } from '@mantine/core'
import { Button, Group, Stack, Text } from '@mantine/core'
import { Dropzone, type DropzoneProps } from '@mantine/dropzone'
import { IconCloudUpload, IconUpload, IconX } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { Modal } from '@/components/Modal'
import classes from './UploadModal.module.css'

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024

export interface UploadModalProps {
  opened: boolean
  onClose: () => void
  /** 选中文件并点击确认后触发，可返回 Promise */
  onUpload: (file: File) => void | Promise<void>
  /** 弹窗标题，默认「上传文件」 */
  title?: string
  /** 拖拽区主提示，默认「点击选择文件，或拖拽到此处」 */
  dropzoneHint?: string
  /** 格式说明，显示在拖拽区下方，如「支持 .txt、.pdf…」 */
  acceptHint?: string
  /** Dropzone accept，不传则不做类型限制 */
  accept?: DropzoneProps['accept']
  /** 单文件大小上限（字节），默认 20MB */
  maxSize?: number
  /** 是否允许多选，默认 false */
  multiple?: boolean
  confirmLabel?: string
  cancelLabel?: string
  selectedLabel?: string
  /** 传给底层 Modal 的其余属性 */
  modalProps?: Omit<ModalProps, 'opened' | 'onClose' | 'title' | 'children'>
}

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
