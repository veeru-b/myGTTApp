import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Grow Together Team',
        short_name: 'GTT',
        description: 'GTT Mutual Financial Security Portal',
        theme_color: '#2563EB', // Matches your light theme accent
        background_color: '#F5F7FA',
        display: 'standalone', // Crucial: Removes the mobile browser URL bar
        orientation: 'portrait',
        icons: [
          {
            src: 'my-logo.png', // The image you added to your public folder earlier
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'my-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})