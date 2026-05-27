# Component Freezing & Certification Plan — v2 (Optimized)

**Status:** Proposed (sostituisce v1 dopo review)
**Created:** 2026-05-21
**Supersedes:** `component_freezing_certification_plan.md` (v1)
**Objective:** Allineare ogni pagina `minimal-*` al rendering canonico della corrispondente `Test*Page`, congelarne il contratto, testarlo e certificarlo, **senza mock e senza duplicazione di codice**.

---

## 0. Perché v2 — diagnosi del problema reale

Prima di riscrivere le fasi, va capito perché il flusso `Test*Page → minimal-*` ha continuato a rompersi nell'ultimo anno (ci sono ~30 log di "portrait-fix" in `test-results/`). Tre cause radice:

1. **Le `minimal-*` non usano i componenti reali.** Esempio concreto: `src/pages/minimal-roster.tsx` `import`-a `VillageRosterSection` ma **non lo renderizza mai**: il JSX è composto di `<div>` custom con stili inline e dati hardcoded. È un finto isolamento — quello che vedi a schermo non è il componente che la `/test` mostra.
2. **Mock data divergono dai sorgenti canonici.** `minimal-roster.tsx` usa `via.placeholder.com` per i portrait; il gioco vero passa per `getResidentPortraitUrl()` con asset risolti. Ogni volta che un campo canonico cambia (status enum, struttura `statSnapshot`, regole portrait), il mock resta indietro e produce regression silenziose.
3. **Granularità di "freeze" sbagliata nel piano v1.** Il v1 propone di congelare *file di kit* (sorgente) con git tag. Ma quello che l'utente vuole congelare è il **comportamento osservabile** della pagina di test: stesso DOM, stesso visual, stesso data flow. Congelare il sorgente non blocca la regressione perché qualsiasi cambio a un dep transitivo passa il git-tag indenne.

Il piano v2 attacca direttamente queste tre cause.

---

## 1. I 10 shift rispetto a v1

