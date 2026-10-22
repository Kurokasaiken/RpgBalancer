# PLAN-051: Verify Slim — evidence derivata, hash-lock, tiering per reach

**Status:** `baptized` — battezzato 2026-10-18 (Director: «procedi»)
**Desiderata:** v35 FROZEN (nessun emendamento richiesto: il plan snellisce
la cerimonia *come da artefatto dibattito*, non cambia gli invarianti —
R-189 e T-04 restano legge)
**Richiesta:** R-220
**Dibattito:** `mind-weaver/.mw/runs/20261018-verify-roi/` — CONVERGED,
artifact `artifact-r004.md` (sha256 `ae269a49…`), ACCEPT 4/4 provider
(claude, gemini, deepseek, grok; chatgpt escluso — sessione degradata).
Obiezioni registrate nell'artifact: nessuna aperta dopo il trust-anchor fix.
**Relazioni:** figlio di PLAN-048 (la misura), usa `WORKFLOW_METRICS.md`
come baseline; tocca gate file → regime PLAN-044 (bootstrap answer /
`awaiting_director` su GATE_FILES).

## 1. Diagnosi

Il forensics report (PLAN-048) misura: **32% del wall-clock di
implementazione è produzione manuale di prove** (command-logs, evidence
JSON, frames, bundle packaging) — i check stessi durano <3min. Il dibattito
R-220 ha verificato che questa spesa NON è teatro: è packaging fatto male.

Verdetto dibattito: *evidence derivata, non scritta*. Tre mosse ROI:

1. **`npm run bundle`** — `produceBundle.ts` già esegue e cattura; il
   residuo manuale è authoring di manifest + raccolta artefatti. Il plan
   porta il flusso a: manifest generato → un comando → un `bundle.json`
   diffabile. L'agente non scrive MAI ricevute/evidence a mano.
2. **Hash-lock meccanico** del trust boundary — `trusted.lock.json` su
   componenti frozen + bundler + verifiers + gate script, con **self-hash
   del bundler** nel bundle e controllo dentro `verify:bundle`
   (unbypassable — il pre-commit resta solo convenienza).
3. **Tiering per reach** — tier deterministico cheap su ogni plan;
   tier percettivo (pixel/fps/human-eye) solo quando il diff raggiunge la
   superficie (surface map + moduli core "touches-all": persistence,
   economy math, save schema); invarianti save/economy always-on;
   sweep completo pre-release.

**Trust anchor** (obiezione bloccante di claude, integrata): hash del
trust-set dentro il write-path dell'agente = falsificabile. Approvazioni
del trust-set valide solo se **firmate dal Director** — GPG/SSH-signed
commit (`commit.gpgsign`, chiave con passphrase) oppure, come fallback
documentato, `npm run approve` che scrive in `~/.rpg-approvals/ledger.jsonl`
fuori dal repo. Bound onesto: senza firma, la forgery è circumvention
deliberata (classe di threat diversa) — accettato nel dibattito.

**Resta judgment:** human-eye (T-04 — SSIM come flag di drift, non
sostituto), approvazioni Director su nuove superfici/trust-set,
authorship dei criteri di accettazione.

## 2. Vincoli

- Nessun nuovo passo manuale per l'agente; niente agente dentro i gate.
- R-189: self-report non è prova — solo meccanica. T-04: claim percettivi
  richiedono testimone che vede.
- Auditability: `bundle.json` resta piccolo, diffabile, sha256-bound.
- T-13: i gate file (`contractsCheck.ts`, `closureLint.ts`,
  `visualForkGate.ts`, …) sono modificati da sessioni parallele —
  toccarli richiede il flusso bootstrap answer di PLAN-044 e coordinamento
  col Director, mai edit silenti.
- Nuove superfici → `mapping:propose` + approvazione Director.
- **Regime aggiornato 2026-10-19 (direttiva Director «nn voglio + cose in attesa del direttore»):** gli agenti eseguono da soli `trusted:seal` + `npm run approve -- --kind=trust-set --actor=agent:<id> --note="…"` per drift legittimo, e `mapping:approve` sulle proprie proposte. Il ledger distingue `actor` (agent vs director); `--note` obbligatoria per gli agenti. Conseguenza: il trust-set diventa **tripwire tamper-evident** — il drift *silenzioso* (file protetto toccato senza risigillo) resta BLOCKED al bundle; la copertura da agente malintenzionato era già fuori threat model (stesso account). Carico Director su questo canale → ~0.
- Backward-compat: manifest e bundle esistenti restano validi; rollback =
  smettere di invocare lo script.

