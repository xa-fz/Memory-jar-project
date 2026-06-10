import clsx from 'clsx'
import type { Locale } from '@/i18n'
import { useLocale } from '@/i18n'
import classes from './LanguageSwitcher.module.css'

const options: { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '中' },
  { value: 'en-US', label: 'EN' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className={classes.root} role="group" aria-label="Language">
      <div
        className={clsx(classes.thumb, locale === 'en-US' && classes.thumbEn)}
      />
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={clsx(
            classes.option,
            locale === value && classes.optionActive,
          )}
          onClick={() => setLocale(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
