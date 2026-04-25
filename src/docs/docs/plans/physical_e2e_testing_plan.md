# Physical E2E Testing System – Implementation Plan

**Data:** 2026-01-15  
**Status:** 📋 DRAFT  
**Strategist:** Cascade  
**Task ID:** E2E-VRT-001

---

## 1. Executive Summary

### 1.1 Obiettivo

Implementare un sistema di testing E2E "fisico" che:

1. **Esegua interazioni reali** nel browser (drag-and-drop, click, hover, scroll)
2. **Verifichi visivamente** che i componenti si comportino correttamente
3. **Catturi screenshot di riferimento** per visual regression testing
4. **Sia a prova di regressioni** con baseline automatiche e CI integration
5. **Copra tutti i componenti critici** del progetto (Idle Village, STS, Balancer)

### 1.2 Problema Attuale

Il progetto ha già una buona base di test Playwright, ma:

- **Gap 1:** I test verificano principalmente lo *stato* (data attributes, hook values), non l'*aspetto visivo*
- **Gap 2:** Mancano baseline screenshot sistematiche per visual regression
- **Gap 3:** I test drag-and-drop usano `dragTo()` ma non verificano visivamente il feedback (bloom, opacity, animazioni)
- **Gap 4:** Non c'è un sistema Docker per screenshot consistenti tra dev machines e CI
- **Gap 5:** Manca integrazione con Puppeteer MCP per testing AI-assisted

### 1.3 Soluzione Proposta

Un sistema a 4 livelli:

```
┌─────────────────────────────────────────────────────────────────┐
│  Level 4: AI-Assisted Testing (Puppeteer MCP)                   │
│  - Cascade può eseguire test interattivi durante sviluppo       │
│  - Verifica visiva on-demand con screenshot                     │
├─────────────────────────────────────────────────────────────────┤
│  Level 3: Visual Regression Testing                             │
│  - toHaveScreenshot() per tutti i componenti critici            │
│  - Baseline in Docker per consistenza CI                        │
│  - Diff automatico con threshold configurabile                  │
├─────────────────────────────────────────────────────────────────┤
│  Level 2: Physical Interaction Testing                          │
│  - Real mouse simulation (mouse.move, mouse.down, mouse.up)     │
│  - Touch simulation per mobile                                  │
│  - Keyboard navigation testing                                  │
├─────────────────────────────────────────────────────────────────┤
│  Level 1: Component State Testing (esistente)                   │
│  - Data attributes verification                                 │
│  - Hook state assertions                                        │
│  - Telemetry event validation                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Gap Analysis

### 2.1 Cosa Esiste Già ✅

| Area | File/Componente | Coverage |
|------|-----------------|----------|
| **Drag-and-drop** | `idle-village-drag.spec.ts`, `villageSandbox-drag-assign.spec.ts` | State-based |
| **Location Card feedback** | `LocationCard.playwright.spec.ts` | Data attributes |
| **Theater hover** | `theater-hover.spec.ts` | Timing + visibility |
| **Mobile touch** | `punch-club-touch-mode.spec.ts` | KPI metrics |
| **STS Console** | `STSConsole.spec.ts` | **3 visual snapshots** ✅ |
| **Telemetry** | `mobileLoggerReporter.ts` | Event capture |
| **Fixtures** | `villageSandbox.ts` | 1800+ lines di helpers |

### 2.2 Cosa Manca ❌

| Gap | Descrizione | Impatto |
|-----|-------------|---------|
| **Visual baselines** | Solo 3 snapshot in tutto il progetto (STS Console) | Non si rilevano regressioni visive |
| **Docker environment** | Screenshot variano tra macOS/Linux/CI | Flaky tests, false positives |
| **Drag visual feedback** | Bloom, opacity, animazioni non verificate | Bug visivi non rilevati |
| **Component catalog** | Nessun Storybook o component showcase | Difficile testare componenti isolati |
| **Mobile visual** | Touch feedback non verificato visivamente | UX mobile non garantita |
| **Puppeteer MCP** | Disponibile ma non integrato nei test | AI-assisted testing non sfruttato |

### 2.3 Componenti Critici da Coprire

**Idle Village:**
- `ActivitySlot` – drag feedback, bloom, progress bar
- `LocationCard` – hover states, drop zones
- `WorkerCard` / `ResidentCard` – drag handle, status indicators
- `ActiveHUD` – mini-cards, notifications
- `TheaterView` – overlay, risk stripes

**STS:**
- `STSConsole` – retro terminal (già coperto)
- `STSHandDisplay` – card layout
- `STSCombatLog` – timeline styling

**Balancer:**
- `StatSlider` – drag interaction
- `FormulaEditor` – syntax highlighting
- `Heatmaps` – color gradients

---

## 3. Architettura Proposta

### 3.1 Docker Environment per Screenshot Consistenti

```dockerfile
# Dockerfile.visual-tests
FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Entrypoint per visual regression tests
ENTRYPOINT ["npx", "playwright", "test", "--grep", "@visual"]
```

**Vantaggi:**
- Screenshot identici su dev machines e CI
- Baseline generate in ambiente controllato
- Nessun flaky test da differenze OS/font

### 3.2 Visual Regression Test Structure

```typescript
// tests/visual/components/ActivitySlot.visual.spec.ts
import { test, expect } from '@playwright/test';
import { seedVillageSandbox } from '../../fixtures/villageSandbox';

