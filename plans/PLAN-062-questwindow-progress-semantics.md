# PLAN-062: QuestRunWindow — semantica progresso e checkpoint fasi (R-231 Plan C)

**Status:** `superseded` — 2026-10-20: implementazione consolidata nell'ondata PLAN-053 ma **non conforme** a C1/C2 (audit F3 `src/docs/docs/game_surface_audit/F3_scheda_questrunwindow.md` §4: barra piena a fase 4/7 o con 4 cali e fine al 95%; tacche a sesti uguali). Assorbito da **PLAN-067 T-B3** (QW-1 B + I1, ruling R-234).
**Richiesta:** `R-231` (#4)
**Parent/Relazioni:** dibattito `20261019-r231-questwindow` (`artifact-r003.md`
sha `c7236b291f62…`); sequenza PLAN-049: PLAN-060 → PLAN-061 → **PLAN-062** →
PLAN-063 → PLAN-064.
**Dipendenza condivisa (reciproca con PLAN-060):** poggia sullo stesso gate
`readyAt`. PLAN-060 verifica il gate com'è e i suoi test sono indipendenti dalla
barra; questo piano ridefinisce **cosa la barra mostra**, non quando il gate
si apre.

---

## 0. Ruling Director (registrato)

- **#4 opzione (b): elapsed vs dichiarata separate.** La barra mostra il tempo
  reale trascorso rispetto alla durata della quest; la durata dichiarata/stimata
  è un riferimento separato. Checkpoint per fase benvenuti — derivabili da
  `readyAt` per fase (nessuno schema nuovo richiesto).

## 1. Scope

1. Nuovo contratto `TimeBar`/progresso: la barra si riempie su **tutta la durata
   reale** della quest (quest da 2 min → riempimento in 2 min).
2. Checkpoint per fase: mark/derivation da `readyAt` per fase.
3. La semantica deve sopravvivere all'overrun dei nodi hidden (es.
   `gob-bottino` consuma `nodeTicks` oltre `estimatedDurationTicks`): con la
   scelta (b) l'elapsed reale è la verità — la stima è display, non gate.
4. **C dichiara nel proprio header il footprint della bar-region** (spazio
   occupato da checkpoint/indicatori) — input dichiarato per PLAN-063, non
   sorpresa a valle.

## 2. Task

- **T-001** — Definizione contratto: config Zod per la semantica (checkpoint
  on/off, derivazione da `readyAt`, comportamento a overrun).
- **T-002** — Implementazione barra: elapsed reale vs durata; checkpoint per
  fase; dichiarazione del footprint bar-region.
- **T-003** — BV su **clock simulato** (ticks controllabili — mai test
  wall-clock da 2 min).
- **T-004** — Doc componente + doc integrazione (contratto PLAN-054).

## 3. Acceptance / BV (per ruling (b))

- C1: barra monotona non-decrescente durante la quest (clock simulato).
- C2: barra raggiunge lo stato "piena"/completo alla fine reale della quest,
  incluso overrun hidden-node (l'elapsed governa).
- C3: checkpoint presenti ai boundary di fase derivati da `readyAt` (DOM assert
  su marker/checkpoint).
- C4: la durata dichiarata/stimata è mostrata come riferimento separato (non
  scala la barra).
- C5: footprint bar-region dichiarato nel plan prima dell'implementazione di
  PLAN-063.
- C6: nessun valore hardcoded (config-first); nessuna stringa hardcoded (i18n).

## 4. Stop-condition

Bundle PASS sui check sopra. La preview della resa barra (se ≥2
rappresentazioni materialmente diverse) passa dal visual-fork gate.

## 5. File chiave (trigage)

- `TimeBar` + `time.progress` path in `QuestRunWindow.tsx`
- quest progression/`readyAt`/`nodeTicks`/`estimatedDurationTicks` nel domain
- config Zod di game frame
