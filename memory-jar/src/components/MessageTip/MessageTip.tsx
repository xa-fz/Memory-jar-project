import clsx from 'clsx'
import { useEffect, useState } from 'react'
import classes from './MessageTip.module.css'

export type MessageTipType = 'success' | 'error'

export interface MessageTipProps {
  opened: boolean
  message: string
  type?: MessageTipType
  duration?: number
  onClose: () => void
}

export function MessageTip({
  opened,
  message,
  type = 'success',
  duration = 1500,
  onClose,
}: MessageTipProps) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (opened) {
      setVisible(true)
      setLeaving(false)
      const timer = window.setTimeout(() => setLeaving(true), duration)
      return () => window.clearTimeout(timer)
    }
    setVisible(false)
    setLeaving(false)
  }, [opened, duration])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(onClose, 240)
    return () => window.clearTimeout(timer)
  }, [leaving, onClose])

  if (!visible) return null

  return (
    <div className={classes.container} role="status" aria-live="polite">
      <div
        className={clsx(classes.card, classes[type], leaving && classes.leaving)}
      >
        <div className={classes.icon} aria-hidden>
          {type === 'success' ? '✓' : '!'}
        </div>
        <p className={classes.message}>{message}</p>
      </div>
    </div>
  )
}
