import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server prints http://localhost:5173 — the address every setup ticket names.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
