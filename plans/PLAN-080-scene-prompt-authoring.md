# PLAN-080 — R-272: authoring dei prompt di scena — regole, lint stilistico, kernel pittorico, compiler

Stato: in corso — implementazione T-001..T-005 completata, bundle OB-1..5 PASS (verdict BLOCKED solo su rumore T-13 condiviso, identico a PLAN-077/078). Dibattito multi-AI web **CONVERGED 4/4 ACCEPT**
(run `mind-weaver/.mw/runs/20261023-r272-scene-prompt-authoring`, artifact-r003
sha `8bbfa012…`, 8 obiezioni disposizionate r001→r003; electorate
chatgpt/claude/gemini/deepseek; grok rimosso provider_dead). In attesa di
battesimo Director.
Richieste: `RICHIESTE.md` R-272 — verbatim Director 2026-10-23:
«il nostro processo di creazione dei prompt è debole […] Armatura antagonista e
Verso Mordor [come stampo] […] perdono lo stile a pennellate spesse che dovrebbe
essere il nostro cavallo di battaglia […] rendere tutto più coerente, uniforme e
che ci possa dare circa risultati sempre simili» + scelta direzione «usare
tutt'e 3» (regole+lint, kernel nel contratto PLAN-052, compiler).
Desiderata: v34 (slice parziale — authoring contract delle scene cinematics,
PLAN-052); contesto v5/v6 (mockup protocol). Nessun nuovo item desiderata
rivendicato: il plan estende il contratto di un plan esistente, non apre
direzione.

visual-fork: skipped — il plan tocca solo docs, script e file spec testuali
(`src/docs/**`, `plans/**`, `.mw/specs/**`, `scripts/*.py`,
`.mw/templates/**`, `tests/**`); nessun elemento grafico creato o modificato,
nessuna rigenerazione di immagini in scope — PLAN-080 §2.

## 1. Scope

Analisi comparativa (esplorazione R-272, 2026-10-23): gli esemplari «Armatura
Antagonista» (~140 parole) e «Verso Mordor» (~110) aprono col medium pittorico,
ripetono i token di stile, tengono la kill list compatta in coda, descrivono
materia+luce invece di coordinate. Il prompt fallito `f3-accampamento-dusk` v1
(unico FAIL di `quest-goblin-scenes`, 11/12 check) apriva con vocabolario
fotografico (`24mm`, `depth of field`, `establishing shot`), stile menzionato
una sola volta in forma hedged (`in the … tradition`), ~28-33% delle parole in
blocchi di negazione, percentuali e coordinate di layout.

Direzione approvata dal Director — **A+B+C**:

- **A — Regole + lint.** Nuove regole «kernel pittorico» nella authoring guide;
  `lint-scene-prompts.py` esteso con check Q13–Q17; migrazione dei prompt che
  non conformano.
- **B — Kernel nel contratto PLAN-052.** §7 «Full prompt» deve essere scritto
  in registro pittorico: l'ingegneria (depth planes, ancore FX, calm zone,
  coordinate) vive nei campi §1–6 del brief; nel prompt ogni vincolo tecnico è
  tradotto in termini visivi (occlusore → «broad dark painted mass at frame
  edge», calm zone → «low-frequency painted area», ancora FX → sorgente di luce
  dipinta, mai le particelle). PLAN-052 è draft non battezzato: l'emendamento è
  hygiene pre-battesimo, non riapre il piano né chiude T-007/v33-v34 pendenti.
- **C — Prompt compiler.** `scripts/build-scene-prompt.py` (Python stdlib,
  input JSON): genera lo scheletro `prompt.md` canonico dai campi del brief,
  che passa il lint per costruzione. Nessuna fonte di verità parallela: il
  compiler legge un file-brief dentro la spec dir, non un registro a parte.

Fuori scope (dichiarato): rigenerazione/valutazione delle immagini, prompt per
agenti o deliberazioni, runtime parallax engine, generazione a layer, video.

