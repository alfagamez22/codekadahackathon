import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 Not Found' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <div className="text-6xl mb-4">⛽</div>
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted mb-6">This page doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-fuel-green text-white rounded-lg text-sm font-medium hover:bg-fuel-green/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
