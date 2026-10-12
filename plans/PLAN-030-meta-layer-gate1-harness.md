---
title: 'PLAN-030 — Meta-Layer Gate 1: harness deterministico + graph linter (senza combattimento)'
status: active
created: 2026-10-12
request: Director 2026-10-12 («adesso come dobbiamo procedere?» → scelta «Ratifica + prototipo Gate 1»); R-164
parent: PLAN-026 (quest generation); related: PLAN-028 (canali), PLAN-029 (Quest Gen Lab), OPEN-019/020/021
research: .mw/runs/20261011-opportunity-layer-research/ (R-154, report-t7 = metodologia a 3 gate)
design: context/QUEST_OPPORTUNITY_LAYER.md (PROPOSAL con punti ratificati 2026-10-11/12)
rule: QUEST_RULES.md §9 (proposte registrate); nessuna regola vigente modificata
---

# PLAN-030 — Meta-Layer Gate 1

## 0. Scopo e decisione di fondo

Validare la **struttura** del layer opportunità (ratificata in parte il
2026-10-12) con un **decision system giocabile senza combattimento** —
metodologia R-154/T7: il loop completo deve esistere

```
WorldState (qualities) → generazione offerte → valutazione gate →
commitment → risoluzione → scrittura qualities → avanzamento tempo → ripeti
```

ma senza le parti che non servono all'ipotesi: niente combat, ferite,
narrativa, UI del villaggio, motori di quest interni.

Il prototipo risponde alle domande di **Gate A** (correttezza
strutturale): le regole producono stati raggiungibili e scelte reali?
Nessuno stato impossibile, nessun bypass non intenzionale, i 3 concetti
di tempo non collassano in un unico timestamp.

Gate B (policy-sim con agent diagnostici + metriche pre-registrate) e
Gate C (playtest di comprensione umana, Wizard-of-Oz) sono **piani
successivi**: questo plan produce l'harness su cui Gate B si appoggia.

## 1. Decisioni ratificate che il piano implementa

| Decisione (fonte) | Conseguenza nel v0 |
|---|---|
| Modello dati **ibrido** (OPEN-019) | `WorldState` = dizionario qualities piatte (`access:`/`contact:`/`intel:`/`clock:`) + `OfferDef` con `requires`/`provides`; più `MilestoneNode` authored per obiettivi strategici |
| Tipi di arco **set aperto config-first** (OPEN-019) | `ArcType` = registry estendibile in config; v0: `unlock`/`intel`/`preparation` + `clock` |
| **Niente valuta intel** (OPEN-021) | scout-quality = funzione di `explorerQuality` del party (larghezza banda di rischio); nessuna risorsa spendibile |
| **Solo leader-capacity** (OPEN-021/010) | commitment richiede un leader libero; gli edifici NON danno slot (v0: non modellati affatto) |
| **4 stati gate su offer card** (OPEN-020) | `evaluateGateState` → `Locked`+via di sblocco / `Underprepared`+banda+mancanza+prezzo / `Ready` / `Over-qualified` |
| **Doppio timer** (tempo) | `acceptanceTicks` (offerta scade) separato da `completionTicks` (quest accettata deve chiudersi) + `window` opzionale |
| **Steering = bias di peso visibile** (OPEN-021) | `SteeringBias` = pesi per famiglia dichiarati, applicati alla distribuzione, mai filtro |
| Tassonomia requisiti **resta proposal** (OPEN-020) | i `requires` si dichiarano in forma minimale (`quality`, `capability`, `stat`); la classificazione a 4 tipi è ciò che il prototipo deve validare |
| **Non idle** (R-161) | il tempo avanza solo a tick espliciti di `advanceTime` — nessuna nozione di assenza |

## 2. Scope v0

