# PLAN-075: Reward collect-commit — settlement al click «Collect» + delta chip HUD (R-260)

**Status:** `baptized` — Director 2026-10-22 («procedi»); ledger aperto `plan:stamp open`
**Desiderata:** R-260 `in corso` (2026-10-22)
**Dibattito:** nessuno — **plan diretto** per ruling Director 2026-10-22
(i fork di design sono stati risolti nei chiarimenti explorer, §2).
**Relazioni:** fratello di PLAN-074 (R-250 journey UX — superfici adiacenti, file
diversi); emenda il *quando* del settlement PLAN-019-S2.5, non il *cosa*
(`quest-settlement.INV-1` resta valida); PLAN-054 living contracts.

**Richiesta Director (verbatim):**
> *"ci vuole sia il feedback come animazione nella HUD e le risorse cambiano
> quando io clicco, nn prima nè dp. aggiungilo al progetto"*

## 1. Grounding

- **Oggi** il settlement applica tutto all'arrivo al villaggio: `run.ended` →
  effetto in `useQuestExpeditionSession` → `settleRun` → `applyQuestSettlement`
  → `state.gold/xp` mutano *prima* che il popup si apra. Il click «Collect
  rewards» chiama solo `onClose` (`QuestRewardPopup.tsx:232-236`).
- Il journal `settleRun` è già a due stadi: **`settling`** (intent + plan
  congelato, persistito) → effetti → **`settled`**. Un run fermo a `settling`
  viene *replayato* gratis al prossimo mount (dedup keys) — è la frontiera
  esatta su cui innestare il nuovo commit-deferred.
- `markRewardShown` scatta al primo paint del report (`rAF` nel popup) — il
  segnale «report mostrato» esiste già come hook; il marker `settling`
  persistito allo stesso momento *è* il bit «mostrato» per l'auto-commit.
- Il gate lancio `anyRunActive` richiede già `settlement.status === 'settled'`
  → con commit-deferred il party resta vincolato finché il report non viene
  chiuso — coerente col ruling «tutto al click» (i residenti non sono «a casa»
  finché il report non è riconosciuto).
- Tutti i path di chiusura del report convogliano in `onClose`
  (Collect CTA, Escape, X) — un solo punto di commit.

## 2. Ruling Director (2026-10-22, explorer)

- **R1 — tutto al click**: l'intero settlement (oro reward+loot, XP villaggio,
  XP residenti, feriti/morti, rilascio equipaggiamento) committa alla chiusura
  del report, non all'arrivo.
- **R2 — ogni chiusura committa**: Collect, Escape, X applicano tutti gli
  effetti + animazione. Nessuno stato «pending» in-session.
- **R3 — auto-commit al reload**: se il report era stato mostrato (`settling`
  persistito), un reload committa senza animazione — il click è cerimonia.
  Report mai mostrato → riappare al reload e attende il click.
- **R4 — visual-fork: skipped** — delta chip «+N» sulla tessera risorsa +
  count-up, reduced-motion istantaneo. Puntatore: questo ruling (RICHIESTE.md
  R-260). Copre la sola decisione estetica del plan (la forma del delta chip).

## 3. Design decisions

| # | Decisione |
|---|-----------|
| D-1 | `questSettlement.ts` splitta `settleRun` in **`beginSettlement`** (persist `settling` + plan congelato) e **`commitSettlement`** (apply effetti + release loadout + persist `settled`). `settleRun` resta = begin+commit per caller/test esistenti. |
| D-2 | **Trigger**: mount del reward popup → `beginSettlement`; `onClose` (ogni path) → `commitSettlement` + segnale delta. Mount della sessione con `settlement.status==='settling'` → auto-commit (replay esistente). |
| D-3 | **Delta signal**: campo transiente `resourceDelta: {gold, xp, at}` top-level nello store (fuori da `state` → non persistito); scritto dalla sessione dai valori del plan congelato; `ResourceReadout`/GameFrameScreen lo consuma e auto-clear dopo `durationMs`. |
| D-4 | **Animazione**: chip «+N» sulla tessera oro (e «+N XP» ancorato sotto il readout — l'XP non ha tessera ma è una risorsa del report) + count-up del valore; `prefers-reduced-motion` → valore aggiornato istantaneo, chip solo fade. Config Zod `hud.resourceDelta` in `gameFrameConfig`. |
| D-5 | **Chip solo se amount>0** — outcome wipe/fled o loot=0 → niente chip su quella risorsa (il report resta la prova). |
| D-6 | `markRewardShown` invariato (identità report); il bit «mostrato» per R3 è il marker `settling` — una sola fonte. |
| D-7 | `ended` non muta più lo stato risorse: l'effetto auto-settle sulla sessione si restringe a (a) marker `settling` → replay commit; (b) niente trigger su `ended` puro. |

## 4. NOT in scope

- Cambi a *cosa* il settlement concede (`deriveSettlementPlan`, ledger keys,
  event log) — `quest-settlement.INV-1` intatta; a scheduling viaggio;
  all'auto-commit legacy per run senza journey (stesso contratto: report →
  commit); a `poiConsumesOnReportClose`; al reward popup layout/reveal; a
  food/wood; a nuove tessere risorsa permanenti in HUD.

## 5. Tasks

