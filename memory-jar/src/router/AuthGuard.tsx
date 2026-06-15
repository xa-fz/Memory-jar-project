import { Center, Loader } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useMessageTip } from '@/components'
import { useAuth } from '@/context'

export function AuthGuard() {
  const intl = useIntl()
  const navigate = useNavigate()
  const { user, checking } = useAuth()
  const { showTip } = useMessageTip()
  const hasHandledUnauthorized = useRef(false)

  useEffect(() => {
    if (checking || user || hasHandledUnauthorized.current) {
      return
    }

    hasHandledUnauthorized.current = true
    navigate('/login', { replace: true })
    showTip({
      message: intl.formatMessage({ id: 'auth.sessionExpired' }),
      type: 'error',
    })
  }, [checking, user, intl, navigate, showTip])

  if (checking) {
    return (
      <Center h="100vh">
        <Loader size="sm" />
      </Center>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
