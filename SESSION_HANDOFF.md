# Session Handoff — 2026-10-03

## 2026-10-03 — Deep research multi-provider, wiki scientifico, proposta v6, playtest live

- **Wiki vivo creato:** `context/QUEST_GAMEPLAY_SCIENCE.md` (committato `107706f9`, indicizzato
  in `context/INDEX.md`) — ~60 fonti reali verificate, principi derivati P1–P47, correzioni
  esplicite (Zeigarnik sovrastimato, house-money non legge, fail-forward = dottrina non scienza),
  gap di letteratura dichiarati (pacing 3–5min e tolleranza RNG non-gambling = non studiati).
- **Deep research batch** in `.mw/runs/20261003-quest-science-deepresearch/` — prompt unico
  `prompt.md` a 4 provider via Canary/CDP (driver `dr_driver.py`): ChatGPT Deep Research ✓
  (risposta completa + follow-up citazioni), DeepSeek DeepThink+Search ✓ (batch più forte),
  Grok-free ✗ debole (molti UNVERIFIED + 2 falsi negativi su fonti reali — inaffidabile per
  audit citazioni), Claude ✗ free-cap prima dell'output.
- **Proposta v6** `.mw/runs/20261003-quest-v6-science/quest-v6.md` — redesign science-based:
  **TAKEN ≠ SECURED** (la cassa in mano è posta esposta, non vittoria), estrazione come fase
  di gioco a 3 forme, fail taxonomy (minor/strategic/quest/character/catastrophic), Astrolabe
  scalato sulla posta, death beat nominato + epilogo con controfattuale.
- **Playtest live strumentato** (Puppeteer, seed 1983, Preset D → VICTORY):
  `playtest-seed1983.md`. Conferma in vivo la diagnosi: **estrazione inesistente nel codice**
  (TAKEN==SECURED), Kran morto su WIN 75-vs-74 reso come 2 righe di log, "WIN" = verdetto quasi
  finto (harm anche a successo), check obiettivo auto-risolto ("ROLL 1 OF 2"), noise meter ancora
  attivo ma inerte, failure path irraggiungibile col gioco prudente (6 WIN/6).
- **Critica consolidata + autocritica v6** in `critique-consolidated.md`: conseguenze v6 ancora
  fiction-driven (serve forma-della-fuga visibile da F4), gradiente push-your-luck non disegnato,
  attachment in 3min probabilmente insufficiente, fuga pulita resta dominante, run-variance
  non risolta.
- **Prossimo passo proposto:** implementazione minima per testare l'ipotesi centrale —
  solo TAKEN→SECURED + estrazione a 3 forme + epilogo con costo — in attesa di decisione
  del Director (v6 integrale vs minimo vs altro).

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
