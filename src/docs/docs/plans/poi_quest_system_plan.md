---
title: POI Quest System — Piano implementativo
type: plan
status: ESEGUITO (T-001 → T-009)
updated: 2026-08-11
richiesta: R-005
desiderata: v3 FROZEN
esplorazione: poi_quest_system_exploration.md
evidence: test-results/poi-quest-system-r005-2026-08-11.md
---

> **Stato esecuzione (2026-08-11).** Tutti i task eseguiti. Safeguard verdi
> (tsc, lint, build:check, kanban:lint) e **72 nuovi test passed**.
> Evidence: [poi-quest-system-r005-2026-08-11.md](../../../../test-results/poi-quest-system-r005-2026-08-11.md).
>
> **Scostamenti dal piano, con motivo:**
> - **Milestone**: una per fase, equispaziate. Con 4 fasi coincide con 25/50/75/100%;
>   `quest_city_rats` ha 3 fasi, quindi 33/67/100%. Il piano assumeva 4 milestone fisse.
> - **T-002**: `durationFormula` di `quest_city_rats` **non** è stato riallineato in
>   `defaultConfig.ts`: il campo è letto da altri consumer (VillageSandbox, MapPage,
>   CardDetail) e cambiarlo avrebbe effetti fuori scope. La durata della quest non lo
>   legge più affatto, quindi la divergenza è innocua qui.
> - **T-005**: usato `DestinyAstrolabeStandalone` da `destinyAstrolabeKit` (componente
>   React canonico) invece di `DestinyAstrolabeComponent.tsx`, che monta un iframe a
>   `height: 100vh` e non è annidabile. Il modale è a schermo intero per la stessa
>   ragione, non dentro il layout della card.
> - **T-006a**: la rope è stata **aggiunta** in fondo alla card, non ha sostituito la
>   progress bar segmentata: le due comunicano cose diverse (avanzamento nella fase
>   vs timer globale) e rimuovere quella esistente sarebbe stata una regressione.
> - **T-003/T-011**: i glifi sono path SVG procedurali da una grammatica condivisa, non
>   rune (il Director ha escluso le rune). La lingua definitiva resta di R-006.
> - **Extra non previsto**: corretti 5 difetti preesistenti e un bug Zod 4 sui default
>   annidati (vedi evidence log). `QuestPOI` esteso in modo additivo con i badge di
>   rischio, così il POI quest della famiglia non perde informazione rispetto a
>   `GenericPoiSkin`.
>
> **Resta da fare:** passata visiva manuale in una finestra in primo piano — il pane
> di preview riporta `document.hidden`, che sospende i timer del countdown.

# POI Quest System — Piano implementativo

Piano per R-005. Lavora sulla pagina esistente
`/poi-quest-detail-roster-time-clock`. Tutti i componenti prodotti devono essere
importabili da qualsiasi POI della famiglia con una riga (frozen kit).

**Desiderata v3 (FROZEN):** cerchio magico che si scrive attorno al POI,
milestone 25/50/75/100% con Astrolabe V1, QuestChronicle con rope luminosa +
"Raccogli ricompense", tutto come frozen kit portabile per la famiglia POI.

---

## Dipendenze e ordine di esecuzione

```
T-001  →  T-002  →  T-003
                        ↓
               T-004  →  T-005
                        ↓
               T-006  →  T-007
                        ↓
               T-008  →  T-009 (safeguards)
```

Ogni task richiede lo stato che il precedente garantisce.

---

## T-001 — Fondamenta: DayNightPOI + QuestPOI dalla famiglia

**Precondizione:** pagina compila (fix duplicate `const status` già applicato).

**Cosa fa:**
1. Importa `DayNightPOI` da `poiKit` (già esportato: `src/ui/idleVillage/frozen/kits/poiKit.tsx`).
2. Aggiunge `DayNightPOI` alla pagina come elemento visivo di scena (sotto il
   clock widget, accanto al POI quest — non interattivo con il countdown locale).
   `DayNightPOI` legge dal global store `useMinimalGameplayWithIdleVillageConfig`;
   il countdown locale della pagina resta indipendente (due clock separati è
   accettabile nel test hub).