## 2. Decisioni di design

1. **Check nuovi nel lint** — set rivisto dal dibattito (4 hard + 1 warn).
   I check sono gate di *registro/convenzione*, non di gusto; il claim
   estetico resta eye-check Director:

   | ID | Cosa | Severità |
   |---|---|---|
   | Q13 | medium-first: token medium (`oil painting`/`impasto`/`oil`) entro la prima frase del fenced block (finestra ~15 parole) E nessun token camera prima di esso. Il token medium conta come token stile → il requisito posizionale «≥1 style token in apertura» è soddisfatto per costruzione | hard |
   | Q14 | register ban — sub-codici `REG-CAM` (vocabolario fotografico: `\d+\s?mm`, `depth of field`, `establishing shot`, `f/\d`, `bokeh`, `telephoto`, `dslr`, `lens flare`, `shallow focus`) e `REG-NUM` (layout numerico: `\d+%`, `x[01].\d`/`y[01].\d`, coppie di coordinate). Allowlist corpus: `cinematic`, `wide-angle`, `golden hour`, `rim light`. Confine = convenzione corpus-derived, dichiarato | hard |
   | Q15 | floor di stile: ≥3 occorrenze di vocabolario stile (`impasto`, `brushstroke`, `palette-knife`, `painterly`, `oil painting`, `visible layers of paint`) contate dopo aver rimosso clausole negate e hedge (`in the … tradition`, `in the style of`, `reminiscent of`) — segmentazione condivisa con Q16 | hard |
   | Q16 | **explicit-negation bulk**: parole dentro run `NO/DO NOT/NEVER` (terminati a fine frase) vs totale — metrica stretta e riproducibile: misura il volume delle kill list, non la negazione semantica (niente `without`/`devoid`, sarebbe rumore) | **warn** (stampa valore + range corpus, exit 0) |
   | Q17 | marker `<!-- AUTHOR:` residuo nel fenced block (scaffold non compilato) | hard |

   **Regole di severità uniformi:**
   - *Corpus-invariance con triage*: la calibrazione T-002 corre gli hard
     gate sullo **snapshot pre-migrazione** del corpus approvato (file list
     + commit hash nel report; dusk-v1 escluso come failure noto). Su
     fallimento: (a) check difettoso → si corregge il check; (b) violazione
     reale in un prompt approvato → si migra il prompt o si registra
     eccezione motivata in un file versionato letto dal lint
     (prompt/check/motivo/approvatore — mai waiver orale); (c) demote a
     warn solo come fallback con accettazione esplicita Director. Mai
     ri-taratura silenziosa. Ri-valutazione a ogni aggiunta al corpus.
   - *Promozione*: un warn diventa hard solo dopo pilota con eye-check
     Director su una scena rigenerata; se il pilota non avviene Q16 resta
     warn permanentemente — dichiarato, niente promozione silenziosa.
2. **Forma del compiler** (ridotta a scheletro + slot): Python stdlib, input
   `brief.json` nella scene dir dello spec, output `prompt.md` con sezioni
   canoniche. Campo prosa vuoto → placeholder `<!-- AUTHOR: campo -->` e
   rifiuto di scrivere senza `--allow-placeholders`; rifiuto overwrite di
   prompt.md esistente senza `--force` (prompt.md canonico dopo editing;
   brief.json = input di scaffolding, non seconda fonte di verità);
   emissione solo da allowlist di chiavi → leak engineering impossibile per
   costruzione. Golden test: byte-identico su interprete pinnato, uguaglianza
   semantica altrove. Warn drift: se brief.json esiste, il lint avvisa se la
   prosa diverge da §7 (containment check, warn).
   **Tabella di traduzione = vincoli di vocabolario, non stringhe**:
   occlusore → un pigmento bibbia *per-scena* (dal campo palette di
   brief.json) + `mass` + ancora al bordo del frame; calm zone →
   `low-frequency painted area` + pigmento; banned phrasings `dark mass`/
   `black mass` (collisione con "never black murk"). Niente frasi identiche
   stampate su ogni scena.
