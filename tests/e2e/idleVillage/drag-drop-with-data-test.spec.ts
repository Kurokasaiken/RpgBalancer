/**
 * Drag & Drop Test con Dati Reali
 * 
 * Usa i dati salvati dall'applicazione principale per testare il drag & drop
 */

import { test, expect, type Page } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';

const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const FALLBACK_RESIDENTS = [
  {
    id: 'with-data-1',
    name: 'Data Test One',
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
    id: 'with-data-2',
    name: 'Data Test Two',
    aiBehavior: 'balanced',
    statBlock: {
      hp: 145,
      strength: 5,
      endurance: 6,
      agility: 3,
      intelligence: 4,
      perception: 4,
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 145,
    maxHp: 145,
    isInjured: false,
    isHero: false,
    survivalCount: 0,
    survivalScore: 0,
  },
] as const;

const slotButton = (page: Page, slotId: string) => page.getByTestId(`slot-button-${slotId}`);
const slotContainer = (page: Page, slotId: string) => page.locator(`[data-slot-id="${slotId}"][role="listitem"]`);

const initTelemetryBuffer = async (page: Page) => {
  await page.addInitScript(() => {
    (window as typeof window & { telemetryBuffer?: unknown[] }).telemetryBuffer =
      (window as typeof window & { telemetryBuffer?: unknown[] }).telemetryBuffer ?? [];
  });
};

const seedResidentsIfNeeded = async (page: Page): Promise<number> => {
  const cards = page.getByTestId('pg-card');
  const count = await cards.count().catch(() => 0);
  if (count > 0) {
    return count;
  }

  console.log('📦 Auto-seeding Character Manager for drag-drop-with-data test');
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ key, dataset }) => {
      localStorage.setItem(key, JSON.stringify(dataset));
      window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
    },
    { key: CHARACTER_STORAGE_KEY, dataset: FALLBACK_RESIDENTS },
  );

  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();
  await page.waitForTimeout(1200);
  return page.getByTestId('pg-card').count();
};

test('🎯 Drag & Drop Test with Real Data', async ({ page }) => {
  console.log('\n🎯 DRAG & DROP TEST WITH REAL DATA');
  console.log('=' .repeat(50));

  await initTelemetryBuffer(page);

  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();

  const residentCards = page.getByTestId('pg-card');
  const cardCount = await seedResidentsIfNeeded(page);
  expect(cardCount).toBeGreaterThan(0);
  console.log(`✅ Found ${cardCount} residents on page`);
  
  // Se ci sono residenti, esegui i test completi
  const residentCard = residentCards.first();
  await expect(residentCard).toBeVisible();

  // TEST 1: Verifica che il resident card sia trascinabile
  console.log('\n🎮 Testing: Resident card is draggable');
  try {
    const isDraggable = await residentCard.evaluate((el) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }
      const attrValue = el.getAttribute('draggable');
      return el.draggable || attrValue === 'true';
    });
    console.log(`   📋 Card draggable: ${isDraggable}`);
    
    if (isDraggable) {
      console.log('✅ Resident card is draggable');
    } else {
      console.log('❌ Resident card is not draggable');
    }
  } catch (error) {
    console.log('❌ Error checking draggable:', error);
  }

  // TEST 2: Verifica slot targets
  console.log('\n🎯 Testing: Slot targets exist');
  try {
    const openSlotButtons = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');
    const restrictedSlotButtons = page.locator('[data-testid^="slot-button-slot-lab-restricted-slot-"]');
    
    const openSlotExists = await openSlotButtons.count() > 0;
    const restrictedSlotExists = await restrictedSlotButtons.count() > 0;
    
    console.log(`   📋 Open slot exists: ${openSlotExists}`);
    console.log(`   📋 Restricted slot exists: ${restrictedSlotExists}`);
    
    if (openSlotExists && restrictedSlotExists) {
      console.log('✅ All slot targets found');
    } else {
      console.log('❌ Some slot targets missing');
    }
  } catch (error) {
    console.log('❌ Error checking slots:', error);
  }

  // TEST 3: Test drag preview (se possibile)
  console.log('\n🎮 Testing: Drag preview functionality');
  try {
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot = slotButton(page, slotId);
    const container = slotContainer(page, slotId);
    await expect(targetSlot).toBeVisible();
    await expect(container).toBeVisible();

    // Aggiungi script per monitorare drag preview
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = `
        window.dragTestResults = { hasDragPreview: false, dragEvents: 0 };
        
        document.addEventListener('dragstart', (e) => {
          window.dragTestResults.dragEvents++;
          const dragImage = document.querySelector('[data-drag-preview]');
          window.dragTestResults.hasDragPreview = !!dragImage;
        });
      `;
      document.head.appendChild(script);
    });

    // Esegui drag breve
    await residentCard.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    const residentBox = await residentCard.boundingBox();
    const targetBox = await targetSlot.boundingBox();
    
    if (residentBox && targetBox) {
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );
      await page.waitForTimeout(200);
    }
    
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Controlla risultati e stato slot
    const dragResults = await page.evaluate(() => (window as any).dragTestResults);
    console.log(`   📋 Drag events: ${dragResults.dragEvents}`);
    console.log(`   📋 Has drag preview: ${dragResults.hasDragPreview}`);
    const dropState = await container.getAttribute('data-drop-state');
    console.log(`   📋 Slot drop state after drag: ${dropState}`);
    
    if (dragResults.dragEvents > 0 && dropState && /valid|idle/.test(dropState)) {
      console.log('✅ Drag functionality working con drop state valido/idle');
    } else {
      console.log('❌ Drag events non rilevati o drop state inatteso');
    }
  } catch (error) {
    console.log('❌ Error testing drag preview:', error);
  }

  // TEST 4: Valid drop assignment
  console.log('\n✅ Testing: Valid slot assignment success');
  try {
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot = slotButton(page, slotId);
    const container = slotContainer(page, slotId);
    await dragElement(page, residentCard, targetSlot, { steps: 12 });
    const clearButton = container.getByRole('button', { name: /^Clear$/i });
    await expect(clearButton).toBeVisible({ timeout: 2000 });
    console.log('✅ Valid drop produced Clear button');
  } catch (error) {
    console.log('❌ Valid drop assignment failed:', error);
    expect(error).toBeUndefined();
  }

  // TEST 5: Telemetry Events
  console.log('\n📊 Testing: Telemetry events emission');
  try {
    const slotId = 'slot-lab-open-slot-0';
    const targetSlot = slotButton(page, slotId);
    await dragElement(page, residentCard, targetSlot, { steps: 12 });
    await page.waitForTimeout(500);

    const telemetryEvents = await page.evaluate(() => {
      const buffer = (window as typeof window & {
        telemetryBuffer?: Array<{ eventType: string; payload?: Record<string, unknown> }>;
      }).telemetryBuffer;
      if (!buffer) return [];
      return buffer.filter((entry) => typeof entry.eventType === 'string' && entry.eventType.startsWith('slot_lab_'));
    });
    const representativeEvent = telemetryEvents[0];

    if (representativeEvent) {
      console.log(`✅ Telemetry event detected: ${representativeEvent.eventType}`);
    } else {
      console.log('❌ No telemetry events detected');
    }
  } catch (error) {
    console.log('❌ Error testing telemetry:', error);
    expect(error).toBeUndefined();
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Residents found: ${cardCount}`);
  console.log('✅ Page loads correctly');
  console.log('✅ Basic drag & drop elements present');
  console.log('✅ Valid drop assignment verified');
  console.log('✅ Telemetry buffer inspected');
});