| # | Shift | Da (v1) | A (v2) | Perché |
|---|-------|---------|--------|--------|
| S1 | **Niente mock** | `mockData/residents.ts`, `mockResidents`, `mockSlots`, `mockActivities` | Le `minimal-*` importano gli stessi simboli usati da `Test*Page`: `MINIMAL_GAMEPLAY_RESIDENTS`, `TEST_RESIDENTS`, `TEST_ROSTER_HEROES`, `useCanonicalRosterBundle`, `useVillageResidents`, `DEFAULT_MINIMAL_CONFIG`, ecc. | Elimina la classe "portrait-fix" di bug. I dati sono **per costruzione** gli stessi delle pagine di test. |
| S2 | **Re-export, non estrazione** | Estrarre logica da `TestRosterPage.tsx` in nuovi `kit*.tsx` | `frozen/kits/rosterKit.ts` è un **re-export** che ri-pubblica `VillageRosterSection` + i suoi hook canonici + un binder dati canonico. Niente nuovo componente. | `TestRosterPage` è 1500+ righe di scenari/drag/HUD/skin. Estrarne pezzi è invasivo e crea il rischio che ha già fatto archiviare un precedente tentativo (`_ARCHIVED_ROSTER_SLOT_INTERACTION`). Il boundary giusto è quello che il codice canonico **già espone** (`@/ui/idleVillage/roster`). |
| S3 | **Showcase frame separato** | Le `minimal-*` mescolano titolo, controlli, info panel e componente | Nuovo `<IsolatedShowcase componentName="…" specPath="…">{children}</IsolatedShowcase>`: solo un viewport centrato, opzionalmente con un piccolo overlay debug nascosto da `?debug=1`. Tutto il resto **fuori**. | Il requisito esplicito: "vedo solo il componente al centro, niente altro". Va incarnato in un componente unico, non disciplina diffusa. |
| S4 | **Freezing del comportamento, non del sorgente** | Git tag su `kit*.tsx` | Freeze pacchetto: `kit.contract.ts` (TS API), `kit.fixture.ts` (dati canonici pinnati a uno snapshot ID), `kit.dom.snap` (snapshot DOM normalizzato), `kit.visual.png` (visual regression baseline), `kit.cert.json` (manifest firmato). Git tag annotato sull'insieme. | Lo scopo del freeze è che "il comportamento del 21 mag 2026 non cambia"; un tag su un file sorgente non lo garantisce, un test di contratto sì. |
| S5 | **Contract test pagina↔pagina** | Solo unit + snapshot del kit | Test: monta `/test/roster` e `/minimal-roster`, individua il subtree comune (`data-testid="village-roster-section"`), normalizza, diff. Deve essere identico (a meno di props chiaramente esposti). | È il test che avrebbe catturato il bug di `minimal-roster` rotto: render output diverso tra le due pagine. |
| S6 | **Infrastruttura prima, factory dopo** | 8 fasi che processano tutti i kit a ondate (estrazione tutti, poi test tutti, poi doc tutti…) | **Wave 0**: costruisci infra + 1 kit di riferimento (Roster) end-to-end fino a certificazione, e *poi* duplichi il pattern sugli altri 14. | Con 15+ pagine il pattern v1 fa scoprire problemi solo a fine Phase 4. Il pattern v2 li scopre nei primi 5 giorni su un kit, poi gli altri costano marginalmente. |
| S7 | **Generator scriptato** | Procedura manuale per ogni kit | `scripts/freeze-kit.ts <kitName>` scaffolda: `kit.ts`, `kit.contract.ts`, `kit.fixture.ts`, `__tests__/*.test.tsx`, `__tests__/*.contract.test.tsx`, `kit.md`, voce nel registry. | A 15 kit, ogni minuto manuale ripetuto × 15 = ore perse e divergenza tra kit. |
| S8 | **Refactor in place, non delete + recreate** | `rm minimal-*.tsx` poi ricrea | Modifica in place ogni `minimal-*.tsx` riducendolo a `<IsolatedShowcase><Component {...canonicalProps} /></IsolatedShowcase>`. Versione vecchia disponibile sotto `?legacy=1` per uno sprint, poi rimossa. | Delete-then-recreate cancella la storia git utile e mette CI giù per un periodo. Refactor in place mantiene bisect-ability e permette A/B durante migrazione. |
| S9 | **Registry centralizzato + manifest** | `index.ts` che riesporta | `frozen/registry.ts`: mappa `kitId → {component, fixture, contract, cert, route_test, route_minimal}`. Usato da CI per discovery automatica di test/cert per ogni kit. | A 15 kit la "lista in 5 file diversi da tenere allineati" è il prossimo bug. Un registry single-source elimina il drift di lista. |
| S10 | **Timeline realistica con buffer** | 11 giorni totali, sequenziale | 5 settimane lavorative (~25 giorni) con Wave 0 (1 settimana) + Wave 1 (3 settimane factory mode) + Hardening (1 settimana). | Con 15+ pagine, scenari di drag, HUD, skin, integration pages, l'11gg di v1 è ~3× sotto. Meglio una stima onesta che 4 slip consecutivi. |

---

## 2. Inventario reale del lavoro

Da `src/pages/minimal-*.tsx` (15 pagine confermate via glob):

**Kit base (1 componente isolato per kit):**

1. `minimal-roster` → `VillageRosterSection`
2. `minimal-clock` → `ClockWidget`
3. `minimal-slotRack` → `ResidentSlotRack`/`SlotRackWithSkin`
4. `minimal-resourcehud` → `ResourceHUD` (da localizzare)
5. `minimal-jobcard` → `JobCard` (da localizzare)
6. `minimal-questcard` → `QuestCard` (da localizzare)
7. `minimal-skillcheck` → `SkillCheck` (da localizzare)
8. `minimal-outcome` → `OutcomeView` (da localizzare)
9. `minimal-market` → `MarketView` (da localizzare)
10. `minimal-slottedmedal` → `SlottedMedal` (da localizzare)
11. `minimal-activity` → `ActivityCapsule` + `TimeEngineStrip`
12. `minimal-hud` → `ActiveHUD`
13. `minimal-pgcard` → `PgCard` (da localizzare; storia dei bug più densa)

**Kit di integrazione (più componenti interagenti, scope maggiore):**

14. `minimal-integration-drag-job` → `DragProvider` + `VillageRosterSection` + `SlotRackWithSkin` + dnd-kit
15. `minimal-integration-quest-flow` → `QuestCard` + `SkillCheck` + `OutcomeView` in sequenza

I "kit di integrazione" hanno scope ≈ 2× dei kit base e vanno trattati come tali nella timeline.

---

## 3. Architettura target

