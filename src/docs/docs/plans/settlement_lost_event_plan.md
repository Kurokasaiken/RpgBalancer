# Settlement Lost — evento run-ending (direzione C: verdetto a schermo)

**Status:** Eseguito (2026-09-16) — T-001…T-006 completi. Evidence: `test-results/settlement-lost-2026-09-16.log`.
**Contesto:** R-072 scena 5 (Consequence), evento di gioco reale — non facciata teaser.
**Critica multi-AI web:** `.mw/runs/2026-09-16-settlement-lost-critique/` (chatgpt, claude, gemini integrati; grok rumore).
**Desiderata FROZEN:** v2 (eventi run-threatening → trattamento cinematografico pieno); decisioni Director in `RICHIESTE.md` R-072.

## 1. Decisioni ferme (Director)

1. `SETTLEMENT LOST` = **fine run**.
2. **Direzione C — verdetto a schermo (takeover)**: countdown invasione a zero → iride/vignetta, desaturazione "grigio ossidato", carta del verdetto con le perdite, CTA.
3. "Ossidato" ≠ grayscale puro: rampa **verdigris/teal** via gradient-map SVG (tecnica di `eventShroudGradeTokens`).
4. **Lista perdite mockata** (config-driven) — il Director scavalca la critica "verdetto finto": le voci sono beat narrativi da config; dove `gameOverState.summary` ha dati reali li mostra, ma non è requisito V1.
5. **Takeover bloccante ratificato** — no ESC, no backdrop dismiss, focus trap: la run è finita, il verdetto va riconosciuto.
6. **Trigger V1 = bottone debug su `/world-surface`** (stesso pattern del toggle shroud); il wiring reale countdown→dominio è rinviato.
7. **Grade sul container world surface**, non sull'App root (risolve lo spike perf T-005: scope provato = quello dello shroud, esteso al box mappa; vignetta/iride copre il resto del viewport via overlay).

## 2. Cosa esiste già (audit)

**Il contratto di fine run esiste già** in `useMinimalGameplay`:

- `gameOverState { isGameOver, reason, summary, gameOverAt }` — `summary` = payload perdite reale (`daysSurvived`, `goldEarned`, `residentsLost`, `finalRoster`).
- `resetGame()` = Run Reset Contract: snapshot game-over via `saveMinimalGameplaySnapshot`, stato resettato, persistence pulita, `minimal_gameplay_restart` telemetrato.
- Reasons attuali: `food_depleted`, `all_injured` (check in `tick()`, guard `!isGameOver` = exactly-once).
- `MinimalGameOverModal` — modale esistente con a11y (focus, `aria-modal`), stats, CTA restart.
- Clock di gioco `currentDay`/`currentTick` persistito nello snapshot → deadline in game-time è reload-safe.
- `WorldSurfaceTestPage`: pattern debug-toggle per lo shroud (le tende si chiudono, mondo cambia, riaprono) — il bottone Settlement Lost segue lo stesso pattern.
- `eventShroudGradeTokens.ts` + filtro SVG montato in `WorldSurfaceRenderer` — tecnica gradient-map da riusare per la rampa ossidata.

**Manca:** reason `settlement_lost`; il takeover visivo (iride + grade ossidato + verdetto); il filtro "ossidato" come componente portabile; un modo di arrivare al game over da UI (debug button).

## 3. Architettura

### 3.1 Dominio (minimo per V1)

- `MinimalGameplayGameOverReasons` += `settlement_lost` con message config dedicato (chiavi i18n, non letterali).
- V1 demo (bottone debug): azione che setta `gameOverState { isGameOver: true, reason: 'settlement_lost', summary: <mock o snapshot reale>, gameOverAt }` — il summary reale si costruisce con lo stesso codice del check in `tick()`; se troppo complesso da estrarre, summary mock da config è accettato (decisione §1.4).
- Path reale (rinviato, non scope V1): `invasionDeadlineDay` persistito + check `currentDay >= deadline` in `tick()`.

### 3.2 Presentazione: `SettlementLostOverlay`

Componente montato su `/world-surface` (debug page), attivo quando `gameOverState.isGameOver && reason === 'settlement_lost'`:

