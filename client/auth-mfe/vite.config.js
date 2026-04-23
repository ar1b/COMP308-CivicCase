import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'auth_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './Login':    './src/pages/Login',
        './Register': './src/pages/Register',
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom':        { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true },
        '@apollo/client':   { singleton: true },
        graphql:            { singleton: true },
      },
    }),
  ],
  preview: { port: 5174, cors: true },
  build:   { target: 'esnext', cssCodeSplit: false },
})
