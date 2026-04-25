<!-- markdownlint-disable MD013 MD024 MD040 -->

# Playwright Guide – Idle Village / Punch Club Lab Testing

Questa guida raccoglie le istruzioni operative per eseguire le suite Playwright della Village Sandbox (in particolare Punch Club e WS6.3) in ambiente di sviluppo locale (lab only). Non sono inclusi test PWA o mobile deployment.

## Setup rapido

1. Installare le dipendenze Playwright (una volta sola):

   ```bash
   npx playwright install --with-deps
   ```

2. Avviare il server di sviluppo locale:

   ```bash
   npm run dev
   ```

3. Eseguire i test in ambiente locale.

## Script npm principali

| Script | Descrizione |
| --- | --- |
| `npm run test:punch-club` | Esegue le spec Punch Club (`touch-mode`, `preserve-state`, `worker-picker`, `landing`) in Desktop Chrome + Mobile Chrome con trace/video abilitati. |
| `npm run test -- tests/punch-club-landing.spec.ts` | Esegue la spec landing page locale (progetti configurati in `playwright.config.ts`). |
| `npm run test -- tests/punch-club-touch-mode.spec.ts` | Esegue una singola spec (progetti configurati in `playwright.config.ts`). |
| `npm run test -- tests/villageSandbox-drag-assign.spec.ts` | Suite legacy per drag desktop. |
| `npm run test:visual` | Esegue tutte le spec con tag `@visual` usando il progetto "Visual Regression". |
| `npm run test:visual:update` | Aggiorna i baseline snapshot (da usare solo dopo review visiva). |
| `npm run test:visual:docker` | Esegue `@visual` all'interno dell'immagine `visual-tests` per garantire screenshot coerenti. |
| `npm run visual:build-docker` | Builda l'immagine `visual-tests` basata su Playwright v1.50. |
| `npm run test:physical` | Esegue soltanto le spec marcate `@physical` che usano gli helper real-mouse/touch. |

> Nota: `test:punch-club` viene definito in `package.json` e usa `npx playwright test tests/punch-club-*.spec.ts --project="Desktop Chrome" --project="Mobile Chrome" --trace on --video on`.

## Hook sandbox disponibili

Durante i test la pagina espone vari flag su `window` per controllare il comportamento della sandbox. Usali tramite le fixture in `tests/fixtures/villageSandbox.ts`.

### Interaction mode override

```ts
await seedVillageSandbox(page, { tabId: 'punchClub', interactionMode: 'tap' });
// Internamente imposta window.__sandboxInteractionMode = 'tap'
```

Modalità supportate: `tap`, `drag`, `hybrid`. Il hook `useSandboxInteractionMode` legge anche l’attributo `data-sandbox-interaction-override` sul `<html>`: evita di settarlo manualmente, preferisci `seedVillageSandbox`.

### Preserve state

```ts
await seedVillageSandbox(page, { preserveState: true });
// Salva lo snapshot corrente su window.__sandboxPreserveState
```

### Seed override per SkillCheck randomness

```ts
await page.evaluate(() => {
  window.__skillCheckSeedOverride = 'test-seed-123';
});
// Ora la pagina usa questo seed per generare stat deterministiche
```

Imposta `window.__skillCheckSeedOverride` a una stringa fissa prima di caricare la pagina SkillCheck per ottenere stat riproducibili. Utile per test variabilità: setta seed A, cattura stat, cambia a seed B, verifica differenza. Se unset, la pagina usa randomness nativa. Supporta anche funzione `() => string | undefined` per override dinamico.

### Telemetria KPI

```ts
const telemetry = await collectSandboxTelemetry(page);
// -> { events: [...], metrics: { tap_per_assignment: ..., assignment_latency_ms: ... } }
```

Il worker picker e gli interaction hook scrivono su `window.__sandboxTelemetry`:

- `events`: sequenza di eventi (`picker_open`, `picker_assign`, `drag_drop`, ecc.).
- `metrics`: aggregati (tap count, avg latency, picker close rate).

Usa questi valori nelle spec mobile per asserire KPI (<450 ms latency, ≥98% close rate).

## Helper Playwright disponibili

File chiave:

- `tests/fixtures/villageSandbox.ts`
  - `seedVillageSandbox(page, { tabId, interactionMode, preserveState })`
  - `collectSandboxTelemetry(page)`
  - `clearSandboxState(page)` _(da aggiungere se la spec richiede reset)_
- `tests/utils/sandbox.ts`
  - `openPicker(page, slotId)`

## Appendice: Diagnostics Panel QA

Per verificare rapidamente la diagnostica mentre si esegue una spec (es. Punch Club touch-mode):

1. Abilita gli hook QA prima di navigare:

   ```ts
   await page.evaluate(() => {
     window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
   });
   ```

   In alternativa, chiama `enableSandboxDiagnostics(page)` se usi le fixture.

2. Una volta caricata la sandbox, apri la console DevTools e assicurati che appaia il pannello **"Sandbox Diagnostics"** in basso a destra.

3. Filtra i log per canale dal select (Picker, Validators, Risk, Theater) mentre esegui l’azione sotto test (es. drag resident → validators, hover theater → theater).

4. Premi **Export** per salvare un JSON dei log e allegarlo alla segnalazione Playwright; usa **Clear** per resettare lo stream prima di riprodurre un bug.

5. Durante il QA manuale, verifica che i log più recenti riflettano timestamp coerenti con l’interazione e che eventuali errori siano evidenziati in rosso.

> Se il pannello non appare, assicurati che `__ENABLE_IDLE_VILLAGE_TEST_HOOKS` sia `true` e che non vi siano override CSS che nascondono l’overlay (z-index 9999). In CI il pannello è reso automaticamente nelle build test.

- `assignViaPicker(page, residentId)`
- `collectTelemetry(page)`

Importali invece di replicare click/drag manuali; questo garantisce consistenza con gli hook.

## Visual Regression & Physical Interaction Testing

La suite Playwright ora include una pipeline dedicata per validare componenti “fisici” (Idle Village, STS, Balancer). Il riferimento strategico è `docs/plans/physical_e2e_testing_plan.md`.

### Directory struttura

```text
tests/visual/
├── idleVillage/
├── sts/
├── balancer/
└── mobile/
```

Ogni spec segue la convenzione `ComponentName.visual.spec.ts` e include il tag `@visual` (aggiungi `@mobile` per layout mobile). I baseline si trovano accanto alle spec (`__snapshots__`) e **devono** essere generati via Docker per evitare drift tra OS.

### Esecuzione consigliata

```bash
# Locale rapido
npm run test:visual

# Aggiorna baseline solo dopo review visiva
npm run test:visual:update

# Ambiente coerente (Docker / CI)
npm run visual:build-docker   # prima esecuzione
npm run test:visual:docker
```

