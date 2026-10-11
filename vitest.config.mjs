import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.{test,spec}.ts'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            all: true,
            include: ['src/**/*.ts'],
            exclude: [
                // Test suites verify behavior; they are not shipped application logic.
                'src/**/*.{test,spec}.ts',
                // Ambient declarations provide compile-time types and emit no runtime code.
                'src/**/*.d.ts',
            ],
        },
    },
});
