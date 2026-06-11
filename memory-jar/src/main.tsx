import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { MessageTipProvider } from '@/components/MessageTip'
import { I18nProvider } from '@/i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" theme={{ primaryColor: 'blue' }}>
      <I18nProvider>
        <MessageTipProvider>
          <App />
        </MessageTipProvider>
      </I18nProvider>
    </MantineProvider>
  </StrictMode>,
)
