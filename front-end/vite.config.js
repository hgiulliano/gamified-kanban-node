import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Usa polling em vez de inotify. Evita o Vite "congelar" o cache e
    // continuar servindo uma versão antiga do arquivo (tela preta por
    // ReferenceError) quando o limite de watchers do sistema é atingido.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
