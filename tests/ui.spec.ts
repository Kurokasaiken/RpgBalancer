import { test, expect, type Page } from '@playwright/test';
import type { IdleVillageConfig } from '../src/balancing/config/idleVillage/types';
import type { VillageState } from '../src/engine/game/idleVillage/TimeEngine';

interface IdleVillageControls {
    play: () => void;
    pause: () => void;
    advance: (delta: number) => void;
    assign: (slotId: string, residentId: string) => boolean;
    getState: () => VillageState | null;
    getConfig: () => IdleVillageConfig | null;
    reset: () => VillageState | null;
}

type WindowWithControls = Window & { __idleVillageControls?: IdleVillageControls };

const getNavButton = (page: Page, tabId: string) => page.getByTestId(`nav-btn-${tabId}`);

async function openNavTab(page: Page, tabId: string) {
    const primaryButton = getNavButton(page, tabId).first();
    if (await primaryButton.isVisible().catch(() => false)) {
        await primaryButton.click();
        return;
    }

    const moreButton = getNavButton(page, 'more').first();
    if (await moreButton.isVisible().catch(() => false)) {
        await moreButton.click();
        const drawerButton = getNavButton(page, tabId).last();
        await drawerButton.click();
        return;
    }

    throw new Error(`Navigation button for tab "${tabId}" not found in current layout.`);
}

