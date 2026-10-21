# PLAN-073: Village Stash ledger — warehouse interattivo ↔ bisaccia quest (R-240)

**Status:** `open` — implementato in working tree (2026-10-21). D-1/D-2 risolti per default
(auto-bind con 1 planner aperto; release-all per-owner). In attesa di commit + verify:bundle.
**Richiesta:** `R-240` (2026-10-21). Assorbe R-239(e) «toggle BAG che si sovrappone a OPEN WAREHOUSE»
e il fork F-ST-1 di PLAN-068 (magazzino mock → registro vero), risolto in direzione «ledger reale».
**Artifact dibattito:** `mind-weaver/.mw/runs/20261021-warehouse-bag/artifact-r003.md` —
**converged, 5/5 ACCEPT** (ChatGPT, Claude, Gemini, Grok, DeepSeek) su sha `8e9e7629…47c`. Run log:
grounding-ledger + event journal nella stessa run dir.
**Documentation Impact:** REQUIRED — `.mw/contracts/components/village-stash-panel.md` (Mode B-amend),
`.mw/contracts/components/quest-expedition-detail.md` (add), `plans/INDEX.md`, `RICHIESTE.md`.

## Ruling Director (2026-10-21, pre-dibattito)

- **A1** — Warehouse aperto **senza planner** (vista villaggio, tasto `V`, menu pannelli): **read-only**.
  Mostra disponibilità reale, nessuna affordance click/drag (no ruoli button, no attributi draggable, no drop refs).
- **A2** — **Pool globale condivisa**: un solo magazzino villaggio. Un item assegnato a QUALSIASI bisaccia
  non è disponibile agli altri POI.
- **A3** — La draft **persiste** alla chiusura del planner (niente auto-release on unmount); serve un pulsante
  «togli tutto» analogo al reset party. Allo start quest gli item **lasciano il pool** per la durata del run.

## Design (artifact-r003, convergente)

### 1. Ledger — `useVillageStashStore` (Zustand, dominio condiviso)

```ts
interface VillageStashState {
  bags: Record<PoiId, (string | null)[]>;                    // len = QUEST_STASH.bagSlots (3)
  committed: Record<RunId, { poi: PoiId; itemIds: string[] }>;
  activeStashOwner: PoiId | null;   // session-only, NON persistito (sostituisce Context:
                                    // il pannello è fratello dei planner, Context irraggiungibile)
  hydrated: boolean; persistDegraded: boolean;
  assign(poi, itemId, slot?) / swap(poi, slot, itemId) / release(poi, slot)
  releaseAll(poi) / commitRun(runId, poi) / rollbackCommit(runId) / openStash(poi | null)
}
```

- Disponibilità **derivata**: `remaining(id) = config.qty − Σbags − Σcommitted`. `qty` config-driven
  (fase-1: 1/item, mai hardcoded). Invariante fungibilità: itemId = tipo, non copia.
- Ogni azione = un solo `set` sincrono con validazione pura prima del commit → doppia assegnazione
  impossibile per costruzione (Zustand = single-writer). Reason: `bagFull|unavailable|invalidSlot|alreadyInBag|notReady`.
- **Validator unico condiviso** runtime+hydrate: stesso itemId vietato due volte nella stessa borsa
  (set-semantics di oggi), `stash.alreadyInBag`.
- **Sequenza quest-start**: validate → `commitRun` (idempotente per runId) → start; se lo start fallisce
  `rollbackCommit` ripristina `bags[poi]` e rimuove `committed[runId]`. Restore a fine run = follow-up (schema v2).
- `useQuestExpeditionSession` mantiene l'API: `selectedItemIds` = selector su `bags[poi]`; `toggleItem` delega.

### 2. Binding & hydration

- `activeStashOwner` settato dal pulsante «Open warehouse» del planner; azzerato su chiusura planner /
  cambio POI / chiusura stash. Ultimo pulsante attivato vince (deterministico con 2 planner).
