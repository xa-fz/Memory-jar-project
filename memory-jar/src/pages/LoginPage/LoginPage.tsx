import { useMemo, useState } from 'react'
import {
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconLock, IconUser } from '@tabler/icons-react'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { httpPost, useMessageTip } from '@/components'
import { useAuth } from '@/context'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import { LoginMascot, type MascotMode } from './LoginMascot'
import { LoginNeuralBg } from './LoginNeuralBg'
import classes from './LoginPage.module.css'

export function LoginPage() {
  const intl = useIntl()
  const navigate = useNavigate()
  const { showTip } = useMessageTip()
  const { fetchMe } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(
    null,
  )
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const mascotMode: MascotMode = useMemo(() => {
    if (focusedField === 'password') {
      if (showPassword) return 'peek'
      return 'password'
    }
    if (focusedField === 'username') return 'username'
    return 'idle'
  }, [focusedField, showPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setSubmitting(true)
    setError('')

    try {
      const body = await httpPost('/auth/login', {
        username: username.trim(),
        password,
      })

      if (body.code === 200) {
        const meResult = await fetchMe({ force: true })
        if (meResult === 'ok') {
          showTip({
            message: intl.formatMessage({ id: 'login.success' }),
            type: 'success',
            onDone: () => navigate('/chat', { replace: true }),
          })
          return
        }
        setError(intl.formatMessage({ id: 'login.errorNetwork' }))
        return
      }

      setError(body.message ?? intl.formatMessage({ id: 'login.error' }))
    } catch {
      setError(intl.formatMessage({ id: 'login.errorNetwork' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.bgLayer} aria-hidden>
        <div className={classes.bgBase} />
        <LoginNeuralBg />
        <div className={classes.bgNoise} />
        <div className={classes.bgVignette} />
      </div>

      <div className={classes.topBar}>
        <LanguageSwitcher />
      </div>

      <div className={classes.wrapper}>
        <div className={classes.cardStack}>
          <LoginMascot mode={mascotMode} />

          <div className={classes.card}>
            <div className={classes.cardGlow} aria-hidden />

            <div className={classes.brandRow}>
              <span className={classes.brandEmoji} aria-hidden>
                🧠
              </span>
              <h1 className={classes.brandTitle}>Memory Jar</h1>
              <p className={classes.brandTagline}>
                {intl.formatMessage({ id: 'app.tagline' })}
              </p>
            </div>

            <form className={classes.form} onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label={intl.formatMessage({ id: 'login.username' })}
                  placeholder={intl.formatMessage({ id: 'login.usernamePlaceholder' })}
                  leftSection={<IconUser size={16} stroke={1.5} />}
                  value={username}
                  onChange={(e) => setUsername(e.currentTarget.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() =>
                    setFocusedField((prev) => (prev === 'username' ? null : prev))
                  }
                  autoComplete="username"
                  size="md"
                  radius="md"
                  classNames={{ input: classes.input, section: classes.inputSection }}
                />

                <PasswordInput
                  label={intl.formatMessage({ id: 'login.password' })}
                  placeholder={intl.formatMessage({ id: 'login.passwordPlaceholder' })}
                  leftSection={<IconLock size={16} stroke={1.5} />}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() =>
                    setFocusedField((prev) => (prev === 'password' ? null : prev))
                  }
                  visible={showPassword}
                  onVisibilityChange={setShowPassword}
                  autoComplete="current-password"
                  size="md"
                  radius="md"
                  classNames={{ input: classes.input, innerInput: classes.innerInput, section: classes.inputSection }}
                />

                <Button
                  type="submit"
                  size="md"
                  radius="md"
                  fullWidth
                  loading={submitting}
                  className={classes.submitBtn}
                  disabled={!username.trim() || !password}
                >
                  {intl.formatMessage({ id: 'login.submit' })}
                </Button>

                {error ? (
                  <Text size="sm" c="red.4" ta="center">
                    {error}
                  </Text>
                ) : null}
              </Stack>
            </form>

            <p className={classes.footerHint}>
              {intl.formatMessage({ id: 'login.hint' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
