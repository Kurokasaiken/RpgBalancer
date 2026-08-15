# questPoiKit

**Status:** Draft · **Version:** 1.0.0
- Canonical reference: `src/ui/idleVillage/pages/PoiDetailQuestRosterTimeClockIntegrationPage.tsx`
- Reference route: `/poi-quest-detail-roster-time-clock`
- Spec: `src/docs/docs/plans/poi_quest_system_plan.md` (desiderata v3 + v4 FROZEN 2026-08-12)
- Evidence: `test-results/poi-quest-system-r005-2026-08-11.md`

---

## Famiglia di componenti

| Componente | File | Ruolo |
|---|---|---|
| `MagicCircleHalo` | `components/MagicCircleHalo.tsx` | Timer visivo della quest — iscrizione che si scrive in senso orario dal centro 12. Nessun ring, nessun track. |
| `QuestChronicle` | `components/QuestChronicle.tsx` | Card della quest in esecuzione — fasi come square, corda luminosa (QuestRope), overlay esito. |
| `MilestoneCheckModal` | `components/MilestoneCheckModal.tsx` | Contenuto del pannello skill check — Destiny Astrolabe V1 + consumabili. Puro div, nessun overlay. |
| `QuestRewardPanel` | `components/QuestRewardPanel.tsx` | Schermata di raccolta ricompense — costruita sui ruoli del design system (`SkinScope`, `SkinTitle`, `SkinButton`). |
| `FloatingPanel` | `components/FloatingPanel.tsx` | Shell spostabile/riducibile senza backdrop. Usato come contenitore di Detail, QuestChronicle, MilestoneCheckModal. |
| `useMilestoneEngine` | `hooks/useMilestoneEngine.ts` | Hook che osserva `elapsedMs` ed emette un evento per ogni soglia di fase attraversata. |
| `QuestPOI` | `components/minimal/QuestPOI.tsx` | Medaglione POI con prop `medallionOverlay` per centrare il halo, badge danno/fase, rischi. |
| `DayNightPOI` | `components/minimal/DayNightPOI.tsx` | Orologio giorno/notte — accetta props controllate (`isDayPhase`, `cycleProgress`, `isPaused`, `onTogglePause`) o legge dallo store globale. |

---

## Import surface

```tsx
// Componenti — transplantabili uno ad uno
import {
  MagicCircleHalo,
  QuestChronicle,
  MilestoneCheckModal,
  QuestRewardPanel,
  FloatingPanel,
  useMilestoneEngine,
} from '@/ui/idleVillage/frozen/kits/questPoiKit';

// Drop-in standalone (include già SkinSystemProvider)
import { MagicCircleHaloStandalone } from '@/ui/idleVillage/frozen/kits/questPoiKit';

// Shell smart: monta SkinSystemProvider solo se assente
import { QuestPoiKitShell } from '@/ui/idleVillage/frozen/kits/questPoiKit';

// Config / helpers puri
import {
  buildQuestMilestones,
  buildAstrolabeSkillsForPhase,
  resolveQuestOutcomeTier,
  questPhaseDurationMs,
  questTotalDurationMs,
} from '@/ui/idleVillage/frozen/kits/questPoiKit';
```

---

## Provider chain

```
QUEST_POI_PROVIDER_CHAIN = ['SkinSystemProvider']
```

`MagicCircleHalo`, `QuestChronicle` e `MilestoneCheckModal` richiedono `SkinSystemProvider`.  
Il check modal monta il Destiny Astrolabe, che non ha requisiti aggiuntivi di provider.  
Il roster drag sopra usa già un `DndContext` — **non aggiungerne uno secondo** (vedi FloatingPanel).

---

## Macchina a stati della quest

```
IDLE ──embark──▶ RUNNING ──milestone fires──▶ CHECK_AWAITING
                    ▲                                │
                    │        ◀──resolve / minimize───┘
                    │
                    └──countdown reaches 100%──▶ COMPLETE ──collect──▶ IDLE
```

### Transizioni

| Da | Evento | A | Effetto |
|---|---|---|---|
| `IDLE` | utente clicca Embark nel Detail | `RUNNING` | chiude Detail, apre QuestChronicle panel |
| `RUNNING` | `useMilestoneEngine` emette evento | `CHECK_AWAITING` | apre MilestoneCheck panel, **pausa countdown** |
| `CHECK_AWAITING` | Astrolabe completa il tiro | `RUNNING` | chiude/rimuove MilestoneCheck, **riprende countdown** |
| `CHECK_AWAITING` | utente minimizza il panel | `RUNNING` | `useEffect` auto-risolve off-screen, riprende countdown |
| `RUNNING` | `questProgress >= 1` | `COMPLETE` | QuestChronicle mostra overlay esito |
| `COMPLETE` | utente clicca "Collect rewards" | `REWARD` | sostituisce QuestChronicle con QuestRewardPanel nello stesso panel |
| `REWARD` | utente clicca "Collect" | `IDLE` | chiude panel, reset stato |

---

## Pausa del countdown — `isCheckAwaiting`

Il countdown è l'unico tempo nella pagina (sorgente singola `worldElapsedMs`). Avanza solo quando:

```ts
const isCheckAwaiting = activeMilestone !== null && !isMilestoneMinimized;
// Nel tick:
if (!isCheckAwaiting) setQuestElapsedMs(prev => prev + COUNTDOWN_TICK_MS * speed);
```

