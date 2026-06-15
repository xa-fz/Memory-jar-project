import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { IconDots, IconPencil, IconTrash } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { Modal } from '@/components'
import type { ChatConversationSummary } from '@/types'
import theme from '@/styles/appTheme.module.css'
import classes from './AppLayout.module.css'

interface ConversationSidebarItemProps {
  conversation: ChatConversationSummary
  isActive: boolean
  formattedTime: string
  onSelect: () => void
  onRename: (title: string) => Promise<boolean>
  onDelete: () => Promise<boolean>
}

export function ConversationSidebarItem({
  conversation,
  isActive,
  formattedTime,
  onSelect,
  onRename,
  onDelete,
}: ConversationSidebarItemProps) {
  const intl = useIntl()
  const [menuOpened, setMenuOpened] = useState(false)
  const [renameOpened, setRenameOpened] = useState(false)
  const [deleteOpened, setDeleteOpened] = useState(false)
  const [renameValue, setRenameValue] = useState(conversation.title)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const openRename = () => {
    setRenameValue(conversation.title)
    setRenameOpened(true)
  }

  const handleRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || renaming) return

    setRenaming(true)
    try {
      const ok = await onRename(trimmed)
      if (ok) {
        setRenameOpened(false)
      }
    } finally {
      setRenaming(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return

    setDeleting(true)
    try {
      const ok = await onDelete()
      if (ok) {
        setDeleteOpened(false)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className={isActive ? classes.conversationRowActive : classes.conversationRow}
        data-menu-open={menuOpened || undefined}
      >
        <UnstyledButton className={classes.conversationMain} onClick={onSelect}>
          <Text size="sm" fw={isActive ? 600 : 500} lineClamp={2}>
            {conversation.title}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {formattedTime}
          </Text>
        </UnstyledButton>

        <Menu
          opened={menuOpened}
          onChange={setMenuOpened}
          position="bottom-end"
          withinPortal
          width={140}
        >
          <Menu.Target>
            <ActionIcon
              className={classes.conversationMenuBtn}
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={intl.formatMessage({ id: 'chat.conversationActionsAria' })}
              onClick={(event) => event.stopPropagation()}
            >
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconPencil size={16} />}
              onClick={() => {
                setMenuOpened(false)
                openRename()
              }}
            >
              {intl.formatMessage({ id: 'chat.rename' })}
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => {
                setMenuOpened(false)
                setDeleteOpened(true)
              }}
            >
              {intl.formatMessage({ id: 'chat.delete' })}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      <Modal
        opened={renameOpened}
        onClose={() => setRenameOpened(false)}
        title={intl.formatMessage({ id: 'chat.renameTitle' })}
        width={440}
      >
        <Stack gap="md">
          <TextInput
            label={intl.formatMessage({ id: 'chat.renameLabel' })}
            placeholder={intl.formatMessage({ id: 'chat.renamePlaceholder' })}
            value={renameValue}
            onChange={(event) => setRenameValue(event.currentTarget.value)}
            maxLength={255}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleRename()
              }
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRenameOpened(false)}>
              {intl.formatMessage({ id: 'chat.renameCancel' })}
            </Button>
            <Button
              className={theme.primaryBtn}
              loading={renaming}
              disabled={!renameValue.trim()}
              onClick={() => void handleRename()}
            >
              {intl.formatMessage({ id: 'chat.renameConfirm' })}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        title={intl.formatMessage({ id: 'chat.deleteConfirmTitle' })}
        width={440}
      >
        <Stack gap="md">
          <Text size="sm">
            {intl.formatMessage(
              { id: 'chat.deleteConfirmMessage' },
              { name: conversation.title },
            )}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteOpened(false)}>
              {intl.formatMessage({ id: 'chat.deleteCancel' })}
            </Button>
            <Button color="red" loading={deleting} onClick={() => void handleDelete()}>
              {intl.formatMessage({ id: 'chat.deleteConfirm' })}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
