import {
  AppShell,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconFileText, IconPlus } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChatProvider, useChat } from '@/context'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import theme from '@/styles/appTheme.module.css'
import { AppHeaderAuth } from './AppHeaderAuth'
import { ConversationSidebarItem } from './ConversationSidebarItem'
import classes from './AppLayout.module.css'

function formatConversationTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function AppShellContent() {
  const intl = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    sortedConversations,
    activeId,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
  } = useChat()

  const isChatRoute = location.pathname === '/chat' || location.pathname === '/'
  const isDocumentsRoute = location.pathname === '/documents'

  const goToChat = () => {
    if (!isChatRoute) {
      navigate('/chat')
    }
  }

  const handleNewConversation = () => {
    void createNewConversation().then(() => goToChat())
  }

  const handleSelectConversation = (id: number) => {
    void selectConversation(id).then(() => goToChat())
  }

  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="md" withBorder>
        <Stack gap="md" h="100%">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
              <AppHeaderAuth />
              <LanguageSwitcher />
            </Group>

            <Stack gap={2}>
              <Group gap={6} wrap="nowrap" align="center">
                <Text
                  span
                  style={{ flexShrink: 0, fontSize: 16, lineHeight: 1 }}
                  aria-hidden
                >
                  🧠
                </Text>
                <Title order={4} lh={1.2} className={theme.brandTitle}>
                  Memory Jar
                </Title>
              </Group>
              <Text size="xs" c="dimmed" lh={1.4} pl={22}>
                {intl.formatMessage({ id: 'app.tagline' })}
              </Text>
            </Stack>
          </Stack>

          <Divider />

          <Button
            className={theme.primaryBtn}
            leftSection={<IconPlus size={16} />}
            onClick={handleNewConversation}
            fullWidth
          >
            {intl.formatMessage({ id: 'chat.newConversation' })}
          </Button>

          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            {intl.formatMessage({ id: 'chat.conversationList' })}
          </Text>

          <ScrollArea flex={1} type="auto" offsetScrollbars>
            <Stack gap={4} pr={4}>
              {sortedConversations.length === 0 ? (
                <Text size="sm" c="dimmed" py="sm">
                  {intl.formatMessage({ id: 'chat.emptyConversations' })}
                </Text>
              ) : (
                sortedConversations.map((conversation) => {
                  const isActive = isChatRoute && conversation.id === activeId
                  return (
                    <ConversationSidebarItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={isActive}
                      formattedTime={formatConversationTime(conversation.updatedAt)}
                      onSelect={() => handleSelectConversation(conversation.id)}
                      onRename={(title) => renameConversation(conversation.id, title)}
                      onDelete={() => deleteConversation(conversation.id)}
                    />
                  )
                })
              )}
            </Stack>
          </ScrollArea>

          <NavLink
            className={classes.documentsLink}
            label={intl.formatMessage({ id: 'nav.myDocuments' })}
            description={intl.formatMessage({ id: 'nav.myDocumentsHint' })}
            leftSection={<IconFileText size={18} stroke={1.5} />}
            active={isDocumentsRoute}
            onClick={() => navigate('/documents')}
            variant="light"
            color="indigo"
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0" style={{ display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export function AppLayout() {
  return (
    <ChatProvider>
      <AppShellContent />
    </ChatProvider>
  )
}
