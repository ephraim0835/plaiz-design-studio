import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['vite.svg', 'logo.png', 'plaiz-logo.png'],
      manifest: {
        name: 'Plaiz Design Studio',
        short_name: 'Plaiz',
        description: 'Premium Design Services at Your Fingertips',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'pwa-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false // Important for 'prompt' strategy
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    minify: false,
    sourcemap: false
  }
})

