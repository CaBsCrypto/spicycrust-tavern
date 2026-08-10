import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 5173, // SpicyCrust hub siempre en 5173
  },
  // Las variables VITE_URL_* en .env se leen automáticamente en dev
  // En producción (npm run build) Vite usa .env.production
})
