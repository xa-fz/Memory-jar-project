import { Center, Loader } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useMessageTip } from '@/components'
import { useAuth } from '@/context'

export function AuthGuard() {
  const intl = useIntl()
  const navigate = useNavigate()
  const { user, fetchMe } = useAuth()
  const { showTip } = useMessageTip()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const result = await fetchMe()
      if (cancelled) return

      if (result === 'unauthorized') {
        navigate('/login', { replace: true })
        showTip({
          message: intl.formatMessage({ id: 'auth.sessionExpired' }),
          type: 'error',
        })
      }

      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [fetchMe, intl, navigate, showTip])

  if (!ready) {
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
