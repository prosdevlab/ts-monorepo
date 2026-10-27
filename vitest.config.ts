// example:lib
import { resolve } from 'path';
// /example:lib
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.{test,spec}.ts',
      // example:template-only
      'scripts/**/*.test.ts',
      // /example:template-only
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**'],
    },
  },
  // example:lib
  resolve: {
    alias: {
      '@monorepo/shared': resolve(__dirname, 'packages/shared/src'),
      '@monorepo/lib': resolve(__dirname, 'packages/lib/src'),
    },
  },
  // /example:lib
});
