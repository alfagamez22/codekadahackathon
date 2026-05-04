import type { MetadataRoute } from 'next'
import { getAppBaseUrl } from '@/lib/app-url'

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/moderator', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