Il workflow `.github/workflows/visual-regression.yml` avvia `npm run test:visual:docker` su ogni PR/push, carica i diff (`*-diff.png`) come artifact e commenta sul PR con le istruzioni per eventuali update (`Run workflow → update_baselines`).

### Physical Interaction Helpers

Per simulare drag-and-drop realistici, gesti touch o hover prolungati usa gli helper in `tests/utils/physicalInteraction.ts`:

```typescript
import {
  physicalDragAndDrop,
  physicalTouchDrag,
  physicalHover,
  physicalKeyboardNav,
} from '../utils/physicalInteraction';

await physicalDragAndDrop(page, resident, slot, {
  steps: 15,
  pauseAtMiddle: true,
  captureScreenshots: true,
});
```

Tagga la spec con `@physical` per filtrarla (`npm run test:physical`). Combina sempre uno screenshot con un’asserzione semantica (telemetria, stato config) per garantire che il comportamento sia corretto oltre all’aspetto visivo.

### Best practice

1. Aggiorna i baseline solo via Docker (`npm run test:visual:docker:update`).
2. Disabilita/attendi le animazioni (`await page.waitForTimeout(100)` o `waitForTransition`).
3. Usa `physicalTouchDrag` per test mobile: riproduce eventi `touchstart/move/end` reali.
4. Versiona gli screenshot con commit separati e descrivi sempre i diff nel PR.

## Esecuzione delle nuove spec WS6.3

1. **Touch mode KPI**
   - `tests/punch-club-touch-mode.spec.ts`
   - Flusso: seed → tap slot → assignment → assert `telemetry.metrics.assignment_latency_ms < 450` & `picker_close_within_target ≥ 98%`.
   - Allega screenshot HUD (`page.screenshot`).

2. **Desktop drag fallback**
   - `tests/punch-club-touch-mode.spec.ts` (descrizione `Drag desktop`).
   - Asserisce che il picker non si apre e che il drag completa l’assegnamento.

3. **Preserve state**
   - `tests/punch-club-preserve-state.spec.ts`
   - Flusso: seed con `preserveState: true` → assegna → `page.reload()` → verifica che il resident resti assegnato e che `telemetry.events` non contenga “reset”.

4. **Worker picker approfondito**
   - `tests/punch-club-worker-picker.spec.ts`
   - Esteso per aprire/chiudere più volte, verificare candidate list, e tracciare la telemetria `assignment_interaction` con KPI latency/close rate.

5. **Mobile landing page**
   - `tests/punch-club-landing.spec.ts`
   - Flusso: visita `/punch-club` → verifica redirect automatico a `/punch-club-mobile` su mobile, verifica opt-out persistente, verifica che desktop non venga reindirizzato.
   - Usa fixture `visitPunchClubLanding` per simulazione device e telemetria.

Esecuzione consigliata:

```bash
npm run test:punch-club
npx playwright test tests/punch-club-touch-mode.spec.ts --project="Mobile Chrome" --headed
npm run lint -- tests
```

## Mobile Playtest Logger CLI

Dopo aver completato i test Playwright, usa il CLI `mobilePlaytestLogger.ts` per registrare i risultati dei playtest mobili:

```bash
# Log non-interattivo (passa KPI da CLI)
npm run playtest:log -- \
  --session punch-club-mobile --tester QA-A1 --device Pixel8 \
  --cycle-duration=84000,90000 --taps-per-assignment=3,2,2 \
  --assignment-latency=410,450 --picker-close-rate=98 \
  --resource-gold=12 --resource-food=3 \
  --notes "Punch Club touch-mode QA"

# Import telemetria con output multipli (default telemetry.json)
npm run playtest:log -- --import telemetry.json --format json,markdown,csv

# Modalità interattiva (solo debug locale)
npm run playtest:log:interactive -- --import data/runs/mobile_playtests/sample.json
```

Replay:

```bash
# Summary/samples/CSV non-interattivo
npm run playtest:replay -- data/runs/mobile_playtests/sample.json \
  --replay-mode all --format csv

# Prompt summary/samples/csv/quit (dev-only)
npm run playtest:replay:interactive -- data/runs/mobile_playtests/sample.json
```

Il CLI salva i report in `data/runs/mobile_playtests/` con timestamp. Usa la variante interattiva solo per workshop manuali; i log CI devono passare tutti i KPI via flag o import.

## VillageSandbox Layout QA Suite

Suite di test per verificare il layout di VillageSandbox (board vs stacked).

### Forzare Layout Stacked

Il layout stacked è attivato automaticamente su viewport mobile (< 1024px) via Tailwind `lg:` breakpoint.

Per forzare manualmente in test:

```typescript
// In fixture o test
await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport
// Il componente rileva e usa layout='stacked'
```

### Interpretazione Output

- **village-sandbox-columns-board**: Layout desktop a griglia (3 colonne lg, sinistra 2 span).
- **village-sandbox-columns-stacked**: Layout mobile flex-col (sinistra prima, destra dopo).
- **Gap**: 16px (gap-4) su board, 8px (gap-2) su stacked.
- **Ordine DOM**: Stacked mantiene ordine logico (roster/HUD prima, poi Active HUD).

Esecuzione:

```bash
npx playwright test tests/villageSandbox-layout.spec.ts --project="Mobile Chrome"
```

Risultati attesi: Stacked verifica ordine verticale, spaziatura, headings visibili.

## Skill Check Preview V6 QA Suite

Suite di test Playwright per verificare la generazione casuale delle stat e il timing dello shake durante i roll dei dadi nella Skill Check Preview V6.

Scenari coperti:

- **Stat Randomness**: Click regenerate → verifica stat diverse.
- **Shake Timing**: Click "Ritira dado" → attendi animazione senza errori console.
- **Regression**: Caricamento pagina e presenza elementi chiave.

Esecuzione:

```bash
npx playwright test tests/skill-check-preview.spec.ts --project="Desktop Chrome"
```

Interpretazione risultati:

- ✅ Stat Randomness: Almeno una stat diversa dopo click regenerate (randomness funziona).
- ✅ Shake Timing: Nessun errore console, canvas e pulsante ancora funzionanti post-animazione.
- ✅ Regression: Elementi chiave presenti (titolo, canvas, stat rows).

## Seed/Bootstrap Resiliency for Playwright Suites

Per stabilizzare i test Playwright che usano `seedVillageSandbox` e prevenire timeout, sono stati aggiunti diagnosi dettagliate, wait app-shell con logging, e helper per forzare preset.

### Diagnosi in seedVillageSandbox

`seedVillageSandbox` ora logga:

- Opzioni passate (tabId, forcedPresetId, etc.)
- Preset attivo via `window.__idleVillageTestHooks?.getShellPresetDiagnostics()?.activeShellPresetId`
- `__idleVillageReady` flag
- Errori console catturati durante seeding

Log esempio:

