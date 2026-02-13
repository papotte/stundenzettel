'use client'

import { useEffect, useState } from 'react'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Shows an install prompt for the PWA when not already running in standalone mode.
 * Styled as a compact toast-like bar. On iOS, shows instructions. On desktop/Android,
 * captures beforeinstallprompt and triggers the native install dialog on button click.
 */
export function InstallPrompt() {
  const t = useTranslations()
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream,
    )
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!installEvent) return
    setIsInstalling(true)
    try {
      await installEvent.prompt()
      await installEvent.userChoice
    } finally {
      setIsInstalling(false)
      setInstallEvent(null)
    }
  }

  if (isStandalone || dismissed) {
    return null
  }

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-4 py-3 shadow-lg',
        'text-foreground',
      )}
    >
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{t('settings.installPromptTitle')}</p>
        {isIOS ? (
          <p className="mt-0.5 text-muted-foreground">
            {t('settings.installPromptIOSInstructions')}
          </p>
        ) : (
          <p className="mt-0.5 text-muted-foreground">
            {t('settings.installPromptDescription')}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {installEvent && !isIOS ? (
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            size="sm"
          >
            {isInstalling
              ? t('common.loading')
              : t('settings.installPromptButton')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled aria-disabled>
            {t('settings.installPromptButton')}
          </Button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
