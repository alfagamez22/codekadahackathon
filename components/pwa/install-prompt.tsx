'use client'

import { useState, useEffect } from 'react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { Button } from '@/components/ui/button'

export function InstallPrompt() {
  const { canInstall, isInstalled, install } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const ua = navigator.userAgent
      setIsIos(/iPad|iPhone|iPod/.test(ua) && !/CriOS/.test(ua))
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (isInstalled || dismissed) return null

  // Shared card wrapper — fixed, bottom-right on desktop; above mobile nav on mobile
  const cardClass =
    'fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-72 rounded-xl border border-border bg-card shadow-xl'

  if (isIos && !showIosInstructions) {
    return (
      <div className={cardClass}>
        <div className="p-4 pr-10">
          <p className="text-sm font-semibold text-foreground mb-1">Install GASTOS</p>
          <button
            onClick={() => setShowIosInstructions(true)}
            className="text-xs text-[#16a34a] hover:underline underline-offset-4"
          >
            Tap to see instructions
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>
    )
  }

  if (isIos && showIosInstructions) {
    return (
      <div className={cardClass}>
        <div className="p-4 pr-10">
          <p className="text-sm font-semibold text-foreground mb-3">Install on iPhone / iPad</p>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Tap the Share button in Safari</li>
            <li>Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></li>
            <li>Tap <strong className="text-foreground">Add</strong></li>
          </ol>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>
    )
  }

  if (!canInstall) return null

  return (
    <div className={cardClass}>
      <div className="p-4 pr-10">
        <p className="text-sm font-semibold text-foreground mb-1">Install GASTOS</p>
        <p className="text-xs text-muted-foreground mb-3">
          Add to your home screen for quick access and offline use.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={install} className="flex-1">Install</Button>
          <Button size="sm" variant="secondary" onClick={() => setDismissed(true)}>Not now</Button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <i className="ri-close-line text-sm" />
      </button>
    </div>
  )
}
