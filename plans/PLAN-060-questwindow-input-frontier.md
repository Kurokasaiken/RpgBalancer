# PLAN-060: QuestRunWindow — coordinamento input e verify frontier (R-231 Plan A)

**Status:** `done` — implementato e verificato 2026-10-19 (bundle `.mw/runs/plan060-input-frontier/`)
**Richiesta:** `R-231` (#1, #2)
**Parent/Relazioni:** struttura 5-plan del dibattito multi-AI `20261019-r231-questwindow`
(converged su `artifact-r003.md`, sha256 `c7236b291f62…`); sequenza coda PLAN-049:
A=PLAN-060 → D1=PLAN-061 → C=PLAN-062 → B=PLAN-063 → D2=PLAN-064.
**Dipendenza condivisa:** poggia sul gate `readyAt` (R-199). Questo piano verifica
il gate **com'è**; PLAN-062 può dopo ridefinire cosa mostra la barra, non quando il
gate si apre. I gate-test qui scritti devono restare indipendenti dalla barra.

---

## 0. Ruling Director (registrati)

- **Speed-key policy:** i tasti `1-9` cambiano velocità **solo quando nessuna
  selezione è pendente**. "Selezione pendente" = opzioni frontier abilitate e
  non ancora scelte (stato eseguibile, non opinione).

## 1. Scope

1. **Coordinamento tasti (#2):** il keydown frame-level in `game-frame.tsx`
   (speed 1-9) deve rispettare `defaultPrevented` / ownership di input della
   quest window. Con selezione pendente → `1-9` selezionano opzioni, velocità
   invariata. Senza selezione pendente → `1-9` cambiano velocità (policy rulata).
2. **Verify frontier (#1):** la frontier avanza quando `readyAt` passa; click su
   opzione abilitata avanza la fase. **Contingenza esplicita:** se la verify
   trova un vero stuck-frontier (opzione abilitata che non avanza), il piano si
   espande o spawna `A2` — non passa in silenzio.
3. **NON scope:** l'indicatore visivo di lock sulle opzioni disabilitate è un
   visual-fork → va nella preview di PLAN-063 (B). A resta puramente
   comportamentale.

## 2. Task

- **T-001** — Fix key coordination: frame-level keydown rispetta
  `defaultPrevented`/focus ownership; `QuestRunWindow` preventDefault quando
  gestisce `1-9` su opzioni pendenti.
- **T-002** — Verify frontier: test che avanza il clock oltre `readyAt` e
  asserisce che l'opzione si abilita e il click avanza la fase.
- **T-003** — BV policy speed-key (ramo scelto): selezione pendente ⇒
  `timeScale` invariato; nessuna selezione pendente ⇒ speed cambia.
  Stato locked-frontier testato separatamente (opzioni disabled, nessun
  avanzamento, speed key funziona per policy).
- **T-004** — Doc: aggiornare contratto componente `QuestRunWindow` (PLAN-054)
  e doc integrazione con la nuova invariante input.

## 3. Acceptance / BV (eseguibile)

- A1: con opzioni abilitate, `Digit1`/`Digit2` selezionano l'opzione e non
  modificano `timeScale` (assert DOM + store).
- A2: con frontier lockata (`nowTick < readyAt`), `1-9` → speed cambia (policy:
  nessuna selezione pendente) e le opzioni restano disabled.
- A3: clock avanza oltre `readyAt` → opzione abilitata → click → fase avanza.
- A4: nessuna stringa utente nuova hardcoded; nessuna costante nuova fuori
  config (invarianti R-231 trasversali).

## 4. Stop-condition

Bundle `verify:bundle` PASS con i check sopra → `fatta`. Se T-002 trova
stuck-frontier reale → registrare, espandere ad A2, non chiudere.

## 6. Esito implementazione (2026-10-19)

- **Fix applicato:** `QuestRunWindow` — i due listener `keydown` (digit→opzione,
  qualsiasi-tasto→avanza beat) passati in **capture phase** + `preventDefault`
  sui tasti gestiti. `game-frame.tsx` — il handler speed/pause in bubble onora
  `event.defaultPrevented`. Nessun altro codice toccato.
- **E2E** `gameQuestInputCoordination.spec.ts` (4/4 PASS):
  - `key press selects the pending option and does not change speed` — A1
  - `locked frontier leaves the speed binding live` — A2. Determinismo via
    **pausa** (`Space`): clock congelato ⇒ la frontier del commit resta
    `waiting`+`nowTick < readyAt` mentre i beat (wall-clock) si esauriscono.
  - `frontier matures at readyAt and an enabled option advances the phase` —
    A3. Nessuno stuck-frontier trovato → A2-contingency non attivata.
  - `presenting beat consumes the key without changing speed`.
- **Doc:** sezione input coordination aggiunta al contratto
  `.mw/contracts/components/quest-run-window.md` (T-004).
- **Regressioni:** `gameQuestCluster.spec.ts` 12/12 (BV-11 flaky su race
  `isVisible→click` preesistente — passa isolato; non legato al diff).
- **Safeguards:** lint 0 errori, `build:check` PASS, unit `questRunWindow` 17/17.
- **Fix collaterale (evidence-blocking, documentato):** `questTheatreAudio.ts`
  — `activeNodes()` contava le voci *schedulate nel futuro* (`play` con
  `delayMs`, es. `shot_settle` a `settleAt×durMs` fino a ~3s) come "live",
  facendo fallire deterministicamente il drain di BV-08 (2.5s) quando la
  storm terminava su un beat con entrance shot lungo. Ora `LiveVoice.startAt`
  marca l'istante audio-clock in cui la voce inizia a suonare e
  `activeNodes()` conta solo voci *sounding* — una cue pendente legittima non
  è un orfano; le cue cancellate continuano a uscire da `live` via
  `fadeOutVoice`. A/B provato: BV-08 falliva identico SENZA il diff input.
- **BV-08 flake residua documentata:** la race `isVisible→click` su beatStage
  (BV-11) resta preesistente — passa isolato, non legata al diff.

## 5. File chiave (trigage)

- `src/pages/game-frame.tsx` (binding speed 1-9 window-level)
- `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` (binding opzioni)
- `tests/e2e/idleVillage/gameQuest*.spec.ts` (family esistente per i BV)
