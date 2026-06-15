import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context'
import { AppLayout } from '@/layouts/AppLayout'
import { ChatPage } from '@/pages/ChatPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { AuthGuard } from '@/router/AuthGuard'
import { LoginRoute } from '@/router/LoginRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<LoginRoute />} />

          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="chat" element={<ChatPage />} />
              <Route path="documents" element={<DocumentsPage />} />
            </Route>
          </Route>

          <Route path="history" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
