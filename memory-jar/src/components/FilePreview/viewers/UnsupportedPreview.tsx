import { Stack, Text } from '@mantine/core'
import { useIntl } from 'react-intl'
import classes from '../FilePreview.module.css'
import { TextPreview } from './TextPreview'

export interface UnsupportedPreviewProps {
  content?: string
}

export function UnsupportedPreview({ content }: UnsupportedPreviewProps) {
  const intl = useIntl()

  return (
    <Stack gap="sm" className={classes.unsupported}>
      <Text size="sm" c="dimmed">
        {intl.formatMessage({ id: 'filePreview.unsupported' })}
      </Text>
      {content?.trim() ? <TextPreview content={content} /> : null}
    </Stack>
  )
}
