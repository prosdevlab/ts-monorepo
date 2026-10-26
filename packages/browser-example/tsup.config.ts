import { defineConfig } from 'tsup';

export default defineConfig([
  // ES module + types, for bundlers and `import`.
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2020',
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outDir: 'dist',
  },
  // Minified script-tag build: exposes window.BrowserExample.
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'BrowserExample',
    target: 'es2020',
    minify: true,
    sourcemap: true,
    outDir: 'dist',
  },
]);
