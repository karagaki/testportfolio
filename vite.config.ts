import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyDirOnBuild: false,
    lib: {
      entry: resolve(__dirname, 'ui/palette-app/main.tsx'),
      name: 'PaletteUI',
      fileName: () => 'palette-ui.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'palette-ui.[ext]',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