| ID | Task — output verificabile | Dipendenze |
|----|---------------------------|------------|
| T-001 | **Split journal settlement** (`questSettlement.ts`): `beginSettlement(run, deps)` = persist `settling`+plan; `commitSettlement(run, deps)` = apply+release+`settled`; `settleRun` = composizione. Idempotenza e fault-seam invariati. Mode B-add su `quest-settlement` + nuova INV (commit boundary). Output: unit verdi, journal shape invariata | — |
| T-002 | **Wiring collect-commit** (`useQuestExpeditionSession.tsx`, `QuestRewardPopup.tsx`, `game-frame-pixi.tsx`): effetto auto-settle su `ended` rimosso → solo replay su `settling`; popup mount → `beginSettlement` (prop `onReportShown`); `onClose` → `commitSettlement` + delta signal. Mode B-amend `use-quest-expedition-session` (nuovo INV commit-on-dismiss) + `quest-reward-popup` (onClose = commit). Output: unit (ended non muta gold; dismiss committa una sola volta; `settling` a mount → commit) | T-001 |
| T-003 | **Delta chip + count-up** (`useMinimalGameplay.ts` campo transiente + setter/clear; `game-frame.tsx` subscribe; `ResourceReadout.tsx` chip «+N» su tessera oro + chip «+N XP» ancorato; `gameFrameConfig.hud.resourceDelta` Zod: `durationMs`, `countUpMs`; i18n aria-label `gameFrame.resources.delta`; reduced-motion). Mode B-add `resource-readout` INV-1. Output: unit + render test | T-002 |
| T-004 | **Regression + witness headless**: suite commit-semantics (R1/R2/R3 — Collect/Esc/X, reload mid-pending, zero-delta, idempotenza); E2E reale: arrivo → oro invariato → dismiss → delta+chip+store; `// INV:` tags. Evidence `test-results/r260/` | T-002, T-003 |
| T-005 | **Chiusura**: contracts sync, docs trusted, eye-check Director sull'animazione, R-260 → `fatta` dopo bundle PASS, RICHIESTE + INDEX | T-004, OB-6 |

## 6. Acceptance criteria + obbligazioni

| AC | Criterio | Test |
|----|----------|------|
| AC-1 | All'arrivo al villaggio (`ended`) `state.gold`/`state.xp` NON cambiano | unit + E2E |
| AC-2 | Dismiss via Collect CTA → tutti gli effetti applicati una volta sola | unit + E2E |
| AC-3 | Dismiss via Escape o X → stesso commit di Collect | unit |
| AC-4 | `settling` persistito + reload → effetti committati senza animazione | unit (replay) |
| AC-5 | Run ended mai mostrata + reload → report riappare, niente commit finché non chiuso | unit |
| AC-6 | Delta `{gold,xp}` > 0 → chip «+N» + count-up; = 0 → niente chip; reduced-motion → istantaneo | unit + headless |
| AC-7 | Doppio dismiss / remount → effetti una volta sola (ledger invariato) | unit |
| AC-8 | `anyRunActive` resta true finché non `settled` | unit esistente verde |

**Obbligazioni (contratto di chiusura):**

- **OB-1** Unit: split journal, commit-on-dismiss, replay auto-commit, delta
  signal, chip rendering — suite verdi `npm run test -- tests/unit/idleVillage`.
- **OB-2** E2E headless: AC-1..AC-6 evidenza `test-results/r260/`.
- **OB-3** Living-contract sync: `quest-settlement` B-add INV, `use-quest-
  expedition-session` B-amend INV, `quest-reward-popup` B-amend, `resource-
  readout` B-add INV-1; `contracts:check` verde; expected_checks ereditati:
  `npm run test -- tests/unit/idleVillage`, e2e quest specs, CTR-game-002,
  007, 008, 009 (game-hud + game-quests).
- **OB-4** Regression-test permanente per task comportamentale (R-247):
  obbligazione `state` bloccante — `ended` non committa (AC-1) è il test che
  fallirebbe senza il cambio.
- **OB-5** `lint` / `build:check` / `closure:lint` verdi; characterization
  journey/settlement esistenti invariate (`questSettlement` suite: il piano
  congelato non cambia).
- **OB-6** Eye-check Director: animazione chip + count-up (T-04 — nessun
  claim percettivo senza testimone).
- **OB-7** `verification.json` → `verify:bundle` → `bundle.json` per task;
  R-260 `fatta` solo dopo PASS.

**Visual-fork:** `skipped — ruling Director 2026-10-22 (delta chip «+N»
tessera + count-up, reduced-motion istantaneo) — RICHIESTE.md R-260 ruling (4)`.
Nessun'altra decisione estetica nel plan.

## 7. Rischi e mitigazioni

- **Gate lancio bloccato se il report non viene chiuso** → R2/R3: qualunque
  dismiss committa; reload con `settling` auto-committa — il blocco è
  limitato alla sessione corrente ed è intenzionale (R1).
- **Popup montato ma mai chiuso, gioco continua** → risorse non commesse per
  scelta del giocatore che lascia il report aperto: coerente col ruling (il
  click è il commit); reload ripulisce.
- **`markRewardShown` ≠ fonte per R3** → si usa il marker `settling` (D-6),
  unica fonte persisted.
- **Delta signal persiste per errore** → top-level store field fuori da
  `state`/partialize (D-3); test AC-6 copre il clear.
- **T-13 worktree condiviso** → nessun commit scoped su file altrui; bundle
  evidence namespaced `r260`.