```
[seedVillageSandbox] Starting seed with options: { targetTab: 'map', forcedPresetId: 'punch_club_light', ... }
[seedVillageSandbox] Active preset: punch_club_light
[seedVillageSandbox] __idleVillageReady: true
```

Garantisce attesa su `[data-testid="village-sandbox-layout"]` prima di procedere.

### Logging Readiness in navigateToIdleVillageTab

`navigateToIdleVillageTab` ora include:

- Wait app-shell su `[data-testid="app-loaded"]` con logging timeout
- Logging readiness diagnostics prima/dopo idle-ready wait
- Diagnosi includono URL, ready flag, test hooks, nav controls, layout visibility

Sequenza seed/reseed:

1. Enable test hooks
2. Goto '/'
3. Wait app-shell con logging
4. Wait idle-ready con logging
5. Wait nav controls
6. Activate tab
7. Ensure layout visible
8. Wait test hooks

### Helper per forzare preset

Usa `forceShellPreset(page, presetId)` per impostare `window.__IDLE_VILLAGE_FORCED_SHELL_PRESET` prima di navigare.

Esempio:

```typescript
await forceShellPreset(page, 'punch_club_light');
await seedVillageSandbox(page, { tabId: 'punchClub' });
```

Se hook disponibile, chiama direttamente `hooks.forceShellPreset`, altrimenti usa flag e reload.

Utile per test che richiedono preset specifico senza passare via `forcedPresetId`.

### Esecuzione diagnostica

Per debug timeout, controlla console logs per app-shell, readiness diagnostics, preset attivo, ready flag, errori console. Se timeout persistente, aumenta timeout o verifica configurazione preset.

## Punch Club Mobile Playtest Checklist

Checklist formale per playtest mobile del loop Gym→Rest→Bout, integrando metriche Mind Studios (CTA chiare, tap ≤3, risk telemetry leggibile) e collegamento ai preset config-first.

### Metriche obbligatorie per ogni sessione

- **Tempo ciclo completo**: secondi dalla schermata Gym iniziale alla fine del Bout (target: <45s)
- **#tap su picker**: numero di tap necessari per completare un assignment (target: ≤3 tap)
- **Delta gold/food**: variazione risorse dopo ciclo completo (es. "+50 gold, -2 food")
- **Risk stripe reading**: % injury/death leggibile senza zoom (target: bande verticali chiare)

### Checklist step-by-step

#### Setup Device

- [ ] Apri browser mobile (Chrome/iOS Safari) in modalità incognito
- [ ] Naviga a `/punch-club` (usare preset Punch Club attivo)
- [ ] Consenti notifiche se richieste per PWA install
- [ ] Verifica caricamento: schermata Gym visibile entro 3s

#### Consent Logger

- [ ] Esegui `npm run playtest:log -- --session punch-club-mobile --notes "Checklist GT-3"`
- [ ] Inserisci identificativo tester nel campo "tester"
- [ ] Accetta consenso telemetria nel banner PWA
- [ ] Verifica hook attivo: `window.__sandboxTelemetry` popolato

#### Run Gym→Rest→Bout

- [ ] **Gym phase**: seleziona attività, monitora tap count su picker (≤3 tap target)
- [ ] **Rest phase**: attendi completamento automatico, osserva risk stripes
- [ ] **Bout phase**: completa combattimento, conta tap totali per ciclo
- [ ] Documenta feedback immediato: CTA chiare? Input lag? Leggibilità mobile?

#### Esporta Log

- [ ] Premi Ctrl+C nel terminale logger per completare sessione
- [ ] Verifica generazione coppia `data/runs/mobile_playtests/<timestamp>-punch-club-mobile.{json,md}`
- [ ] Controlla metriche: tempo ciclo, tap count, delta risorse popolati automaticamente
- [ ] Allega screenshot bande risk se feedback qualitativo necessario

### Config-first collegamento

- **Preset Punch Club**: `data/presets/punch_club_light.json`
- **Stat weights**: `src/balancing/config/statWeights.ts`
- **Telemetria**: `scripts/mobilePlaytestLogger.ts` con tag `cta_latency_ms`, `picker_tap_count`
- **Risk display**: `src/ui/punchClub/calculateQuestRiskPercentages.ts`

### Esecuzione con Playwright

```bash
# Test mobile completo
npm run test:punch-club

# Verifica risk stripes su mobile
npx playwright test tests/punch-club-touch-mode.spec.ts --project="Mobile Chrome"

# Logger CLI con import telemetria
npm run playtest:log -- --import data/runs/mobile_playtests/sample.json
```

## Mobile Playtest Logger Integration (KS-058)

Integrazione automatica tra Playwright tests e mobilePlaytestLogger CLI per raccolta telemetria post-test con session tagging automatico.

### Architettura dell'Integrazione

```
Playwright Test → Telemetry Capture → Session Storage Tag → Post-Test CLI → Mobile Logs
```

**Componenti chiave:**

- `tests/helpers/playwrightTelemetryHelper.ts` - Estrae telemetria da `window.__sandboxTelemetry`
- `tests/helpers/sessionTagHelper.ts` - Gestisce automaticamente session tagging da sessionStorage
- `scripts/postTestMobileLogger.ts` - Workflow post-test che chiama mobilePlaytestLogger CLI
- `tests/helpers/mobileLoggerFixtures.ts` - Fixtures Playwright integrate

### Setup Rapido

1. **Configurazione base** (già inclusa in `playwright.config.ts`):

```typescript
import { mobileLoggerConfig } from './tests/helpers/mobileLoggerConfig';
export default mobileLoggerConfig;
```

1. **Utilizzo nei test**:

```typescript
import { test, expect } from '../tests/helpers/mobileLoggerFixtures';

test('punch club mobile telemetry', async ({ page, mobileLogger }) => {
  await page.goto('/punch-club');
  
  // Session tag automatico: mobileLogger.sessionTag
  console.log('Session tag:', mobileLogger.sessionTag);
  
  // Validazione storage
  const storageValid = await mobileLogger.validateStorage();
  expect(storageValid).toBe(true);
  
  // Test logic...
  
  // Telemetry catturata automaticamente post-test
  // Oppure manuale: const file = await mobileLogger.captureTelemetry();
});
```

### Funzionalità Automatiche

#### Session Tagging

- **Generazione automatica**: `playwright-{test-slug}-{timestamp}`
- **Storage**: sessionStorage con key `punch-club-session-tag`
- **KPI target**: <5s per read/write operations
- **Fallback**: genera tag anche se sessionStorage non disponibile

#### Telemetry Capture

- **Source**: `window.__sandboxTelemetry` (events, metrics, sessionId)
- **Output**: `test-results/telemetry/telemetry-{test-slug}-{timestamp}.json`
- **Attachments**: Allegati automatici ai test results Playwright
- **Format**: Structured snapshot con test metadata

#### Post-Test Processing

