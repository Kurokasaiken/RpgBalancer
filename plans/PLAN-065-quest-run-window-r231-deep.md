# PLAN-060: QuestRunWindow 9-Point Overhaul & Living Contract Sync (R-231)

**Status:** `draft` — prodotto dal dibattito multi-AI web `20261019-quest-run-window-plan` (9 round, 25 witness records `WITNESS-01..25`, `artifact-r009.md` sha256 `2f02ef4e6de2bf863c0be23aa78755f8b8ad5cdee87758b291f04a9dc36e27a4` + `decision_memo.md`); in attesa di ruling Director sulle Visual Fork Card `VF-1..4` e battesimo («procedi»).
**Desiderata:** `v35` FROZEN (Visual Fork Gate, `PLAN-047`) · `v36` FROZEN (Living Component Contracts, `PLAN-054`)
**Richiesta:** `R-231`
**Superfici toccate (`.mw/surface-map.json`):** `game-hud`, `game-quests`
**Trappole applicabili (`context/recurring-traps.md`):** `T-01`, `T-02`, `T-03`, `T-04`, `T-07`, `T-19`

---

## 0. Provenance & Sintesi del Dibattito Multi-AI Web (`20261019-quest-run-window-plan`)

- **Run:** `/Users/faustoboni/progetti_personali/mind-weaver/.mw/runs/20261019-quest-run-window-plan/`
- **Elettorato:** `chatgpt`, `claude`, `gemini`, `grok`, `deepseek` (9 round, `T-001..T-011`, 25 witness records `WITNESS-01..25`).
- **Principali vulnerabilità scoperte e risolte nel dibattito:**
  1. **`WITNESS-01 / 07` (Edge-safety proof & continuità $C^1$ in `postSettle`):** Una sinusoide pura $\sin(\omega\tau)$ a $\tau = 0$ è solo $C^0$ (derivata $\omega \neq 0 \implies$ scatto di velocità all'atterraggio) e un `breathZoom` simmetrico a `zoomTo === 1.0` viola i margini UV certificati $[\varepsilon, 1-\varepsilon]$. Risolto con inviluppo smoothstep $r(\tau) = u^2(3-2u)$ ($r(0)=0, r'(0)=0$), zoom breathing unilaterale verso l'alto ($z(\tau) \ge z_{\text{floor}}(\tau) \ge 1.03$), e clamp analitico in forma chiusa `swayEff_a` sul margine UV residuo reale certificato da `certifyShaderEdge` / `certifyDomEdge`.
  2. **`WITNESS-02` (Continuità camera su `presenting: true → false` e skip a metà ingresso):** In `QuestRunWindow.tsx:425`, quando `presenting` passa a `false`, `beatCursor.current` diventa `null` e `shotKey` passava a `'idle'`, resettando `shotEpoch` e facendo saltare la camera. Risolto ancorando `{ sceneKey, shot, shotEpoch }` all'arrivo sul nodo (`${run.nodeId}:${run.visitedNodes.length}`), indipendentemente da `presenting`, con blend smoothstep $350\text{ ms}$ in spazio $1/\text{zoom}$ convesso se un beat di check/harm sovrascrive lo shot.
  3. **`WITNESS-03 / 10 / 18` (Race sull'ordine di registrazione dei listener `keydown` e regressione `Space`/focus bottoni):** `GameFrameScreen` monta prima di `QuestRunWindow`; un listener bubble in `QuestRunWindow` gira *dopo* che `GameFrameScreen` ha già cambiato la velocità! Risolto registrando il listener di `QuestRunWindow` in **capture phase** (`{ capture: true }`) + flag condivisi in `questRunStore.ts` (`questWindowOpen`, `questWindowPresenting`, `modalOverlayActive`) con cleanup garantito su unmount/minimise. `Space` viene intercettato da `QuestRunWindow` **solo** mentre `presenting === true` (così a finestra in attesa `Space` mette in pausa/riprende il gioco normalmente), e il guard sui `<button>` in `game-frame.tsx` è limitato a `Space`/`Enter` così i tasti `1–4` continuano a cambiare velocità a finestra chiusa anche dopo aver cliccato un bottone HUD.
  4. **`WITNESS-04 / 08 / 11 / 13 / 14 / 16 / 19 / 20 / 21 / 22 / 23 / 24 / 25` (Durata normativa POI, nodo immediato `gob-bottino`, e `TimeBar` monotona senza salti):**
     - `useQuestExpeditionSession.tsx:525-534` moltiplicava `durationDays (5) * dayLengthInTimeUnits (5) = 25 → baseNodeTicks = 2`, schiacciando i `110` tick (~2 min) di `poi-goblin` a `22` tick. Risolto passando `poi.ticksPerNode` (`10`) e `poi.estimatedDurationTicks` (`110`) con singolo arrotondamento su `nodeTicks`.
     - `gob-bottino` riceve `immediate: true` (`nodeWeight === 0`, `readyAt = tick`), sbloccandosi istantaneamente all'arrivo senza consumare tick di marcia.
     - Su `wipe`/`fled` lo snapshot `frozen = displayFraction(state, tick, nowMs)` viene calcolato **prima** di qualsiasi mutazione di stato, evitando il doppio conteggio dell'ultima fetta e mantenendo $|\Delta \text{displayFraction}| = 0$.
  5. **`WITNESS-05 / 09 / 12 / 15 / 17` (Priorità di shrink `stageCapPx` e slot `<Theater>` non-circolare a `1280×720`):**
     - Corretto `PreVerdictBreath` (`cinemaFx.tsx:488`) aggiungendo `display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0` e rimosso il doppio `phaseLocked` (`QuestRunWindow.tsx:1030`).
     - `quest-window-stage` riceve `flex: '0 0 auto', maxHeight: `${stageCapPx}px`, overflowY: 'auto'` con `stageCapPx = Math.max(stageMinHeightPx, plaqueCapPx - pinnedChromePx - theatreMinH)` misurato in `useLayoutEffect`, così il testo non prende mai scrollbar finché `[data-testid="quest-theatre"]` ha margine sopra `theatreMinH`.
     - `[data-testid="quest-theatre"]` usa `width: '100%', aspectRatio: String(aspect), flex: '0 1 auto', minHeight: theatreMinH` (altezza intrinseca `330px` a `1080p`, non circolare) con `<Theater>` centrato `position: 'absolute'` e dimensionato a `w = Math.round(h * aspect), h = Math.min(availH, Math.floor(availW / aspect))` via `ResizeObserver` (zero effetto ghigliottina sul 40% inferiore dell'immagine!).

---

## 1. Visual Fork Gate (`PLAN-047` / Desiderata v35)

### 1.1 Modifiche con skip verificato (nessuna seconda rappresentazione materiale)
- #3 Header solo icone:
- `visual-fork: skipped — direzione fissata verbatim dal Director "in alto nn mettere scritte, lascia solo le icone (niente bag, assigned party o chronicle)" — RICHIESTE.md#R-231`
- #5/#8 Bugfix catena flex `PreVerdictBreath` + deduplica `phaseLocked`:
- `visual-fork: skipped — bugfix che ripristina il contratto flex di cinemaFx e rimuove la stringa phaseLocked duplicata — src/ui/idleVillage/skins/primitives/cinemaFx.tsx:488`
- #7 Allineamento plancia minimizzata (`space-between`):
- `visual-fork: skipped — direzione fissata verbatim dal Director "la rpima icona a sinistra è sul bordo, quella a destra deve essere allineata a destrs" — RICHIESTE.md#R-231`
- Bugfix logici/manoscritto v3 su `questRun.ts` e `useQuestExpeditionSession.tsx` (epicfail wired, `baseNodeTicks = poi.ticksPerNode`, `immediate` gob-bottino, forecast timing, `onOpenStash`) — nessuna rappresentazione visiva nuova:
- `visual-fork: skipped — fix logici/manoscritto e seam E2E, nessun elemento grafico — src/ui/idleVillage/questS1Lab/questRun.ts`

### 1.2 Decisioni coperte da Visual Fork Cards (`.mw/runs/r231-quest-run-window/`)
1. **VF-1 (`#4` Checkpoints su `TimeBar`):** `.mw/runs/r231-quest-run-window/visual-fork-timebar-checkpoints.md`
   - **Opzione A:** *Tacche incise su barra continua* (`4px` barra continua con tacche verticali alle soglie delle fasi).
   - **Opzione B:** *Barra segmentata per fasi* ($K$ segmenti discreti separati da `2px` di gap).
2. **VF-2 (`#6` Icona e posizione `Abandon Quest`):** `.mw/runs/r231-quest-run-window/visual-fork-abandon-control.md`
   - **Opzione A:** *Icona `cmd-retreat` nel footer a destra* (al posto del testo viola `ABANDON QUEST`, con conferma inline a fianco).
   - **Opzione B:** *Icona `cmd-retreat` nell'header a destra* (con piccolo popover di conferma sotto l'header).
3. **VF-3 (`#9` Profilo animazione post-entrata):** `.mw/runs/r231-quest-run-window/visual-fork-post-settle-motion.md`
   - **Opzione A:** *Quadro vivo respirante* (`periodMs: 6500, floorZoom: 1.02, breathZoom: 0.010, swayAmp: [0.24, 0.10], drift.a: 0.12`).
   - **Opzione B:** *Deriva multiplane profonda* (`periodMs: 5200, floorZoom: 1.035, breathZoom: 0.016, swayAmp: [0.42, 0.18], drift.a: 0.16`).
4. **VF-4 (`#5/#8` Cornice ribalta `<Theater>` su viewport compresse `1280×720`):** `.mw/runs/r231-quest-run-window/visual-fork-theatre-sidebars.md`
   - **Opzione A:** *Cornice aderente al dipinto `2.4:1`* (`w × h` centrato, zero bande interne alla cornice).
   - **Opzione B:** *Ali laterali sfocate in tinta* (riquadro largo `792px` con ali laterali ambient sfocate dietro al dipinto `2.4:1` intero).

---

## 2. Task Esecutivi (Ordinati per Dipendenza)

### T-001 — Schema `immediate: true`, durata normativa POI e sblocco immediato `gob-bottino` (`#1a`, `#4a`)
- **File toccati:**
  - `src/balancing/config/idleVillage/quests/questScenario.schema.ts`
  - `src/balancing/config/idleVillage/quests/scenarios/goblin.ts`
  - `src/ui/idleVillage/questS1Lab/questRun.ts`
  - `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx`
- **Modifiche:**
  1. Aggiungere `immediate: z.boolean().optional()` a `QuestChoiceNodeSchema` e impostare `immediate: true` su `gob-bottino` in `goblin.ts`.
  2. Esporre `nodeWeight(node): 0 | 1` in `questRun.ts` (`0` per `end` e `choice` con `immediate: true`, `1` altrimenti) e usare `waitTicks = nodeWeight(nextNode) * state.nodeTicks` in `arriveNode` / `matureNode`.
  3. In `useQuestExpeditionSession.tsx:525-534`, usare `baseNodeTicks = poi.ticksPerNode` (`10`) ed `expeditionSpanTicks = poi.estimatedDurationTicks` (`110`) con singolo arrotondamento in `loadoutDuration`.

### T-002 — Arbitraggio tastiera capture-phase e hint pausa su fronte bloccato (`#1b`, `#2`)
- **File toccati:**
  - `src/ui/idleVillage/questS1Lab/questRunStore.ts`
  - `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
  - `src/pages/game-frame.tsx`
  - `src/ui/idleVillage/hooks/useTimeEngineLoop.ts`
  - `src/localization/locales/en/idleVillage.json` (e dizionari locale attivi)
- **Modifiche:**
  1. Pubblicare `questWindowOpen`, `questWindowPresenting`, `modalOverlayActive` in `questRunStore.ts` con reset garantito nel cleanup `useEffect` di unmount/minimise.
  2. In `QuestRunWindow.tsx`, registrare il listener `keydown` in capture phase (`{ capture: true }`): reclama sempre `1–9` quando `!minimised && !modalOverlayActive`; reclama `Space | Enter | ArrowRight` **solo** quando `presenting === true` (lasciando `Space` libero di mettere in pausa/riprendere il clock quando `presenting === false`).
  3. In `game-frame.tsx:142` e `useTimeEngineLoop.ts:37`, limitare il guard `button, a[href], [role="button"]` ai soli tasti `Space` ed `Enter` (così `1–4` funzionano a finestra chiusa anche con focus su un bottone HUD) e rispettare `questWindowOpen` (per `1–9`) e `questWindowPresenting` (per `Space`).
  4. Mostrare `gameFrame.questWindow.phaseLockedPaused` quando `frontierLocked && isPaused`.

### T-003 — Catena flex `PreVerdictBreath`, priorità `stageCapPx` e slot `<Theater>` `2.4:1` senza ghigliottina (`#5`, `#8`, `VF-4`)
- **File toccati:**
  - `src/ui/idleVillage/skins/primitives/cinemaFx.tsx`
  - `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
- **Modifiche:**
  1. In `cinemaFx.tsx:488`, aggiungere `display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0` a `PreVerdictBreath`.
  2. In `QuestRunWindow.tsx`, rimuovere il paragrafo `phaseLocked` duplicato dentro `quest-window-stage` (righe 1029–1033).
  3. Calcolare `stageCapPx = Math.max(questWindow.stageMinHeightPx, plaqueCapPx - pinnedChromePx - theatreMinH)` in `useLayoutEffect` e applicarlo a `quest-window-stage` (`flex: '0 0 auto', maxHeight: `${stageCapPx}px`, overflowY: 'auto'`).
  4. Dare a `[data-testid="quest-theatre"]` `position: 'relative', width: '100%', aspectRatio: String(aspect), flex: '0 1 auto', minHeight: theatreMinH` e dimensionare `<Theater>` (`position: 'absolute'`, centrato) tramite `ResizeObserver` (`h = Math.min(availH, Math.floor(availW / aspect)), w = Math.round(h * aspect)`), applicando l'opzione scelta dal Director su `VF-4`.

### T-004 — Continuità camera post-entrata, `postSettle` $C^1$ certificato e ciclo di vita ticker (`#9`, `VF-3`)
- **File toccati:**
  - `src/balancing/config/idleVillage/quests/questTheatreFx.ts`
  - `src/ui/idleVillage/questS1Lab/render/depthTransform.ts`
  - `src/ui/idleVillage/questS1Lab/render/DepthScene.tsx`
  - `src/ui/idleVillage/questS1Lab/render/sceneManifest.ts`
  - `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
- **Modifiche:**
  1. Ancorare `{ sceneKey, shot, shotEpoch }` in `QuestRunWindow.tsx` a `${run.nodeId}:${run.visitedNodes.length}` indipendentemente da `presenting`, con blend smoothstep $350\text{ ms}$ in $(1/z, \text{pan}, \text{camVec})$ su override.
  2. Estendere `QuestDepthFxSchema` con `postSettle` (`enabled, rampMs, periodMs, swayAmp, breathZoom, floorZoom`) e implementare in `cameraAt` l'oscillazione $C^1$ post-atterraggio con clamp analitico `swayEff_a` certificato da `certifyShaderEdge` / `certifyDomEdge`.
  3. In `DepthScene.tsx`, mantenere attivo `app.ticker` durante `postSettle` finché `!reducedMotion && active && documentVisible`, renderizzando il frame composto `cameraAt(shot, shot.durMs)` prima di fermare il ticker quando minimizzato/nascosto/concluso.
  4. Applicare il profilo `VF-3` scelto dal Director e alzare l'alpha nebbia/polvere in `sceneManifest.ts` (`carro-nascosto` `drift.a >= 0.12`).

### T-005 — Checkpoints `TimeBar`, header icon-only, `cmd-retreat` abandon icon+tooltip e allineamento minimizzato (`#3`, `#4b`, `#6`, `#7`, `VF-1`, `VF-2`)
- **File toccati:**
  - `src/ui/idleVillage/questS1Lab/questSchedule.ts`
  - `src/ui/idleVillage/components/gameFrame/engravedIcons.tsx`
  - `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
- **Modifiche:**
  1. In `questSchedule.ts` e `TimeBar` (`QuestRunWindow.tsx`), preservare il contratto `D-J / D-K` (`questSchedule.test.ts`), escludere i nodi `immediate: true` dal gonfiare la durata, congelare il progresso pre-mutazione su `wipe`/`fled`, e renderizzare i checkpoint per fase secondo il ruling `VF-1`.
  2. In `HeaderPill` (`QuestRunWindow.tsx`), rimuovere lo `<span>{label}</span>` visibile mantenendo icona, `PartyPips`/dot armato, `aria-label` e tooltip.
  3. Aggiungere `'cmd-retreat'` in `engravedIcons.tsx` e sostituire il bottone testuale viola `ABANDON QUEST` con il controllo solo-icona + tooltip + conferma inline secondo il ruling `VF-2`.
  4. Allineare la `HudPlaque` minimizzata (`data-testid="quest-window-minimised"`) con `width: '100%', justifyContent: 'space-between'` e pulsante restore ancorato a destra (`marginLeft: 'auto'`).

### T-006 — Contratti vivi (`PLAN-054`), suite `INV:<id>` e verifica visiva/temporale (`T-04`, `T-19`)
- **File toccati:**
  - `.mw/contracts/components/quest-run-window.md`
  - `.mw/contracts/CTR-game-008-quest-time-input.md`
  - `tests/unit/idleVillage/questS1Lab/questRunWindowR231.test.tsx`
  - `tests/unit/idleVillage/questS1Lab/depthTransform.test.ts`
  - `tests/unit/idleVillage/questS1Lab/questSchedule.test.ts`
  - `tests/e2e/idleVillage/questWindowR231.spec.ts`
- **Modifiche & Verifiche:**
  1. Aggiornare i contratti vivi con tutti i 14 blocchi `INV:<id>` della tabella di tracciabilità (`artifact-r009.md` §3).
  2. Eseguire unit test + Playwright headless (`1920×1080`, `1366×768`, `1280×720`, `1024×600`) + cattura multi-frame `t_settle + {0, 2000, 4000}ms` per T-04, `npm run lint`, `npm run build:check`, `npm run closure:lint`.
