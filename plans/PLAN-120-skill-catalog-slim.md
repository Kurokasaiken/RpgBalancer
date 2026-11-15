# PLAN-120 — Skill catalog slim: descrizioni ≤200 char + verifica telemetry

**Stato:** `fatto` (2026-11-15 — battezzato ed eseguito T-0..T-3; risultato: catalogo 21.763→7.274 char -67%, pixijs -75%, guard `audit --fail-over 240` verde; evidenze `.mw/runs/plan120-catalog-slim/report.md`)

**Parent:** R-342 (ops: audit contesto fisso Devin + ottimizzazione sistema).

**Fonte approvata:** `artifact-r002.md` del dibattito MW
`20261115-context-budget-audit` (CONVERGED 4/4, sha `e8f1f03f…`) — Phase-2.
Ruling Director 2026-11-15: *"procedi"* (Phase-1 fatta), *"si"* (questo plan).

**Cosa è:** riduzione del blocco più pesante del catalogo skill iniettato a
ogni sessione — le `description:` di frontmatter dei `SKILL.md`. Solo il campo
`description` viene toccato: nomi, path, corpi SKILL.md immutati.

**Cosa NON è:**

- non rimuove né archivia skill (già fatto in Phase-1 per le 4 obsolete);
- non fa umbrella-merge dei 24 pixijs (rejected da artifact-r002 — revisit
  solo se la misura post-slim risultasse insufficiente);
- non tocca le regole `.windsurf/rules/` (Phase-3, task separato);
- non misura il gap 262k (Phase-0, task separato — questo plan porta solo il
  delta misurabile del catalogo, che vale a prescindere).

## 0. Fatti verificati (2026-11-15)

- Catalogo reale (post-archivio Phase-1): **47 skill uniche**, **23.616 char**
  di `description:` aggregate — il blocco pixijs (router `pixijs` + 23
  sub-skill) pesa **16.986 char ≈ 72% del catalogo**.
- File reali: `mind-weaver/.agents/skills/<name>/SKILL.md`; `~/.agents/`,
  `~/.claude/`, `~/.cursor/skills/` sono symlink allo stesso store → **una
  sola edit copre tutti gli IDE**.
- **VENDORED.md autorizza esattamente questo edit**: *"adattare solo la
  `description` (trigger)"* — le pixijs-* sono vendored (pixijs/pixijs-skills,
  MIT); lo slim è adattamento di description, consentito; re-clone upstream
  sovrascriverebbe → lo slim deve essere **ripetibile via script+mappa**, non
  edit a mano.
- Altre description >400 char non-pixijs: `explorer` 912, `knowledge-extractor`
  552, `planner` 472, `work-ticket` 415 (MW-authored, liberi di slim).
- Verification model (da artifact-r002): telemetry `~/.mw/skill-usage.jsonl`
  = misura primaria di recall; canary stratificato = secondario.
- Trappole rilevanti: **T-13** (worktree condiviso: anche mind-weaver è un
  repo separato — le modifiche vanno committate scoped, niente sweep).
- Non è una superficie `/game`: niente sync gate, niente visual-fork
  (`visual-fork: skipped — nessuna decisione estetica; scope = frontmatter
  YAML di skill ops, puntatore: artifact-r002 Phase-2`).

## 0b. Regola di esecuzione (Director, 2026-11-15)

**Un plan approvato si esegue tutto d'un fiato, senza fermarsi.** L'agente che
esegue non si ferma a chiedere conferme tra un task e l'altro (T-0→T-3 in
sequenza), non rilancia domande già coperte dal contratto, non propone
alternative a metà strada.

**Unica pausa legittima:** una scelta non prevista dal plan che solo il
Director può fare — es. un'eccezione >240 char su D-1, un conflitto scoperto
con lavoro parallelo (T-13), un'invariante violata dall'esecuzione. In quel
caso: stop, domanda mirata con opzioni, ripresa dopo ruling. Errori tecnici,
test falliti, output inattesi **non** sono motivi di stop: si debugga e si
continua dentro lo scope del plan.

## 1. Principi

- **P1 — Lo slim è rigenerabile, non manuale.** Una mappa
  `{skill-name: nuova-description}` + script che riscrive solo il campo
  `description:` in frontmatter. Se upstream re-clona, si riapplica.
- **P2 — Il canary è keyword, non prosa.** Ogni nuova description mantiene
  le keyword distintive che fanno matchare il trigger (nomi API, concetti
  dominio); taglia connettivi e liste "Triggers on:".
- **P3 — Misura prima/dopo nello stesso run.** L'audit script emette il
  delta in char e token stimati: il bundle riporta il numero reale, non la
  stima del dibattito.

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| D-1 | Cap per-skill | ≤200 char (vincolo artifact; eccezione documentabile se una keyword-list essenziale non ci sta — max 240, motivazione nel plan) | T-1 |
| D-2 | Soak telemetry | 7 giorni di uso naturale poi diff `skill-usage.jsonl`; advisory, non blocking | post-deploy |

## 3. Fasi / Task

### T-0 — Audit tool + baseline (in `mind-weaver/scripts/`)

