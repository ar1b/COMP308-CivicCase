import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'analytics_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './Analytics':      './src/pages/Analytics',
        './StaffDashboard': './src/pages/StaffDashboard',
        './Chatbot':        './src/components/Chatbot',
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
  preview: { port: 5176, cors: true },
  build:   { target: 'esnext', cssCodeSplit: false },
})
