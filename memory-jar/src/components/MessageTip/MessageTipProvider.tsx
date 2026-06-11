import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MessageTip, type MessageTipType } from './MessageTip'

export interface ShowMessageTipOptions {
  message: string
  type?: MessageTipType
  duration?: number
  onDone?: () => void
}

interface MessageTipContextValue {
  showTip: (options: ShowMessageTipOptions) => void
}

const MessageTipContext = createContext<MessageTipContextValue | null>(null)

export function MessageTipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<ShowMessageTipOptions | null>(null)

  const showTip = useCallback((options: ShowMessageTipOptions) => {
    setTip(options)
  }, [])

  const handleClose = useCallback(() => {
    setTip((current) => {
      current?.onDone?.()
      return null
    })
  }, [])

  const value = useMemo(() => ({ showTip }), [showTip])

  return (
    <MessageTipContext.Provider value={value}>
      {children}
      <MessageTip
        opened={tip !== null}
        message={tip?.message ?? ''}
        type={tip?.type}
        duration={tip?.duration}
        onClose={handleClose}
      />
    </MessageTipContext.Provider>
  )
}

export function useMessageTip() {
  const ctx = useContext(MessageTipContext)
  if (!ctx) {
    throw new Error('useMessageTip must be used within MessageTipProvider')
  }
  return ctx
}