```
src/ui/idleVillage/frozen/
├── _infra/
│   ├── IsolatedShowcase.tsx          # S3 — frame "solo componente al centro"
│   ├── CanonicalDataBridge.ts        # S1 — espone hook/fixture canonici
│   ├── contract.ts                   # S5 — helpers per contract test
│   └── certManifest.ts               # S4 — schema cert.json
├── kits/
│   ├── rosterKit.ts                  # S2 — re-export + binder
│   ├── rosterKit.contract.ts         # TS API freezata (interface)
│   ├── rosterKit.fixture.ts          # dati canonici pinnati (riferisce un commit di MINIMAL_GAMEPLAY_RESIDENTS)
│   ├── rosterKit.cert.json           # manifest firmato (versione, sha, evidence)
│   ├── rosterKit.md                  # documentazione utente
│   └── __tests__/
│       ├── rosterKit.contract.test.tsx     # contract test pagina↔pagina (S5)
│       ├── rosterKit.dom.test.tsx          # snapshot DOM normalizzato
│       └── rosterKit.visual.spec.ts        # Playwright visual baseline
├── registry.ts                       # S9 — single source of truth
└── index.ts                          # re-export pubblico
scripts/
└── freeze-kit.ts                     # S7 — generator
tests/contract/
└── minimal-vs-test.spec.ts           # S5 — contract sweep auto-generato dal registry
```

Convenzioni chiave:

- **`kit.ts` non contiene componenti nuovi.** Solo `export { VillageRosterSection } from '@/ui/idleVillage/roster';` più un `useRosterKitData()` che incapsula `useCanonicalRosterBundle()`. Il "binder" è l'unico pezzo di codice originale del kit e deve restare sotto le ~50 righe.
- **`kit.contract.ts` è la API freezata.** Cambiarlo richiede version bump esplicito. Esempio: `export interface RosterKitContract { component: ComponentType<{ residents: ResidentState[] }>; defaultData: () => ResidentState[]; version: '1.0.0'; }`.
- **`kit.fixture.ts` non duplica dati.** È un re-export pinnato: `export { MINIMAL_GAMEPLAY_RESIDENTS as fixture } from '@/balancing/config/idleVillage/minimalGameplayConfig';` con commento che indica il commit ref di freeze. Se il file canonico cambia in modo incompatibile, il contract test fallisce — non il kit silenziosamente.

---

## 4. Wave 0 — Infrastruttura + Kit di riferimento (Roster) — 5 giorni

Obiettivo: arrivare a "minimal-roster mostra esattamente lo stesso DOM del subtree `VillageRosterSection` dentro /test/roster, certificato".

### Giorno 1 — Investigazione di rischio

- Leggere `_ARCHIVED_ROSTER_SLOT_INTERACTION/` e capire perché è stato archiviato. Scrivere `docs/freeze/POSTMORTEM_ARCHIVED.md` con le 3 cause principali, da evitare in v2.
- Audit di `TestRosterPage.tsx` (ricognizione): mappare quali sezioni dell'enorme file sono il rendering canonico di `VillageRosterSection` vs. wrappers di scenario (`RACK_SCENARIOS`), controlli debug, skin lab. Output: una mappa "linea → ruolo" per identificare il subtree target del contract test.
- Definire il selettore di contratto: probabilmente un `data-testid="village-roster-section"` sul root del componente reale. Se non c'è, aggiungerlo nel componente canonico (cambio minimo, retrocompatibile).

**Convenzione testid contract root** (definita 2026-05-21):
- Pattern canonico: `data-testid="<kebab-component-name>"` sul **root JSX** del componente.
- Già conforme: `VillageRosterSection` (`<section>` root, riga 120), `PgCard` (`<div>` root, riga 411), `ActiveHUD`, `ActivityCapsule`.
- Eccezione (incoerenza storica): `ResidentSlotRack` ha `data-testid="resident-slot-rack"` su un `<div>` interno (lista, riga 746) usato da 11 test esistenti. Per non romperli, aggiunto `data-testid="resident-slot-rack-root"` sul vero root JSX (riga 694). I contract test useranno `-root` come boundary del componente; gli unit test legacy continuano con il testid esistente. **TODO post-Wave 1**: consolidare convenzione spostando il testid canonico sul root e refactorando i 11 file di test (ticket separato).
- Variante non canonica `PgCardTS002.tsx` non ha testid: NON usata da nessuna `minimal-*`, non bloccante. Disposizione: deprecation flag o rimozione in Hardening.

### Giorno 2 — Infra di base