- **Trigger**: Automatico in `globalTeardown` Playwright
- **Script**: `scripts/postTestMobileLogger.ts`
- **Processing**: Chiama mobilePlaytestLogger CLI per ogni telemetry file
- **Output**: Logs in `data/runs/mobile_playtests/` (JSON + Markdown)
- **Summary**: Report in `test-results/mobile-logger-summary.md`

### Esecuzione con Integrazione

```bash
# Test con telemetria automatica
npx playwright test tests/punch-club-*.spec.ts

# Solo test mobile con integration
npx playwright test tests/punch-club-touch-mode.spec.ts --project="Mobile Chrome"

# Verifica output post-test
ls test-results/telemetry/
ls data/runs/mobile_playtests/
cat test-results/mobile-logger-summary.md
```

### Output Attesi

**1. Telemetry Files** (`test-results/telemetry/`):

```json
{
  "sessionId": "playwright-punch-club-mobile-2026-01-07T15-30-00",
  "sessionTag": "playwright-punch-club-mobile-2026-01-07-15-30-00",
  "events": [...],
  "testInfo": {
    "title": "punch club mobile telemetry",
    "file": "tests/punch-club-mobile.spec.ts"
  },
  "extractedAt": "2026-01-07T15:30:05.123Z"
}
```

**2. Mobile Logger Logs** (`data/runs/mobile_playtests/`):

- Formato standard MobilePlaytestLog (JSON + Markdown)
- Metriche derivate da telemetry events
- Session tag propagato automaticamente

**3. Integration Summary** (`test-results/mobile-logger-summary.md`):

- Report di tutti i test processati
- Success/failure rates
- Link ai log files generati

### Configurazione Avanzata

#### Custom Session Tag

```typescript
import { setSessionTag } from '../tests/helpers/sessionTagHelper';

test('custom session tag', async ({ page }) => {
  await setSessionTag(page, 'custom-test-session');
  // ...test logic
});
```

#### Manual Telemetry Capture

```typescript
import { captureAndSaveTelemetry } from '../tests/helpers/playwrightTelemetryHelper';

test.afterEach(async ({ page }, testInfo) => {
  const telemetryFile = await captureAndSaveTelemetry(page, testInfo);
  console.log('Telemetry saved:', telemetryFile);
});
```

#### Disabilitazione Integrazione

```typescript
// In playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    // Rimuovi mobileLoggerReporter per disabilitare
  ],
  globalSetup: undefined, // Disabilita setup automatico
  globalTeardown: undefined, // Disabilita post-test workflow
});
```

### Troubleshooting

#### Session Storage Issues

```
⚠️  SessionStorage not available - session tagging disabled
```

**Fix**: Verifica browser context, privacy settings, o usa fallback automatico

#### KPI Violations

```
⚠️  Session tag KPI violation: 6234ms (target: <5000ms)
```

**Fix**: Performance issue del browser, non bloccante

#### Telemetry Not Found

```
📂 No telemetry files found, skipping post-test workflow
```

**Fix**: Verifica che `window.__sandboxTelemetry` sia popolato nell'applicazione

#### CLI Processing Failures

```bash
❌ Post-test workflow failed with code 1
```

**Fix**: Controlla `test-results/mobile-logger-summary.md` per dettagli errori

### Integrazione con CI/CD

```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests with mobile logger
  run: npx playwright test
  
- name: Upload telemetry artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: telemetry-reports
    path: |
      test-results/telemetry/
      data/runs/mobile_playtests/
      test-results/mobile-logger-summary.md
```

### Metriche Monitorate

- **Telemetry Collection Rate**: % test con telemetria catturata
- **Session Tag Success Rate**: % test con tagging funzionante
- **Processing Success Rate**: % telemetry file processati con successo
- **KPI Compliance**: % operazioni sessionStorage <5s
- **End-to-End Latency**: Tempo totale da test completion a log generation

## E2E Mobile Logger Integration (KS-066)

Integrazione completa E2E tra Playwright tests e mobilePlaytestLogger CLI con mobile tests abilitati e workflow automatico post-test.

### Configurazione E2E

**Playwright Config Abilitato:**

```typescript
// Mobile projects abilitati in playwright.config.ts
projects: [
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 14 Pro'] },
    testMatch: '**/*mobile*.spec.ts',
    testIgnore: '**/*touch-mode*.spec.ts',
  },
  {
    name: 'Mobile Chrome', 
    use: { ...devices['Pixel 7'] },
    testMatch: '**/*mobile*.spec.ts,**/*touch-mode*.spec.ts',
  },
]
```

**Global Hooks Integrati:**

- `globalSetup`: Crea directory `test-results/telemetry/`
- `globalTeardown`: Esegue `postTestMobileLogger.ts` automaticamente
- `mobileLoggerReporter`: Traccia raccolta telemetria per ogni test

### Esecuzione E2E

```bash
# Esegui tutti i test mobile con logger integration
npx playwright test --project="Mobile Chrome"

# Esegui solo test touch-mode con telemetry capture
npx playwright test tests/punch-club-touch-mode.spec.ts --project="Mobile Chrome"

# Esegui test E2E integration
npx playwright test tests/mobile-logger-e2e.spec.ts --project="Mobile Chrome"
```

### Output E2E Atteso

**1. Telemetry Files Automatici:**

```
test-results/telemetry/
├── telemetry-mobile-e2e-integration-test-2026-01-07T21-50-00.json
├── telemetry-punch-club-touch-mode-2026-01-07T21-51-15.json
└── telemetry-spell-creator-mobile-2026-01-07T21-52-30.json
```

**2. Mobile Logger Logs Automatici:**

```
data/runs/mobile_playtests/
├── playwright-mobile-e2e-integration-test-2026-01-07.json
├── playwright-mobile-e2e-integration-test-2026-01-07.md
├── playwright-punch-club-touch-mode-2026-01-07.json
└── playwright-punch-club-touch-mode-2026-01-07.md
```

**3. Integration Report:**

```
test-results/mobile-logger-report.json
test-results/mobile-logger-summary.md
```

### Test E2E Integration

**File: `tests/mobile-logger-e2e.spec.ts`**

- Verifica setup/teardown automatici
- Testa session tagging in mobile context
- Valida telemetry capture su mobile viewport
- Simula workflow completo E2E

### CI/CD Integration

```yaml
# .github/workflows/playwright-e2e.yml
- name: Run Mobile E2E Tests with Logger
  run: npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
  
- name: Upload Mobile Logger Artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: mobile-e2e-logger-results
    path: |
      test-results/telemetry/
      data/runs/mobile_playtests/
      test-results/mobile-logger-*.json
      test-results/mobile-logger-summary.md
```

### Troubleshooting E2E

**Mobile Tests Non Trovati:**

```bash
# Verifica pattern matching
npx playwright test --list --project="Mobile Chrome"

# Controlla file esistenti
ls tests/*mobile*.spec.ts
```

