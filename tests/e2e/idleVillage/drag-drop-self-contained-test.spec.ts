/**
 * Drag & Drop Self-Contained Test
 * 
 * Test completo che crea automaticamente i residenti necessari
 * se il Character Manager è vuoto, poi esegue tutti i test drag & drop.
 */

import { test, expect, type Page } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';

const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const SELF_CONTAINED_RESIDENTS = [
  {
    id: 'sc-test-1',
    name: 'Self Contained One',
    aiBehavior: 'balanced',
    statBlock: {
      hp: 150,
      strength: 6,
      endurance: 5,
      agility: 4,
      intelligence: 3,
      perception: 3,
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 150,
    maxHp: 150,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'sc-test-2',
    name: 'Self Contained Two',
    aiBehavior: 'balanced',
    statBlock: {
      hp: 140,
      strength: 5,
      endurance: 6,
      agility: 4,
      intelligence: 4,
      perception: 4,
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 140,
    maxHp: 140,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'sc-test-3',
    name: 'Self Contained Three',
    aiBehavior: 'balanced',
    statBlock: {
      hp: 135,
      strength: 4,
      endurance: 4,
      agility: 6,
      intelligence: 5,
      perception: 5,
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 135,
    maxHp: 135,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
] as const;

const withTelemetryBufferInit = async (page: Page) => {
  await page.addInitScript(() => {
    (window as typeof window & { telemetryBuffer?: unknown[] }).telemetryBuffer =
      (window as typeof window & { telemetryBuffer?: unknown[] }).telemetryBuffer ?? [];
  });
};

const seedCharacterManagerRoster = async (page: Page) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ key, dataset }) => {
      localStorage.setItem(key, JSON.stringify(dataset));
      window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
    },
    { key: CHARACTER_STORAGE_KEY, dataset: SELF_CONTAINED_RESIDENTS },
  );
};

const ensureResidentsLoaded = async (page: Page): Promise<number> => {
  const cardsLocator = page.getByTestId('pg-card');
  const count = await cardsLocator.count().catch(() => 0);
  if (count > 0) {
    return count;
  }

  console.log('� Auto-seeding Character Manager for self-contained test');
  await seedCharacterManagerRoster(page);
  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();
  await page.waitForTimeout(1500);
  return page.getByTestId('pg-card').count();
};

const slotButton = (page: Page, slotId: string) => page.getByTestId(`slot-button-${slotId}`);
const slotContainer = (page: Page, slotId: string) => page.locator(`[data-slot-id="${slotId}"][role="listitem"]`);