- Interattivo iff `activeStashOwner` **e** `hydrated`. Righe click → owner; drop → poiId del target.
- Hydrate (chiave `idleVillage.stashLedger.v1`, Zod-versionata, via `PersistenceService` async):
  tri-stato — (a) chiave assente → vuoto, scritture ON (first boot NON è failure); (b) errore I/O →
  `persistDegraded`, mai scrive; (c) corrotto/versione futura → `persistDegraded` + copia `.corrupt.<ts>`.
  Subscribe write-through **solo dopo hydrate**; azioni `notReady` pre-hydrate; pannelli montano post-hydrate.
- Reconcile: drop itemId ignoti, pad/truncate a `bagSlots`, no duplicati, clamp over-`qty` — tutto loggato.
  Pruning owner solo dopo POI-registry pronto e solo per POI provabilmente cancellati (fail-closed).

### 3. Interazione

| Trigger | Effetto |
|---|---|
| Click riga warehouse | `assign(owner, item, firstFree)`; piena → `stash.bagFull` in `aria-live` + shake (token, reduced-motion → solo messaggio) |
| Click slot occupato | `release(owner,slot)`, nessuna conferma |
| Drag `stash-item` → `bag-slot` | vuoto → assign; occupato → **swap** atomico (stesso set) |
| Drag `bag-item` → `stash-dropzone` | release per poiId del payload (owner-agnostic) |
| `stash-item` → slot di ALTRO owner | `onDragCancel` (binding possiede il warehouse) |
| `bag-item` → proprio slot | no-op (niente reorder — fuori scope) |
| Esc / drop fuori | nessuna mutazione (stato solo in `onDragEnd`) |
| Pulsante «release all» | **header bisaccia del planner** (come reset party), visibile iff borsa non vuota; `releaseAll(poi)` atomico, cancella drag attivi |
| Righe riservate | rimosse a remaining=0; qty>1 → badge rimanente |
| Header warehouse | contatore `stash.reservedElsewhere` («N altrove») se altri owner tengono item |

Focus: dopo assign → slot riempito; dopo release → riga riapparsa (o titolo pannello se lista vuota).
Dropzone sul CONTAINER con min-height token + `stash.empty` (sempre raggiungibile anche a lista vuota).

### 4. DnD (page-level `DndContext` esistente)

- Draggables: `stash-item:<itemId>`, `bag-item:<poiId>:<slot>`; droppables: `bag-slot:<poiId>:<slot>`,
  `stash-dropzone`. `parseDndId` → union discriminata (JSDoc). Router `handleDragEnd` su `active.data.kind`;
  stashItem→bagSlot richiede `target.poiId === activeStashOwner`. Collisione `pointerWithin` + rect check
  (pannelli fratelli NON annidati), priorità `bagSlot > stashZone`. Branch residenti intatti; test router
  copre resident-drag-over-bagSlot = no-op. `DragOverlay` portal `document.body` (T-16).

### 5. Layout fix (overlap R-239e)

Header bisaccia di `QuestExpeditionDetail`: flex wrapping → CSS grid
`grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"label action" "counters counters"`.
Label `overflow:hidden;text-overflow:ellipsis`; pulsante in area `action`, `flex-shrink:0`, nowrap;
contatori riga propria. Gap da token skin, niente absolute/margin hack.
**Criterio witness**: `bbox(button) ∩ bbox(label) = ∅` a 1280×800 e 1440×900, en + pseudo (+40%).

## Task

- **T-001** Ledger store: schema Zod persistito, hydrate tri-stato, reconcile, reducer
  assign/swap/release/releaseAll/commitRun/rollbackCommit/openStash, validatore condiviso, unit test reducer+hydrate+persistence round-trip+persistDegraded.
- **T-002** `useQuestExpeditionSession` → selector su ledger; `toggleItem` delega; pulsante release-all
  nell'header bisaccia del planner (primitive esistenti, token skin).
- **T-003** `VillageStashPanel` interattivo/read-only su binding+hydrated: righe `<button>`, click assign,
  dropzone container, `reservedElsewhere`, empty-state, focus mgmt, tooltip `stash.openHint` in read-only.
