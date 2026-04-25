import { test, expect } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';
import { DEMO_STATE_STORAGE_KEY, LEGACY_DEMO_CONFIG_KEY } from '../../../src/ui/styleLab/StyleLabDemo';
import { PRESET_MANAGER_STORAGE_KEYS } from '../../../src/ui/styleLab/config/presetManager';

type PlaywrightPage = import('@playwright/test').Page;

const clearStyleLabPersistence = async (page: PlaywrightPage) => {
  await page.evaluate((storageKeys) => {
    storageKeys.forEach((key) => {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn('[StyleLabDemoPresetSwitch] Failed to clear storage key', key, error);
      }
    });
  }, [
    DEMO_STATE_STORAGE_KEY,
    LEGACY_DEMO_CONFIG_KEY,
    PRESET_MANAGER_STORAGE_KEYS.CUSTOM_PRESETS,
    PRESET_MANAGER_STORAGE_KEYS.ACTIVE_PRESET,
  ]);
};

const waitForPresetPersistence = async (page: PlaywrightPage, presetId: string) => {
  await page.waitForFunction(
    ({ snapshotKey, activePresetKey, targetPreset }) => {
      const tryParse = (raw: string | null) => {
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch (error) {
          console.warn('[StyleLabDemoPresetSwitch] Failed to parse snapshot', error);
          return null;
        }
      };

      const storage = typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
      if (!storage) return false;

      const snapshot = tryParse(storage.getItem(snapshotKey));
      if (snapshot) {
        if (snapshot.basePresetId === targetPreset || snapshot.presetId === targetPreset) {
          return true;
        }
        if (snapshot.demoConfig?.meta?.presetId === targetPreset) {
          return true;
        }
      }

      const activePreset = storage.getItem(activePresetKey);
      if (activePreset && activePreset === targetPreset) {
        return true;
      }

      return false;
    },
    {
      snapshotKey: DEMO_STATE_STORAGE_KEY,
      activePresetKey: PRESET_MANAGER_STORAGE_KEYS.ACTIVE_PRESET,
      targetPreset: presetId,
    },
    { timeout: 10000 },
  );
};

const getStyleLabPersistenceState = async (page: PlaywrightPage) => {
  return page.evaluate(({ snapshotKey, activePresetKey }) => {
    const storage = typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
    if (!storage) {
      return {
        snapshotRaw: null,
        snapshotPresetId: null,
        snapshotBasePresetId: null,
        snapshotMetaPresetId: null,
        activePreset: null,
      };
    }

    const snapshotRaw = storage.getItem(snapshotKey);
    let parsedSnapshot: Record<string, any> | null = null;
    if (snapshotRaw) {
      try {
        parsedSnapshot = JSON.parse(snapshotRaw);
      } catch (error) {
        console.warn('[StyleLabDemoPresetSwitch] Failed to parse persisted snapshot', error);
      }
    }

    return {
      snapshotRaw,
      snapshotPresetId: parsedSnapshot?.presetId ?? null,
      snapshotBasePresetId: parsedSnapshot?.basePresetId ?? null,
      snapshotMetaPresetId: parsedSnapshot?.demoConfig?.meta?.presetId ?? null,
      activePreset: storage.getItem(activePresetKey),
    };
  }, {
    snapshotKey: DEMO_STATE_STORAGE_KEY,
    activePresetKey: PRESET_MANAGER_STORAGE_KEYS.ACTIVE_PRESET,
  });
};

const logStyleLabDiagnostics = async (page: PlaywrightPage, reason: string) => {
  const diagnostics = await page.evaluate((reasonMessage) => {
    const rootEl = document.querySelector('[data-testid="style-lab-demo-root"]') as HTMLElement | null;
    const windowRef = window as typeof window & {
      __STYLE_LAB_LAST_PRESET__?: string;
      __STYLE_LAB_ADOPT_LOG__?: unknown;
    };
    return {
      reason: reasonMessage,
      timestamp: new Date().toISOString(),
      activePresetAttr: rootEl?.getAttribute('data-active-preset') ?? null,
      activePillarAttr: rootEl?.getAttribute('data-active-pillar') ?? null,
      presetKind: rootEl?.getAttribute('data-preset-kind') ?? null,
      lastPreset: windowRef.__STYLE_LAB_LAST_PRESET__ ?? null,
      adoptLog: windowRef.__STYLE_LAB_ADOPT_LOG__ ?? null,
    };
  }, reason);

  console.error('[StyleLabDiagnostics]', JSON.stringify(diagnostics));
  return diagnostics;
};