## 3. Scope

- **IN:** `npm run bundle` wrapper+generatore manifest, `trusted.lock.json`
  + check in verify:bundle, ancora di fiducia (approve firmato o ledger
  fuori-repo), tier-labels sulle obbligazioni + scoping per diff, tipo
  `judgment` con witness record bound, harness di misura (seeded faults,
  false-positive rate), dogfood.
- **OUT:** GPG/SSH setup della chiave Director (decisione tua — se non
  pronto, parte il fallback ledger); import-graph scoping (v2);
  riscrittura dei manifest esistenti in JSON schema (incrementale, solo
  nuovi plan).

## 4. Contratto

Obbligazioni verificabili (il plan si auto-verifica con i gate che
migliora):

- **OB-1** (state): `npm run bundle -- --run=<dir>` esiste, genera
  manifest+receipt deterministici, exit 0 solo su PASS; l'agente non
  scrive `bundle.json`/`command-results.json` a mano (test: receipt
  rigenerato sovrascrive qualsiasi file hand-written — come OB-2 PLAN-044).
- **OB-2** (state): `trusted.lock.json` copre componenti frozen +
  GATE_FILES + bundler; un drift su file frozen produce FAIL in
  `verify:bundle`; self-hash del bundler presente in `bundle.json`.
- **OB-3** (state): trust anchor attivo — approvazione trust-set valida
  solo via ledger `~/.rpg-approvals/` (o firma, se la chiave è
  configurata); un edit al trust-set senza approval valida → FAIL.
- **OB-4** (state): obbligazioni hanno `tier`; un diff che non tocca
  superfici percettive non esegue check pixel/fps; un diff su modulo core
  (elenco dichiarato) esegue il tier pieno; invarianti save/economy
  always-on presenti e eseguiti.
- **OB-5** (state): tipo `judgment` richiede witness record con
  sha256 frame + commit SHA; schema lint rifiuta obbligazioni
  prose-only senza tipo.
- **OB-6** (state): harness di misura — fixture "lying agent" (test
  piantato rosso + claim done → closure rifiuta) e "seeded fault" per
  tier; report esteso con false-positive rate; target documentato
  (32%→<10% burst su N≥8 plan, FP≤5%).
