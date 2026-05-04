import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gaspricetracker.ph'
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/auth/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/auth/register`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/dashboard`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/stations/nearby`, changeFrequency: 'always', priority: 0.9 },
    { url: `${base}/validate`, changeFrequency: 'always', priority: 0.7 },
  ]
}