**Minimizzare = affidare al destino.** Quando `isMilestoneMinimized` diventa `true` mentre
`activeMilestone !== null`, un `useEffect` risolve la fase off-screen con i valori attuali e
riprende il countdown senza aspettare input:

```ts
useEffect(() => {
  if (!activeMilestone || !isMilestoneMinimized) return;
  // risolve la milestone senza animazione
  const result = resolveMilestoneWithoutAnimation(activeMilestone, partyStats);
  addPhaseResult(result);
  setActiveMilestone(null);
}, [activeMilestone, isMilestoneMinimized]);
```

---

## `MagicCircleHalo` — centrare sul medaglione

Il halo è concentric con il medaglione di `QuestPOI`, non con il wrapper intero
(che include badge e label sotto). Usare `medallionOverlay`:

```tsx
<QuestPOI
  // ...altri props
  medallionOverlay={
    <MagicCircleHalo progress={questProgress} isComplete={questProgress >= 1} />
  }
/>
```

`QuestPOI` posiziona `medallionOverlay` con:

```css
position: absolute;
top: renderSize / 2;          /* metà del medaglione quadrato */
transform: translate(-50%, -50%);
```

`renderSize` corrisponde alla dimensione del medaglione, non del container esterno.

---

## `FloatingPanel` — drag senza collisione con DndContext

Il pannello dragger usa pointer events nativi, non `@dnd-kit`. Questo è un vincolo, non una
preferenza: il `DndContext` del roster interpreta ogni `active.id` come `residentId`, e
un secondo draggable dnd-kit colliderebbe con `onDragEnd`.

```tsx
<FloatingPanel
  panelId="milestone-check"
  title={t('milestoneCheck.title')}
  icon="⚔️"
  initialPosition={{ x: window.innerWidth / 2 - 160, y: 120 }}
  width={320}
  onClose={() => setActiveMilestone(null)}
  isMinimized={isMilestoneMinimized}
  onMinimizedChange={setIsMilestoneMinimized}
>
  <MilestoneCheckModal {...milestoneProps} />
</FloatingPanel>
```

Z-index: ogni pointer-down porta il pannello toccato in primo piano via un modulo-level
`stackCounter` (parte da 1000). Nessuno stato globale richiesto.

---

## `QuestRewardPanel` — vincolo skin

Costruito **solo** su ruoli del design system. Regola di build:

- Solo `--skin-*` CSS vars — nessun colore letterale.
- Solo `data-skin="panel|section|badge|title|cta"` — nessuna classe Tailwind di colore.
- I soli colori inline ammessi sono `var(--skin-status-met)` e `var(--skin-status-unmet)`.

Il test `'sets no literal colour on any element'` in `QuestRewardPanel.test.tsx` verifica
questa invariante.

---

## `resolveQuestOutcomeTier` — come si determina l'esito

L'esito non dipende da un power roll ma dalle fasi realmente giocate:

| Condizione | Tier |
|---|---|
| tutte passate, nessuna morte | `'perfect'` |
| tutte passate, almeno una morte | `'success'` |
| ≥ 50 % passate | `'success'` |
| < 50 % passate | `'partial'` |
| tutte fallite, nessuna morte | `'fail'` |
| tutte fallite, almeno una morte | `'deadly'` |

```ts
import { resolveQuestOutcomeTier } from '@/engine/game/idleVillage/questMilestones';
const tier = resolveQuestOutcomeTier(phaseResults); // 'perfect' | 'success' | 'partial' | 'fail' | 'deadly'
```

---

## Configurazione durata e difficoltà

```ts
import {
  questPhaseDurationMs,   // durata di una singola fase in ms
  questTotalDurationMs,   // durata totale della quest in ms
  DEFAULT_QUEST_TIME_SCALE,
  resolvePhaseDifficulty,
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
} from '@/ui/idleVillage/frozen/kits/questPoiKit';
```

La durata viene da `QuestPhase.durationValue` (config), non da `durationFormula`.  
La difficoltà viene da `questSkillCheckConfig`, non da un valore hardcoded.

---

## i18n — namespace attivi

| Namespace | Uso |
|---|---|
| `activityCapsule` | testo nel Detail (tipo POI, durata, requisiti) |
| `milestoneCheck` | titolo e azioni del pannello skill check |
| `questChronicle` | fasi, corda, overlay esito |
| `floatingPanel` | tooltip minimizza/chiudi |
| `questReward` | schermata ricompensa |
| `poiDetail.risk` | badge danno/morte |

Interpolazione: **parentesi singole** `{variabile}` — non doppie (`{{variabile}}`).

---

## Test coverage

| File | Suite | N |
|---|---|---|
| `tests/unit/idleVillage/FloatingPanel.test.tsx` | drag, minimize, close, z-index | 16 |
| `tests/unit/idleVillage/QuestRewardPanel.test.tsx` | rendering, skin constraint | 10 |
| `tests/unit/idleVillage/questMilestones.test.ts` | milestone timing, resolveQuestOutcomeTier | 42 |

Il polyfill `PointerEvent` per jsdom è dichiarato nel `beforeAll` di `FloatingPanel.test.tsx`
— non modificare il componente per farlo funzionare in test.

---

*Last Updated: 2026-08-13*