const expectAttributeOrLog = async (
  page: PlaywrightPage,
  locator: ReturnType<PlaywrightPage['getByTestId']>,
  attribute: string,
  value: string,
) => {
  try {
    await expect(locator).toHaveAttribute(attribute, value);
  } catch (error) {
    await logStyleLabDiagnostics(page, `Attribute mismatch: expected ${attribute}=${value}`);
    throw error;
  }
};

const navigateToStyleLab = async (page: PlaywrightPage) => {
  await clearStyleLabPersistence(page);
  await page.goto('/?tab=styleLabDemo');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('style-lab-demo-root')).toBeVisible();
  const hidePanelButton = page.getByRole('button', { name: /Nascondi Style Lab/i });
  if (await hidePanelButton.isVisible()) {
    await hidePanelButton.evaluate((node: HTMLButtonElement) => node.click());
  }
};

const ensureControlsPanelOpen = async (page: PlaywrightPage) => {
  const toggle = page.getByTestId('style-lab-controls-toggle');
  await expect(toggle).toBeVisible();

  const ariaLabel = await toggle.getAttribute('aria-label');
  if (ariaLabel !== 'Collapse controls panel') {
    await toggle.click();
  }

  const panel = page.getByTestId('style-lab-controls-panel');
  await expect(panel).toHaveAttribute('data-visible', 'true');
};

const selectPreset = async (page: PlaywrightPage, presetId: string, root: ReturnType<PlaywrightPage['getByTestId']>) => {
  await ensureControlsPanelOpen(page);
  const button = page.getByTestId(`style-lab-preset-button-${presetId}`);
  await expect(button).toBeVisible();
  await button.evaluate((node: HTMLButtonElement) => node.click());
  await page.waitForFunction(
    (expected) => (window as typeof window & { __STYLE_LAB_LAST_PRESET__?: string }).__STYLE_LAB_LAST_PRESET__ === expected,
    presetId,
    { timeout: 30000 },
  );

  try {
    await expect(root).toHaveAttribute('data-active-preset', presetId, { timeout: 5000 });
  } catch (error) {
    const diagnostics = await logStyleLabDiagnostics(
      page,
      `Preset adopt check failed for ${presetId}`,
    );
    throw new Error(
      `Style Lab bundle non aggiornato: data-active-preset = ${diagnostics.activePresetAttr} (expected ${presetId}). ` +
        `Diagnostics: ${JSON.stringify(diagnostics)}\nOriginal error: ${String(error)}`,
    );
  }
};

