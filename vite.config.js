import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    expect: { requireAssertions: true },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/lib/server/**', 'src/tests/disabled-components/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.js',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**'
      ]
    }
  }
});