1. **Iride/vignetta** fullscreen che chiude verso il centro (durate/easing da config).
2. **Grade ossidato** sul container della world surface: `OxidizedGradeFilter` (SVG `<defs>` portabile) + `OXIDIZED_RAMP` in `settlementLostTokens.ts` — NON dentro `eventShroudGradeTokens` (scope diverso). Il villaggio/mappa desatura a verdigris; l'overlay con vignetta copre il resto del viewport.
3. **Carta del verdetto**: "SETTLEMENT LOST" + sottotitolo + **lista perdite** (beat da config; se `summary` reale è disponibile lo mostra) + **CTA** "Begin a new settlement" → `resetGame()`.
4. **Bloccante**: `role="alertdialog"`, focus trap, `aria-live` sull'esito, ESC/backdrop disabilitati.

### 3.3 Invarianti

- **i18n**: chiavi `world.settlementLost.*` / `gameOver.settlementLost.*` in `idleVillage`; config contiene chiavi, non letterali.
- **Config-first**: `settlementLostConfig.ts` (Zod): durate sequenza, `OXIDIZED_RAMP`, intensità vignetta, lista beat perdite, chiavi copy, testo CTA.
- **Skin system**: carta su primitive esistenti (`MatericEventCard` variant o struttura stats di `MinimalGameOverModal`); token `--skin-*`, niente CSS standalone.
- **Telemetry**: `settlement_lost_verdict_shown` (una volta per run — guard), `minimal_gameplay_restart` con `reason: 'settlement_lost'` (esistente), opzionale `settlement_lost_debug_trigger` sul bottone.
- **Persistence**: gestita dal `resetGame()` esistente; niente storage diretto.

## 4. Task

| ID | Task | Produce / verifica |
|---|---|---|
| T-001 | `settlementLostConfig.ts` (Zod) + `settlementLostTokens.ts` (`OXIDIZED_RAMP`) + `OxidizedGradeFilter` | config validato; filtro montabile |
| T-002 | Dominio: reason `settlement_lost` in `MinimalGameplayGameOverReasons` + azione `triggerSettlementLost(summary?)` su `useMinimalGameplay` (setta `gameOverState`, idempotente via guard `isGameOver`, telemetra) | unit test: trigger → gameOver+reason; doppio trigger → una sola transizione; `resetGame()` dopo trigger → stato pulito |
| T-003 | `SettlementLostOverlay`: iride → grade ossidato sul container world surface → carta verdetto (lista da config + summary se presente) → CTA→`resetGame()`; a11y alertdialog/focus trap/no-ESC; i18n; telemetry | RTL: appare solo su `reason==='settlement_lost'`; CTA chiama reset; ESC non chiude; chiavi i18n presenti |
| T-004 | Bottone debug su `/world-surface` (pattern shroud toggle) → `triggerSettlementLost()` | flusso bottone → takeover → reset osservabile a mano |
| T-005 | ~~Spike perf~~ **risolta**: grade sul container world surface, non App root. Se durante verifica manuale la transizione scatta, fallback = grade solo sul box mappa (già scope dello shroud) | verificato a runtime |
| T-006 | Safeguards + evidence: `npm run lint -- <scope>`, `test` scope, `build:check`, `kanban:lint`; log `test-results/settlement-lost-<data>.log`; `COMPONENT_MASTER_INDEX` se il takeover diventa trusted | tutto verde + log |

Dipendenze: T-001→T-003; T-002→T-003/T-004; T-003→T-006.

## 5. Fuori scope V1 (esplicito)

- Countdown reale dell'invasione (game-time `invasionDeadlineDay` + check in `tick()` + `scheduleInvasion()` di dominio).
- World event `goblin_invasion` come shadow di presentazione della deadline.
- Schermata Legacy reale (la "knowledge preserved" V1 è lo snapshot game-over di `resetGame()`).
- Mount su pagine di gioco diverse da `/world-surface`.

## 6. Critiche integrate / tensioni residue

**Integrate:** fonte canonica = `gameOverState` (no `runOutcome` parallelo); lista perdite mockata ma marcata come tale (scavalcata dal Director, §1.4); bloccante ratificato; exactly-once via guard esistente; a11y in T-003.

**Residue (note, non bloccanti):**
- Deadline reale rinviata → il bottone debug bypassa il countdown; documentato come V1.
- `summary` mock accettato se l'estrazione del summary-builder dal check `tick()` è invasiva.
- Reload tra verdetto e CTA: `gameOverState` non è persistito → al reload lo stato è "run in corso"; accettabile in V1 demo (la deadline reale risolverà anche questo caso).
