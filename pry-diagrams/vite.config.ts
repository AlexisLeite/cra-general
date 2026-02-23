import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  worker: {
    format: 'es',
    rollupOptions: {
      // Workers must be self-contained in the library build; do not inherit the
      // main bundle externals (e.g. mobx), or the blob worker fails at runtime.
      external: [],
    },
  },
  esbuild: {
    // JSON diagram import/export relies on runtime class names matching serialized
    // `class` values such as "TaskNode". Preserve names in the built package.
    keepNames: true,
  },
  plugins: [
    react(),
    dts({
      include: ['src'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PryDiagrams',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'mobx',
        'mobx-react-lite',
        'react-icons',
        'html2canvas',
        'svg-path-bbox',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