test.describe('ActivitySlot Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await seedVillageSandbox(page, { tabId: 'punchClub' });
  });

  test('idle state matches baseline', async ({ page }) => {
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await expect(slot).toHaveScreenshot('activity-slot-idle.png');
  });

  test('hover state shows bloom effect', async ({ page }) => {
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await slot.hover();
    await page.waitForTimeout(100); // Allow CSS transition
    await expect(slot).toHaveScreenshot('activity-slot-hover.png');
  });

  test('drag-over state shows valid feedback', async ({ page }) => {
    // Simulate drag state via test hooks
    await page.evaluate(() => {
      window.__idleVillageTestHooks?.setDraggingResidentId?.('pc-trainee-1');
    });
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await expect(slot).toHaveScreenshot('activity-slot-drag-valid.png');
  });

  test('active state shows progress bar', async ({ page }) => {
    // Assign resident and advance time
    await page.evaluate(() => {
      const hooks = window.__idleVillageTestHooks;
      hooks?.assignResidentToSlot?.('job_punch_training', 'pc-trainee-1');
      hooks?.advanceTimeUnits?.(1);
    });
    const slot = page.locator('[data-testid="activity-slot-job_punch_training"]');
    await expect(slot).toHaveScreenshot('activity-slot-active.png');
  });
});
```

### 3.3 Physical Interaction Helpers

```typescript
// tests/utils/physicalInteraction.ts
import { Page, Locator } from '@playwright/test';

/**
 * Performs a real drag-and-drop with intermediate mouse movements
 * to trigger all CSS transitions and visual feedback
 */
export async function physicalDragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  options: {
    steps?: number;
    pauseAtMiddle?: boolean;
    captureScreenshots?: boolean;
  } = {}
): Promise<{ screenshots: Buffer[] }> {
  const { steps = 10, pauseAtMiddle = false, captureScreenshots = false } = options;
  const screenshots: Buffer[] = [];

  const sourceBBox = await source.boundingBox();
  const targetBBox = await target.boundingBox();
  
  if (!sourceBBox || !targetBBox) {
    throw new Error('Could not get bounding boxes for drag elements');
  }

  const sourceCenter = {
    x: sourceBBox.x + sourceBBox.width / 2,
    y: sourceBBox.y + sourceBBox.height / 2,
  };
  const targetCenter = {
    x: targetBBox.x + targetBBox.width / 2,
    y: targetBBox.y + targetBBox.height / 2,
  };

  // Move to source and press
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.mouse.down();
  
  if (captureScreenshots) {
    screenshots.push(await page.screenshot());
  }

  // Move in steps to trigger dragenter/dragover events
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = sourceCenter.x + (targetCenter.x - sourceCenter.x) * progress;
    const y = sourceCenter.y + (targetCenter.y - sourceCenter.y) * progress;
    await page.mouse.move(x, y);
    
    if (pauseAtMiddle && i === Math.floor(steps / 2)) {
      await page.waitForTimeout(200);
      if (captureScreenshots) {
        screenshots.push(await page.screenshot());
      }
    }
  }

  // Release at target
  await page.mouse.up();
  
  if (captureScreenshots) {
    screenshots.push(await page.screenshot());
  }

  return { screenshots };
}

