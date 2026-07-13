import { test, expect } from '@playwright/test';

test.describe('I18N locale visual regression', { tag: '@visual' }, () => {
  const locales = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German expansion' },
    { code: 'ar', label: 'Arabic RTL' },
    { code: 'pseudo', label: 'Pseudo-locale' },
  ];

  const paths = ['/', '/idle-village', '/balancer', '/punch-club'];

  for (const locale of locales) {
    for (const path of paths) {
      const testName = `${locale.label} on ${path || '/'} @i18n @locale:${locale.code}`;
      test(testName, async ({ page }) => {
        await page.goto(path);

        // Switch language in-app via the exposed i18n singleton
        if (locale.code !== 'en') {
          await page.evaluate(async (code) => {
            const i18n = (window as unknown as { __i18n?: { changeLanguage: (lng: string) => Promise<unknown> } }).__i18n;
            if (i18n) {
              await i18n.changeLanguage(code);
            } else {
              // Fallback: set html lang/dir and rely on CSS variable
              document.documentElement.lang = code;
              document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
            }
          }, locale.code);
          // Wait for resources to load and UI to settle
          await page.waitForTimeout(500);
        }

        const safePath = path.replace(/^\//, '') || 'home';
        await expect(page).toHaveScreenshot(
          `i18n-${locale.code}-${safePath}.png`,
          { fullPage: true },
        );
      });
    }
  }
});
