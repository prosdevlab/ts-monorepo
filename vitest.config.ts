// example:lib
import { fileURLToPath } from 'node:url';
// /example:lib
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    restoreMocks: true,
    include: ['packages/**/*.{test,spec}.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**'],
    },
  },
  // example:lib
  resolve: {
    alias: {
      '@monorepo/shared': fileURLToPath(new URL('./packages/shared/src', import.meta.url)),
      '@monorepo/lib': fileURLToPath(new URL('./packages/lib/src', import.meta.url)),
    },
  },
  // /example:lib
});