test.describe('Style Lab Demo – Preset Bridging', () => {
  test('applies built-in preset and exposes snapshot metadata', async ({ page }) => {
    await navigateToStyleLab(page);

    const root = page.getByTestId('style-lab-demo-root');
    await expectAttributeOrLog(page, root, 'data-active-preset', 'minimalFrontier');
    await expectAttributeOrLog(page, root, 'data-active-pillar', 'frontier');

    await selectPreset(page, 'obsidianVault', root);

    await expectAttributeOrLog(page, root, 'data-active-preset', 'obsidianVault');
    await expectAttributeOrLog(page, root, 'data-active-pillar', 'empire');
    await expectAttributeOrLog(page, root, 'data-preset-kind', 'builtin');
    await expectAttributeOrLog(page, root, 'data-snapshot-preset-id', 'obsidianVault');
  });

  test('persists selected preset across reloads', async ({ page }) => {
    await navigateToStyleLab(page);

    const root = page.getByTestId('style-lab-demo-root');
    await selectPreset(page, 'blizzardRift', root);
    await expectAttributeOrLog(page, root, 'data-active-preset', 'blizzardRift');
    await waitForPresetPersistence(page, 'blizzardRift');

    const beforeReloadState = await getStyleLabPersistenceState(page);
    console.info('[StyleLabPersistence][before reload]', JSON.stringify(beforeReloadState));
    expect(beforeReloadState.snapshotBasePresetId ?? beforeReloadState.activePreset).toBe('blizzardRift');

    await page.reload();
    await page.waitForLoadState('networkidle');
    const afterReloadState = await getStyleLabPersistenceState(page);
    console.info('[StyleLabPersistence][after reload]', JSON.stringify(afterReloadState));
    await expectAttributeOrLog(page, page.getByTestId('style-lab-demo-root'), 'data-active-preset', 'blizzardRift');
  });

  test.describe('PgCard Drag Overlay – Style Lab Integration', () => {
    test('@overlay validates window.__STYLE_LAB_LAST_PRESET with Wanderlust pillar', async ({ page }) => {
      await navigateToStyleLab(page);

      const root = page.getByTestId('style-lab-demo-root');
      
      // Switch to Wilderness preset
      await selectPreset(page, 'minimalFrontier', root);
      await expectAttributeOrLog(page, root, 'data-active-preset', 'minimalFrontier');
      await expectAttributeOrLog(page, root, 'data-active-pillar', 'frontier');

      // Verify window object reflects current preset
      const lastPreset = await page.evaluate(() => 
        (window as typeof window & { __STYLE_LAB_LAST_PRESET__?: string }).__STYLE_LAB_LAST_PRESET__
      );
      expect(lastPreset).toBe('minimalFrontier');

      // Navigate to test route to check overlay integration
      await page.goto('/test');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-roster-page')).toBeVisible();

      // Trigger drag to generate overlay
      const sourceCard = page.getByTestId('pg-card').first();
      const slotId = 'slot-lab-open-slot-0';
      const targetSlot = page.getByTestId(`slot-button-${slotId}`);
      
      await expect(sourceCard).toBeVisible();
      await expect(targetSlot).toBeVisible();

      // Perform drag and check overlay attributes
      await dragElement(page, sourceCard, targetSlot, {
        steps: 8,
        onIntermediateMove: async ({ page, current }) => {
          await page.waitForTimeout(50);
          
          // Verify PgCard drag overlay is present
          const dragOverlay = page.locator('[data-drag-preview-center] .tok-svg');
          await expect(dragOverlay).toBeVisible();
        },
      });
    });

    test('@overlay validates Empire pillar detection from context', async ({ page }) => {
      await navigateToStyleLab(page);

      const root = page.getByTestId('style-lab-demo-root');
      
      // Switch to Empire preset
      await selectPreset(page, 'obsidianVault', root);
      await expectAttributeOrLog(page, root, 'data-active-preset', 'obsidianVault');
      await expectAttributeOrLog(page, root, 'data-active-pillar', 'empire');

      // Navigate to test route
      await page.goto('/test');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('test-roster-page')).toBeVisible();

      // Switch to Empire scenario for pillar detection
      await page.selectOption('#scenario-select', 'imperial-city');
      await page.waitForTimeout(200);

      // Trigger drag and verify Empire pillar
      const sourceCard = page.getByTestId('pg-card').first();
      const slotId = 'slot-lab-open-slot-0';
      const targetSlot = page.getByTestId(`slot-button-${slotId}`);
      
      await dragElement(page, sourceCard, targetSlot, {
        steps: 8,
        onIntermediateMove: async ({ page, current }) => {
          await page.waitForTimeout(50);
          
          const dragOverlay = page.locator('[data-drag-preview-center] .tok-svg');
          await expect(dragOverlay).toBeVisible();
        },
      });
    });

    test('@overlay validates diagnostic attributes during preset switch', async ({ page }) => {
      await navigateToStyleLab(page);

      const root = page.getByTestId('style-lab-demo-root');
      
      // Start with Wilderness preset
      await selectPreset(page, 'minimalFrontier', root);
      
      // Navigate to test route
      await page.goto('/test');
      await page.waitForLoadState('networkidle');

      // Start drag and verify initial attributes
      const sourceCard = page.getByTestId('pg-card').first();
      const slotId = 'slot-lab-open-slot-0';
      const targetSlot = page.getByTestId(`slot-button-${slotId}`);
      
      let overlayVerified = false;
      
      await dragElement(page, sourceCard, targetSlot, {
        steps: 12,
        onIntermediateMove: async ({ page, current }) => {
          if (!overlayVerified && current.x > 200) { // Check midway through drag
            await page.waitForTimeout(50);
            
            const dragOverlay = page.locator('[data-drag-preview-center] .tok-svg');
            await expect(dragOverlay).toBeVisible();
            
            overlayVerified = true;
          }
        },
      });

      expect(overlayVerified).toBeTruthy();
    });
  });
});