- **T-004** DnD wiring: `parseDndId`, id registrati, branch router, collision policy, overlay portal.
- **T-005** Header grid fix + regression test overlap (bbox assertion 1280×800/1440×900 × en/pseudo).
- **T-006** Wiring `commitRun`/`rollbackCommit` nel call-site quest-start esistente
  (`expeditionLoadout`/`createRun` in `game-frame-pixi.tsx`) + test idempotenza/rollback.
- **T-007** Contratti Mode B-amend (village-stash-panel: ritira read-only-always; quest-expedition-detail:
  bag su ledger, swap, release-all) + i18n `idleVillage:stash.*` en/it-IT/pseudo + test component.
- **T-008** Bundle di chiusura: unit+component+E2E (click/drag entrambe le direzioni, 2 planner no
  doppia assegnazione, close/reopen persiste, release-all, reload persistence, read-only no-mutation),
  `lint -- <scope>`, `build:check`, `closure:lint`, `verify:bundle`, smoke :5173, visual witness
  (empty/full/drag/read-only — T-04: occhio umano/witness reale per il claim layout).

## Contratto (obbligazioni verificabili)

1. `remaining(itemId)` = `config.qty − Σbags − Σcommitted` — derivata, mai persistita; qty non hardcoded.
2. Click riga → primo slot libero; borsa piena → nessuna mutazione + `stash.bagFull` annunciato.
3. Click slot occupato / drag `bag-item`→dropzone → `release`, riga riappare (remaining>0).
4. `stash-item`→`bag-slot` occupato → swap atomico in un solo set; su altro owner → cancel.
5. Read-only senza binding: zero ruoli button, zero attributi draggable, zero mutazioni.
6. Draft persiste a close/reopen planner e a reload pagina (chiave `idleVillage.stashLedger.v1`).
7. Mutazioni rifiutate `notReady` finché `hydrated=false`; subscribe scrittura solo post-hydrate.
8. Overlap: `bbox(quest-open-stash) ∩ bbox(bag-label) = ∅` a 1280×800 e 1440×900, en e pseudo.
9. Doppia assegnazione impossibile con 2 planner (validazione dentro il set sincrono); stessa
   itemId mai due volte nella stessa borsa (`alreadyInBag`, stesso validatore runtime/hydrate).
10. `commitRun` idempotente per runId; start fallito → `rollbackCommit` ripristina borsa+disponibilità.
11. Resident drag paths invariati; `DragOverlay` portaled in `document.body`.
12. Tutte le stringhe via i18n `idleVillage` (en/it-IT/pseudo, parità chiavi); valori UI da config/token.

## Visual fork

`visual-fork: skipped — nessuna nuova rappresentazione materiale: il warehouse resta la lista HUD esistente (stesso skin/famiglia), le righe diventano button primitive e il fix header è un bugfix di geometria — puntatore: artifact-r003 §Dispositions in mind-weaver/.mw/runs/20261021-warehouse-bag/ + R-240 in RICHIESTE.md`

## Ruling aperti al Director

- **D-1** — Auto-bind: aprendo il warehouse con `V`/menu mentre **esattamente un** planner è aperto,
  bindarlo a quel planner (UX comoda) o restare read-only stretto? Default proposto: bind se 1 solo.
- **D-2** — `releaseAll` scope per-owner (coerente col reset party) — assumiamo sì; contatore
  «N altrove» rende visibile il pool globale.

## File toccati (effettivi, post-implementazione)

- Nuovi: `src/ui/idleVillage/store/useVillageStashStore.ts` (ledger Zustand + Zod + persistenza),
  `src/ui/idleVillage/components/gameFrame/stashDnd.ts` (id/payload DnD tipizzati + router puro),
  `tests/unit/idleVillage/villageStashLedger.test.ts`, `tests/unit/idleVillage/stashDnd.test.ts`,
  `tests/e2e/idleVillage/villageStash.spec.ts`.
- `src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx` (dual-mode, dropzone, live region),
  `src/ui/idleVillage/components/gameFrame/villageStashViewModel.ts` (disponibilità derivata).
