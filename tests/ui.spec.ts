import { test, expect } from '@playwright/test';

test.describe('UI Verification Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for React to mount
        await page.waitForLoadState('networkidle');
    });

    test('App Loads: Grid Arena Tab is Default', async ({ page }) => {
        // Verify Grid Arena loads by default (as per App.tsx default tab)
        await expect(page.locator('text=Turn 1')).toBeVisible();
        await expect(page.locator('text=Combat started')).toBeVisible();
    });

    test('Spell Library: Navigation and Create Spell', async ({ page }) => {
        // Navigate to Spell Library
        await page.locator('button:has-text("Spell Library")').click();
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
        // Grid Arena should be default tab, but click anyway for safety
        await page.locator('button:has-text("⚔️ Grid Arena")').click();

        // Verify Turn indicator
        await expect(page.locator('text=Turn 1')).toBeVisible();

        // Verify Entities exist (abbreviated names)
        await expect(page.locator('text=WA').first()).toBeVisible(); // Warrior
        await expect(page.locator('text=OR').first()).toBeVisible(); // Orc

        // Verify Combat Log sidebar
        await expect(page.locator('h3:has-text("Combat Log")')).toBeVisible();
        await expect(page.locator('text=Combat started')).toBeVisible();
    });

    test('Stat Weigher: Full Analysis Flow', async ({ page }) => {
        // Navigate to Arena Lab
        await page.locator('button:has-text("Arena Lab")').click();
        await page.waitForTimeout(500);

        // Click Balance sub-tab (with emoji)
        await page.locator('button:has-text("⚖️ Balance")').click();
        await page.waitForTimeout(500);

        // Click Stat Weighting
        await page.locator('button:has-text("⚖️ Stat Weighting")').click();
        await page.waitForTimeout(500);

        // Verify we're on Stat Weigher
        await expect(page.locator('h3:has-text("Stat Weight Calculator")')).toBeVisible();

        // Click Run Analysis
        await page.locator('button:has-text("Run Analysis")').click();

        // Wait for results table (this takes time due to simulations)
        await expect(page.locator('table')).toBeVisible({ timeout: 30000 });

        // Verify results show data
        await expect(page.locator('text=HP Equivalent')).toBeVisible();
        await expect(page.locator('text=+1 critChance')).toBeVisible();
    });

    test('Balancer Tab: Loads Correctly', async ({ page }) => {
        await page.locator('button:has-text("Balancer")').click();
        await page.waitForTimeout(500);

        // Verify main balancer heading and key elements
        await expect(page.locator('h2:has-text("Game Balancing")')).toBeVisible();
        await expect(page.locator('text=Critical Hits').first()).toBeVisible();
        await expect(page.locator('text=Mitigation').first()).toBeVisible();
    });

});
