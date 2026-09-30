import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sin "base": Netlify sirve el sitio desde la raíz del dominio
// (https://tu-sitio.netlify.app/), a diferencia de GitHub Pages,
// que lo serviría en /<nombre-del-repo>/. Si en algún momento se
// vuelve a deployar en GitHub Pages, acá es donde hay que agregar
// base: '/<nombre-del-repo>/' otra vez (y actualizar start_url y
// scope del manifest más abajo).

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Crono Natación',
        short_name: 'Crono',
        description: 'Cronómetro por andarivel para postas americanas de natación',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
    }),
  ],
})