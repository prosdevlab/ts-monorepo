import { defineConfig } from 'tsup';

export default defineConfig({
  // index: the importable API. cli: the executable; its `#!/usr/bin/env node` line is kept and the file made executable.
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  dts: { entry: 'src/index.ts' },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  skipNodeModulesBundle: true,
});