- `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx` (slot dnd, release-all, header grid),
  `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx` (bag da ledger, commit/rollback),
  `src/ui/idleVillage/questS1Lab/useQuestRun.ts` (releaseCommit a terminale).
- `src/pages/game-frame-pixi.tsx` (hydrate, binding D-1, router DnD pagina).
- `src/balancing/config/idleVillage/villageStashConfig.ts` (qty→1 fase-1); `public/locales/{en,it-IT,pseudo}/idleVillage.json`;
  contratti `.mw/contracts/components/{village-stash-panel,quest-expedition-detail,game-frame-pixi}.md`;
  `tests/unit/idleVillage/villageStash.test.tsx`.

## Trappole applicate

T-16 (overlay → portal body), T-04 (layout claim → witness umano), T-13 (failure → sospetta collisione
worktree), `page.evaluate` solo con sorgente stringa, no foreground window, `PersistenceService` unico
canale (niente localStorage), config-first + Zod, i18n, primitive esistenti, JSDoc su API nuove.

## Implementazione — esiti (2026-10-21)

### Root cause reale dell'overlap (scoperta in implementazione, T-20)

L'overlap denunciato **non era solo un problema di layout dell'header**: il selettore
`skinScope.css` `[data-hud-controls] button:not([data-skin="cta"]):has(> svg:only-child)`
forza `width: 26px` — e `:only-child` conta solo i nodi *elemento*, quindi un pulsante
`<EngravedIcon/>{t('…')}` matcha comunque (il `#text` non conta). Risultato: pill 26px con
testo `nowrap` centrato che straborda simmetricamente sopra i pulsanti vicini — overlap
visivo **e di hit-region** (il testo overflow è hittable; `getBoundingClientRect` mentiva,
il dispatch reale no). Fix: icona+label wrappati in `<span>` dentro il button → la regola
non matcha più, la pill prende la larghezza del contenuto (116px/166px misurati).
Trappola registrata come **T-20** in `context/recurring-traps.md` — vale per OGNI pulsante
icona+testo sotto `data-hud-controls`.

Falsa pista documentata: durante il debug `game-boot-screen` intercettava davvero tutti i
pointer-event finché `pointer-events` non passa a `none` — due bug sovrapposti sullo stesso
sintomo «il click non fa nulla».

### Safeguards (2026-10-21)

- `npm run build:check` ✅; tsc pulito sui file dello scope.
- `npx eslint` sui file toccati: 0 errori (file in ignore-pattern del kit: warning attesi).
- Unit: `villageStash.test.tsx` 17, `villageStashLedger.test.ts` 22, `stashDnd.test.ts` 8,
  `questExpeditionBag.test.tsx` 8 — **55/55 verdi**.
- `npm run i18n:validate`: 215 missing key **tutte baseline** (pgDetailCard, gameFrame.resources,
  poiDetail, testRoster, roster — nessuna chiave PLAN-073).
- `npm run closure:lint`: fallisce su **baseline/concorrente** — R-236 senza Chiusura, gate-file
  `produceBundle.ts` da ri-approvare, `.mw/review/*`, assets creature, `_tmp-smoke-stash.cjs`
  (tool usa-e-getta, da rimuovere), visual-fork su file altrui. Nessuna istanza PLAN-073.
- Runtime smoke (headless, dev server :5173): **7/7 check verdi** — header-no-overlap a
  1280×800 e 1440×900 (bbox disjoint), read-only senza planner, click-assign (riga sparisce
  dallo scaffale), click-release, release-all (click reale → `bags:{}` persistito),
  draft-persists-reload. Evidenza: `test-results/plan073-smoke/`.

### Note di scope/commit

Worktree condiviso: `useQuestExpeditionSession.tsx`, `game-frame-pixi.tsx`, i tre file locale,
`RICHIESTE.md`, `plans/INDEX.md`, `context/recurring-traps.md` contengono anche lavoro
concorrente (R-231 forecast timing, R-239 fork/asset-warmup) — staging selettivo obbligatorio
(T-13), mai `git add .`.
