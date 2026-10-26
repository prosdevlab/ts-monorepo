import { defineConfig } from 'tsup';

export default defineConfig({
  // index: the importable API. cli: the executable; its `#!/usr/bin/env node` line is kept and the file made executable.
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  // tsup 8 adds baseUrl to its declaration build, which TypeScript 6 rejects; drop once on tsup 9.
  dts: { entry: 'src/index.ts', compilerOptions: { ignoreDeprecations: '6.0' } },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  skipNodeModulesBundle: true,
});