3. Sostituisce `GenericPoiSkin` con `QuestPOI` da `poiKit`, passando:
   - `questId={activity.id}`
   - `label={activity.label}`
   - `icon={activity.icon ?? '⚔️'}`
   - `status={questStatus}` (mappato da `embarkResult`: `available` / `in_progress` / `completed` / `failed`)
   - `phases={phaseDots}` (array derivato da `blueprint.phases`, stato iniziale tutti `locked`)
   - `progress={elapsedMs / DURATION_MS}`
   - `onClick={handleQuestPoiClick}`

**Garantisce:** la pagina compila, mostra `DayNightPOI` e `QuestPOI` da frozen
kit, il progress ring di `QuestPOI` si muove col countdown.

**File modificati:** `PoiDetailQuestRosterTimeClockIntegrationPage.tsx`

---

## T-002 — Sorgente della durata: sum(QuestPhase.durationValue)

**Precondizione:** T-001 completato.

**Cosa fa:**
1. Importa `defaultQuestBlueprints` da
   `src/balancing/config/idleVillage/quests/questBlueprints.ts`.
2. Seleziona il blueprint corrispondente all'activity corrente
   (`blueprint = defaultQuestBlueprints[activity.id]`).
3. Calcola `QUEST_DURATION_MS`:
   ```ts
   const TEST_SCALE_MS: Record<string, number> = { hours: 1000, days: 8000, ticks: 100 };
   const QUEST_DURATION_MS = blueprint
     ? blueprint.phases.reduce((sum, p) => sum + p.durationValue * (TEST_SCALE_MS[p.durationUnits] ?? 1000), 0)
     : 12000; // fallback
   ```
   Per `quest_city_rats`: `2h + 3h + 1h = 6 × 1000ms = 6000ms`.
4. Calcola i timestamp delle 4 milestone:
   ```ts
   const MILESTONE_FRACTIONS = [0.25, 0.5, 0.75, 1.0];
   const milestoneMs = MILESTONE_FRACTIONS.map(f => Math.round(QUEST_DURATION_MS * f));
   ```
5. Aggiorna `durationFormula` del blueprint a `quest_city_rats` in
   `defaultConfig.ts` da `'3'` a `'6'` (secondi, allineato alle 6 fasi-ore
   del blueprint — il campo è usato come riferimento display nel POI detail).

**Garantisce:** la durata della quest viene dal blueprint (fonte unica),
le milestone sono derivate automaticamente, il countdown riflette le fasi reali.

**File modificati:**
- `PoiDetailQuestRosterTimeClockIntegrationPage.tsx`
- `src/balancing/config/idleVillage/defaultConfig.ts` (solo `durationFormula` di `quest_city_rats`)

---

## T-003 — MagicCircleHalo: iscrizione arcana che si scrive

**Precondizione:** T-002 completato (`QUEST_DURATION_MS` e `elapsedMs` stabili).

**Cosa fa:**
Crea `src/ui/idleVillage/components/MagicCircleHalo.tsx` — componente SVG + CSS.

### Specifica tecnica

**Props:**
```ts
interface MagicCircleHaloProps {
  progress: number;        // 0–1: frazione di cerchio materializzato
  size?: number;           // diametro in px, default 200
  isComplete?: boolean;    // true → stato pulsazione
  glyphSet?: string[];     // caratteri arcani, default: set interno
}
```

**Rendering:**
- Un `<svg>` con `viewBox` centrato.
- N caratteri (es. 36) posizionati su una circonferenza, calcolati con `Math.cos`/`Math.sin`
  a partire da ore 12 (angolo `-π/2`) in senso orario.
- `Math.floor(progress * N)` caratteri sono visibili; il resto ha `opacity: 0`.
- Ogni carattere ha una propria animazione CSS `@keyframes materialise`:
  `opacity: 0 → 1, text-shadow: 0 → glow, font-size: 60% → 100%` in 400ms.
  Il delay è `characterIndex * 50ms` (materializzazione sequenziale).