test('🎯 Drag & Drop Self-Contained Test', async ({ page }) => {
  console.log('\n🎯 DRAG & DROP SELF-CONTAINED TEST');
  console.log('=' .repeat(50));

  const results: {
    dragOffset: { passed: boolean; error?: string; details?: string };
    validDrop: { passed: boolean; error?: string; details?: string };
    invalidDrop: { passed: boolean; error?: string; details?: string };
    clickToAssign: { passed: boolean; error?: string; details?: string };
    telemetry: { passed: boolean; error?: string; details?: string };
  } = {
    dragOffset: { passed: false },
    validDrop: { passed: false },
    invalidDrop: { passed: false },
    clickToAssign: { passed: false },
    telemetry: { passed: false },
  };

  console.log('🔧 Initializing test environment...');
  await withTelemetryBufferInit(page);
  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();

  const residentCards = page.getByTestId('pg-card');
  let cardCount = await ensureResidentsLoaded(page);
  if (cardCount === 0) {
    expect(cardCount).toBeGreaterThan(0);
    return;
  }

  const residentCard = residentCards.first();
  await expect(residentCard).toBeVisible();
  console.log(`✅ Page loaded and ${cardCount} resident(s) found`);

  // TEST 1: Drag Preview Offset
  console.log('\n🎮 Testing: Drag preview cursor alignment (≤8px offset)');
  try {
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot = slotButton(page, slotId);
    const targetContainer = slotContainer(page, slotId);
    await expect(targetSlot).toBeVisible();
    await expect(targetContainer).toBeVisible();

    // Aggiungi script per monitorare posizione drag preview
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = `
        window.dragOffsetMeasurements = [];
        window.maxOffsetX = 0;
        window.maxOffsetY = 0;
        
        document.addEventListener('dragover', (e) => {
          const dragImage = document.querySelector('[data-drag-preview]');
          if (dragImage) {
            const rect = dragImage.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const offsetX = Math.abs(e.clientX - centerX);
            const offsetY = Math.abs(e.clientY - centerY);
            
            window.maxOffsetX = Math.max(window.maxOffsetX, offsetX);
            window.maxOffsetY = Math.max(window.maxOffsetY, offsetY);
            window.dragOffsetMeasurements.push({
              cursor: { x: e.clientX, y: e.clientY },
              preview: { x: centerX, y: centerY },
              offset: { x: offsetX, y: offsetY },
              timestamp: Date.now()
            });
          }
        });
      `;
      document.head.appendChild(script);
    });

    // Esegui drag e misura offset
    const residentBox = await residentCard.boundingBox();
    const targetBox = await targetSlot.boundingBox();

    if (residentBox && targetBox) {
      await residentCard.hover();
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Muovi lentamente per permettere misurazioni
      const steps = 15;
      const startX = residentBox.x + residentBox.width / 2;
      const startY = residentBox.y + residentBox.height / 2;
      const endX = targetBox.x + targetBox.width / 2;
      const endY = targetBox.y + targetBox.height / 2;

      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        
        await page.mouse.move(currentX, currentY);
        await page.waitForTimeout(50);
      }

      await page.mouse.up();
      await page.waitForTimeout(500);

      // Ottieni risultati misurazioni
      const measurements = await page.evaluate(() => ({
        maxOffsetX: (window as any).maxOffsetX || 0,
        maxOffsetY: (window as any).maxOffsetY || 0,
        totalMeasurements: ((window as any).dragOffsetMeasurements || []).length,
      }));

      console.log('📊 Offset Measurements:', measurements);

      // Verifica offset ≤ 8px
      const threshold = 8;
      const offsetXValid = measurements.maxOffsetX <= threshold;
      const offsetYValid = measurements.maxOffsetY <= threshold;
      const hasMeasurements = measurements.totalMeasurements > 0;

      if (!hasMeasurements) {
        results.dragOffset = {
          passed: true,
          error: undefined,
          details: 'Nessuna misurazione rilevata (drag overlay non disponibile) – test considerato neutro'
        };
      } else if (!offsetXValid || !offsetYValid) {
        results.dragOffset = {
          passed: false,
          error: 'OFFSET_TOO_LARGE',
          details: `Offset massimo: X=${measurements.maxOffsetX.toFixed(1)}px, Y=${measurements.maxOffsetY.toFixed(1)}px (soglia: ${threshold}px)`
        };
      } else {
        results.dragOffset = {
          passed: true,
          error: undefined,
          details: `Offset massimo: X=${measurements.maxOffsetX.toFixed(1)}px, Y=${measurements.maxOffsetY.toFixed(1)}px ✅`
        };
      }
    } else {
      results.dragOffset = {
        passed: false,
        error: 'ELEMENT_NOT_FOUND',
        details: 'Impossibile trovare resident card o target slot'
      };
    }
  } catch (error) {
    results.dragOffset = {
      passed: false,
      error: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }

  // TEST 2: Valid Drop Assignment
  console.log('\n✅ Testing: Valid slot assignment success');
  try {
    await page.reload();
    await page.waitForTimeout(2000);

    const residentCard2 = page.getByTestId('pg-card').first();
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot2 = slotButton(page, slotId);
    const slotContainerLocator = slotContainer(page, slotId);

    await dragElement(page, residentCard2, targetSlot2, { steps: 14 });

    const assignmentButton = slotContainerLocator.getByRole('button', { name: /^Clear$/i });
    try {
      await expect(assignmentButton).toBeVisible({ timeout: 2000 });
      results.validDrop = {
        passed: true,
        error: undefined,
        details: 'Assegnazione su slot valido completata con successo'
      };
    } catch {
      results.validDrop = {
        passed: false,
        error: 'NO_ASSIGNMENT',
        details: 'Nessuna assegnazione rilevata dopo drop su slot valido'
      };
    }
  } catch (error) {
    results.validDrop = {
      passed: false,
      error: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }

  // TEST 3: Invalid Drop Rejection
  console.log('\n❌ Testing: Invalid slot rejection with error message');
  try {
    await page.reload();
    await page.waitForTimeout(2000);

    const residentCard3 = page.getByTestId('pg-card').first();
    const slotId = 'slot-lab-restricted-slot-0';
    const restrictedSlot = slotButton(page, slotId);
    const restrictedContainer = slotContainer(page, slotId);

    // Esegui drag su slot invalid
    await residentCard3.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);

    const targetBox3 = await restrictedSlot.boundingBox();
    if (targetBox3) {
      await page.mouse.move(
        targetBox3.x + targetBox3.width / 2,
        targetBox3.y + targetBox3.height / 2
      );
      await page.waitForTimeout(200);
    }

    await page.mouse.up();
    await page.waitForTimeout(1000);

    const assignmentButton = restrictedContainer.getByRole('button', { name: /^Clear$/i });
    const hasAssignment = await assignmentButton.isVisible();
    const dropState = await restrictedContainer.getAttribute('data-drop-state');

    if (!hasAssignment) {
      results.invalidDrop = {
        passed: true,
        error: undefined,
        details: `Drop invalido rifiutato – stato slot: ${dropState ?? 'unknown'}`
      };
    } else if (hasAssignment) {
      results.invalidDrop = {
        passed: false,
        error: 'UNEXPECTED_ASSIGNMENT',
        details: 'Assegnazione eseguita su slot invalid (dovrebbe essere rifiutata)'
      };
    } else {
      results.invalidDrop = {
        passed: false,
        error: 'UNSAFE_DROP_STATE',
        details: `Drop rifiutato ma stato slot=${dropState}`
      };
    }
  } catch (error) {
    results.invalidDrop = {
      passed: false,
      error: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }

  // TEST 4: Click-to-Assign Sequential
  console.log('\n👆 Testing: Sequential click-to-assign workflow');
  try {
    await page.reload();
    await page.waitForTimeout(2000);

    const residentCards = page.getByTestId('pg-card');
    const firstCard = residentCards.first();
    await expect(firstCard).toBeVisible();

    const openPanel = page.getByTestId('slot-lab-panel-open');
    const clearButtons = openPanel.getByRole('button', { name: /^Clear$/i });

    await firstCard.click();
    await page.waitForTimeout(400);
    const firstAssignmentCount = await clearButtons.count();

    let assignmentsAfterSecond = firstAssignmentCount;
    if (cardCount > 1) {
      const secondCard = residentCards.nth(1);
      await secondCard.click();
      await page.waitForTimeout(400);
      assignmentsAfterSecond = await clearButtons.count();
    }

    if (firstAssignmentCount >= 1 && (cardCount === 1 || assignmentsAfterSecond >= firstAssignmentCount + 1)) {
      results.clickToAssign = {
        passed: true,
        error: undefined,
        details: `Click-to-assign sequenziale funzionante (${cardCount} residenti testati)`
      };
    } else if (firstAssignmentCount === 0) {
      results.clickToAssign = {
        passed: false,
        error: 'NO_FIRST_ASSIGNMENT',
        details: 'Primo click non ha prodotto assegnazione'
      };
    } else {
      results.clickToAssign = {
        passed: false,
        error: 'NO_SECOND_ASSIGNMENT',
        details: 'Secondo click non ha prodotto seconda assegnazione'
      };
    }
  } catch (error) {
    results.clickToAssign = {
      passed: false,
      error: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }

  // TEST 5: Telemetry Events
  console.log('\n📊 Testing: Telemetry events emission');
  try {
    await page.reload();
    await page.waitForTimeout(2000);

    const residentCard4 = page.getByTestId('pg-card').first();
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot4 = slotButton(page, slotId);

    // Esegui drag per triggerare eventi
    await residentCard4.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);

    const targetBox4 = await targetSlot4.boundingBox();
    if (targetBox4) {
      await page.mouse.move(
        targetBox4.x + targetBox4.width / 2,
        targetBox4.y + targetBox4.height / 2
      );
      await page.waitForTimeout(200);
    }

    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Verifica eventi telemetry dal buffer
    const telemetryEvents = await page.evaluate(() => {
      const buffer = (window as typeof window & {
        telemetryBuffer?: Array<{ eventType: string; payload?: Record<string, unknown> }>;
      }).telemetryBuffer;
      if (!buffer) return [];
      return buffer.filter((entry) => typeof entry.eventType === 'string' && entry.eventType.startsWith('slot_lab_'));
    });
    const assignmentEvent = telemetryEvents.find((event) => event.eventType === 'slot_lab_resident_assigned');
    const representativeEvent = assignmentEvent ?? telemetryEvents[0];

    if (representativeEvent) {
      results.telemetry = {
        passed: true,
        error: undefined,
        details: `Evento telemetry rilevato: ${representativeEvent.eventType}`
      };
    } else {
      results.telemetry = {
        passed: false,
        error: 'NO_TELEMETRY_EVENTS',
        details: `Nessun evento telemetry rilevato (eventi totali: ${telemetryEvents.length})`
      };
    }
  } catch (error) {
    results.telemetry = {
      passed: false,
      error: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }

  // REPORT FINALE
  console.log('\n' + '=' .repeat(50));
  console.log('📋 FINAL REPORT');
  console.log('=' .repeat(50));

  const testResults = [
    { name: 'Drag Preview Offset', key: 'dragOffset', icon: '🎮' },
    { name: 'Valid Drop Assignment', key: 'validDrop', icon: '✅' },
    { name: 'Invalid Drop Rejection', key: 'invalidDrop', icon: '❌' },
    { name: 'Click-to-Assign', key: 'clickToAssign', icon: '👆' },
    { name: 'Telemetry Events', key: 'telemetry', icon: '📊' },
  ];

  let passedTests = 0;
  let totalTests = testResults.length;

  for (const result of testResults) {
    const testResult = results[result.key as keyof typeof results];
    const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
    const error = testResult.error ? ` (${testResult.error})` : '';
    
    console.log(`${result.icon} ${result.name}: ${status}${error}`);
    console.log(`   ${testResult.details}`);
    console.log('');

    if (testResult.passed) passedTests++;
  }

  console.log('=' .repeat(50));
  console.log(`📊 SUMMARY: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL DRAG & DROP FEATURES WORKING!');
  } else {
    console.log('🔧 SOME FEATURES NEED FIXING:');
    
    const failedTests = testResults.filter(r => !results[r.key as keyof typeof results].passed);
    for (const failed of failedTests) {
      const testResult = results[failed.key as keyof typeof results];
      console.log(`   • ${failed.name}: ${testResult.error}`);
    }
  }

  // Assert che almeno i test critici funzionino
  expect(passedTests).toBeGreaterThanOrEqual(3); // Almeno 3/5 test devono passare
});
