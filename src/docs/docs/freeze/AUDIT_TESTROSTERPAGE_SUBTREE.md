# Audit: `TestRosterPage.tsx` — Mappa "linea → ruolo" e subtree di contratto

**Author:** Wave 0 Day 1 (task #7)
**Date:** 2026-05-21
**Source file:** `src/ui/idleVillage/TestRosterPage.tsx` (1994 righe)
**Purpose:** Identificare per ciascun kit il **subtree esatto** del rendering canonico che il contract test (S5) deve comparare contro la corrispondente `minimal-*`.

---

## 1. Sintesi (per la decisione veloce)

Tre risultati importanti per la pianificazione di Wave 0/1:

1. **`TestRosterPage` non è la "reference universale".** Importa `ClockWidget`, `ActivityCapsule`, `ActiveHUD` ma **non li renderizza**. Il contract test pagina↔pagina può prendere `/test` come riferimento solo per `minimal-roster`, `minimal-slotRack`, `minimal-pgcard`, e parzialmente per `minimal-integration-drag-job`.
2. **Per `minimal-clock`, `minimal-activity`, `minimal-hud`** la pagina di riferimento è **`MinimalGameplayPage`** (`/minimal-gameplay`), non `/test`. Va aggiunto al plan v2 (Sezione 5 prioritizzazione) e al contract test framework (per-kit configurable reference route).
3. **`TestRosterPage` ha già `data-testid="test-roster-page"`** (riga 1610) e contiene una sezione esplicita `testId="village-roster-wrapper"` (riga 1795) che è il subtree pulito per il contract test del `rosterKit`. Identica strategia da replicare via `testId` sui sub-wrapper dei prossimi kit.

---

## 2. Struttura del file (mappa "blocchi → linee")

```
TestRosterPage.tsx (1994 righe)
│
├── 1–83     Imports
│             ├── canonical components (VillageRosterSection, ResidentSlotRack[Skin], PgCard*, ActiveHUD*, ActivityCapsule*, ClockWidget*, TimeEngineStrip)
│             ├── hooks canonici (useCanonicalRosterBundle, useVillageResidents, useActiveHUDState, useSandboxTiming, ...)
│             └── config canonici (DEFAULT_IDLE_VILLAGE_CONFIG, DEFAULT_MINIMAL_CONFIG, MINIMAL_GAMEPLAY_RESIDENTS, TEST_RESIDENTS, TEST_ROSTER_HEROES, SLOT_LAB_CONFIG)
│
├── 84–191   Tipi locali + RACK_SCENARIOS (scenario "open" e "restricted")
│             └── Solo scaffolding interno: NON è da congelare in nessun kit.
│
├── 193–426  RackScenarioPanel
│             ├── Render line 363: <StyleLabSurface variant="card" testId={`slot-lab-panel-${scenario.id}`}>
│             └── Render line 409: <ResidentSlotRackSkin slots={...} ...>
│             ⇒ Subtree usato da minimal-slotRack (dentro al wrapper di scenario).
│
├── 429–1608 TestRosterPageContent (logica e state)
│             ├── 508   useTheme presetMap
│             ├── 932   useEffect su scenario change
│             ├── 1031  useActiveHUDState() — hook chiamato ma componente NON renderizzato in questa pagina
│             ├── 1365  Loop RACK_SCENARIOS per inizializzazione
│             └── 1561+ Theme switching logic
│
└── 1609–1972 TestRosterPageContent (render JSX principale)
              │
              ├── 1610  <div data-testid="test-roster-page" style={styleLabVars}>  ← ROOT con testid
              │
              ├── 1619  <DndContext>                                              ← drag system attivo (riferimento per minimal-integration-drag-job)
              │
              │ ├── 1626  <StyleLabSurface>                                       ← chrome di layout
              │ │
              │ ├── 1633  Toolbar tematica                                        ← DEBUG-ONLY (NON parte del subtree canonico)
              │ │
              │ ├── 1682  <TimeEngineStrip ...>                                   ← canonical render: subtree per future minimal-timeengine se aggiunto (oggi nessun minimal-* mappa qui)
              │ │
              │ ├── 1715  StyleLabSurface vari (informational, error states)      ← DEBUG-ONLY
              │ │
              │ ├── 1755  Slot debug visualization toggle                         ← DEBUG-ONLY
              │ │
              │ ├── 1795  <StyleLabSurface testId="village-roster-wrapper">       ← ★ CONTRACT SURFACE rosterKit
              │ │   └── 1796  <VillageRosterSection ...>                          ← canonical render
              │ │
              │ ├── 1813  <RackScenarioPanel scenario={RACK_SCENARIOS[0]} ...>    ← ★ CONTRACT SURFACE slotRackKit (Rack A)
              │ │   └── 363 → 409 (via riferimento al sub-componente)
              │ │
              │ ├── 1835  <RackScenarioPanel scenario={RACK_SCENARIOS[1]} ...>    ← Rack B (per i contract test sceglieremo Rack A solo)
              │ │
              │ ├── 1855  <StyleLabSurface variant="card">                         ← chrome
              │ │   └── 1860  <PoiDetailSkinWrapper ...>                          ← non mappato a un minimal-* attuale (skin POI)
              │ │
              │ └── (chiusura DndContext)
              │
              └── 1940  <CertifiedWorkerPickerSheet ...>                          ← overlay modal, attivato on-demand
                        Non parte del subtree canonico statico.
│
└── 1973–1994 TestRosterPage wrapper
              <SkinSystemProvider>
                <SandboxTimingProvider>
                  <DragProvider>
                    <TestRosterPageContent />
                  </DragProvider>
                </SandboxTimingProvider>
              </SkinSystemProvider>
              ⇒ Provider chain CANONICO. Ogni minimal-* che dipende da skin/timing/drag
              deve mountare questi provider nello stesso ordine.
```

---

## 3. Mappa kit → contract surface

Per ciascun kit, indica la **reference route**, il **selettore subtree** e la **provider chain richiesta**.

| Kit | Reference route | Subtree selector | Provider chain richiesta |
|---|---|---|---|
| `rosterKit` | `/test` (TestRosterPage L1795) | `[data-testid="village-roster-wrapper"] > [data-testid="village-roster-section"]` | SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext |
| `slotRackKit` | `/test` (TestRosterPage L1813, scenario "open") | `[data-testid="slot-lab-panel-open"] >> [data-testid="resident-slot-rack-root"]` | SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext |
| `pgCardKit` | `/test` (TestRosterPage L1796 → primo `<PgCard>` interno a VillageRosterSection) | `[data-testid="village-roster-section"] >> [data-testid="pg-card"]` (primo) | come `rosterKit` |
| `dragKit` (integration-drag-job) | `/test` (TestRosterPage L1619 DndContext) | l'intera `[data-testid="test-roster-page"]` con eventi di drag | come `rosterKit` |
| `clockKit` | **`/minimal-gameplay`** (MinimalGameplayPage) | da identificare in Day 2 (testid da aggiungere se manca) | provider chain di MinimalGameplayPage (da auditare) |
| `activityKit` | **`/minimal-gameplay`** | come `clockKit` | come `clockKit` |
| `hudKit` | **`/minimal-gameplay`** | come `clockKit` | come `clockKit` |
| `timeEngineKit` (futuro) | `/test` (L1682) | `[data-testid="time-engine-strip"]` (testid da verificare) | come `rosterKit` |
| `resourceHudKit`, `jobCardKit`, `questCardKit`, `skillCheckKit`, `outcomeKit`, `marketKit`, `slottedMedalKit` | TBD (probabilmente MinimalGameplayPage o altre Test*Page non ancora ispezionate) | da auditare in Day 2 | TBD |

**Implicazione:** il contract test framework di Wave 0 Day 2 deve essere **per-kit configurabile**:

```ts
// _infra/contract.ts (target API)
type ContractConfig = {
  kitId: string;
  referenceRoute: string;        // "/test" | "/minimal-gameplay" | ...
  minimalRoute: string;          // "/minimal-roster"
  subtreeSelector: string;       // playwright locator
  providerChain?: ProviderId[];  // opzionale, per render in jsdom
};
```

Il piano v2 (Sezione 5 Wave 1 prioritizzazione) viene aggiornato di conseguenza: i kit basati su `/test` partono prima (refactor "rotto" tracciato dal subtree canonico), quelli basati su `MinimalGameplayPage` richiedono prima un audit della reference page.

---

## 4. Sezioni di TestRosterPage da escludere dal subtree canonico

Il contract test, anche al livello "intera pagina /test", deve normalizzare via via questi blocchi (sono UI di test harness, non comportamento canonico del componente):

- **L1633–1681** — Theme switching toolbar (debug).
- **L1715–1794** — Banner di stato (loading, errori, info testuali).
- **L1755** — Slot debug visualization toggle (debug).
- **L1855–1939** — POI detail skin wrapper, se non corrispondente a un minimal-*.
- **L1940** — `CertifiedWorkerPickerSheet` (overlay, on-demand).

Strategia di normalizzazione (in `_infra/contract.ts`):

1. Selettore positivo: trovare il sub-wrapper canonico via `data-testid` esplicito.
2. Selettore negativo: rimuovere figli di `[data-testid$="-debug"]`, `[data-testid$="-toolbar"]`, `[data-testid$="-banner"]`.
3. Attribute strip: rimuovere `data-*` volatili (es. `data-render-ts`, `data-frame-id`).

Convenzione a regime: chi aggiunge UI di test harness DEVE marcarla con suffisso `-debug` / `-toolbar` / `-banner` (governance da scrivere in Hardening, Sezione 7 del plan v2).

---

## 5. Imports importanti rilevati (per la fase Estrazione)

Da TestRosterPage L1–83, gli import canonici che `rosterKit.fixture.ts` e `slotRackKit.fixture.ts` ri-esporteranno:

```ts
// fixture data sources (canonici, già usati da TestRosterPage)
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { TEST_RESIDENTS } from '@/balancing/config/idleVillage/testResidents';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import { DEFAULT_TEST_HARNESS_CONFIG as SLOT_LAB_CONFIG } from '@/balancing/config/idleVillage/testHarnessConfig';

// hooks canonici
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';
import { useActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';

// componenti canonici (re-export dai kit)
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import ResidentSlotRackSkin from '@/ui/idleVillage/components/ResidentSlotRackSkin';
import { SlotRackWithSkin } from '@/ui/idleVillage/components/SlotRackWithSkin';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
```

Tutti già esistenti, tutti canonici, tutti già usati nel render di produzione tramite `MinimalGameplayPage` o `TestRosterPage`. Conferma S1 del plan v2: **zero mock**.

---

## 6. Aggiornamenti propagati al plan v2

1. **Sezione 5 (Wave 1 prioritizzazione):** rivedere come segue.
   - **Settimana 1 — kit con `/test` come reference**: `pgcard`, `slotRack`. Più `clock` rimandato.
   - **Settimana 2 — kit con `MinimalGameplayPage` come reference**: `clock`, `activity`, `hud`, `resourcehud`, `slottedmedal`. **Prerequisito**: Day 6 dedicato all'audit di `MinimalGameplayPage` come è stato fatto oggi per `TestRosterPage`.
   - **Settimana 3 — kit specialistici**: `jobcard`, `questcard`, `skillcheck`, `outcome`, `market`, `integration-quest-flow`. Probabile sorgente: `GameplayTestPage`/`GameplayTestMinimal`/route gameplay vari (da auditare nello stesso step).

2. **Sezione 4 (Wave 0 Day 2 infra):** `contract.ts` deve essere **per-kit configurabile** (vedi snippet in Sezione 3 sopra), non solo `/test ↔ /minimal-<x>`.

3. **Sezione 9 (Rischi):** aggiungere Rischio 4 — "MinimalGameplayPage non ha la disciplina dei `testid` di TestRosterPage". Mitigazione: audit dedicato in Day 6, eventuale propagazione della convenzione testid root prima di affrontare i kit di Settimana 2.

4. **Sezione 11 (Success criteria):** aggiungere "Convenzione `*-debug` / `*-toolbar` / `*-banner` documentata e applicata per UI di test harness in tutte le Test*Page e MinimalGameplayPage".

---

## 7. Conclusione

Wave 0 Day 1 completata. Output: questo audit + il postmortem dell'archivio + due `data-testid` consolidati. Wave 0 Day 2 può iniziare con specifiche concrete:

- Costruire `IsolatedShowcase`.
- Costruire `CanonicalDataBridge` con le prime API `useRosterData()` / `useResidentVisualResolver()`.
- Costruire `contract.ts` con la firma per-kit-configurabile descritta in Sezione 3.

Niente surprise da v2 dopo Day 1, **a parte la scoperta che metà dei kit richiedono `MinimalGameplayPage` come reference invece che `TestRosterPage`** — informazione critica che il piano originale (v1) non considerava affatto.