3. **Negative-corpus test**: copie degradate dei prompt approvati (apertura
   camera, blocco negazioni extra, stile rimosso) → ogni hard gate deve
   sparare esattamente sulla degradazione mirata; misura FP/FN senza
   generare immagini. `fail-register-dusk-v1` = fixture primaria. Il test
   resta valido anche dopo una eventuale demotion (un check che non spara
   più sulla sua degradazione è un bug del check).
4. **Soglie e confini**: derivati dal corpus (regola 1), con il corpus
   pinnato a snapshot+hash per tracciabilità.
5. **File caldi condivisi (T-13)**: `f3-accampamento-dusk/prompt.md` è stato
   riscritto da una sessione parallela ieri — prima di toccarlo verificare
   mtime/autore; la riscrittura attuale passa il lint vecchio ma fallirebbe
   Q13 (nessun medium-first) e probabilmente accenderebbe Q16 (kill list
   ~20 voci).

## 3. Task e acceptance

### T-001 — Regole «kernel pittorico» nei doc

- `src/docs/docs/art-direction/scene_prompt_authoring_guide.md`: nuova
  sezione/nuove regole (R9 «kernel pittorico»): medium-first, floor di stile
  con hedge non conteggiato, ban vocabolario camera e misure di layout nel
  blocco prompt, budget negazioni, restatement positivo obbligatorio per i
  vincoli FX (es. «paint only the light SOURCE»), riga anti-pattern con il
  dusk-v1 come esempio.
- `plans/PLAN-052-quest-scene-depth-staging.md`: clausola nel contratto §7 —
  il «Full prompt» è un kernel pittorico; §1–6 portano l'ingegneria; tabella
  di traduzione vincolo→frase visiva (occlusore, calm zone, ancora FX);
  nota changelog.
- `.devin/skills/mockup-generator/SKILL.md`: puntatore alla nuova sezione
  della guide (riga singola, nessuna duplicazione di regole).
- **Acceptance**: i tre file contengono le clausole; `grep` delle ancore
  nuove restituisce i match attesi.

### T-002 — Lint esteso + fixture + test di regressione

- `scripts/lint-scene-prompts.py`: implementa Q13–Q17 (§2.1) con messaggi
  nello stile esistente e severità hard/warn; **calibrazione** sullo
  snapshot pre-migrazione del corpus (file list + commit hash nel report
  `context/` o nel run dir; dusk-v1 escluso). Su fallimento corpus →
  triage (a/b/c di §2.1), mai retune silenzioso.
- `tests/fixtures/scene-prompts/`: fixture `pass-exemplar` (stampo Armatura),
  `fail-register-dusk-v1` (**primaria**: apertura camera + stile hedged +
  blocchi negazioni), `fail-numeric-layout`, `fail-style-thin`,
  `fail-placeholder` + **negative-corpus** (copie degradate dei prompt
  approvati → ogni hard gate spara solo sulla degradazione mirata).
- `tests/unit/scripts/lintScenePrompts.test.ts`: spawnSync
  `python3 scripts/lint-scene-prompts.py <fixture-dir>`; asserisce exit code
  e codici Q attesi per fixture; **test permanente che fallisce senza la
  modifica** (R-247): i fail-fixture producono esattamente i nuovi check.
- **Acceptance**: sweep lint reale verde su tutte le dir
  `.mw/specs/*/scenes/` post-migrazione T-004; fixture rosse producono i Q
  previsti; `npm run test -- tests/unit/scripts` verde.

### T-003 — Compiler `build-scene-prompt.py` (dopo T-002)

