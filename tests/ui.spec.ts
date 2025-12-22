import { test, expect, type Page } from '@playwright/test';
import type { IdleVillageConfig } from '../src/balancing/config/idleVillage/types';
import type { VillageState } from '../src/engine/game/idleVillage/TimeEngine';

interface IdleVillageResetOptions {
    founderId?: string;
}

interface IdleVillageControls {
    play: () => void;
    pause: () => void;
    advance: (delta: number) => void;
    assign: (slotId: string, residentId: string) => boolean;
    getState: () => VillageState | null;
    getConfig: () => IdleVillageConfig | null;
    reset: (options?: IdleVillageResetOptions) => VillageState | null;
    getAssignmentFeedback: () => string | null;
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

    test('Skill Check: Alt Visuals v8 renders PIXI scene', async ({ page }) => {
        await expect(page.locator('h1:has-text("Skill Check Preview Lab")').first()).toBeVisible();

        const altModeButton = page.getByRole('button', { name: /Alt Visuals · Anime/i }).first();
        await altModeButton.click();

        const v8Button = page.getByRole('button', { name: /Alt Visuals v8/i }).first();
        await v8Button.click();

        const altVisualsSection = page.getByTestId('alt-visuals-v8');
        await expect(altVisualsSection).toBeVisible();

        // Click "Avvia scena" to start the animation
        const startButton = altVisualsSection.getByRole('button', { name: /Avvia scena/i });
        await startButton.click();

        await page.waitForFunction(() => {
            const section = document.querySelector('[data-testid="alt-visuals-v8"]');
            return !!section?.querySelector('canvas');
        });
        await expect(altVisualsSection.locator('canvas')).toBeVisible();
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
                const cityRats = config.activities?.job_city_rats;
                if (cityRats) {
                    cityRats.metadata = {
                        ...(cityRats.metadata ?? {}),
                        supportsAutoRepeat: false,
                        continuousJob: false,
                    };
                    cityRats.statRequirement = undefined;
                }
                const training = config.activities?.job_training_basics;
                if (training) {
                    training.metadata = {
                        ...(training.metadata ?? {}),
                        supportsAutoRepeat: false,
                        continuousJob: false,
                    };
                    training.statRequirement = undefined;
                }
                controls.reset({ founderId: 'founder_easy' });
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

        test('drag and drop assigns resident to slot', async ({ page }) => {
        const residentCard = page.locator('[data-testid="resident-card"]').first();
        await residentCard.waitFor({ state: 'visible' });
        const slotLocator = page.locator('[data-slot-id="village_square"]');
        await slotLocator.waitFor({ state: 'visible' });

        const draggedResidentId = await residentCard.getAttribute('data-resident-id');
        if (!draggedResidentId) {
            throw new Error('Resident card missing data-resident-id attribute');
        }

        await residentCard.dragTo(slotLocator, { force: true });

        await page.waitForFunction((id) => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                return false;
            }
            const state = controls.getState();
            if (!state) return false;
            const resident = state.residents[id];
            if (!resident) return false;
            return resident.status === 'away';
        }, draggedResidentId, { timeout: 10000 });

        const dragResult = await page.evaluate((id) => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                throw new Error('Idle Village controls missing');
            }
            const state = controls.getState();
            if (!state) {
                throw new Error('Village state not ready');
            }
            const activities = Object.values(state.activities ?? {}).filter((activity) =>
                activity.characterIds?.includes(id),
            );
            return {
                residentStatus: state.residents[id]?.status ?? null,
                activityCount: activities.length,
                lastFeedback: controls.getAssignmentFeedback ? controls.getAssignmentFeedback() : null,
            };
        }, draggedResidentId);

        expect(dragResult.residentStatus).toBe('away');
        expect(dragResult.activityCount).toBeGreaterThan(0);
        expect(dragResult.lastFeedback ?? '').toContain('assegnato');
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
            const targetSlotId = 'village_square';
            const assigned = controls.assign(targetSlotId, availableResident.id);
            const feedback = controls.getAssignmentFeedback ? controls.getAssignmentFeedback() : null;
            if (!assigned) {
                throw new Error(
                    `Failed to assign resident to slot "${targetSlotId}". Resident status=${availableResident.status}. Feedback=${feedback ?? 'n/a'}`,
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

        const maxSteps = 10;
        let residentStatus: string | null = null;
        for (let i = 0; i < maxSteps; i += 1) {
            await page.evaluate(() => {
                const controls = (window as WindowWithControls).__idleVillageControls;
                if (!controls) {
                    throw new Error('Idle Village controls missing');
                }
                controls.advance(1);
            });

            residentStatus = await page.evaluate((id) => {
                const controls = (window as WindowWithControls).__idleVillageControls;
                if (!controls) {
                    throw new Error('Idle Village controls missing');
                }
                const state = controls.getState();
                if (!state) {
                    throw new Error('Village state not ready during advance loop');
                }
                return state.residents[id]?.status ?? null;
            }, residentId);

            if (residentStatus === 'available') {
                break;
            }
        }

        expect(residentStatus).toBe('available');

        const debugState = await page.evaluate((id) => {
            const controls = (window as WindowWithControls).__idleVillageControls;
            if (!controls) {
                throw new Error('Idle Village controls missing');
            }
            const state = controls.getState();
            if (!state) {
                throw new Error('Village state not ready');
            }
            const resident = state.residents[id];
            const activities = Object.values(state.activities ?? {}).map((activity) => ({
                id: activity.id,
                status: activity.status,
                activityId: activity.activityId,
                slotId: activity.slotId,
                startTime: activity.startTime,
                endTime: activity.endTime,
                characterIds: [...(activity.characterIds ?? [])],
              }));
            return {
                currentTime: state.currentTime,
                residentStatus: resident?.status ?? null,
                resources: {
                    gold: state.resources.gold ?? 0,
                    xp: state.resources.xp ?? 0,
                },
                activities,
            };
        }, residentId);

        console.log('DEBUG final state', debugState);

        expect(debugState.resources.gold).toBeGreaterThan(baselineResources.gold);
        expect(debugState.resources.xp).toBeGreaterThan(baselineResources.xp);
        });
    });
});
