import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Szlaki',
        short_name: 'Szlaki',
        description: 'Planowanie szlaków w kraju i za granicą',
        theme_color: '#1b4332',
        background_color: '#0b1a12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `${base}/`,
        scope: `${base}/`,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        navigateFallback: `${base}/404.html`,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