- `scripts/build-scene-prompt.py`: scheletro + slot. Legge `brief.json`
  (campi allineati a PLAN-052 §1–6), emette `prompt.md` canonico.
  - campo prosa vuoto → `<!-- AUTHOR: campo -->` + rifiuto senza
    `--allow-placeholders`;
  - overwrite solo con `--force` esplicito;
  - emissione solo da chiavi allowlisted (leak engineering impossibile);
  - tabella traduzione a vincoli di vocabolario + pigmento per-scena dal
    campo palette (§2.2).
- `.mw/templates/scene-prompt/brief.template.json`: input di esempio
  commentato (campi + note «questi dati sono logistica, il prompt li
  traduce»).
- Test nel file di T-002 (o `tests/unit/scripts/buildScenePrompt.test.ts`):
  golden — compiler su fixture brief → lint exit 0; doppia esecuzione →
  byte-identico su interprete pinnato; refusal su placeholder senza flag e
  su overwrite senza `--force`; drift-warn su brief.json divergente.
- **Acceptance**: `python3 scripts/build-scene-prompt.py --brief <fixture>
  --out <tmp>` produce prompt che passa TUTTI gli hard gate.

### T-004a — Migrazione batch rovine

- `quest-rovine-scenes` r0–r7: aggiungere ancora `SUBJECT:` (falso positivo
  lint); r2/r4 integrare `deep teal` in PALETTE (gap reale).
- **Acceptance**: lint exit 0 su `quest-rovine-scenes`; diff minimi (solo
  ancore/clausole, prosa pittorica approvata intatta).

### T-004b — Migrazione `f3-accampamento-dusk` (file caldo)

- **Gate preliminare**: verifica mtime/autore del file (T-13). Se la
  sessione parallela sta ancora lavorando sul file → STOP e confronto col
  Director invece di sovrascrivere.
- Allineare §7: apertura medium-first (Q13), kill list compattata sotto
  osservazione Q16-warn, nessun token REG-CAM/REG-NUM, ≥3 token stile
  effettivi (Q15). La riscrittura parallela attuale ha già le ancore
  strutturali: il delta è l'apertura e il volume delle negazioni.
- **Acceptance**: lint exit 0 su `quest-goblin-scenes` incluso dusk.

### T-005 — Verifica e bundle di chiusura

- Safeguard: `npm run test -- tests/unit/scripts`, `npm run build:check`,
  `closure:lint` (diagnosi T-13 su eventuale rumore da sessioni parallele —
  non catturare lavoro altrui in commit scoped).
- Coverage: `scripts/lint-scene-prompts.py`, `scripts/build-scene-prompt.py`,
  `tests/fixtures/scene-prompts/**`, `.mw/templates/scene-prompt/**` non sono
  in superficie mappata → `coverage_exception` EXC-20261023-* con motivazione
  (tooling prompt-authoring, scrutiny via fixture test + lint sweep), oppure
  voce di superficie se il Director preferisce mapparli.
- `verification.json` + `verify:bundle` → `bundle.json`; chiusura R-272 in
  `RICHIESTE.md` con `bundle:`.
- **Nota T-04**: il plan non rigenera immagini. Il claim «il kernel produce
  pennellate spesse» è estetico e si chiude solo con eye-check Director su
  una scena generata — dichiarato fuori dal bundle.

## 4. File toccati (superfici)

- `src/docs/docs/art-direction/scene_prompt_authoring_guide.md` — governance-docs.
- `plans/PLAN-052-quest-scene-depth-staging.md`, `plans/INDEX.md`,
  `plans/PLAN-080-*.md` — governance-docs.
- `.devin/skills/mockup-generator/SKILL.md` — governance-docs.
- `scripts/lint-scene-prompts.py`, `scripts/build-scene-prompt.py` — non
  mappati → exception (T-005).
- `tests/unit/scripts/lintScenePrompts.test.ts` (+ eventuale
  `buildScenePrompt.test.ts`) — workflow-forensics (`tests/unit/scripts/**`).
