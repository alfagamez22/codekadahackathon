import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gas Price Tracker PH',
    short_name: 'GasTracker',
    description: 'Track and compare fuel prices across stations in the Philippines',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Nearby Stations',
        short_name: 'Nearby',
        description: 'Find gas stations near you',
        url: '/stations/nearby',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Validate Prices',
        short_name: 'Validate',
        description: 'Help confirm community price reports',
        url: '/validate',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    categories: ['utilities', 'navigation'],
  }
}
