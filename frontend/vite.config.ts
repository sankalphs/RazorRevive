import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM-safe config dir (Vite's native config loader deprecates the CJS
// `__dirname` global) — same source-of-truth .env as the backend reads.
const configDir = fileURLToPath(new URL('.', import.meta.url))

// Read BACKEND_PORT from the repo root .env (same source of truth as the
// backend's python-dotenv load) so the dev proxy never points at a dead port.
function backendPort(): string {
  try {
    const envFile = readFileSync(pathResolve(configDir, '../.env'), 'utf-8')
    const match = envFile.match(/^BACKEND_PORT\s*=\s*(\d+)\s*$/m)
    if (match) return match[1]
  } catch {
    // no .env file — fall through to the default
  }
  return process.env.BACKEND_PORT || '8000'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort()}`,
        changeOrigin: true,
      }
    }
  }
})
