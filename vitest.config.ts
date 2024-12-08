import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['json'], // Add required reporters
      all: true,
      clean: true,
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        '**/__tests__/**',
        // Add other exclusions if necessary
      ],
    },
  },
});