- `IsolatedShowcase` con CSS minimo (viewport centrato, `?debug=1` opzionale).
- `CanonicalDataBridge` con i primi due metodi: `useRosterData()`, `useResidentVisualResolver()`.
- `contract.ts` con `mountAndDiff(testRoute, minimalRoute, selector)` che normalizza DOM (rimuove id volatili, timestamp, ordine attributi) e produce diff.
- `certManifest.ts` con schema Zod del `cert.json` (version, kitId, gitSha, fixtureSha, evidence URLs, certifiedBy, certifiedAt).

### Giorno 3 — `freeze-kit.ts` generator

- Script Node che prende `<kitName>` e crea i 7 file con placeholder corretti.
- Aggiunta automatica al `registry.ts` (parsing + insert ordinato).
- Smoke test: `npm run freeze:kit demoKit` produce file e li rimuove con `--dry-run`.

### Giorno 4 — Roster kit end-to-end

- `rosterKit.ts` (re-export di `VillageRosterSection` + binder a `useCanonicalRosterBundle`).
- `rosterKit.contract.ts`, `rosterKit.fixture.ts`.
- Refactor di `src/pages/minimal-roster.tsx` (rimozione mock data + JSX custom; risultato: ~10 righe che importano dal kit dentro `IsolatedShowcase`).
- Vecchio comportamento dietro `?legacy=1` per 1 sprint.

### Giorno 5 — Test + certificazione del Roster kit

- Contract test: `tests/contract/minimal-vs-test.spec.ts` con caso roster.
- DOM snapshot test.
- Playwright visual baseline (1 viewport desktop + 1 mobile).
- `cert.json` generato dalla pipeline (npm run cert:roster) con sha attuali.
- Git tag annotato: `frozen/roster-kit-v1.0.0`.
- **Gate Wave 0:** se il contract test passa per Roster, Wave 1 è abilitato. Se fallisce, l'approccio si rivede prima di scalare.

---

## 5. Wave 1 — Factory mode sui kit base — 15 giorni

12 kit base (escludendo Roster già fatto e i 2 di integrazione). Velocità target: **~0.8 kit/giorno** medi (≈10 ore di lavoro effettivo per kit con il generator pronto, più buffer per i casi rognosi tipo `pgcard`). Sui 15 giorni allocati: 12 giorni "produzione" + 3 giorni buffer/incidenti.

Sequenza consigliata per minimizzare rischio:

1. **Settimana 1** — Kit "puramente di display" (basso rischio): `clock`, `slottedmedal`, `resourcehud`, `outcome`, `jobcard`, `questcard`. Output ad alta confidenza, valida il generator.
2. **Settimana 2** — Kit con dati canonici complessi: `pgcard` (storia bug densa, fare attenzione), `skillcheck`, `market`, `activity`, `slotRack`.
3. **Settimana 3** — Kit interattivi: `hud`. Buffer per i kit che si rivelano più rognosi del previsto (`pgcard` in particolare, viste le 20+ patch storiche).

Per ogni kit:

- `npm run freeze:kit <name>` (3 min).
- Localizzare il componente canonico reale (usare la mappa di TestRosterPage o equivalente Test*Page se esiste; altrimenti trovare il primo `import` reale).
- Compilare contract + fixture (15 min).
- Refactor `minimal-<name>.tsx` (15-30 min).
- Test contract + DOM + visual (1-2h).
- Cert + tag (15 min).
- Doc in `kit.md` (30 min).

**Daily ritual:** ogni mattina, `npm run contract:all` su CI verifica che tutti i kit certificati restino conformi. Se un kit drift-a, blocca il merge.

---

## 6. Wave 2 — Kit di integrazione — 4 giorni

`minimal-integration-drag-job` e `minimal-integration-quest-flow` sono qualitativamente diversi dai kit base perché incarnano un **flusso** (sequenza di interazioni) e non un rendering statico. Il contract test diventa scenario-based:

- Sequenza di eventi (drag start, hover, drop) eseguita su entrambe le pagine.
- Asserzione: lo stato visivo intermedio e finale è identico modulo selettori esposti.

Tempo previsto: 2 giorni per kit, incluso refactor + scenari Playwright.

---

## 7. Hardening — 5 giorni

