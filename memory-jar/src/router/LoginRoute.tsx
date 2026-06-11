import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context'
import { LoginPage } from '@/pages/LoginPage'

export function LoginRoute() {
  const { user, fetchMe } = useAuth()

  // 后台检查是否已有 session，不阻塞登录页渲染
  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  if (user) {
    return <Navigate to="/chat" replace />
  }

  return <LoginPage />
}
