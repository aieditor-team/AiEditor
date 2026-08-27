import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/index.ts', 'src/**/index.ts'],
            thresholds: {
                statements: 25,
                branches: 19,
                functions: 27,
                lines: 26,
            },
        },
    },
})
