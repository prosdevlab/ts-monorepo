import { defineConfig } from 'tsup';

export default defineConfig([
  // ES module + types, for bundlers and `import`.
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2020',
    // tsup 8 adds baseUrl to its declaration build, which TypeScript 6 rejects; drop once on tsup 9.
    dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
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
