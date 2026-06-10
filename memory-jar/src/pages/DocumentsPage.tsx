import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
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
import { UploadModal } from '@/components'
import { initialDocuments } from '@/data/mock'

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function DocumentsPage() {
  const intl = useIntl()
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [opened, { open, close }] = useDisclosure(false)

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleUpload = (file: File) => {
    const newDoc: DocumentItem = {
      id: Date.now(),
      title: file.name,
      preview: intl.formatMessage(
        { id: 'documents.uploadPreview' },
        { size: (file.size / 1024).toFixed(1) },
      ),
      date: formatDate(),
    }
    setDocuments((prev) => [newDoc, ...prev])
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{intl.formatMessage({ id: 'documents.title' })}</Title>
            <Text size="sm" c="dimmed" mt={4}>
              {intl.formatMessage({ id: 'documents.subtitle' })}
            </Text>
          </div>
          <Button
            color="blue"
            leftSection={<IconUpload size={16} />}
            onClick={open}
          >
            {intl.formatMessage({ id: 'documents.upload' })}
          </Button>
        </Group>

        <Stack gap="md">
          {documents.map((doc) => (
            <Card key={doc.id} withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
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
                  <Badge variant="light" color="gray">
                    {doc.date}
                  </Badge>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={intl.formatMessage({ id: 'documents.deleteAria' })}
                    onClick={() => handleDelete(doc.id)}
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
