import { useState } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { ChatPage } from '@/pages/ChatPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import type { PageId } from '@/types'

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('chat')

  const renderPage = () => {
    switch (activePage) {
      case 'chat':
        return <ChatPage />
      case 'documents':
        return <DocumentsPage />
      case 'history':
        return <HistoryPage />
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </AppLayout>
  )
}
