import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
    },
    projects: [
        // Desktop baseline
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },
        // Mobile devices (for responsive checks, including SpellCreatorNew mobile)
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 14 Pro'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 7'] },
        },
    ],
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
