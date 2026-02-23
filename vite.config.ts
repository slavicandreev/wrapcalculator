import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'embed') {
    // Embed build: single IIFE bundle for <script> tag embedding
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: 'src/embed.tsx',
          name: 'WrapCalculator',
          fileName: 'embed',
          formats: ['iife'],
        },
        rollupOptions: {
          // Bundle everything — embed must be self-contained
          external: [],
          output: {
            // Place output directly in dist/
            dir: 'dist',
            entryFileNames: 'embed.js',
          },
        },
        outDir: 'dist',
        emptyOutDir: false, // Don't wipe the main app build
        minify: true,
      },
    };
  }

  // Default: standard SPA build
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    base: './',
  };
});
