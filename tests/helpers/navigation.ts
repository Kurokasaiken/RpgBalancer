import { type Page } from '@playwright/test';

declare global {
  interface Window {
    __appNavControls?: {
      getActiveTab?: () => string;
      setActiveTab?: (tabId: string) => void;
    };
  }
}

/**
 * Returns the navigation button locator for a given tab id.
 */
export const getNavButton = (page: Page, tabId: string) => page.getByTestId(`nav-btn-${tabId}`);

/**
 * Opens a navigation tab within the web app, using AppNavControls when available
 * and falling back to clicking on navigation buttons.
 *
 * @param page Playwright page instance
 * @param tabId target navigation tab identifier
 */
export async function openNavTab(page: Page, tabId: string): Promise<void> {
  const switchedViaControls = await page
    .evaluate((targetTabId) => {
      const controls = window.__appNavControls;
      if (!controls || typeof controls.getActiveTab !== 'function') {
        return false;
      }

      const currentTab = controls.getActiveTab();
      if (currentTab === targetTabId) {
        return true;
      }

      if (typeof controls.setActiveTab === 'function') {
        controls.setActiveTab(targetTabId);
        return true;
      }

      return false;
    }, tabId)
    .catch(() => false);

  if (switchedViaControls) {
    await page.waitForTimeout(50);
    return;
  }

  await page.waitForSelector('[data-testid^="nav-btn-"]', { timeout: 20_000 });

  const primaryButton = getNavButton(page, tabId);
  if ((await primaryButton.count()) > 0) {
    const visibleButton = primaryButton.filter({ hasNot: page.locator('[hidden]') }).first();
    await visibleButton.click();
    return;
  }

  const moreButton = getNavButton(page, 'more');
  if ((await moreButton.count()) > 0) {
    await moreButton.first().click();
    const drawerButton = getNavButton(page, tabId).last();
    await drawerButton.waitFor({ state: 'visible', timeout: 5000 });
    await drawerButton.click();
    return;
  }

  throw new Error(`Navigation button for tab "${tabId}" not found in current layout.`);
}
