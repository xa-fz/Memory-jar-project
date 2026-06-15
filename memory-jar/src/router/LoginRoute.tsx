import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context'
import { LoginPage } from '@/pages/LoginPage'

export function LoginRoute() {
  const { user, checking } = useAuth()

  if (!checking && user) {
    return <Navigate to="/chat" replace />
  }

  return <LoginPage />
}