test.describe('UI Verification Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for React to mount
        await page.waitForLoadState('networkidle');
    });

    test('App Loads: Skill Check Lab is Default', async ({ page }) => {
        // Skill Check Lab should be the configured default landing tab
        await expect(page.locator('h1:has-text("Skill Check Preview Lab")').first()).toBeVisible();
    });

    test('Spell Library: Navigation and Create Spell', async ({ page }) => {
        await openNavTab(page, 'spellLibrary');
        await expect(page.locator('h2:has-text("Spell Library")')).toBeVisible();

        // Click New Spell button
        await page.locator('button:has-text("+ New Spell")').click();

        // Verify spell editor modal opens
        await expect(page.locator('text=Edit Spell').first()).toBeVisible({ timeout: 5000 });

        // Verify form has spell properties
        await expect(page.locator('text=Mana Cost').first()).toBeVisible();
        await expect(page.locator('text=Cooldown').first()).toBeVisible();
    });

    test('Grid Arena: Entities and Interaction', async ({ page }) => {
        await openNavTab(page, 'gridArena');

        const selectorEmpty = page.getByTestId('character-selector-empty');
        if (await selectorEmpty.isVisible().catch(() => false)) {
            await expect(selectorEmpty).toBeVisible();
            await expect(selectorEmpty.locator('text=No Characters Found')).toBeVisible();
            return;
        }

        // Verify Turn indicator and entity abbreviations
        await expect(page.getByTestId('grid-turn-indicator')).toContainText('Turn', { timeout: 10000 });

        // Verify Entities exist (abbreviated names)
        await expect(page.locator('text=WA').first()).toBeVisible(); // Warrior
        await expect(page.locator('text=OR').first()).toBeVisible(); // Orc

        // Verify Combat Log sidebar
        await expect(page.locator('h3:has-text("Combat Log")')).toBeVisible();
        await expect(page.locator('text=Combat started')).toBeVisible();
    });

    test('Stat Testing: Stat Stress Testing page loads', async ({ page }) => {
        await openNavTab(page, 'balancerStats');
        await page.waitForTimeout(500);

        // Verify we are on the Stat Efficiency Testing page
        await expect(page.locator('h1:has-text("Stat Efficiency Testing")')).toBeVisible();

        // Key controls should be present
        await expect(page.locator('button:has-text("Run All Tiers")')).toBeVisible();
        await expect(page.locator('button:has-text("Run Auto-Balance")')).toBeVisible();
    });

    test('Balancer Tab: Loads Correctly', async ({ page }) => {
        await openNavTab(page, 'balancer');
        await page.waitForTimeout(500);

        // Verify main balancer heading and tagline from the Balancer editor
        await expect(page.locator('h1:has-text("Balancer")').first()).toBeVisible();
        await expect(page.locator('text=Arcane Tech Glass · Config-Driven').first()).toBeVisible();
    });

    test('Testing Lab: Maintenance notice renders', async ({ page }) => {
        await openNavTab(page, 'testing');
        await page.waitForTimeout(300);

        await expect(page.locator('h1:has-text("Testing Lab")').first()).toBeVisible();
        await expect(page.locator('text=This module is currently undergoing maintenance').first()).toBeVisible();
    });

    test('Tactical Lab: debug grid renders', async ({ page }) => {
        await openNavTab(page, 'tacticalLab');
        await page.waitForTimeout(500);

        // Verify Tactical Lab heading and tactical debug grid are visible
        await expect(page.locator('text=Tactical Lab').first()).toBeVisible();
        await expect(page.locator('[data-testid="tactical-debug-grid"]').first()).toBeVisible();
    });

    test.describe('Idle Village drag & drop', () => {
        test.beforeEach(async ({ page }) => {
            await openNavTab(page, 'idleVillageMap');

            await page.waitForFunction(() => {
                const w = window as WindowWithControls;
                return typeof window !== 'undefined' && !!w.__idleVillageControls?.getState?.();
            });

            await page.evaluate(() => {
                const controls = (window as WindowWithControls).__idleVillageControls;
                if (!controls) {
                    throw new Error('Idle Village controls missing');
                }
                const config = controls.getConfig();
                if (!config) {
                    throw new Error('Idle Village config missing');
                }
                const job = config.activities?.job_city_rats;
                if (job) {
                    job.metadata = {
                        ...(job.metadata ?? {}),
                        supportsAutoRepeat: false,
                        continuousJob: false,
                    };
                    job.statRequirement = undefined;
                }
                controls.reset();
            });

            await page.waitForFunction(() => {
                const controls = (window as WindowWithControls).__idleVillageControls;
                if (!controls) return false;
                const state = controls.getState();
                if (!state) return false;
                const residents = Object.values(state.residents ?? {}) as { status?: string }[];
                return residents.some((resident) => resident.status === 'available');
            });
        });

        test('assignment yields rewards and frees resident', async ({ page }) => {
        const { residentId, baselineResources } = await page.evaluate(() => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                throw new Error('Idle Village controls missing');
            }
            const state = controls.getState();
            if (!state) {
                throw new Error('Village state not ready');
            }
            const residents = Object.values(state.residents ?? {}) as { id: string; status: string }[];
            const availableResident = residents.find((resident) => resident.status === 'available');
            if (!availableResident) {
                throw new Error('No available resident to assign');
            }
            const config = controls.getConfig();
            if (!config) {
                throw new Error('Idle Village config missing');
            }
            const slotIds = Object.keys(config.mapSlots ?? {});
            let chosenSlot: string | null = null;
            for (const slotId of slotIds) {
                if (controls.assign(slotId, availableResident.id)) {
                    chosenSlot = slotId;
                    break;
                }
            }
            if (!chosenSlot) {
                throw new Error(
                    `Failed to assign resident to any slot. Resident status=${availableResident.status}. Slots=${slotIds.join(',')}`,
                );
            }
            return {
                residentId: availableResident.id,
                baselineResources: {
                    gold: state.resources.gold ?? 0,
                    xp: state.resources.xp ?? 0,
                },
            };
        });

        await page.evaluate(() => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                throw new Error('Idle Village controls missing');
            }
            controls.advance(2);
        });

        const result = await page.evaluate((id) => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                throw new Error('Idle Village controls missing');
            }
            const state = controls.getState();
            if (!state) {
                throw new Error('Village state not ready');
            }
            const resident = state.residents[id];
            return {
                status: resident?.status ?? null,
                resources: {
                    gold: state.resources.gold ?? 0,
                    xp: state.resources.xp ?? 0,
                },
            };
        }, residentId);

        expect(result.status).toBe('available');
        expect(result.resources.gold).toBeGreaterThan(baselineResources.gold);
        expect(result.resources.xp).toBeGreaterThan(baselineResources.xp);
        });
    });
});
