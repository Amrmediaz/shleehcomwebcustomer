import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed at shleeh.com/app/ — the domain root stays the existing .NET
// admin panel/API, this app lives in a subpath alongside it. `base` makes
// every built asset reference (JS/CSS chunks, and the %BASE_URL% tokens in
// index.html) resolve under /app/ instead of the site root. If this ever
// moves back to the domain root, this is the one line to change.
const BASE_PATH = '/app/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ShleehCom — Buildings & Chalets Booking',
        short_name: 'ShleehCom',
        description: 'Book flats, apartments and chalets across Oman with ShleehCom.',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#185FA5',
        lang: 'en',
        dir: 'ltr',
        icons: [
          { src: `${BASE_PATH}pwa-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${BASE_PATH}pwa-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${BASE_PATH}pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-shell caching only — booking/price/auth calls always go to
        // the network so a stale cache never serves out-of-date prices or
        // availability.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'shleeh-app-shell' },
          },
        ],
      },
    }),
  ],
})
