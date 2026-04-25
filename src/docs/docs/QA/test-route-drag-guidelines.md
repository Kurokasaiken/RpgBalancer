# Test Route Drag & Visual QA Mandate

This document defines how every automation suite targeting the `/test` route (Idle Village TestRosterPage) must verify drag-and-drop behavior, visual treatments, and diagnostics to prevent regressioni ottiche non rilevabili con test puramente DOM.

## 1. Scope & Reference Surface

- **Authoritative surface**: `TestRosterPage` montata sul percorso `/test`, che espone WorkerPanel + ResidentSlotRack con DragProvider e Style Lab tokens configurati (@src/ui/idleVillage/TestRosterPage.tsx).
- **Persona target**: QA automation, Idle Village feature squad, Style Lab maintainers.
- **Obiettivo**: ogni suite che tocca il drag/resident assignment deve usare questa pagina per garantire parità con Minimal Gameplay senza dipendere dal loop completo.

## 2. Visual Regression Workflow

1. **Strumenti**: Playwright test runner + Pixelmatch baseline (`@playwright/test` `toMatchSnapshot`). Per gradienti complessi è consentito (ma non obbligatorio) integrare Applitools se Pixelmatch produce falsi positivi.
2. **Baselines**:
   - Cartella: `test-results/vrt-baseline/test-route/<spec-name>/` versionata via git LFS (necessario per immagini).
   - Convenzione file: `{viewport}-{state}.png` (es. `desktop-slot-valid.png`).
3. **Pipeline**:
   - Primo run approvato produce baseline via `npx playwright test --update-snapshots`.
   - Ogni PR esegue `npx playwright test --project=chromium --grep @test-route --workers=1 --trace=on` e confronta con baseline.
4. **Review**:
   - Differenze >0.5% pixel count richiedono analisi manuale su Playwright report + Applitools (se configurato).
   - Screenshot artefatti devono essere rigenerati solo dopo conferma design.

## 3. Drag Simulation Protocol

- **Niente dispatch sintetici**: usare esclusivamente `page.mouse`/`page.touchscreen` con coordinate reali.
- **Helper condiviso**: creare/riusare `tests/utils/dragActions.ts` con API `dragElement(page, sourceLocator, targetLocator, { steps, midAssertions })` che:
  1. Risolve bounding boxes (`locator.boundingBox()`), calcola centro/touch point.
  2. Esegue `mouse.move -> mouse.down -> mouse.move(target)` con `steps ≥ 10` per sbloccare sensori dnd-kit.
  3. Supporta callback `onIntermediateMove` per fermarsi su drop zone e validare stati.
- **Touch fallback**: per layout mobile usare `page.touchscreen.tap` + `touchstart/move/end` con gli stessi helper (flag `inputMode: 'touch'`).

## Auto-Seeding Residents

All tests should auto-seed residents to ensure consistent test execution:

```typescript
const CHARACTER_STORAGE_KEY = 'idle_combat_characters';
const FALLBACK_RESIDENTS = [/* ... */];

const seedIfNeeded = async (page: Page): Promise<number> => {
  const cards = page.getByTestId('pg-card');
  const count = await cards.count().catch(() => 0);
  if (count > 0) return count;

  console.log('📦 Auto-seeding Character Manager');
  await page.goto('/');
  await page.evaluate(({ key, dataset }) => {
    localStorage.setItem(key, JSON.stringify(dataset));
    window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
  }, { key: CHARACTER_STORAGE_KEY, dataset: FALLBACK_RESIDENTS });

  await page.goto('/test');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();
  await page.waitForTimeout(1200);
  return page.getByTestId('pg-card').count();
};
```

## Slot Helper Functions

Use consistent slot selectors throughout all tests:

```typescript
const slotButton = (page: Page, slotId: string) => page.getByTestId(`slot-button-${slotId}`);
const slotContainer = (page: Page, slotId: string) => page.locator(`[data-slot-id="${slotId}"][role="listitem"]`);
```

## Drag Operations

Use the enhanced `dragElement` helper that supports both Locator and coordinates:

```typescript
import { dragElement } from '../../utils/dragActions';

// Drag to slot
await dragElement(page, residentCard, targetSlot, { steps: 12 });

// Drag to outside point
await dragElement(page, residentCard, { x: 100, y: 100 }, { steps: 12 });
```

## 4. Mid-Drag Feedback Assertions

