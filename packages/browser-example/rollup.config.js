import terser from '@rollup/plugin-terser';

// Script-tag build: bundles tsc's ES module output into a minified file that exposes window.BrowserExample.
export default {
  input: 'dist/index.js',
  output: {
    file: 'dist/index.global.js',
    format: 'iife',
    name: 'BrowserExample',
    sourcemap: true,
    plugins: [terser()],
  },
};
