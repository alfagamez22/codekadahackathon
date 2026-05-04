const DEFAULT_APP_URL = 'https://gaspricetracker.ph'

function normalizeUrl(value: string | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const absolute = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(absolute).origin
  } catch {
    return null
  }
}

export function getAppBaseUrl(): string {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeUrl(process.env.VERCEL_BRANCH_URL) ??
    normalizeUrl(process.env.VERCEL_URL) ??
    normalizeUrl(process.env.URL) ??
    normalizeUrl(process.env.DEPLOY_PRIME_URL) ??
    normalizeUrl(process.env.DEPLOY_URL) ??
    DEFAULT_APP_URL
  )
}

export function getAppBaseUrlObject(): URL {
  return new URL(getAppBaseUrl())
}