- **Nessun cerchio di sfondo, nessun anello, nessuna traccia.**
- Glyph set default (Unicode, no font speciale):
  ```
  ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ
  ᛚ ᛜ ᛞ ᛟ ☽ ✦ ⟡ ⬡ ᚡ ᚣ ᚥ ᚧ ᚫ ᚭ ᚯ ᚱ
  ```
  (rune Elder Futhark + simboli — leggibili come "lingua magica", niente font esterno).
- Colore: `var(--skin-accent, #c4a44a)` con `filter: drop-shadow(0 0 4px currentColor)`.
- Stato `isComplete`: aggiunge `@keyframes pulse` all'intero SVG (scale 1→1.05→1,
  glow intensificato, ogni 1.5s). CSS transition solo, niente JS in loop.

**Dove si monta:** nella pagina, avvolge il `QuestPOI` come layer assoluto
(`position: absolute, inset: -24px`).

**Invarianti rispettati:**
- Partenza ore 12 ✅
- Dove si è acceso rimane acceso (una volta `opacity: 1` non torna indietro) ✅
- Niente binari/tracce ✅
- Il cerchio non ruota: si scrive ✅
- A completamento: stop + pulsazione ✅
- Budget Pillar 1: DOM/CSS puro, zero PixiJS, zero requestAnimationFrame in loop ✅

**Garantisce:** componente standalone testabile in isolamento, progress 0→1 produce
iscrizione progressiva da 12 a 12, `isComplete` aggiunge pulsazione.

**File creati:** `src/ui/idleVillage/components/MagicCircleHalo.tsx`
**File modificati:** `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` (monta il cerchio)

---

## T-004 — useMilestoneEngine: hook per le milestone temporali

**Precondizione:** T-002 (`milestoneMs` disponibili).

**Cosa fa:**
Crea `src/ui/idleVillage/hooks/useMilestoneEngine.ts`.

```ts
interface MilestoneEvent {
  milestoneIndex: number;  // 0-3
  phase: QuestPhase;       // blueprint della fase corrispondente
  elapsedMs: number;
}

function useMilestoneEngine(
  elapsedMs: number,
  milestoneMs: number[],        // [ms25, ms50, ms75, ms100]
  phases: QuestPhase[],         // blueprint.phases
  active: boolean,              // true = spedizione avviata
  onMilestone: (event: MilestoneEvent) => void,
): { firedMilestones: number[] }
```

**Logica:**
- `firedRef = useRef<Set<number>>(new Set())`.
- `useEffect` su `[elapsedMs, active]`: per ogni `i` in `0..3`, se
  `elapsedMs >= milestoneMs[i]` e `!firedRef.current.has(i)` e `active`:
  - `firedRef.current.add(i)`
  - chiama `onMilestone({ milestoneIndex: i, phase: phases[i], elapsedMs })`
- Reset quando `active` torna `false`.

**Garantisce:** ogni milestone è emessa esattamente una volta per run; il callback
porta il blueprint della fase corrispondente.

**File creati:** `src/ui/idleVillage/hooks/useMilestoneEngine.ts`

---

## T-005 — Astrolabe V1 per fase: consumabili + skill check

**Precondizione:** T-004 (`onMilestone` disponibile).

**Cosa fa:**
1. Aggiunge stato `pendingMilestone: MilestoneEvent | null` alla pagina.
2. `onMilestone` → imposta `pendingMilestone` (apre modale).
3. Modale `MilestoneCheckModal`:
   - **Fase 1 (consumabili):** mostra nome fase, rischi (`riskProfile.injuryChance`,
     `deathChance`), lista slot residenti con le loro stat. Bottone "Salta consumabili"
     + stub list consumabili (vuota per ora). Bottone "Avvia skill check" →
   - **Fase 2 (Astrolabe):** monta `DestinyAstrolabeComponent` V1 con:
     ```ts
     skills = buildSkillsFromPhase(phase, controller.slots, roster)
     // buildSkillsFromPhase: per ogni requiredStatTag nella fase,
     //   somma i valori di quel tag da tutti i residenti negli slot
     //   → una DestinyAstrolabeSkill per tag richiesto
     woundedChance = phase.riskProfile.injuryChance / 100
     deathChance = phase.riskProfile.deathChance / 100
     onComplete = (result) => handleMilestoneResult(milestoneIndex, result)
     autoStart = false  // attende click "Lancia"
     ```
