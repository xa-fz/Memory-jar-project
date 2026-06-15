import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { clearHttpDedupe, httpGet, httpPost, useMessageTip } from '@/components'
import type { AuthUser } from '@/types'

type FetchMeResult = 'ok' | 'unauthorized' | 'error'

interface FetchMeOptions {
  force?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  checking: boolean
  fetchMe: (options?: FetchMeOptions) => Promise<FetchMeResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_ME_DEDUPE_KEY = 'auth/me'

export function AuthProvider({ children }: { children: ReactNode }) {
  const intl = useIntl()
  const navigate = useNavigate()
  const { showTip } = useMessageTip()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(true)

  const fetchMe = useCallback(async (options?: FetchMeOptions): Promise<FetchMeResult> => {
    const force = options?.force ?? false

    if (force) {
      clearHttpDedupe(AUTH_ME_DEDUPE_KEY)
    }

    setChecking(true)
    try {
      const body = await httpGet<AuthUser>('/auth/me', {
        dedupeKey: AUTH_ME_DEDUPE_KEY,
      })
      if (body.code === 200 && body.data) {
        setUser(body.data)
        return 'ok'
      }
      if (body.code === 401) {
        setUser(null)
        return 'unauthorized'
      }
      setUser(null)
      return 'error'
    } catch {
      setUser(null)
      return 'error'
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  const logout = useCallback(async () => {
    clearHttpDedupe(AUTH_ME_DEDUPE_KEY)
    try {
      await httpPost('/auth/logout')
    } catch {
      // 网络失败也清本地状态
    }
    setUser(null)
    navigate('/login', { replace: true })
    showTip({
      message: intl.formatMessage({ id: 'auth.logoutSuccess' }),
      type: 'success',
    })
  }, [intl, navigate, showTip])

  const value = useMemo(
    () => ({ user, checking, fetchMe, logout }),
    [user, checking, fetchMe, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
