import { test, expect } from '@playwright/test';

test.describe('UI Verification Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for React to mount
        await page.waitForLoadState('networkidle');
    });

    test('App Loads: Balancer Tab is Default', async ({ page }) => {
        // Verify Balancer (config-driven) loads by default
        await expect(page.locator('h1:has-text("Balancer")').first()).toBeVisible();
    });

    test('Spell Library: Navigation and Create Spell', async ({ page }) => {
        // Navigate to Spell Library (now labelled "Grimoire" in nav)
        await page.locator('button:has-text("Grimoire")').click();
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
        // Navigate to Grid Arena (labelled "Battlefield" in nav)
        await page.locator('button:has-text("Battlefield")').click();

        // Verify Turn indicator
        await expect(page.locator('text=Turn 1')).toBeVisible();

        // Verify Entities exist (abbreviated names)
        await expect(page.locator('text=WA').first()).toBeVisible(); // Warrior
        await expect(page.locator('text=OR').first()).toBeVisible(); // Orc

        // Verify Combat Log sidebar
        await expect(page.locator('h3:has-text("Combat Log")')).toBeVisible();
        await expect(page.locator('text=Combat started')).toBeVisible();
    });

    test('Stat Testing: Stat Stress Testing page loads', async ({ page }) => {
        // Navigate to Stat Testing (Stat Stress Testing page)
        await page.locator('button:has-text("Stat Testing")').click();
        await page.waitForTimeout(500);

        // Verify we are on the Stat Efficiency Testing page
        await expect(page.locator('h1:has-text("Stat Efficiency Testing")')).toBeVisible();

        // Key controls should be present
        await expect(page.locator('button:has-text("Run All Tiers")')).toBeVisible();
        await expect(page.locator('button:has-text("Run Auto-Balance")')).toBeVisible();
    });

    test('Balancer Tab: Loads Correctly', async ({ page }) => {
        await page.locator('button:has-text("Balancer")').click();
        await page.waitForTimeout(500);

        // Verify main balancer heading and tagline from BalancerNew
        await expect(page.locator('h1:has-text("Balancer")').first()).toBeVisible();
        await expect(page.locator('text=Arcane Tech Glass · Config-Driven').first()).toBeVisible();
    });

    test('Tactical Lab: debug grid renders', async ({ page }) => {
        // Navigate to Tactical Lab (under System section)
        await page.locator('button:has-text("Tactical Lab")').click();
        await page.waitForTimeout(500);

        // Verify Tactical Lab heading and tactical debug grid are visible
        await expect(page.locator('text=Tactical Lab').first()).toBeVisible();
        await expect(page.locator('[data-testid="tactical-debug-grid"]').first()).toBeVisible();
    });

});