/**
 * Simulates touch drag for mobile testing
 */
export async function physicalTouchDrag(
  page: Page,
  source: Locator,
  target: Locator
): Promise<void> {
  const sourceBBox = await source.boundingBox();
  const targetBBox = await target.boundingBox();
  
  if (!sourceBBox || !targetBBox) {
    throw new Error('Could not get bounding boxes for touch drag');
  }

  await page.touchscreen.tap(
    sourceBBox.x + sourceBBox.width / 2,
    sourceBBox.y + sourceBBox.height / 2
  );
  
  // Swipe to target
  await page.evaluate(({ sx, sy, tx, ty }) => {
    const touch = new Touch({
      identifier: 1,
      target: document.elementFromPoint(sx, sy)!,
      clientX: sx,
      clientY: sy,
    });
    
    document.dispatchEvent(new TouchEvent('touchstart', {
      touches: [touch],
      changedTouches: [touch],
    }));
    
    // Simulate move
    const moveTouch = new Touch({
      identifier: 1,
      target: document.elementFromPoint(tx, ty)!,
      clientX: tx,
      clientY: ty,
    });
    
    document.dispatchEvent(new TouchEvent('touchmove', {
      touches: [moveTouch],
      changedTouches: [moveTouch],
    }));
    
    document.dispatchEvent(new TouchEvent('touchend', {
      touches: [],
      changedTouches: [moveTouch],
    }));
  }, {
    sx: sourceBBox.x + sourceBBox.width / 2,
    sy: sourceBBox.y + sourceBBox.height / 2,
    tx: targetBBox.x + targetBBox.width / 2,
    ty: targetBBox.y + targetBBox.height / 2,
  });
}
```

### 3.4 Puppeteer MCP Integration

Il progetto ha già Puppeteer MCP configurato. Possiamo usarlo per:

1. **Testing interattivo durante sviluppo** – Cascade può navigare e verificare visivamente
2. **Screenshot on-demand** – Cattura screenshot di componenti specifici
3. **Debug visual issues** – Ispeziona elementi e verifica stili

```typescript
// Esempio di utilizzo MCP durante sviluppo
// Cascade può eseguire:
// 1. mcp2_puppeteer_navigate({ url: 'http://localhost:5173/punch-club' })
// 2. mcp2_puppeteer_click({ selector: '[data-testid="activity-slot-job_punch_training"]' })
// 3. mcp2_puppeteer_screenshot({ name: 'activity-slot-clicked' })
```

---

## 4. Implementation Phases

### Phase VRT-0: Infrastructure Setup (4h)

**Obiettivo:** Creare l'infrastruttura Docker e configurazione base

**Deliverables:**
- [ ] `Dockerfile.visual-tests` con Playwright + Chrome/WebKit
- [ ] Script `npm run test:visual` per esecuzione locale
- [ ] Script `npm run test:visual:docker` per esecuzione in container
- [ ] Aggiornamento `playwright.config.ts` con progetto `@visual`
- [ ] Directory `tests/visual/` con struttura base
- [ ] CI workflow `.github/workflows/visual-regression.yml`

**Files:**
- `Dockerfile.visual-tests` (nuovo)
- `scripts/runVisualTests.sh` (nuovo)
- `playwright.config.ts` (modifica)
- `.github/workflows/visual-regression.yml` (nuovo)

### Phase VRT-1: Physical Interaction Helpers (4h)

**Obiettivo:** Creare utility per interazioni fisiche reali

**Deliverables:**
- [ ] `physicalDragAndDrop()` con mouse simulation step-by-step
- [ ] `physicalTouchDrag()` per mobile
- [ ] `physicalHover()` con timing configurabile
- [ ] `physicalKeyboardNav()` per accessibility testing
- [ ] Test suite per validare gli helpers

**Files:**
- `tests/utils/physicalInteraction.ts` (nuovo)
- `tests/utils/__tests__/physicalInteraction.test.ts` (nuovo)

### Phase VRT-2: Idle Village Visual Baselines (8h)

**Obiettivo:** Creare baseline screenshot per tutti i componenti Idle Village

**Componenti da coprire:**
- [ ] `ActivitySlot` – idle, hover, drag-valid, drag-invalid, active, completed
- [ ] `LocationCard` – idle, hover, bloom, locked
- [ ] `WorkerCard` – available, busy, injured, dead
- [ ] `ActiveHUD` – empty, with-activities, notifications
- [ ] `TheaterView` – closed, open, with-risk-stripes
- [ ] `ResourcePanel` – normal, low-resource-warning
- [ ] `RosterFeedback` – success, error, warning

**Files:**
- `tests/visual/idleVillage/ActivitySlot.visual.spec.ts`
- `tests/visual/idleVillage/LocationCard.visual.spec.ts`
- `tests/visual/idleVillage/WorkerCard.visual.spec.ts`
- `tests/visual/idleVillage/ActiveHUD.visual.spec.ts`
- `tests/visual/idleVillage/TheaterView.visual.spec.ts`
- `tests/visual/idleVillage/ResourcePanel.visual.spec.ts`
- `tests/visual/idleVillage/RosterFeedback.visual.spec.ts`

### Phase VRT-3: STS Visual Baselines (4h)

**Obiettivo:** Estendere le baseline STS esistenti

**Componenti da coprire:**
- [ ] `STSConsole` – già coperto, verificare completezza
- [ ] `STSHandDisplay` – card states, selection
- [ ] `STSCombatLog` – timeline entries, damage indicators
- [ ] `STSIntentVisualizer` – intent icons, predictions
- [ ] `STSAnalyzerProfiler` – charts, metrics

**Files:**
- `tests/visual/sts/STSHandDisplay.visual.spec.ts`
- `tests/visual/sts/STSCombatLog.visual.spec.ts`
- `tests/visual/sts/STSIntentVisualizer.visual.spec.ts`
- `tests/visual/sts/STSAnalyzerProfiler.visual.spec.ts`

### Phase VRT-4: Balancer Visual Baselines (4h)

**Obiettivo:** Creare baseline per componenti Balancer

**Componenti da coprire:**
- [ ] `StatSlider` – idle, dragging, at-limits
- [ ] `FormulaEditor` – syntax highlighting, errors
- [ ] `SynergyHeatmap` – color gradients, tooltips
- [ ] `RadarChart` – stat profiles

**Files:**
- `tests/visual/balancer/StatSlider.visual.spec.ts`
- `tests/visual/balancer/FormulaEditor.visual.spec.ts`
- `tests/visual/balancer/SynergyHeatmap.visual.spec.ts`
- `tests/visual/balancer/RadarChart.visual.spec.ts`

### Phase VRT-5: Mobile Visual Testing (4h)

**Obiettivo:** Visual regression per viewport mobile

**Deliverables:**
- [ ] Baseline per layout stacked
- [ ] Touch feedback visuals
- [ ] Picker modal styling
- [ ] Mobile-specific animations

**Files:**
- `tests/visual/mobile/IdleVillageMobile.visual.spec.ts`
- `tests/visual/mobile/PunchClubMobile.visual.spec.ts`

### Phase VRT-6: CI Integration & Documentation (4h)

**Obiettivo:** Integrazione completa in CI e documentazione

**Deliverables:**
- [ ] GitHub Actions workflow con artifact upload
- [ ] Baseline update workflow (manual trigger)
- [ ] PR comment con diff images
- [ ] Documentazione in `PLAYWRIGHT_GUIDE.md`
- [ ] Runbook per gestione baseline

**Files:**
- `.github/workflows/visual-regression.yml` (completo)
- `docs/tests/PLAYWRIGHT_GUIDE.md` (aggiornamento)
- `docs/tests/VISUAL_REGRESSION_RUNBOOK.md` (nuovo)

---

## 5. Configurazione Playwright Proposta

```typescript
// playwright.config.ts (aggiornamenti)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ... existing config ...
  
  projects: [
    // ... existing projects ...
    
    // Visual regression project (Docker only)
    {
      name: 'Visual Regression',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Disable animations for consistent screenshots
        launchOptions: {
          args: ['--force-prefers-reduced-motion'],
        },
      },
      // Only run in Docker for consistency
      grep: /@visual/,
    },
    
    // Mobile visual regression
    {
      name: 'Visual Regression Mobile',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['iPhone 14 Pro'],
        launchOptions: {
          args: ['--force-prefers-reduced-motion'],
        },
      },
      grep: /@visual.*@mobile/,
    },
  ],
  
  // Snapshot configuration
  expect: {
    toHaveScreenshot: {
      // Allow 0.1% pixel difference
      maxDiffPixelRatio: 0.001,
      // Threshold for color difference
      threshold: 0.2,
      // Animations must be disabled
      animations: 'disabled',
    },
  },
  
  // Snapshot path template
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
});
```

---

## 6. Script npm Proposti

```json
{
  "scripts": {
    "test:visual": "playwright test --grep @visual",
    "test:visual:update": "playwright test --grep @visual --update-snapshots",
    "test:visual:docker": "docker run --rm -v ${PWD}:/app -w /app visual-tests",
    "test:visual:docker:update": "docker run --rm -v ${PWD}:/app -w /app visual-tests --update-snapshots",
    "visual:build-docker": "docker build -t visual-tests -f Dockerfile.visual-tests .",
    "test:physical": "playwright test --grep @physical"
  }
}
```

---

## 7. KPI e Metriche

### 7.1 Coverage Target

| Area | Componenti | Baseline Target | Timeline |
|------|------------|-----------------|----------|
| Idle Village | 7 | 28 screenshots | Phase VRT-2 |
| STS | 5 | 15 screenshots | Phase VRT-3 |
| Balancer | 4 | 12 screenshots | Phase VRT-4 |
| Mobile | 2 | 8 screenshots | Phase VRT-5 |
| **Totale** | **18** | **63 screenshots** | **32h** |

### 7.2 Success Metrics

- **Visual Regression Detection Rate:** 100% delle regressioni visive rilevate
- **False Positive Rate:** < 5% (grazie a Docker)
- **CI Execution Time:** < 5 minuti per suite completa
- **Baseline Update Frequency:** < 1x/settimana (solo per cambiamenti intenzionali)

### 7.3 Quality Gates

- [ ] Tutti i test visual passano in CI
- [ ] Nessun screenshot mancante per componenti critici
- [ ] Docker image buildabile e funzionante
- [ ] Documentazione completa e aggiornata

---

## 8. Estensioni Future

### 8.1 Storybook Integration

Aggiungere Storybook per:
- Component isolation testing
- Visual documentation
- Design system showcase

### 8.2 Percy/Applitools Integration

Per progetti enterprise:
- Cloud-based visual testing
- Cross-browser screenshots
- AI-powered diff detection

### 8.3 Accessibility Visual Testing

Combinare visual regression con:
- Color contrast verification
- Focus indicator visibility
- Screen reader compatibility

### 8.4 Performance Visual Testing

Aggiungere metriche visive per:
- Layout shift detection (CLS)
- First contentful paint screenshots
- Animation smoothness

---

## 9. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Screenshot flaky | Media | Alto | Docker environment |
| Baseline drift | Bassa | Medio | Review process per update |
| CI slow | Media | Medio | Parallelizzazione, caching |
| Storage bloat | Bassa | Basso | Git LFS per snapshots |

---

## 10. Riferimenti

### Documentazione Progetto
- `docs/tests/PLAYWRIGHT_GUIDE.md` – Guida esistente
- `tests/fixtures/villageSandbox.ts` – Fixtures esistenti
- `playwright.config.ts` – Configurazione attuale

### Ricerca Online
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Docker + Playwright for Consistent Screenshots](https://markus.oberlehner.net/blog/running-visual-regression-tests-with-storybook-and-playwright-for-free)
- [Physical Drag-and-Drop Testing](https://reflect.run/articles/how-to-test-drag-and-drop-interactions-in-playwright/)

### Tecnologie
- **Playwright 1.50+** – Visual regression built-in
- **Docker** – Environment consistency
- **Puppeteer MCP** – AI-assisted testing (già disponibile)

---

## 11. Approvazione

| Ruolo | Nome | Data | Firma |
|-------|------|------|-------|
| Strategist | Cascade | 2026-01-15 | ✅ |
| Coordinator | - | - | ⏳ |
| User | - | - | ⏳ |

---

**Prossimo passo:** Approvazione utente e registrazione in `strategy_tasks.md`
