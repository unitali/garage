import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// versão do package.json (atualizada pelo PR de release) — aparece no Perfil
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // versão nova fica esperando até o usuário tocar em "Atualizar" (src/pwa.ts)
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Unitali Garage',
        short_name: 'Unitali Garage',
        description: 'Controle de manutenções, abastecimentos e despesas dos seus veículos',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#073863',
        background_color: '#ffffff', // tela de abertura do app instalado: logo sobre branco
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // inclui o logo (src/assets) para aparecer também offline
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // /__/auth/* é o handler do Firebase Auth (proxy no vercel.json) — o service worker não pode interceptar
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
});
