import { test, expect } from '@playwright/test';

/**
 * Job Reward Generation Test Suite
 *
 * Verifica che mentre un job è in esecuzione, i reward vengano generati
 * correttamente secondo la configurazione (dailyRewardProfile).
 *
 * Configurazione job_chop_wood:
 * - dailyRewardProfile: [{ resourceId: 'wood', amountPerDay: 3 }]
 * - durationFormula: '1' (1 tick)
 * - ticksPerDay: 20 (default da dayLengthInTimeUnits)
 *
 * Calcolo reward per tick:
 * - 3 legna al giorno / 20 tick = 0.15 legna per tick
 */

test.describe('Job Reward Generation Over Time', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-job-poi-roster-time-integration');
  });

  test('should render job POI with Chop Wood configuration', async ({ page }) => {
    await expect(page.getByText('🪓 Job: Chop Wood')).toBeVisible();
    await expect(page.getByText('ID: job_chop_wood')).toBeVisible();
  });

  test('should render roster with available residents', async ({ page }) => {
    await expect(page.getByText('👥 Available Residents')).toBeVisible();
    const medals = page.locator('[data-testid^="roster-medal-"]');
    const count = await medals.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render rewards panel', async ({ page }) => {
    await expect(page.getByText('💰 Automatic Rewards')).toBeVisible();
    await expect(page.getByText('Total Rewards:')).toBeVisible();
    await expect(page.getByText('Total Wood:')).toBeVisible();
  });

  test('should render time engine controls', async ({ page }) => {
    await expect(page.getByText('⏱️ Time Engine Controls')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Advance 1s' })).toBeVisible();
  });

  test('should assign resident to job via drag and drop', async ({ page }) => {
    // Get first resident medal
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const medalId = await firstMedal.getAttribute('data-testid');

    // Get job POI drop zone
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');

    // Drag resident to job POI
    await firstMedal.dragTo(jobPoi);

    // Verify assignment
    await expect(page.getByText('Assigned to job')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  test('should show zero rewards before assignment', async ({ page }) => {
    const totalRewards = page.getByText('Total Rewards:');
    const totalWood = page.getByText('Total Wood:');

    await expect(totalRewards).toContainText('0');
    await expect(totalWood).toContainText('0');
  });

  test('should generate rewards after assigning resident and advancing time', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    // Wait for assignment to complete
    await expect(page.getByText('Assigned to job')).toBeVisible();

    // Advance time multiple times to trigger reward generation
    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });

    // Advance time 10 times (simulating 10 ticks)
    for (let i = 0; i < 10; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100); // Small delay between advances
    }

    // Verify rewards were generated
    const totalRewards = page.getByText('Total Rewards:');
    await expect(totalRewards).not.toContainText('0');

    // Verify wood rewards were generated
    const totalWood = page.getByText('Total Wood:');
    await expect(totalWood).not.toContainText('0');
  });

  test('should show individual reward entries with timestamps', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    await expect(page.getByText('Assigned to job')).toBeVisible();

    // Advance time
    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Verify reward entries are visible
    const rewardEntries = page.locator('.bg-yellow-50'); // Reward entry background
    const count = await rewardEntries.count();
    expect(count).toBeGreaterThan(0);

    // Verify each entry has resource and amount
    const firstEntry = rewardEntries.first();
    await expect(firstEntry.getByText('wood')).toBeVisible();
  });

  test('should increase rewards proportionally with time advancement', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    await expect(page.getByText('Assigned to job')).toBeVisible();

    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });

    // Get initial wood count
    let initialWood = 0;
    const totalWoodText = await page.getByText('Total Wood:').textContent();
    if (totalWoodText) {
      const match = totalWoodText.match(/Total Wood:\s*(\d+)/);
      if (match) {
        initialWood = parseInt(match[1], 10);
      }
    }

    // Advance time 5 times
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Get wood count after 5 advances
    let woodAfter5 = 0;
    const woodAfter5Text = await page.getByText('Total Wood:').textContent();
    if (woodAfter5Text) {
      const match = woodAfter5Text.match(/Total Wood:\s*(\d+)/);
      if (match) {
        woodAfter5 = parseInt(match[1], 10);
      }
    }

    // Advance time another 5 times
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Get wood count after 10 advances
    let woodAfter10 = 0;
    const woodAfter10Text = await page.getByText('Total Wood:').textContent();
    if (woodAfter10Text) {
      const match = woodAfter10Text.match(/Total Wood:\s*(\d+)/);
      if (match) {
        woodAfter10 = parseInt(match[1], 10);
      }
    }

    // Verify wood increased with time
    expect(woodAfter5).toBeGreaterThan(initialWood);
    expect(woodAfter10).toBeGreaterThan(woodAfter5);
  });

  test('should stop generating rewards when assignment is removed', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    await expect(page.getByText('Assigned to job')).toBeVisible();

    // Advance time to generate rewards
    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Get wood count before removal
    let woodBeforeRemoval = 0;
    const woodBeforeText = await page.getByText('Total Wood:').textContent();
    if (woodBeforeText) {
      const match = woodBeforeText.match(/Total Wood:\s*(\d+)/);
      if (match) {
        woodBeforeRemoval = parseInt(match[1], 10);
      }
    }

    // Remove assignment
    await page.getByRole('button', { name: 'Remove' }).click();

    // Advance time again
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Get wood count after removal
    let woodAfterRemoval = 0;
    const woodAfterText = await page.getByText('Total Wood:').textContent();
    if (woodAfterText) {
      const match = woodAfterText.match(/Total Wood:\s*(\d+)/);
      if (match) {
        woodAfterRemoval = parseInt(match[1], 10);
      }
    }

    // Verify wood count didn't increase after removal
    expect(woodAfterRemoval).toBe(woodBeforeRemoval);
  });

  test('should clear rewards when clear button is clicked', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    await expect(page.getByText('Assigned to job')).toBeVisible();

    // Advance time to generate rewards
    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Verify rewards exist
    const totalRewards = page.getByText('Total Rewards:');
    await expect(totalRewards).not.toContainText('0');

    // Clear rewards
    await page.getByRole('button', { name: 'Clear Rewards' }).click();

    // Verify rewards are cleared
    await expect(totalRewards).toContainText('0');
    await expect(page.getByText('Total Wood:')).toContainText('0');
  });

  test('should show empty state message when no rewards', async ({ page }) => {
    await expect(page.getByText('No rewards yet. Assign a resident and advance time to see rewards.')).toBeVisible();
  });

  test('should hide empty state message when rewards are generated', async ({ page }) => {
    // Assign resident to job
    const firstMedal = page.locator('[data-testid^="roster-medal-"]').first();
    const jobPoi = page.locator('[data-testid="job-poi-drop-zone"]');
    await firstMedal.dragTo(jobPoi);

    await expect(page.getByText('Assigned to job')).toBeVisible();

    // Advance time to generate rewards
    const advanceButton = page.getByRole('button', { name: 'Advance 1s' });
    for (let i = 0; i < 5; i++) {
      await advanceButton.click();
      await page.waitForTimeout(100);
    }

    // Verify empty state message is hidden
    await expect(page.getByText('No rewards yet. Assign a resident and advance time to see rewards.')).not.toBeVisible();
  });
});
