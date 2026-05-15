import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind first; disable Lightning CSS optimize to avoid stripping Tailwind v4 at-rules in some setups
  plugins: [
    tailwindcss({ optimize: false }),
    react(),
  ],
})
