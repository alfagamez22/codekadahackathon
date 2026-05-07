import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RootProviders } from '@/components/providers/root-providers'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
import { getAppBaseUrlObject } from '@/lib/app-url'
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  metadataBase: getAppBaseUrlObject(),
  title: {
    default: 'GASTOS',
    template: '%s — GASTOS',
  },
  description: 'Track, compare, and report fuel prices across stations in the Philippines.',
  applicationName: 'GASTOS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GASTOS',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    title: 'GASTOS',
    description: 'Community-powered fuel price tracking for the Philippines.',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", geist.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" suppressHydrationWarning>
        <OfflineIndicator />
        <RootProviders>{children}</RootProviders>
        <InstallPrompt />
      </body>
    </html>
  )
}
