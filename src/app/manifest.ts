import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeautyOS',
    short_name: 'BeautyOS',
    description: 'Ваш спутник красоты',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF9F7',
    theme_color: '#D4617A',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192-v2.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512-v2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