- `scripts/mw-skill-desc.py audit --json` → per ogni `*/SKILL.md` in
  `~/.agents/skills/` (realpath dedup): nome, path reale, len description,
  flag `>200`. Output JSON committato come
  `.mw/runs/plan120-catalog-slim/baseline.json` (in RPG `.mw/runs/`).
- `scripts/mw-skill-desc.py slim --map <file> --check` → riscrive il campo
  `description:` di ogni skill nella mappa preservando il resto del file
  (parse YAML frontmatter testuale, niente riserialize del body); `--check`
  = dry-run diff.
- **Deliverable:** tool + baseline.json (prova il 23.616 → target ≤10.000).

### T-1 — Slim map pixijs + apply

- `.mw/plan120/desc-slim-map.yaml` in mind-weaver: 24 voci
  (`pixijs` + 23 `pixijs-*`), ognuna ≤200 char (target ~120-180), con le
  keyword distintive preservate dal testo attuale (nomi API/classi:
  `Application`, `Assets.load`, `FederatedEvent`, `DisplacementFilter`,
  `ParticleContainer`, `BitmapText`, `Ticker`, ecc.) — NON keyword inventate.
- Apply via tool → `git -C mind-weaver diff` verificato: solo righe
  `description:` toccate.
- **Deliverable:** mappa + diff + `audit` post-slim (target: blocco pixijs
  ≤5.000 char).

### T-2 — Slim non-pixijs >400

- Stesse meccanica per `explorer`, `knowledge-extractor`, `planner`,
  `work-ticket` (voci nella stessa mappa). Skip qualsiasi skill la cui
  description >400 si riveli già funzionale allo slim (valutazione caso per
  caso, motivazione nel report).
- **Deliverable:** stessa mappa aggiornata + audit finale.

### T-3 — Verifica + docs + commit

- `audit --json` finale → `report.json` in `.mw/runs/plan120-catalog-slim/`:
  delta per skill, totali, violazioni residue.
- Canary stratificato (artefatto, non eseguito in CI):
  `test-results/plan120/canary-prompts.md` — ≥1 prompt per skill-group
  (es. "add a particle emitter" → pixijs-scene-particle-container;
  "load a spritesheet" → pixijs-assets; "exploriamo la direzione" →
  explorer) per spot-check Director.
- Telemetria: snapshot `skill-usage.jsonl` copiato nel run dir (baseline
  soak); la valutazione di recall avviene a +7gg (obbligazione advisory).
- Update: R-342 in `RICHIESTE.md`, `HANDOFF-deploy-git.md` § residuo,
  `VENDORED.md` nota slim-policy, `plans/INDEX.md` riga PLAN-120.
- Commit scoped in `mind-weaver` (tool+mappa+SKILL.md) e in `RPG`
  (plan+baseline+report+docs) — niente sweep di lavoro altrui (T-13).

## 4. Contratto di chiusura (verification.json → verify:bundle → bundle.json)

| OB | Tipo | Obbligazione | Blocking |
|---|---|---|---|
| OB-1 | state | `mw-skill-desc.py audit` post-slim: **47 SKILL.md** parsano, zero description >240 char (cap assoluto), blocco pixijs ≤5.000 char, totale catalogo ≤10.000 char | sì |
| OB-2 | state | diff confinato: `git -C ~/progetti_personali/mind-weaver diff` sulle SKILL.md toccate modifica SOLO righe del campo `description:` in frontmatter (check script su hunks) | sì |
| OB-3 | state | invarianti strutturali: stesso set di skill prima/dopo (nomi+file), symlink ~/.agents|~/.claude|~/.cursor integri, zero file SKILL.md rimossi/creati | sì |
| OB-4 | state | guard permanente (equivalente R-247): `mw-skill-desc.py audit --fail-over 240` committato e verde — il check permane e rieseguibile; re-run richiesto dopo ogni re-clone vendored | sì |
| OB-5 | human-eye | telemetry soak: diff `skill-usage.jsonl` a +7gg (o prima sessione che invoca ≥3 skill pixijs) — recall non degradato; canary spot-check opzionale da `canary-prompts.md` | no |
| OB-6 | state | docs: R-342 aggiornata con delta misurato; `VENDORED.md` registra la slim-policy; `plans/INDEX.md` aggiornato | sì |

**Nota R-247:** il task non muta comportamento di codice di gioco — l'equivalente
del test di regressione permanente è OB-4 (check meccanico rieseguibile).
Nessuna eccezione silentiosa: dichiarata qui.

## 5. Rischi / note

- **Recall loss invisibile**: il rischio vero è una keyword tagliata di troppo
  che uccide il trigger di una skill non coperta da canary → mitigato da
  telemetry soak (OB-5) e dal fatto che lo slim preserva le keyword
  distintive verbatim dal testo attuale.
- **Re-clone vendored**: upstream sovrascrive le description → il plan è
  progettato ripetibile (mappa+script); dopo update pixijs si rilancia
  `slim --map`.
- **`~/.cursor/skills` potrebbe contenere file non-symlink**: lo slim lavora
  su realpath dedup; qualsiasi copia reale trovata dall'audit viene
  segnalata nel report (non modificata silenziosamente due volte).
- **Dibattito sul plan**: non proposto — direzione già validata dal dibattito
  artifact-r002; esecuzione meccanica. Critica leggera = self-review.
