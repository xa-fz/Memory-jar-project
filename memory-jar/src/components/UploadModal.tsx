import { useState } from 'react'
import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import { IconCloudUpload, IconUpload, IconX } from '@tabler/icons-react'
import { supportedExtensions } from '@/data/mock'

interface UploadModalProps {
  opened: boolean
  onClose: () => void
  onUpload: (file: File) => void
}

export function UploadModal({ opened, onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleClose = () => {
    setFile(null)
    setUploading(false)
    onClose()
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    // 模拟上传，后续接入 POST /api/documents/upload/
    await new Promise((resolve) => setTimeout(resolve, 600))
    onUpload(file)
    handleClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="上传文档"
      size="md"
      centered
    >
      <Stack gap="md">
        <Dropzone
          onDrop={(files) => setFile(files[0] ?? null)}
          onReject={() => setFile(null)}
          maxSize={20 * 1024 * 1024}
          accept={[
            MIME_TYPES.pdf,
            MIME_TYPES.csv,
            MIME_TYPES.xls,
            MIME_TYPES.xlsx,
            'text/plain',
            'text/markdown',
            'application/json',
            'application/xml',
            'text/xml',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]}
          multiple={false}
          styles={{
            root: {
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
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

            <Text fw={500}>点击选择文件，或拖拽到此处</Text>
            <Text size="sm" c="dimmed" ta="center">
              支持 {supportedExtensions}
            </Text>
          </Stack>
        </Dropzone>

        {file && (
          <Text size="sm">
            已选择：<Text span fw={500}>{file.name}</Text>
          </Text>
        )}

        <Text size="xs" c="dimmed">
          无需填写标题和内容，将自动使用文件名
        </Text>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            取消
          </Button>
          <Button
            color="blue"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
          >
            上传
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
