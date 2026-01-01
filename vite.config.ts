import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for offline deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // manualChunks: (id) => {
        //   if (id.includes('node_modules')) {
        //     if (id.includes('@mui/material') || id.includes('@mui/system')) return 'mui-core';
        //     if (id.includes('@mui/icons-material')) return 'mui-icons';
        //     if (id.includes('@mui/x-data-grid')) return 'mui-grid';
        //     if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
        //     if (id.includes('react-router-dom')) return 'router';
        //     if (id.includes('@mui/x-date-pickers') || id.includes('date-fns')) return 'date-utils';
        //     return 'vendor';
        //   }
        // },
      },
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },


})
