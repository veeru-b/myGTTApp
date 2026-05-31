import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // This includes the service worker assets in your build automatically
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'Grow Together Team',
        short_name: 'GTT',
        description: 'GTT Mutual Financial Security Portal',
        theme_color: '#2563EB',
        background_color: '#F5F7FA',
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png', // Leading slash is safer for routing
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Required for Android home screens to prevent ugly borders
          }
        ]
      }
    })
  ]
})