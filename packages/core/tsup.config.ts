import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // tsup 8 adds baseUrl to its declaration build, which TypeScript 6 rejects; drop once on tsup 9.
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  skipNodeModulesBundle: true,
});
