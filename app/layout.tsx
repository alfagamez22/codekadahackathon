import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { RootProviders } from '@/components/providers/root-providers'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
import { getAppBaseUrlObject } from '@/lib/app-url'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: getAppBaseUrlObject(),
  title: {
    default: 'GasTOS',
    template: '%s — GasTOS',
  },
  description: 'Track, compare, and report fuel prices across stations in the Philippines.',
  applicationName: 'GasTOS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GasTOS',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    title: 'GasTOS',
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <OfflineIndicator />
        <RootProviders>{children}</RootProviders>
        <InstallPrompt />
      </body>
    </html>
  )
}
