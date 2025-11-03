import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteImagemin from 'vite-plugin-imagemin'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Image optimization for production builds
    viteImagemin({
      verbose: true,
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      mozjpeg: {
        quality: 80,
      },
      optipng: {
        optimizationLevel: 7,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
      webp: {
        quality: 80,
      },
    }),
    // Gzip compression for production builds
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10KB
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (better compression than gzip)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/tests': path.resolve(__dirname, './src/tests')
    }
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    // Source maps for production debugging
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunking strategy for optimal loading
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            // Data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // UI utilities
            if (id.includes('dompurify') || id.includes('class-variance-authority') || id.includes('clsx')) {
              return 'ui-vendor';
            }
            // Other node_modules
            return 'vendor';
          }

          // Feature-based code splitting
          if (id.includes('/src/features/')) {
            if (id.includes('/shop-dashboard/')) return 'shop-features';
            if (id.includes('/admin-dashboard/')) return 'admin-features';
            if (id.includes('/user-dashboard/')) return 'user-features';
            if (id.includes('/auth/')) return 'auth-features';
          }

          // Shared components
          if (id.includes('/src/shared/components/')) {
            return 'shared-components';
          }
        },
        // Filenames with content hash for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.leema.kz',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand'
    ],
    exclude: ['@vite/client', '@vite/env']
  }
})
