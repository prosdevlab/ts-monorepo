import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**'],
    },
  },
  resolve: {
    alias: {
      '@monorepo/shared': resolve(__dirname, 'packages/shared/src'),
      '@monorepo/lib': resolve(__dirname, 'packages/lib/src'),
    },
  },
});
