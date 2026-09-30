import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sirve el sitio en https://<usuario>.github.io/<repo>/
// así que "base" tiene que ser "/<nombre-del-repo>/".
// Si el repo se llama, por ejemplo, "natacion-crono", dejalo así:
const base = '/natacion-crono/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate': cuando hay una versión nueva del build, el
      // service worker se actualiza solo en segundo plano (sin
      // preguntar), y la toma la próxima vez que se abre la app.
      registerType: 'autoUpdate',
      // Deja correr el service worker también en `npm run dev`,
      // para poder probar el modo offline sin tener que buildear.
      devOptions: { enabled: true },

      // Mismo manifest que la versión vanilla (nombre, colores,
      // ícono), para que se instale igual en el celular.
      manifest: {
        name: 'Crono Natación',
        short_name: 'Crono',
        description: 'Cronómetro por andarivel para postas americanas de natación',
        lang: 'es',
        start_url: base,
        scope: base,
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

      // Cachea todos los assets del build (JS, CSS, HTML, el ícono)
      // para que la app abra offline una vez instalada, igual que
      // la versión vanilla con su service worker a mano.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        // Si en algún momento agregamos llamadas a una API (por
        // ejemplo, el futuro backend en FastAPI), acá se suman
        // reglas de runtimeCaching para esas rutas — hoy no hace
        // falta porque todo el estado vive en localStorage.
      },
    }),
  ],
})