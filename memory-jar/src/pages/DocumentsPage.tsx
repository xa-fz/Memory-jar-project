import { useCallback, useEffect, useState } from 'react'
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
import { IconFileText, IconTrash, IconUpload } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import type { DocumentItem } from '@/types'
import { httpDelete, httpGet, httpUpload, UploadModal, useMessageTip } from '@/components'
import theme from '@/styles/appTheme.module.css'

export function DocumentsPage() {
  const intl = useIntl()
  const { showTip } = useMessageTip()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, { open, close }] = useDisclosure(false)

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

  const handleDelete = async (id: number) => {
    try {
      const body = await httpDelete(`/documents/${id}`)
      if (body.code === 200) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
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
      const body = await httpUpload<{ id: number; title: string }>(
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
            onClick={open}
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
              <Card key={doc.id} withBorder padding="lg" radius="md" className={theme.surfaceCard}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                    <ThemeIcon size={40} radius="md" variant="light" color="indigo">
                      <IconFileText size={22} />
                    </ThemeIcon>
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={600} lineClamp={1}>
                        {doc.title}
                      </Text>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {doc.preview}
                      </Text>
                    </Stack>
                  </Group>

                  <Group gap="md" wrap="nowrap">
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
        opened={opened}
        onClose={close}
        onUpload={handleUpload}
        title={intl.formatMessage({ id: 'documents.upload' })}
        acceptHint={intl.formatMessage({ id: 'documents.acceptHint' })}
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
      />
    </>
  )
}