**Telemetry Non Generata:**

```bash
# Verifica global setup
npx playwright test --config playwright.config.ts --debug

# Controlla directory telemetry
ls test-results/telemetry/
```

**Post-Test Workflow Fallito:**

```bash
# Esegui manualmente il post-test workflow
npx tsx scripts/postTestMobileLogger.ts

# Controlla log per errori
cat test-results/mobile-logger-summary.md
```

### Metriche E2E

- **Mobile Test Coverage**: % test mobile eseguiti con successo
- **Telemetry Capture Rate**: % test mobile con telemetria catturata
- **Session Tag Success Rate**: % test mobile con tagging funzionante
- **End-to-End Processing Time**: Tempo totale da test start a log generation
- **Mobile Device Compatibility**: Success rate per device type (Safari vs Chrome)

### Architettura E2E

```
Mobile Test Start → Session Tag Auto-Set → Test Execution → Telemetry Capture → Test End → Global Teardown → Mobile Logger CLI → Report Generation
```

L'integrazione E2E è completamente automatica e richiede solo l'esecuzione dei test mobile standard.

## Post-Refactor VillageSandbox Test Updates (KS-029)

Dopo il refactoring di `useMapContext.ts` e l'integrazione dei nuovi validator drop-state, i test VillageSandbox richiedono navigazione al tab 'punchClub' invece di 'map':

### Test Aggiornati

- `tests/villageSandbox-dropstate.spec.ts`: Ora naviga a `{ tabId: 'punchClub' }` per testare drop states su location card e activity slots
- `tests/villageSandbox-theater.spec.ts`: Ora naviga a `{ tabId: 'punchClub' }` per testare theater overlay e hover timers

### Modifiche Chiave

- VillageSandbox component ora renderizzato solo nel PunchClubPage (tab 'punchClub')
- useMapContext ripulito da handler legacy demo/multi-village
- Aggiunto supporto per DropState 'locked' nei validator location drop
- Integrati nuovi hook useSandboxInteractionMode e useTheaterController

### Esecuzione Post-Refactor

```bash
# Test drop states con navigazione corretta
npx playwright test tests/villageSandbox-dropstate.spec.ts --project="Desktop Chrome"

# Test theater con navigazione corretta  
npx playwright test tests/villageSandbox-theater.spec.ts --project="Desktop Chrome"
```

## PC-M3: Punch Club PWA Access & Telemetry Compliance

Suite di test per verificare l'accesso PWA general-purpose, consenso obbligatorio per logging e tagging sessione automatica introdotti in PC-M3.

### Nuove Spec Aggiunte

1. **`tests/punch-club-link.spec.ts`** - Test generali PWA access
   - Caricamento <2s su desktop/mobile
   - Consenso obbligatorio per logging
   - Generazione e validazione session tag
   - Redirect controllato post-consenso
   - Supporto shared link con token

2. **Aggiornamenti a `tests/punch-club-touch-mode.spec.ts`** - Test PC-M3 mobile
   - Touch target sizing (≥44px)
   - Mobile consent modal sizing
   - Session tag device detection
   - Mobile redirect con parametri

### Procedure PC-M3

#### Setup Consenso e Session Tagging

```typescript
// Test con consenso obbligatorio
test('mandatory consent blocks access', async ({ page }) => {
  // Clear storage per simulare first visit
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());

  await page.goto('/punch-club');

  // Modal consenso appare automaticamente
  await expect(page.locator('[data-testid="punch-club-landing"]')).toBeVisible();
  const consentModal = page.locator('.fixed.inset-0.z-50');
  await expect(consentModal).toBeVisible();

  // Launch button disabilitato finché consenso non accettato
  const launchBtn = page.locator('[data-testid="punch-club-launch-cta"]');
  await expect(launchBtn).toBeDisabled();

  // Accetta consenso
  await page.locator('button:has-text("Accept & Continue")').click();
  await expect(consentModal).toBeHidden();
  await expect(launchBtn).toBeEnabled();
});
```

#### Verifica Session Tag

```typescript
// Session tag generato automaticamente
test('session tag generation and storage', async ({ page }) => {
  await page.goto('/punch-club');

  // Handle consenso se necessario
  const consentModal = page.locator('.fixed.inset-0.z-50');
  if (await consentModal.isVisible()) {
    await page.locator('button:has-text("Accept & Continue")').click();
  }

  // Verifica session tag nel DOM
  const sessionTagElement = page.locator('text=/Session Tag:/');
  await expect(sessionTagElement).toBeVisible();

  // Verifica storage
  const storedTag = await page.evaluate(() => {
    return sessionStorage.getItem('punch-club-session-tag');
  });
  expect(storedTag).toMatch(/^pc-[a-z0-9]+-\d+-(mobile|desktop)$/);
});
```

#### Test Shared Link Access

```typescript
test('shared link access with token', async ({ page }) => {
  const linkToken = 'test-shared-link-123';

  await page.goto(`/punch-club?link=${linkToken}`);

  // Verifica tracking shared link
  const events = await getPunchClubLandingEvents(page);
  expect(events).toContainEqual(
    expect.objectContaining({
      event: 'shared_link_accessed',
      payload: expect.objectContaining({ linkToken }),
    })
  );
});
```

#### KPI Performance

- **Caricamento landing**: <2s su desktop e mobile
- **Redirect post-consenso**: <2s completamento
- **Session tag read**: <5s nella generazione JSON logger
- **Touch targets**: ≥44px su mobile
- **Consenso persistenza**: sopravvive reload page

### Esecuzione PC-M3 Tests

```bash
# Suite completa PC-M3 (landing + touch mode)
npm run test:punch-club

# Solo landing page tests
npx playwright test tests/punch-club-link.spec.ts --project="Desktop Chrome" --project="Mobile Chrome"

# Solo mobile touch tests
npx playwright test tests/punch-club-touch-mode.spec.ts --project="Mobile Chrome"

# Con video/tracing per debug performance
npx playwright test tests/punch-club-link.spec.ts --project="Mobile Chrome" --video on --trace on
```

### Troubleshooting PC-M3

**Consenso non appare**: Verifica che localStorage e cookies siano puliti prima del test.

**Session tag non generato**: Controlla che la pagina sia caricata completamente prima di verificare sessionStorage.

**Redirect lento**: Monitora console per errori e performance entries. KPI failure loggato automaticamente.

**Touch targets falliti**: Verifica viewport mobile (375x667) e che elementi non siano nascosti da overlay.

### Integrazione con Mobile Logger

PC-M3 aggiunge `sessionTag` al MobilePlaytestLogSchema. Il logger CLI ora legge automaticamente il tag da sessionStorage entro 5s dalla generazione log:

```bash
# Logger con session tag da browser
npx tsx scripts/mobilePlaytestLogger.ts --session pc-session-123
# Output include sessionTag se disponibile in sessionStorage
```