4. `handleMilestoneResult`:
   - Aggiorna `phaseResults[milestoneIndex]` con `result.verdict`.
   - Aggiorna `phaseDots[milestoneIndex].state` → `success` / `failure`.
   - Chiude il modale (`pendingMilestone = null`).
   - Il gioco prosegue — nessuna interruzione automatica.
5. Se il modale è chiuso prima della fine: `autoStart = true`, astrolabe gira in
   background, risultato salvato senza UI.
6. Interruzione manuale: bottone "Abbandona quest" visibile quando
   `embarkResult` è set e `elapsedMs < QUEST_DURATION_MS`. Click: reset stato,
   residenti tornano nel roster (stessa logica di "Raccogli ricompense").

**Garantisce:** ogni milestone apre il check; se il card è chiuso il check gira
silenzioso; il giocatore può interrompere manualmente.

**File modificati:** `PoiDetailQuestRosterTimeClockIntegrationPage.tsx`
**File creati:** `src/ui/idleVillage/components/MilestoneCheckModal.tsx`

---

## T-006 — QuestChronicle estesa: rope luminosa + Raccogli ricompense

**Precondizione:** T-005 (`phaseResults[]` disponibili e popolabili).

**Cosa fa:**
Estende `src/ui/idleVillage/components/QuestChronicle.tsx` con tre aggiunte:

### 6a — Rope luminosa
Sostituisce la progress bar piatta segmentata con un componente `<QuestRope>`:
- Barra orizzontale in fondo alla card.
- Colore: gradiente `transparent → var(--skin-accent)` che si riempie da
  sinistra a destra proporzionalmente a `progress` (0→1).
- CSS `transition: width 200ms linear`.
- Glow: `box-shadow: 0 0 8px var(--skin-accent)` sull'estremità destra.
- La prop esistente `progress` della card viene riusata.

### 6b — Pulsante "Raccogli ricompense"
- Visibile solo quando `outcome` è `victory` o `defeat` (quest completata).
- Stile: bottone primario skin-aware (`var(--skin-accent)`), testo "Raccogli ricompense".
- Prop: `onCollect?: () => void`.
- Posizione: sotto l'overlay di esito, centrato.

### 6c — Wire phaseResults
- La card riceve `phaseVisualStates: PhaseVisualState[]` (già accettate da
  `QuestChroniclePhase`). La pagina popola questi stati da `phaseResults[]`:
  milestone non ancora raggiunte = `locked`, raggiunta con success = `success`,
  raggiunta con failure = `failure`, milestone corrente = `active`.

**Props aggiuinte a `QuestChronicle`:**
```ts
onCollect?: () => void;  // se assente il bottone non appare
```

**Garantisce:** QuestChronicle mostra la rope luminosa, i riquadri di fase
aggiornati in tempo reale, e il bottone di raccolta al termine.

**File modificati:** `src/ui/idleVillage/components/QuestChronicle.tsx`

---

## T-007 — Sostituzione POI detail con QuestChronicle + raccolta

**Precondizione:** T-006 (card estesa pronta).

**Cosa fa:**
1. Aggiunge stato `isQuestCardOpen: boolean`.
2. `handleQuestPoiClick` (T-001):
   - Se `embarkResult` è null: apre il POI detail (comportamento corrente).
   - Se `embarkResult` è set: imposta `isQuestCardOpen = true`.
3. Render condizionale: se `isQuestCardOpen` → mostra `<QuestChronicle>` al posto
   del detail panel. La card riceve:
   - `blueprint={blueprint}` (dati quest)
   - `phaseResults` → `phaseVisualStates` (T-006c)
   - `progress={elapsedMs / QUEST_DURATION_MS}`
   - `outcome={elapsedMs >= QUEST_DURATION_MS ? computeOutcome(phaseResults) : undefined}`
   - `onCollect={handleCollect}`
