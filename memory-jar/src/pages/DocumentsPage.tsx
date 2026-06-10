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
import { useDisclosure } from '@mantine/hooks'
import { IconFileText, IconTrash, IconUpload } from '@tabler/icons-react'
import type { DocumentItem } from '@/types'
import { initialDocuments } from '@/data/mock'
import { UploadModal } from '@/components/UploadModal'

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [opened, { open, close }] = useDisclosure(false)

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleUpload = (file: File) => {
    const newDoc: DocumentItem = {
      id: Date.now(),
      title: file.name,
      preview: `已上传文件（${(file.size / 1024).toFixed(1)} KB），内容将在接入后端后自动索引。`,
      date: formatDate(),
    }
    setDocuments((prev) => [newDoc, ...prev])
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>我的文档</Title>
            <Text size="sm" c="dimmed" mt={4}>
              管理你上传的文档记忆
            </Text>
          </div>
          <Button
            color="blue"
            leftSection={<IconUpload size={16} />}
            onClick={open}
          >
            上传文档
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
                    aria-label="删除文档"
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
              暂无文档，点击「上传文档」添加你的第一份记忆
            </Text>
          )}
        </Stack>
      </Stack>

      <UploadModal opened={opened} onClose={close} onUpload={handleUpload} />
    </>
  )
}