Il tag appare nei JSON esportati sotto `sessionTag` field per audit trail completo.

## Mobile Logger Integration

Integrazione completa tra Playwright E2E tests e mobilePlaytestLogger CLI per raccolta telemetria automatica post-test.

### Architettura Integration

```
Playwright Test → Session Tag Auto-Set → Telemetry Capture → Test End → MobileLoggerReporter → CLI Processing → Aggregated Reports
```

### Componenti Chiave

#### 1. Enhanced mobilePlaytestLogger CLI

**Nuovi Flag:**

- `--post-playwright`: Modalità processing automatico telemetria Playwright
- `--playwright-output-dir <dir>`: Directory telemetria (default: test-results/telemetry)
- `--aggregate-format <json|markdown|csv>`: Formato report aggregato

**Esempi:**

```bash
# Processamento automatico telemetria
npm run playtest:post-playwright

# Report in Markdown
npm run playtest:post-playwright:markdown

# Report in CSV
npm run playtest:post-playwright:csv

# Custom directory
npx tsx scripts/mobilePlaytestLogger.ts --post-playwright --playwright-output-dir custom/telemetry
```

#### 2. MobileLoggerReporter

**File:** `tests/helpers/mobileLoggerReporter.ts`

**Funzionalità:**

- Auto-cattura telemetria dopo ogni test mobile
- Session tagging automatico
- Post-processing con CLI mobilePlaytestLogger
- Report aggregati con metriche KPI

**Configurazione:**

```typescript
// playwright.config.ts
import { MobileLoggerReporter } from './tests/helpers/mobileLoggerReporter';

export default defineConfig({
  reporter: [
    ['html'],
    ['list'],
    [new MobileLoggerReporter({
      autoProcessTelemetry: true,
      aggregateFormat: 'json',
      telemetryOutputDir: 'test-results/telemetry'
    })]
  ],
  // ...
});
```

#### 3. Telemetry Extraction Hooks

**Helpers Aggiornati:**

- `playwrightTelemetryHelper.ts`: Capture e conversione telemetria
- `sessionTagHelper.ts`: Session tagging con KPI tracking
- `mobileLoggerReporter.ts`: Integration layer

### Workflow Automatico

#### 1. Test Execution

```typescript
// Test con telemetry extraction automatica
test('mobile test with telemetry', async ({ page }) => {
  // Auto-session tagging
  await setSessionTag(page, 'mobile-test-session');
  
  // Test interactions
  await page.goto('/?mobile=true');
  await page.getByTestId('nav-btn-spellCreationNew').click();
  
  // Telemetry catturata automaticamente a fine test
});
```

#### 2. Post-Test Processing

Il MobileLoggerReporter esegue automaticamente:

```bash
npx tsx scripts/mobilePlaytestLogger.ts --post-playwright --aggregate-format=json
```

#### 3. Report Generation

**Output Files:**

- `data/runs/mobile_playtests/playwright-aggregate-<timestamp>.json`
- `data/runs/mobile_playtests/playwright-aggregate-<timestamp>.md`
- `data/runs/mobile_playtests/playwright-aggregate-<timestamp>.csv`

### NPM Scripts Integration

**Scripts Aggiunti:**

```json
{
  "playtest:post-playwright": "tsx scripts/mobilePlaytestLogger.ts --post-playwright",
  "playtest:post-playwright:markdown": "tsx scripts/mobilePlaytestLogger.ts --post-playwright --aggregate-format=markdown",
  "playtest:post-playwright:csv": "tsx scripts/mobilePlaytestLogger.ts --post-playwright --aggregate-format=csv",
  "test:mobile:logger": "playwright test tests/mobile-logger-e2e.spec.ts --reporter=list",
  "test:mobile:report": "npm run test:mobile:logger && npm run playtest:post-playwright"
}
```

### Test Suite Aggiornata

#### mobile-logger-e2e.spec.ts

**Test Cases:**

1. **Telemetry Capture**: Verifica cattura telemetria e session tag
2. **Setup/Teardown**: Validazione global setup/teardown
3. **CLI Compatibility**: Test compatibilità dati con mobilePlaytestLogger
4. **Edge Cases**: Session tagging con caratteri speciali

#### punch-club-touch-mode.spec.ts

**Enhancements:**

- Telemetry extraction in tutti i test mobile
- Session tagging automatico
- Compatibility tracking con CLI

### Report Aggregati

#### JSON Structure

```json
{
  "summary": {
    "totalSessions": 5,
    "generatedAt": "2026-01-08T12:00:00.000Z",
    "averageMetrics": {
      "avgCycleDurationMs": 85000,
      "avgTapsPerAssignment": 3.2,
      "cycleTargetMetRate": 80
    }
  },
  "sessions": [...]
}
```

#### Markdown Report

```markdown
# Playwright Mobile Telemetry Aggregate Report

Generated: 2026-01-08T12:00:00.000Z
Total Sessions: 5

## Summary Metrics

| Metric | Average | Target | Met Rate |
|--------|---------|--------|----------|
| Cycle Duration | 85000ms | 90000ms | 80% |

## Session Details

### session-123
- **Session Tag:** mobile-test-session
- **Tester:** punch-club-touch-mode
- **Device:** mobile-test
- **KPI Results:** ✅ All targets met
```

### KPI Tracking

**Metrics Tracked:**

- Cycle Duration (target: <90s)
- Taps per Assignment (target: ≥3)
- Assignment Latency (target: <450ms)
- Picker Close Rate (target: ≥98%)
- Resource Delta (target: ≥10 gold, ≥2 food)

**Success Rates:**

- Individual test KPI compliance
- Aggregate session performance
- Device-specific metrics

### CI/CD Integration

**GitHub Actions Example:**

```yaml
- name: Run Mobile Tests with Logger
  run: npm run test:mobile:report
  
- name: Upload Mobile Logger Reports
  uses: actions/upload-artifact@v3
  with:
    name: mobile-logger-results
    path: |
      data/runs/mobile_playtests/playwright-aggregate-*.json
      data/runs/mobile_playtests/playwright-aggregate-*.md
      test-results/mobile-logger-*.json
```

### Troubleshooting

**Telemetry Non Catturata:**

```bash
# Verifica directory telemetry
ls test-results/telemetry/

# Verifica MobileLoggerReporter logs
cat test-results/mobile-logger-report.json

# Esegui manualmente CLI
npm run playtest:post-playwright
```

**Session Tag Missing:**

```bash
# Verifica session tagging helpers
npx playwright test tests/mobile-logger-e2e.spec.ts --debug

# Controlla storage availability
npx playwright test tests/mobile-logger-e2e.spec.ts --project="Mobile Chrome" --headed
```

**CLI Processing Failed:**

```bash
# Verifica CLI arguments
npx tsx scripts/mobilePlaytestLogger.ts --help

# Test con debug output
npx tsx scripts/mobilePlaytestLogger.ts --post-playwright --playwright-output-dir test-results/telemetry
```