4. `handleCollect`:
   - Chiama `controller.clearAllSlots()` → residenti tornano nel roster.
   - Reset: `setEmbarkResult(null)`, `setElapsedMs(0)`, `setPhaseResults([])`,
     `setIsQuestCardOpen(false)`.
   - Log telemetria: `trackTelemetryEvent('quest_rewards_collected', ...)`.
5. `computeOutcome`: `victory` se ≥ 3 fasi su 4 success (o ≥ 2 su 3 se la
   quest ha 3 fasi), altrimenti `defeat`.

**Garantisce:** click sul POI durante la quest apre la card; la card si chiude
solo col bottone di raccolta; al collect i residenti tornano al roster e lo stato
si azzera.

**File modificati:** `PoiDetailQuestRosterTimeClockIntegrationPage.tsx`

---

## T-008 — Freeze: questPoiKit

**Precondizione:** T-007 completato e pagina funzionante end-to-end.

**Cosa fa:**
Crea `src/ui/idleVillage/frozen/kits/questPoiKit.tsx`:

```ts
export { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
export { useMilestoneEngine } from '@/ui/idleVillage/hooks/useMilestoneEngine';
export { QuestChronicle } from '@/ui/idleVillage/components/QuestChronicle';
export type { MagicCircleHaloProps } from '@/ui/idleVillage/components/MagicCircleHalo';
export type { MilestoneEvent } from '@/ui/idleVillage/hooks/useMilestoneEngine';

export const QUEST_POI_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];
export const QuestPoiKitShell = createKitShell(QUEST_POI_PROVIDER_CHAIN, 'QuestPoiKitShell');
```

Aggiunge la voce al `COMPONENT_MASTER_INDEX.md`:
`questPoiKit — MagicCircleHalo, useMilestoneEngine, QuestChronicle — TRUSTED`.

**Garantisce:** i tre componenti prodotti sono importabili con una riga da qualsiasi
POI della famiglia.

**File creati:** `src/ui/idleVillage/frozen/kits/questPoiKit.tsx`
**File modificati:** `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`

---

## T-009 — Safeguards

**Precondizione:** T-008 completato.

**Checklist:**
- [ ] `npx tsc --noEmit` → zero errori
- [ ] `npm run build:check` → build pulita
- [ ] `npm run kanban:lint` → nessuna violazione
- [ ] Dev server avviato, `/poi-quest-detail-roster-time-clock` caricata
- [ ] Smoke test manuale:
  - DayNightPOI visibile ✓
  - QuestPOI mostra progress ring che avanza ✓
  - MagicCircleHalo scrive il cerchio da 12 a 12 in 6s ✓
  - A 25%/50%/75%: modale Astrolabe si apre, si può completare ✓
  - A 100%: cerchio pulsa, click → QuestChronicle si apre ✓
  - Rope si riempie, riquadri fase aggiornati ✓
  - "Raccogli ricompense" → residenti tornano nel roster, stato reset ✓
  - "Abbandona quest" → stessa azione ma mid-quest ✓

---

## Decisioni architetturali aperte

| Decisione | Stato | Default scelto |
| --- | --- | --- |
| Glyph set: rune Unicode vs SVG paths custom | **APERTA** (rimandato a R-006 reskin) | Rune Elder Futhark + simboli Unicode — nessun font esterno |
| Rendering avanzato (PixiJS) per glifi | **APERTA** (rimandato a R-006) | CSS/SVG puro per ora — profilare con PixiJS in R-006 |
| `DayNightPOI` vs countdown locale: due clock | **DECISIONE LOCALE** | Accettabile nel test hub; in produzione il POI quest userà un solo store |
| `computeOutcome` (soglia vittoria) | **APERTA** | ≥ 50% fasi success = victory; da bilanciare con config |

---

## Non in scope (R-005)

- Reskin ActionHalo, nuovo body medaglione → R-006
- Lingua glifica custom (font, SVG paths) → R-006
- Ricompense reali (resource engine) → separato
- Persistenza dello stato quest tra reload → separato
- Multi-POI quest (più quest contemporanee) → separato
