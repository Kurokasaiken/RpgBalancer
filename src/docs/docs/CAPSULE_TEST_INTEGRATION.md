# Capsule Test Integration

Document canonico per allineare gli interventi sulla TestRosterPage legati al time engine strip, alle capsule POI e all'integrazione SlottedMedal. È derivato dal piano "Slotted Medal Regression-Safe Rollout" (`.windsurf/plans/slotted-medal-regression-plan-16665b.md`) e viene aggiornato dopo ogni fase completata.

## 1. Baseline 39016dd

**Obiettivo:** catturare lo stato funzionante del commit `39016dd` prima di ogni modifica.

### Artefatti richiesti

| Tipo | Descrizione | Percorso/Note |
| --- | --- | --- |
| Screenshot | Drag valido nello scenario sandbox | `test-results/baseline-2026-03-01/baseline-valid-drop.png` (601.93 KB) |
| Screenshot | Drag invalido (slot bloccato) | `test-results/baseline-2026-03-01/baseline-invalid-drop.png` (601.93 KB) |
| Screenshot | Day/Night + ClockWidget + ActiveHUD (layout originale) | `test-results/baseline-2026-03-01/baseline-time-strip.png` (17.26 KB) |
| Screenshot | POI capsule idle state | `test-results/baseline-2026-03-01/baseline-poi-idle.png` (9.28 KB) |
| Screenshot | POI capsule active/dragging state | `test-results/baseline-2026-03-01/baseline-poi-active.png` (9.28 KB) |
| Screenshot | Full page /test | `test-results/baseline-2026-03-01/baseline-full-page.png` (601.93 KB) |
| Log baseline | Lint, test, build, kanban safeguards | `test-results/slotted-medal-phase0-baseline.log` |

### Note operative
- Annotare nel log baseline l'hash esatto e l'orario della cattura.
- Ogni file multimediale deve essere salvato in `test-results/baseline-<data>/` con naming coerente (`baseline-clock-strip.png`, ecc.).
- Collegare qui i percorsi reali una volta prodotti.

## 2. Phase 2 – Time Engine Strip & Harness Suite ✅ COMPLETATO

**Obiettivo:** consolidare la strip Day/Night + ClockWidget + ActiveHUD in un unico componente TimeEngineStrip e documentare l'integrazione.

### Implementazione completata
1. **TimeEngineStrip component:** Nuovo componente in `src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx` che consolida:
   - Day/Night ActivityCapsule con controlli ciclo
   - ClockWidget con gestione velocità
   - ActiveHUD con stato attività
   - Layout compact e full modes

2. **TestRosterPage integration:** Aggiornata per utilizzare TimeEngineStrip invece dei componenti separati:
   - Props consolidate per clockProps, hudState, villageState
   - Mantenuti data attributes per test automation
   - Preservati controlli Clear Slots e Restore Stamina

3. **Test suite:** Creato `tests/unit/testRosterPage/TestRosterPage.fixes.test.tsx` con:
   - Test TimeEngineStrip integration
   - Test data attributes
   - Test UI interactions
   - Test error handling

### Requisiti UI verificati
✅ **Strip consolidata:** Componente unico con layout grid (full) e flex (compact)
✅ **ClockWidget integrato:** Props passate correttamente con onSpeedChange e onTogglePause
✅ **Controlli legacy mantenuti:** Clear Slots e Restore Stamina ancora presenti per test harness

### Test eseguiti
- ✅ `npm run test -- tests/unit/testRosterPage/TestRosterPage.fixes.test.tsx`
- ✅ `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx`
- ✅ `npm run build:check`
- ✅ `npm run kanban:lint`

### Telemetria / Token
- **Style Lab tokens:** Utilizzati tramite props accentHex e variant system
- **Data attributes:** Mantenuti per test automation (data-time-engine-*)
- **Evidence:** `test-results/np-sm-006-2026-03-01.log`

## Appendice – Suite obbligatorie per TestRosterPage
Elenco dei pacchetti che devono girare al termine di **ogni** prompt NP-SM:
1. `npm run test -- tests/unit/idleVillage/useActivityCapsuleState.simple.test.tsx`
2. `npm run test -- tests/unit/testRosterPage/TestRosterPage.fixes.test.tsx` (dalla Phase 2 in poi)
3. `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts` (inclusi grep specifici quando richiesti)
4. Eventuali nuove spec Playwright dedicate (`tests/e2e/idleVillage/test-route-medal-drag.spec.ts`, ecc.)
5. `npm run lint`/`npm run build:check`/`npm run kanban:lint` come da prompt.

Aggiornare questa appendice se vengono aggiunte nuove suite o se cambiano i percorsi.