### Performance Metrics

**Processing Times:**

- Telemetry capture: <100ms per test
- CLI processing: <5s per 10 telemetry files
- Report generation: <2s per format
- Total E2E workflow: <10s per test suite

**Storage Requirements:**

- Telemetry files: ~1KB per test
- Aggregated reports: ~10KB per format
- Mobile logger report: ~5KB

### Best Practices

1. **Test Organization**: Usa `mobile-` prefix per test mobile
2. **Session Tagging**: Include test identifier in session tag
3. **Telemetry Events**: Log meaningful events for KPI tracking
4. **Error Handling**: Graceful degradation se telemetry non disponibile
5. **Report Review**: Monitor aggregated reports per trend analysis

### Future Enhancements

- Real-time telemetry dashboard
- Custom KPI definitions per test suite
- Integration con CI/CD metrics collection
- Automated alerting per KPI violations
- Historical trend analysis

## Mobile Redirect & Moodboard Landing E2E Tests (KS-MOBILE-2)

Suite di test E2E per verificare il comportamento mobile redirect basato su user agent e la navigazione moodboard con lazy loading, introdotti in KS-MOBILE-1.

### Test Files Aggiunti

#### 1. `tests/mobile-redirect.spec.ts`

**Scopo:** Verificare il redirect automatico mobile basato su user agent detection e parametri manuali.

**Test Cases:**

1. **Mobile User Agent Detection**: Simula dispositivi iPhone con user agent string, verifica redirect automatico a `#moodboard`
2. **Desktop No Redirect**: Verifica che desktop user agents non vengano reindirizzati
3. **Manual Override**: Test parametri `?mobile=true/false` per override comportamento automatico
4. **Navigation Persistence**: Verifica che redirect mobile persista durante navigazione

**Configurazione Node.js Bypass:**

```typescript
const nodeVersion = process.versions.node.split('.').map(Number);
const shouldSkip = nodeVersion[0] < 20;

if (shouldSkip) {
  test.describe.skip('Mobile Redirect E2E Tests - Node.js version < 20', () => {
    // Skip suite se Node.js incompatibile
  });
} else {
  test.describe('Mobile Redirect E2E Tests', () => {
    // Test effettivi
  });
}
```

#### 2. `tests/moodboard-landing.spec.ts`

**Scopo:** Verificare caricamento moodboard tab, lazy loading, e comportamento responsive su mobile.

**Test Cases:**

1. **Desktop Navigation**: Click su nav button, verifica caricamento content e titoli
2. **Hash Navigation**: Access diretto via `#moodboard`, verifica tab attiva
3. **Mobile Navigation**: Touch navigation, drawer menu se necessario
4. **Orientation Changes**: Mobile viewport rotation, verifica persistenza content
5. **Performance Loading**: Caricamento <3s, lazy loading immagini
6. **Accessibility**: Heading structure, navigation labels

### Architettura Test

#### Node.js Compatibility Layer

Poiché Vite richiede Node.js 20.19+, i test includono:

- **Version Detection**: `process.versions.node.split('.').map(Number)`
- **Conditional Skip**: Suite completa skippata se Node.js < 20
- **Syntax Validation**: Test compilano correttamente anche se non eseguibili

#### Mobile Device Emulation

```typescript
test.describe('Mobile Viewport', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)...'
  });

  test('mobile navigation test', async ({ page }) => {
    // Test mobile specifico
  });
});
```

### Esecuzione Tests

```bash
# Syntax check (funziona anche con Node.js 16)
npx tsc --noEmit tests/mobile-redirect.spec.ts tests/moodboard-landing.spec.ts

# Runtime execution (richiede Node.js 20+)
npx playwright test tests/mobile-redirect.spec.ts --project="Mobile Chrome"
npx playwright test tests/moodboard-landing.spec.ts --project="Desktop Chrome" --project="Mobile Chrome"

# Con tracing per debug
npx playwright test tests/moodboard-landing.spec.ts --project="Mobile Chrome" --trace on --video on
```

### Dipendenze e Prerequisiti

**Dipendenze Task:**

- **KS-MOBILE-1**: Fornisce navigation logic verificata e evidence
- **KS-075**: Implementa mobile redirect e Vercel config
- **KS-076**: Risoluzione TypeScript errors per build stabile

**Prerequisiti Runtime:**

- Node.js 20.19.6+ (per Vite compatibility)
- Playwright browsers installati (`npx playwright install --with-deps`)
- `npm run build` passando (build stabile)

### Integration con Evidence KS-MOBILE-1

I test si basano sull'analisi KS-MOBILE-1 che conferma:

- `'moodboard'` è tab valido in `BASE_APP_NAV_TAB_IDS`
- Hash parsing funziona per `#moodboard`
- Mobile redirect imposta automaticamente `#moodboard`
- Lazy loading MoodboardPage è configurato correttamente
- Navigation logic è **CORRETTA**

### Output Attesi

**Syntax Check:**

```bash
$ npx tsc --noEmit tests/mobile-redirect.spec.ts tests/moodboard-landing.spec.ts
# Exit code: 0 (nessun errore TypeScript)
```

**Runtime Execution (con Node.js 20+):**

- `tests/mobile-redirect.spec.ts`: ✅ 5 test cases passanti
- `tests/moodboard-landing.spec.ts`: ✅ 6 test cases passanti
- Report HTML Playwright con screenshots
- Trace files per debugging

### Troubleshooting

**Node.js Version Too Old:**

```bash
node --version  # Deve essere 20.19.6+
# Se < 20: nvm use 20.19.6
```

**Syntax Errors:**

```bash
npx tsc --noEmit tests/mobile-*.spec.ts
# Fix eventuali errori TypeScript
```

**Runtime Failures:**

```bash
# Con debug output
npx playwright test tests/mobile-redirect.spec.ts --project="Mobile Chrome" --debug

# Verifica navigation
npx playwright test tests/moodboard-landing.spec.ts --project="Desktop Chrome" --headed
```

### Performance Expectations

## STS (Slay the Spire) Testing

### Overview

The STS simulator requires specialized Playwright testing for its retro terminal interface, including keyboard navigation, accessibility validation, and visual regression testing.

### Setup Requirements

1. **Node.js 20.19.6+**: Required for STS testing compatibility
2. **Playwright Dependencies**: `npx playwright install --with-deps`
3. **Terminal Font Support**: Ensure monospace fonts are available for testing

### Test Files

- `tests/tools/sts/STSConsole.spec.ts` - End-to-end console testing
- `tests/tools/sts/STSHandDisplay.rtl.test.tsx` - React Testing Library tests
- `tests/tools/sts/__snapshots__/STSRetro.snap` - Visual regression snapshots

### Running STS Tests

#### Console Tests (Playwright)

