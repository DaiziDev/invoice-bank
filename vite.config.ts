import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * base : chemin du site sur GitHub Pages.
 * Pour https://<compte>.github.io/invoice-bank/ → '/invoice-bank/'
 * Pour un domaine personnalisé → '/'
 * Surchargeable au build : BASE_PATH=/autre/ npm run build
 */
const base = process.env.BASE_PATH ?? '/invoice-bank/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Invoice Bank — démonstration',
        short_name: 'Invoice Bank',
        description: "Démonstration d'application bancaire mobile pour la zone CEMAC. Données fictives.",
        theme_color: '#0E2A26',
        background_color: '#0E2A26',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        lang: 'fr',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: base + 'index.html',
      },
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
