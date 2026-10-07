import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// En desarrollo, las peticiones a /api y /health se reenvían al servidor de la biblioteca (backend, puerto 4001):
// así el sitio usa direcciones relativas igual que cuando se publica, y funciona también abierto desde otro equipo
// de la red (un kiosco, un celular). Si el backend corre en otro puerto, cambia BACKEND_URL.
const backend = process.env.BACKEND_URL || 'http://localhost:4001'
const proxy = { '/api': backend, '/health': backend }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
    proxy,
  },
  preview: {
    port: 5174,
    host: true,
    proxy,
  },
})