```bash
# Run all STS console tests
npx playwright test tests/tools/sts/STSConsole.spec.ts

# Run with specific viewport
npx playwright test tests/tools/sts/STSConsole.spec.ts --project="Desktop Chrome"

# Run mobile tests
npx playwright test tests/tools/sts/STSConsole.spec.ts --project="Mobile Chrome"
```

#### Component Tests (RTL)

```bash
# Run STS hand display tests
npm run test:unit -- tests/tools/sts/STSHandDisplay.rtl.test.tsx

# Run with coverage
npm run test:unit:coverage -- tests/tools/sts/STSHandDisplay.rtl.test.tsx
```

#### Visual Regression Tests

```bash
# Update snapshots
npx playwright test tests/tools/sts/STSConsole.spec.ts --update-snapshots

# Compare with baseline
npx playwright test tests/tools/sts/STSConsole.spec.ts --visual
```

### Test Coverage Areas

#### 1. Console Interface Testing

- **Retro Terminal Theme**: Validates terminal green color scheme and monospace fonts
- **Control Bar**: Tests start run functionality, seed display, and control buttons
- **Hand Display**: Validates card rendering, selection, and keyboard navigation
- **Combat Log**: Tests log scrolling, entry display, and color coding
- **Moodboard Integration**: Validates `#moodboard` hash presence and functionality

#### 2. Accessibility Testing

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: ARIA labels, roles, and live regions
- **Color Contrast**: WCAG 2.1 AA compliance for terminal green theme
- **Focus Management**: Proper focus indicators and tab order

#### 3. Mobile Responsiveness

- **Touch Interactions**: Card selection via touch gestures
- **Mobile Layout**: Adaptation for mobile viewport (375x667)
- **Scrolling**: Touch scrolling for combat log and hand display
- **Virtual Keyboard**: Mobile keyboard appearance for command input

#### 4. Performance Testing

- **Load Time**: Console should load within 3 seconds
- **Interaction Speed**: Rapid card selection without lag
- **Memory Usage**: Efficient rendering for large hands (10+ cards)
- **Animation Performance**: Smooth terminal animations at 60fps

### Key Test Scenarios

#### Start Run Flow

```typescript
test('should start run with deterministic seed', async () => {
  await page.goto('/tools/sts');
  const startButton = page.locator('[data-testid="start-run-button"]');
  await startButton.click();
  
  const runStatus = page.locator('[data-testid="run-status"]');
  await expect(runStatus).toContainText('Running');
  
  const seedDisplay = page.locator('[data-testid="seed-display"]');
  await expect(seedDisplay).toBeVisible();
});
```

#### Keyboard Navigation

```typescript
test('should support keyboard navigation for card selection', async () => {
  const cards = page.locator('[data-testid="hand-card"]');
  await cards.first().focus();
  
  await page.keyboard.press('ArrowRight');
  await expect(cards.nth(1)).toBeFocused();
  
  await page.keyboard.press('Enter');
  await expect(cards.nth(1)).toHaveClass('selected');
});
```

#### Mobile Touch Testing

```typescript
test('should support touch interactions on mobile', async () => {
  await page.setViewportSize({ width: 375, height: 667 });
  const cards = page.locator('[data-testid="hand-card"]');
  
  await cards.first().tap();
  await expect(cards.first()).toHaveClass('selected');
});
```

#### Visual Regression

```typescript
test('should match retro terminal design snapshot', async () => {
  const consoleElement = page.locator('.sts-console');
  await expect(consoleElement).toHaveScreenshot('sts-console-retro.png');
});
```

### Configuration

#### Playwright Config

```typescript
// In playwright.config.ts
projects: [
  {
    name: 'Desktop Chrome',
    use: {
      viewport: { width: 1280, height: 720 },
    },
  },
  {
    name: 'Mobile Chrome',
    use: {
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      hasTouch: true,
    },
  },
],
```

#### Test Environment

```typescript
// Test setup for STS
test.beforeEach(async ({ page }) => {
  await page.goto('/tools/sts');
  await page.waitForSelector('.sts-console');
});
```

### Troubleshooting

#### Common Issues

**Font Rendering Issues:**

```bash
# Ensure monospace fonts are available
npx playwright test tests/tools/sts/STSConsole.spec.ts --headed
```

**Timeout Errors:**

```bash
# Increase timeout for slow operations
npx playwright test tests/tools/sts/STSConsole.spec.ts --timeout=10000
```

**Mobile Test Failures:**

```bash
# Run mobile tests with device emulation
npx playwright test tests/tools/sts/STSConsole.spec.ts --project="Mobile Chrome" --debug
```

#### Debug Mode

```bash
# Run with Playwright Inspector
npx playwright test tests/tools/sts/STSConsole.spec.ts --debug

# Run with trace files
npx playwright test tests/tools/sts/STSConsole.spec.ts --trace on
```

### Expected Results

#### Successful Test Run

```bash
✅ 15 tests passed
✅ 3 visual regression tests passed
✅ 5 accessibility tests passed
✅ 4 mobile tests passed
✅ 3 performance tests passed
```

#### Coverage Report

```bash
✅ Console Interface: 100% coverage
✅ Hand Display: 95% coverage
✅ Keyboard Navigation: 100% coverage
✅ Mobile Interactions: 90% coverage
```

### Integration with CI/CD

#### GitHub Actions

```yaml
- name: STS Tests
  run: |
    npx playwright install --with-deps
    npx playwright test tests/tools/sts/STSConsole.spec.ts
    npx playwright test tests/tools/sts/STSHandDisplay.rtl.test.tsx
```

#### Artifacts

- **Screenshots**: Visual regression comparisons
- **Trace Files**: Debug information for failed tests
- **Videos**: Test execution recordings
- **Reports**: HTML test reports with detailed results

### Best Practices

#### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Include accessibility in all tests
- Test both desktop and mobile viewports

#### Data Management

- Use deterministic seeds for reproducible tests
- Mock external dependencies
- Clean up test data after each test
- Use page.goto() with full URLs

#### Performance

- Use page.waitForSelector() for dynamic content
- Avoid unnecessary waits
- Test with realistic data sizes
- Monitor memory usage in long-running tests

- **Syntax Check**: <2s
- **Single Test Execution**: <10s
- **Full Suite**: <30s
- **Memory Usage**: <200MB

### CI/CD Integration

```yaml
# .github/workflows/mobile-tests.yml
- name: Run Mobile Redirect Tests
  run: npx playwright test tests/mobile-redirect.spec.ts --project="Mobile Chrome"

- name: Run Moodboard Landing Tests  
  run: npx playwright test tests/moodboard-landing.spec.ts --project="Desktop Chrome" --project="Mobile Chrome"
```

### Future Extensions

- Aggiunta test per più dispositivi mobile
- Integration con mobile logger per telemetria
- Cross-browser testing (Safari mobile)
- Performance regression monitoring
- Accessibility automated checks