- **Sweep contract test completo:** tutti i kit certificati, su CI matrix (Chromium/WebKit, mobile/desktop). Triage delle inevitabili flakiness visual.
- **Rimozione legacy paths:** dopo uno sprint, rimuovere `?legacy=1` fallback e dead code.
- **Documentazione finale:** `docs/freeze/INDEX.md` con il registro completo, link a ogni `kit.md` + cert badge.
- **Governance:** scrivere `docs/freeze/POLICY.md` con regole post-freeze (chi può ri-certificare, come si fa version bump, criteri per major vs patch).
- **CI gate:** PR che modifica un componente canonico fa fallire il job se i contract test del relativo kit non sono aggiornati o esplicitamente bumpati.

---

## 8. Versioning — semplificato

Visto che il consumo è interno e nello stesso repo (S9 dell'AskUserQuestion):

- **Niente semver per kit.** Singolo numero `kit.contract.ts → version: '1.0.0'` + git tag annotato `frozen/<kitId>-v<version>`.
- Bump regola unica: se il contract o il fixture cambia, version bump + nuovo tag + nuovo `cert.json`. Punto.
- Niente publish a npm, niente changelog separato per kit (il git log tagged è la storia).

---

## 9. Tre rischi residui e come gestirli

1. **TestRosterPage continua a essere refactored mentre congeliamo.** Mitigazione: prima azione di Wave 0 è aggiungere un commit di "stabilizzazione" + nota nei doc che congelamenti in corso. Se un PR modifica `TestRosterPage`, deve rilanciare i contract test e i kit interessati. Il CI gate (sezione 7) lo enforce.
2. **Il componente canonico non ha un `data-testid` stabile.** Mitigazione: parte di Wave 0 è auditare e, se manca, aggiungere un testid sul root del componente reale (cambio minimo, non rompe nulla). Tutti i contract test si appoggiano a questi testid, non a posizioni del DOM.
3. **Esiste già un archivio di un tentativo fallito.** Mitigazione esplicita in Giorno 1 di Wave 0 (postmortem dell'archive). Non è opzionale — la causa per cui v1 si è arenato va capita prima di rifare lo stesso percorso.

---

## 10. Timeline riepilogativa

| Fase | Durata | Dipendenza | Output |
|------|--------|-----------|--------|
| Wave 0 — Infra + Roster | 5 gg | — | Infra completa + 1 kit certificato + gate verde |
| Wave 1 — Factory base | 15 gg | Wave 0 verde | 12 kit base certificati |
| Wave 2 — Integrazione | 4 gg | Wave 1 (≥ kit drag, roster, slotRack) | 2 kit integrazione certificati |
| Hardening | 5 gg | Wave 2 | CI gate attivo, legacy rimosso, doc finale |

**Totale: 29 giorni lavorativi (≈ 6 settimane calendario).**

Confronto: v1 prevedeva 11 giorni. v2 ne prevede 29, ma con (a) 15 pagine invece di 5-6, (b) contract testing reale, (c) elimina mock data, (d) ha un gate verde dopo 5 giorni che permette di abortire se l'approccio non funziona — cosa che v1 non aveva.

---

## 11. Success criteria (revisionati da v1)

- [ ] Ogni `minimal-*` apre e mostra **solo** il componente canonico al centro, niente UI extra.
- [ ] Zero `mock*` arrays nei file `src/pages/minimal-*.tsx`.
- [ ] Ogni kit ha `contract.ts`, `fixture.ts`, `cert.json`, `kit.md`, git tag, contract test verde.
- [ ] `npm run contract:all` passa in CI.
- [ ] Visual regression baseline congelato per ogni kit, viewer disponibile.
- [ ] `docs/freeze/POLICY.md` scritto, `docs/freeze/POSTMORTEM_ARCHIVED.md` scritto.
- [ ] Nessuna pagina `minimal-*` ha più di ~15 righe di codice (showcase wrapper + kit usage).
- [ ] Un PR che modifica un componente canonico fa partire i contract test automaticamente.

---

## 12. Cosa fare adesso (Next steps concreti)

1. **Review umano del piano v2** — confronta con v1, decidi se mergiare/sostituire.
2. **Decisione su `IsolatedShowcase`** — esiste già qualcosa di simile in `src/ui/styleLab/StyleLabSurface`? Verificare riuso.
3. **Approvazione Wave 0** — se ok, primo task è il postmortem dell'archive (Giorno 1).
4. **Branch strategy** — proposta: `freeze/wave-0` come long-lived branch, merge in `main` solo a fine Wave 0 con gate verde.

---

**Owner proposto:** TBD
**Reviewer:** Fausto
**Last Updated:** 2026-05-21