| Elemento | v0 | Note |
|---|---|---|
| Engine | `src/engine/metaLayer/` — TS puro, deterministico, seeded RNG | stessa famiglia di `engine/quest` |
| Config | `src/balancing/config/metaLayer/` — Zod per ogni artefatto | config-first invariant |
| Famiglie | 3: infiltration (allarme), delve/survival (attrito), race (progresso bersaglio) | signature pressure + stop condition dichiarate in `FamilyDef` |
| Tier | 3 per famiglia → ~15-20 `OfferDef` authored | ricompense fisse configurate, niente stat-inflation |
| Milestone | 2 nodi authored (es. «Infiltrare la Fortezza», «Spezzare l'Assedio») | tracciano gli approcci aperti |
| Party | `PartyCapability`: capability tags + `leaders` (count) + `explorerQuality` + stat sintetiche | niente roster reale, niente LabMember |
| Harness API | `offerQuests`, `inspectRequirements`, `selectQuest`, `advanceTime` | ~poche centinaia di righe, driver a script |
| Linter | `lintOpportunityGraph(config)` → report JSON + MD | BFS sullo spazio qualities raggiungibile |
| UI | **nessuna** (Gate C avrà una board minima; non qui) | YAGNI |

## 3. Non-scope v0

- Combattimento, ferite, morte, infortuni (il resolve è seeded-esito
  graduato, non una simulazione tattica);
- interno di quest (`ScenarioInstance`, grafo di scena, canali —
  orbita PLAN-026/028): una quest accettata si risolve come **esito
  graduato** (epic fail/fail/almost/win/big win) da banda di rischio +
  capacità, senza percorrere nodi;
- narrativa, domain kit, testo;
- UI (qualsiasi pagina); il Quest Gen Lab resta l'harness visivo per
  l'intra-quest — il meta-layer è un simulatore parallelo (report-t7 §7);
- valuta intel, edifici, economia villaggio reale, roster reale;
- transizione mid-run tra famiglie (ratificata ma serve
  ScenarioInstance — si testa quando il resolve diventa run vera);
- conversion rewards (posticipate al playtest, decisione Director).

## 4. Contratti v0 (bozza)

```ts
// config (Zod)
type QualityKey = `${'access'|'contact'|'intel'|'clock'|'capability'}:${string}`
type ArcType = string                      // registry aperto, v0: unlock|intel|preparation|clock
type GateState = 'locked'|'underprepared'|'ready'|'over-qualified'

interface RequirementRef {                  // forma minimale — la tassonomia a 4 tipi è da validare
  kind: 'quality'|'capability'|'stat'
  key: string                               // QualityKey | capability tag | stat name
  severity?: 'absolute'|'capability'|'cost'|'optimize'   // OPT-IN v0: serve a classificare dopo
}
interface QualityDelta { key: QualityKey; delta: number }
interface OfferDef {
  id: string; family: string; tier: 1|2|3
  requires: RequirementRef[]
  provides: QualityDelta[]                  // reward = scrittura di qualities
  durationTicks: number
  acceptanceTicks: number                   // scadenza dell'offerta
  completionTicks: number                   // tempo max post-commit
  window?: { openAt: number; closeAt: number }
  unlockHint?: string                       // via di sblocco mostrata se Locked
  riskBand: [number, number]                // banda grezza; scout la stringe
}
interface FamilyDef { id; signaturePressure: QualityKey; pressureMoves: ...;
                      stopCondition: ...; compatibleChannels: string[] }
interface MilestoneNode { id; requires: RequirementRef[]; approaches: ... }

// engine
interface WorldState { qualities: Map<QualityKey, number>; tick: number }
interface PartyCapability { leaders: number; explorerQuality: number;
                            capabilities: Set<string>; stats: Record<string,number> }
generateOffers(state, party, steering, rng): Offer[]
evaluateGateState(offer, party, state): { state: GateState; band:[n,n]; missing:[]; cost?:…; unlockRoute?:string }
commitOffer(offerId, party, state): CommitResult      // consuma 1 leader
advanceTime(state, party, ticks): {expiredOffers, completedQuests, clockEvents}
```

## 5. Task draft

- **T-001** Config `metaLayer`: schemi Zod per `QualityKey`,
  `RequirementRef`, `QualityDelta`, `OfferDef`, `FamilyDef`,
  `MilestoneNode`, `ArcType` registry, `SteeringBias`; file JSON/TS per
  le 3 famiglie × 3 tier e i 2 milestone. (`src/balancing/config/metaLayer/`)
- **T-002** Engine: `WorldState`, `PartyCapability`, `generateOffers`
  (pesi × steering, seeded), `evaluateGateState` (4 stati + banda scout
  da `explorerQuality` + unlockRoute su Locked), `commitOffer`
  (leader-capacity), `advanceTime` (clocks, scadenze acceptance/
  completion, window, write-back `provides`). (`src/engine/metaLayer/`)
- **T-003** Harness: facade `offerQuests`/`inspectRequirements`/
  `selectQuest`/`advanceTime` + **driver a script** (scenario TS/JSON
  che gioca N cicli loggando le decisioni) — utilizzabile da test e da
  una sessione manuale del Director.
- **T-004** Graph linter `lintOpportunityGraph(config, initialState)`:
  BFS sullo spazio qualities raggiungibile (offerte come transizioni,
  clocks come eventi). Check: (a) nessun OfferDef irraggiungibile
  (dead offer); (b) ogni milestone critico raggiungibile via ≥2 insiemi
  di requisiti distinti (≥2 ingressi); (c) nessun bypass non
  intenzionale (rimuovere un requisito deve cambiare il reachable set);
  (d) ogni Locked ha `unlockHint`; (e) i 3 tempi non collassano
  (esistono offerte in cui acceptance ≠ completion ≠ duration);
  (f) nessuna scrittura `provides` verso quality inesistenti nel
  vocabolario. Output `test-results/plan030-graph-lint/`.
- **T-005** Contenuto v0: ~15-20 offerte authored (3 famiglie × 3 tier
  + cross-gates: una quest stealth T3 che richiede intel da una delve
  T2, ecc.), 2 milestone, 2-3 clock di mondo, catalogo capability tag
  iniziale.
- **T-006** Test + sessione Director: suite seeded (determinismo
  offerte, gate states, timer distinti, leader-capacity blocca il 3°
  party, steering sposta la distribuzione senza filtrare, write-back);
  linter eseguito come test; evidence log + **sessione 50-100 cicli
  del Director** sul driver (T7: «gioca tu stesso») con note raccolte.

## 6. Exit criteria (Gate A)

1. Linter report: zero dead offer, milestone con ≥2 ingressi, zero
   bypass non intenzionali, vocabolario qualities chiuso.
2. Suite test verde: determinismo a seed fisso, i 3 tempi distinti,
   gate states corretti, leader-capacity vincolante.
3. Sessione Director registrata (`test-results/plan030-session-*.md`):
   le offerte che compaiono sono spiegabili dalla qualities-scrittura
   precedente (leggibilità causale preliminare — Gate C la verifica
   con esterni).

**Decide per Gate B:** se la struttura è corretta, PLAN-031 = policy
agents (greedy/risk-averse/specialist/unlock-seeker/deadline-aware) +
metriche pre-registrate (dead-option rate, dominant-strategy rate,
opportunity-miss rate, unlock utility…).

## 7. Decisioni aperte (da non decidere in silenzio)

- **Signature pressure v0 delle 3 famiglie** — proposta:
  `clock:alarm` (infiltration), `clock:attrition` (delve),
  `clock:target-progress` (race); il nome esatto è libero finché
  coerente con `FamilyDef`.
- **Sintassi `unlockHint`/unlockRoute** — stringa libera vs riferimento
  a RequirementRef soddisfabile; v0 propone riferimento strutturato.
- **Chi fa battere i clock** — tick globale di `advanceTime` (default
  v0) vs agenti/eventi specifici; se un clock batte a ogni tick, il
  mondo «che avanza da solo» potrebbe scadere troppe offerte.
- **Severity in `RequirementRef`** — campo opt-in per classificare
  ex-post (il prototipo deve dire se la tassonomia a 4 tipi regge, non
  presupporla).
- **Esito graduato del resolve** — banda scout → probabilità sui 5
  esiti; forma esatta della curva lasciata al T-002 con default
  configurabile.

## 8. Stato di avanzamento (2026-10-12)

| Task | Stato | Artefatti |
|---|---|---|
| T-001 | ✅ | `src/balancing/config/metaLayer/{schema,content,index}.ts` — Zod, 3 famiglie × 3 tier, 13 offerte, 2 milestone, 2 clock |
| T-002 | ✅ | `src/engine/metaLayer/{rng,engine}.ts` — WorldState, generateOffers pesato+steering, evaluateGateState (4 stati + scout band + unlockRoute), commit/advance/resolve graduato |
| T-003 | ✅ | `harness.ts` (facade) + `driver.ts` (`driveSession`, `formatBoard`, 4 policy) |
| T-004 | ✅ | `linter.ts` — BFS fixpoint sullo spazio qualities; dead offer, ≥2 ingressi milestone, bypass, unlockHint, 3 tempi, vocabolario. Report in `test-results/plan030-graph-lint/` |
| T-005 | ✅ | Contenuto v0 authored in `content.ts` (cross-gate: `infil-assassinate` richiede `intel:guard-rotation ≥2` da `infil-scout-camp` ripetibile; `access:fortress-inner` da `access:sewers`) |
| T-006 | 🟡 | Suite seeded: 23 test verdi. Evidence: `test-results/plan030-evidence.md` + `plan030-session.log` (60 cicli scripted). **Resta la sessione manuale del Director** |

Safeguard: `test -- metaLayer` 23/23 ✅ · `build:check` ✅ · `kanban:lint` ✅ · `lint` vacuous sullo scope (engine/balancing in quarantena eslint preesistente; copertura reale = tsc via build:check).

### Divergenze/note vs draft
- Steering testato via **presence-rate** (boardSize 2 vs pool 5): count assoluto è cappato da 1 offerta/famiglia eleggibile.
- `scout-camp` reso ripetibile: era un dead route verso `guard-rotation ≥2` (trovato dal linter, non dal test).
- Finding per Gate B in `plan030-evidence.md`: attrattore degenere su policy naive, qualities senza cap, race family inerte per party non specializzato.
