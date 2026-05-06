'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }

    const timeoutId = window.setTimeout(() => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

      if (isStandalone) {
        setIsInstalled(true)
      }
    }, 0)

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setPromptEvent(null)
    }
  }

  return { canInstall: !!promptEvent, isInstalled, install }
}
