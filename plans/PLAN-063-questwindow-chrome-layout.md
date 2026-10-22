# PLAN-063: QuestRunWindow — chrome & layout (R-231 Plan B)

**Status:** `in corso` — 2026-10-20: implementazione consolidata (R-231 #3 header solo icone, #6 abbandono icona+tooltip, #7 minimizzata simmetrica: verificati a schermo, audit F3 §5). Residui (tre grammatiche di bottone nell'header, colore della conferma d'abbandono) assorbiti da PLAN-067 (T-A14/T-B6). Chiusura: bundle + eye-check Director.
**Richiesta:** `R-231` (#3, #5, #6, #7 + indicatore lock di #1)
**Parent/Relazioni:** dibattito `20261019-r231-questwindow` (`artifact-r003.md`
sha `c7236b291f62…`); sequenza PLAN-049: … → PLAN-062 → **PLAN-063** → PLAN-064.

**Perché è in coda per ultimo-dei-fix (deliberato, non backlog drift):** la
fixture geometrica #5 dipende dagli esiti di C (footprint bar-region) e D1
(aspect pannello immagine). Il **chrome è geometry-independent** → la preview di
questo piano è costruibile subito (task T-001 può partire in anticipo); solo
l'implementazione/finalizzazione atterra dopo C/D1.

---

## 0. Struttura review

Header del piano: **una fork-review con 4 ruling registrati separatamente**
(#3, #6, #7, indicatore lock di #1) **+ una fixture comportamentale** (#5).
Ogni fork è registrato come entry separata (ownership tracciabile per il
visual-fork gate, PLAN-047). La review può condividere una sessione Director con
PLAN-064 (entrambe fork-review).

## 1. Scope

- **#3** header icon-only: via i label dalle pill bag/assigned-party/chronicle;
  estendere le primitive skin esistenti (`HudPlaque`, `SkinBadge`, `SkinButton`,
  `SkinCloseButton`); inventario icone verificato in implementazione.
- **#6** abandon quest: da text pill `TONE.death` a **icona + tooltip** (testo
  via i18n).
- **#7** minimized: allineamento ai bordi (space-between / edge-anchored), non
  left-packed.
- **Indicatore lock (#1):** forma visiva del feedback su opzioni disabilitate
  (ruling qui, implementazione condivisa con PLAN-060).
- **#5** scroll "raro": fixture comportamentale — la quest goblin di riferimento
  mostra tutte le righe senza scrollbar a densità default; testo degenere può
  scrollare. Clamp `stageMaxHeightPx` 260 resta valore di config.
- **a11y:** aria-label + raggiungibilità da tastiera per i controlli icon-only.
- **i18n:** tooltip + ogni nuova stringa via chiavi.
- Fork reversibili via config/flag (kit congelati).

## 2. Task

- **T-001** — Preview cards `/theater-lab` per i 4 fork (costruibile subito,
  prima di C/D1).
- **T-002** — Ruling Director sui 4 fork (registrati separatamente).
- **T-003** — Implementazione chrome (#3, #6, #7, indicatore lock).
- **T-004** — Fixture #5: quest di riferimento senza scrollbar a densità
  default (dopo C/D1 — geometry finale).
- **T-005** — Doc componente + doc integrazione aggiornate.

## 3. Acceptance / BV

- B1: header ha zero label nodes testuali (DOM assert) — icone con tooltip/a11y.
- B2: abandon = icona con tooltip bound a chiave i18n (DOM assert).
- B3: minimized = **edge-geometry** — bounding box icone ai bordi del container
  (non solo `justify-content: space-between`, che con padding errato passerebbe).
- B4: quest goblin di riferimento → tutte le righe visibili, nessuna scrollbar a
  densità default e viewport di riferimento.
- B5: indicatore lock visibile su opzioni disabilitate (forma rulata).
- B6: tutti i controlli icon-only raggiungibili da tastiera + aria-label.
- B7: BV di questo piano = regression gate del componente — ri-eseguiti dopo C/D1.

## 4. Stop-condition

4 ruling registrati + bundle PASS + preview approvate. PLAN-063 non chiude finché
la fixture #5 non è verificata sulla geometry finale (post C/D1).

## 5. File chiave (trigage)

- `QuestRunWindow.tsx` (header pills, footer abandon, minimized, scroll regions)
- `src/ui/idleVillage/skins/primitives/` (HudPlaque, SkinBadge, SkinButton…)
- `gameFrameConfig` (`stageMaxHeightPx`)
- `public/locales/{en,it}/idleVillage.json`