- `tests/fixtures/scene-prompts/**` — non mappati → exception.
- `.mw/templates/scene-prompt/**` — non mappati → exception.
- `.mw/specs/quest-rovine-scenes/scenes/*/prompt.md`,
  `.mw/specs/quest-goblin-scenes/scenes/f3-accampamento-dusk/prompt.md` —
  governance-docs.

## 5. Contratto di chiusura (obbligazioni)

- **OB-1** (state, blocking): la guide contiene la sezione kernel pittorico
  con le regole Q13–Q17 documentate — `grep` ancore.
- **OB-2** (state, blocking): `python3 scripts/lint-scene-prompts.py` exit 0
  su ogni dir `.mw/specs/*/scenes/`; le fixture rosse falliscono coi codici
  attesi — comando nel test file.
- **OB-3** (state, blocking): `npm run test -- tests/unit/scripts` verde —
  include il test di regressione permanente sui nuovi check e il golden
  compiler (deterministico + lint-passing + no leak engineering).
- **OB-4** (state, blocking): PLAN-052 porta la clausola kernel in §7 +
  changelog — `grep` ancore.
- **OB-5** (state, blocking): `npm run build:check` e `closure:lint` senza
  errori attribuibili a questo diff; exception di coverage registrate.
- **Eccezione human-eye dichiarata**: nessuna verifica visiva in bundle — il
  piano è tooling/documentazione; la prova estetica («pennellate spesse
  preservate») resta eye-check Director alla prossima generazione immagine.

## 6. Trappole attive

- **T-04**: nessun claim visivo senza testimone — dichiarato in OB-5.
- **T-13**: worktree condiviso; `f3-accampamento-dusk` è file caldo di una
  sessione parallela → verifica mtime/autore prima di T-004, stop+Director se
  in tensione; nessun commit scoped che catturi modifiche altrui.
- **T-22**: nessuna misura runtime in questo plan.
- **R-247**: ogni behavior change di lint/compiler coperto da test permanente
  red-first (T-002/T-003).

## Changelog

- 2026-10-23 — draft v1: plan A+B+C da esplorazione R-272 (medium-first,
  style floor, negation budget, kernel §7, compiler deterministico).
- 2026-10-23 — **r003 (CONVERGED 4/4 ACCEPT)**: dibattito multi-AI web
  `20261023-r272-scene-prompt-authoring`. Emendamenti: Q15-numerico
  piegato in Q14 (REG-CAM/REG-NUM); Q16 «explicit-negation bulk» declassato
  a **warn** con regola di promozione eye-check; nuovo Q17 hard su marker
  `<!-- AUTHOR:` residuo; regola corpus-invariance con triage (fix check /
  migra prompt / demote solo con accettazione Director); tabella traduzione
  a vincoli di vocabolario + pigmento per-scena (niente stringhe fisse);
  compiler ridotto a scheletro+slot con placeholder e `--force`; negative-
  corpus test; dusk → T-004b dedicato; rischio residuo dichiarato: i gate
  coprono registro/convenzione, il gusto resta all'eye-check Director.
- 2026-10-23 — **implementazione completa**: R9 in guide + PLAN-052 item 10;
  lint Q13–Q17 (4 hard + Q16 warn) con regole corpus-invariance; migrazione
  corpus — 18 prompt legacy migrati a medium-first (`painted in heavy oil
  impasto.`), rovine con ancora SUBJECT e deep teal su r2/r4, dusk §7
  riallineato (medium-first + `18%` rimosso, file caldo T-13 verificato);
  compiler `build-scene-prompt.py` (scheletro+slot, `--force`, placeholder
  `<!-- AUTHOR:`); fixture + 10 test vitest verdi; report calibrazione
  `context/prompt-kernel-calibration-2026-10-23.md`; bundle
  `.mw/runs/plan080-prompt-authoring/bundle.json` — OB-1..5 PASS, verdict
  BLOCKED solo su gate globali (drift trusted-lock/INV estranei, T-13).
