import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
          // ENTRY 1: Explicitly tell Chrome to use this for 192x192
          {
            src: '/gttlogo.png', 
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          // ENTRY 2: Crucial addition to unlock the real "Install" button
          {
            src: '/gttlogo.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})