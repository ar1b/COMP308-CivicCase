import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/graphql/auth':      { target: 'http://localhost:4001', rewrite: path => '/graphql' },
      '/graphql/issues':    { target: 'http://localhost:4002', rewrite: path => '/graphql' },
      '/graphql/analytics': { target: 'http://localhost:4003', rewrite: path => '/graphql' },
      '/graphql':           { target: 'http://localhost:4001' },
    }
  }
})
