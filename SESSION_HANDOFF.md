# Session Handoff — 2026-10-02

## Current state

- **PLAN-019-S1 battezzato** (`plans/PLAN-019-S1-quest-interessante.md`): «La cassa delle
  sementi» in lab isolato `/quest-s1-lab`. Criterio Director: *«nn ci interessa che funzioni,
  deve essere divertente»* — le meccaniche rev.2 (verdetto→rischi, bodyguard, leader, wipe)
  sono strumenti di tensione nella forma più economica, non sistemi da validare.
- **Desiderata v24 rev.2 FROZEN**: reward = prova-obiettivo + leader vivo (non più ≥50% check);
  riuscita dalla partenza compound; HP separati; rischi per slot; bodyguard solo su danni da
  skill check. PLAN-019 aggiornato a v4; D-4/D-7 chiuse, D-8 superata, D-9 aperta.
- Matrice di lavoro T-001 preparata: `.mw/runs/20261002-s1-quest-design/quest-design.md`.

## Next step

**T-002/T-003 implementati** (non committati): lab `/quest-s1-lab` giocabile end-to-end.
File: `src/ui/idleVillage/questS1Lab/questScenario.ts` (contenuto hardcoded),
`questRun.ts` (engine: RNG seedabile, verdetto→rischi per slot, bodyguard che intercetta
tutti i danni da check, incidente non-check, death save 5%, wipe, fuga, mercante multi-acquisto),
`src/ui/idleVillage/pages/QuestS1LabPage.tsx` (preset 4 party, stato, scelte, log),
route registrata in `src/App.tsx`. Test: `tests/unit/idleVillage/questS1Lab/questRun.test.ts`
(9/9 verdi). Prossimo: T-004 — playtest del Director + `S1-design-findings.md`.

**2026-10-02 — UI redesign dopo critica Director** («pessimo lavoro di design, manca il bordo»):
UI ricostruita sul linguaggio di WanderlustRosterCard (party: ritratto oro, nome Cinzel,
ruolo+stato, barre HP/Stamina, riga stat; morto=grayscale, ferito=ring ambra) e
QuestDetailPanel (pannelli `rounded-3xl border-amber-400/40 bg-black/75`, kicker tracked,
InfoRow bordate). Skill check: **componente battezzato = DestinyAstrolabeV62**
(`/minimal-destiny-astrolabe-v6-2`, tar-goo WebGL2), usato via `destinyAstrolabeV62Kit`
con `config.mode`=verdetto forzato; bottone «continua» appare solo dopo `onResolve`
(niente spoiler). Registrato in `COMPONENT_MASTER_INDEX.md`. Verificato in browser
(intercettazione bodyguard → morte → reward persa). Evidence:
`test-results/quest-s1-lab-redesign-2026-10-02.log`.

## Decisions made

- PLAN-019-S1 battezzato dopo 3 round critica web + critica ChatGPT incollata dal Director.
- Preview compound fuori da S1 (feature di S3). Death save solo se manca il momento.
- Skill check riusa i 5 verdetti dell'Astrolabe; nessuna teoria nuova.
- Gate A = solo giudizio del Director sul core loop; FAIL classificato per causa.

## Do not touch

- `missionResolver.ts` / PLAN-018 restano congelati: nessuna modifica al runtime quest finché
  S1 non ha prodotto i design findings. Niente codice S1 che diventi modello generale.

## Open questions

- Nessuna decisione aperta: i parametri numerici sono mock iniziali in `quest-design.md`, da
  ritoccare nel playtest. Death save 5% confermato; wipe = si perde tutto.