Per replicare bug come bloom non visibile o stato invalid opaco:

1. **Pausa a metà drag**: usare l'hook `onIntermediateMove` per attendere `page.waitForTimeout(50)` e ispezionare attributi.
2. **Valid state checks**: `data-drop-state="valid"`, classe `bg-linear-to-br from-emerald-400/25...` (bloom) e `pointer-events-auto` (@src/ui/idleVillage/components/ActivitySlot.tsx).
3. **Invalid state checks**: `data-drop-state="invalid"`, `opacity-50`, `pointer-events-none`, ring bianco/alpha (non rose) per indicare non-toccabile (RackScenarioPanel copy @src/ui/idleVillage/TestRosterPage.tsx#294-333).
4. **Placeholder/Shadow**: verificare la presenza di `data-testid="slot-placeholder"` o gradienti configurati nel Style Lab.
5. **Telemetry**: monitorare eventi `slot_lab_resident_assigned` / `_failed` emit (@src/ui/idleVillage/TestRosterPage.tsx#620-643) per correlare con screenshot.

## 5. Component Test Layer (Playwright CT)

- Per validare casi limite (validator personalizzato, crew full, etc.) montare WorkerPanel/ResidentSlotRack isolati usando Playwright Component Testing con fixture che inietta `SLOT_LAB_CONFIG` e mocka PersistenceService.
- CT deve verificare: animazioni, placeholder, error copy senza dipendere da IdleVillageConfig async load.
- I CT non sostituiscono gli e2e `/test`, ma riducono tempi di debug.

## 6. Trace & Diagnostics

- Obbligatorio eseguire test con `--trace=on` (o `retain-on-failure`).
- Artefatti salvati in `test-results/traces/test-route/<spec>/<timestamp>/`.
- Al fallimento allegare: trace.zip, screenshot diff, log Playwright.
- Per riproduzione manuale usare `npx playwright show-trace <trace.zip>` e verificare coordinate mouse.

## 7. Governance & Acceptance Gates

1. **Spec tagging**: tutte le suite devono avere `test.describe.configure({ mode: 'serial' })` + tag `@test-route` per orchestrazione CI.
2. **Checks obbligatori**:
   - `npm run test -- tests/e2e/idleVillage --grep @test-route`
   - `npm run build:check`
   - `npm run kanban:lint`
3. **Evidence**: log principale `test-results/test-route-drag-vrt-<YYYYMMDD>.log` elenca output test, baseline diff, trace path.
4. **Kanban**: chi consegna nuovi test aggiorna la riga su agent_assignments (`In corso` → `Completato`) e riporta evidence nel log (vedi memoria Guardian).

## 8. Checklist per nuove suite

- [ ] Importa helper di drag reale (`dragElement`).
- [ ] Esegue screenshot baseline prima/dopo drop.
- [ ] Asserisce stati visivi (bloom, invalid opacity, tooltip copy) mentre il mouse è sopra slot.
- [ ] Registra trace e allega link nel report CI.
- [ ] Aggiorna doc se introduce nuovi feedback visivi/config.

## Appendix – Rotte e selettori chiave

| Elemento | Locator | Note |
| --- | --- | --- |
| Surface principale | `\[data-testid="test-roster-page"\]` | Verifica caricamento harness. |
| Worker roster | `\[data-testid="village-roster-section"\]` | Fonte dei draggable `pg-card`. |
| Slot rack permissivo | `\[data-testid="slot-lab-panel-open"\]` / `\[data-slot-id="slot-lab-open-slot-*"\]` | `data-drop-state` = `valid\|idle\|invalid`, pulsante `Clear` visibile solo se assegnato. |
| Slot rack restrittivo | `\[data-testid="slot-lab-panel-restricted"\]` / `\[data-slot-id="slot-lab-restricted-slot-*"\]` | Usa stessi attributi, ottimo per assert `invalid`. |
| Slot button | `\[data-testid="slot-button-${slotId}"\]` | Target reale per `dragElement`; matcha `slot-lab-{scenario}-slot-{index}`. |
| Picker | `\[data-testid="certified-worker-picker"\]` | Innesca telemetry `slot_lab_picker_*`. |

---
Per qualsiasi nuovo requisito visivo (nuove palette Style Lab, nuovi stati drop), aggiornare questo documento e notificare QA/Style Lab tramite il canale #idle-village-testing.