- **SAFE**: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run closure:lint` passano; nessun nuovo
  step manuale obbligatorio per l'agente; report/workflow non regrediscono.

## 5. Task

- **T-001** `npm run bundle`: wrapper che scopre la run dir, genera il
  manifest scheletro dai tipi di obbligazione, invoca `produceBundle.ts`,
  emette receipt unico diffabile; retention slim (frames/logs by-hash solo
  dove servono obbligazioni pixel/human-eye).
- **T-002** `trusted.lock.json` + check `frozenIntegrity` dentro
  `verify:bundle` (+ check convenienza opzionale pre-commit); self-hash
  bundler nel bundle.
- **T-003** `npm run approve`: comando Director → ledger fuori-repo
  (`~/.rpg-approvals/ledger.jsonl`, append, hash del trust-set); gate
  verifica che modifiche al trust-set abbiano un'entry valida più recente
  dell'ultimo hash-change. (Upgrade path a firma documentato.)
- **T-004** Tiering: campo `tier` sulle obbligazioni; elenco moduli core
  dichiarato in config; scoping diff→superficie via `.mw/surface-map.json`;
  comando `verify:sweep` (full tier) per pre-release.
- **T-005** Contract schema: `verification.json` con schema zod; tipo
  `judgment` con witness record; `npm run bundle` valida lo schema e
  rifiuta prose-only.
- **T-006** Misura: fixture lying-agent + seeded faults per tier;
  estensione `planForensics` con gate-false-positive rate e burst-minutes
  (già parzialmente presente); sezione nel report.
- **T-007** Dogfood: applicare il nuovo flusso a questo stesso plan e a
  un plan reale; misura pre/post sul ledger `workflow-timing.jsonl`;
  note di migrazione in `context/`.

## 6. Sequenza suggerita

T-001 (il grosso del ROI, isolato) → T-002 → T-003 → T-004/T-005 →
T-006/T-007. Ogni T-xxx produce il suo bundle col flusso corrente finché
T-001 non esiste; da T-002 in poi si dogfooda `npm run bundle`.

## 7. Stato avanzamento (2026-10-18)

| Task | Stato | Note |
|---|---|---|
| T-001 | ✅ | `scripts/verification/bundle.ts` + `npm run bundle` (`--init`, `--run=`, `--no-exec`, `--all-tiers`). Test `bundle.test.ts` 9/9. E2E su run sintetica: exit code reali, `bundle.json` scritto, STALE-gate verificato. |
| T-002 | ✅ | `scripts/verification/trustedLock.ts` + `trusted:seal`/`trusted:check`. Trust-set = GATE_FILES + bundler + `directorApprove.ts` + `.mw/verify-tiers.json` + `.mw/surface-map.json` + `frozen/**` + `trusted docs/**`. Lock in `.mw/trusted.lock.json`; fail-open finché assente. |
| T-003 | ✅ | `scripts/verification/directorApprove.ts` → `npm run approve -- --kind=trust-set`, ledger append-only fuori-repo `~/.rpg-approvals/ledger.jsonl` (path iniettabile nei test). Stampa il drift prima di registrare — approvazione informata. **Semantica strict:** una volta che il ledger ha un record trust-set, è lui l'ancora — il lock locale è solo diagnostico → un lock riforgiato dall'agente NON passa (coperto da test). |
| T-004 | ✅ | `tier` su `Obligation` (`deterministic`/`perceptual`/`always`, default dal tipo: pixel/fps/human-eye → perceptual). Reach via `.mw/verify-tiers.json` (perceptual_globs + core_globs touches-all: persistence, EconomyEngine, economyConfig) + `isVisualFile`. Skip → risultato `SKIPPED` non bloccante. `npm run verify:sweep` = full tier. Config assente/diff vuoto → nessun skip (fail-closed). |
| T-005 | ⚠️ parz. | Witness binding implementato: signoff human-eye richiede `commit_sha` o `frames_sha256` oltre a reviewer+note — il record si lega a ciò che il witness ha visto. NON fatto: schema zod del manifest e tipo `judgment` separato (human-eye copre già il caso; valutare se serve). |
| T-005b | ✅ impl | Schema Zod del manifest: `scripts/verification/manifestSchema.ts` + wiring fail-closed in `produceBundle.ts` (manifest malformato/prose-only → exit 2). Test `manifestSchema.test.ts` 8/8; suite verification 217/217. Tipo `judgment` **scartato** (valutato: human-eye+witness binding copre già il caso). Retrocompat: manifest storici pre-contratto non validano — documentato nello schema. **Pendente:** `produceBundle.ts` è gate-file → drift trust-set, serve `trusted:seal`+`approve` Director → accodato come G-11 in PLAN-068. |
| T-006 | ✅ | Fixture lying-agent (`lyingAgent.test.ts`, 2/2): verdetto derivato dai commandResults anche con verifier/bundle falsi PASS → FAIL+BLOCKED; receipt meccanico porta `generated_by`. Seeded-fault in trustedLock.test (tamper, lock riforgiato, drift non approvato). Report: sezione "Gate cost" in WORKFLOW_METRICS — verdict distribution, obligation results, Director burden (answers/exceptions/approvals), trust anchor state. Gap dichiarato: flip-rate BLOCKED→PASS non osservabile su disco (bundle sovrascritto) — serve journaling verdict o stima da seeded-fault. |
| T-007 | ⏳ auto | **Trust anchor attivato dal Director 2026-10-18** (`trusted:seal` 133 file + `approve` ×2 — primo catch reale: drift surface-map post-mapping:approve rilevato → risigillo → PASS). Misura pre/post: arriva da sola su `workflow-timing.jsonl` ai prossimi plan; confrontare il burst `verification` nel report. |

**Safeguard:** `bundle.test.ts` 9/9 · `trustedLock.test.ts` 8/8 · `build:check` PASS.
`closure:lint` ancora BLOCKED su file visuali della sessione parallela
(T-13 — non assorbiti in questo scope, come da separazione concorrente).
