import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prod: Removed dev proxy (Vercel static hosting)\n  // server: {\n  //   proxy: {\n  //     '/api': {\n  //       target: 'http://localhost:3000',\n  //       changeOrigin: true,\n  //       rewrite: (path) => path.replace(/^\/api/, '/api')\n  //     }\n  //   }\n  // }
})
