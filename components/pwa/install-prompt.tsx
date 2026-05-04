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
    const ua = navigator.userAgent
    setIsIos(/iPad|iPhone|iPod/.test(ua) && !/CriOS/.test(ua))
  }, [])

  if (isInstalled || dismissed) return null

  if (isIos && !showIosInstructions) {
    return (
      <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background border border-border rounded-xl p-4 shadow-lg z-50">
        <div className="font-medium text-sm mb-1">Install Gas Price Tracker</div>
        <button
          onClick={() => setShowIosInstructions(true)}
          className="text-xs text-fuel-green underline"
        >
          Tap to see instructions
        </button>
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted text-xs">✕</button>
      </div>
    )
  }

  if (isIos && showIosInstructions) {
    return (
      <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background border border-border rounded-xl p-4 shadow-lg z-50">
        <div className="font-medium text-sm mb-2">Install on iPhone / iPad</div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Tap the Share button in Safari</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add"</li>
        </ol>
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted text-xs">✕</button>
      </div>
    )
  }

  if (!canInstall) return null

  return (
    <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background border border-border rounded-xl p-4 shadow-lg z-50">
      <div className="font-medium text-sm mb-1">Install Gas Price Tracker</div>
      <p className="text-xs text-muted mb-3">Add to your home screen for quick access and offline use.</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={install} className="flex-1">Install</Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>Not now</Button>
      </div>
    </div>
  )
}
