import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, // Baris ini yang akan memperbaiki error tersebut
    'global': 'globalThis', // Tambahan aman untuk mencegah error Web3 lainnya
  }
})

