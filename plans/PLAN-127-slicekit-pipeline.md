# PLAN-127 — Pipeline canonica mockup→componente scalabile ("slice-kit")

**Stato:** **rev.2 — BATTEZZATO.** Rev.1 battezzata 2026-11-18 (ruling «battezzo»,
stamp `open` 2026-11-18T19:48Z). Rev.2 richiesta il 2026-11-19 (split standard
generico/profilo RPG — come PLAN-128 rev.2) e **battezzata 2026-11-19** (ruling
Director «battezzo», stamp `note --kind rebaptism` 2026-11-19T21:36:39Z) nella
forma **artifact-r004** del dibattito multi-AI
`20261119-plan127-rev2` (sha256 `9e66ec81981d…31ba3627ef`, decision_memo:
3/4 ACCEPT — chatgpt/gemini/deepseek; grok scope disagreement registrato sul
trust boundary dichiarato). In testa alla rev.2 sono assorbiti, per ruling
Director opzione A, task e obbligazioni del draft PLAN-129 («pipeline
esecutiva con ricevute», R-365) — PLAN-129 non esiste più come piano separato.
Il testo della rev.1 è conservato verbatim in
`mind-weaver/.mw/runs/20261119-plan127-split/plan-127-rev1-battezzato.md`
(sha256 `b3d1ba09…ba884`).

## 1. Problema (RPG)

~30 componenti `HudReal*` + pannelli HUD sono **cornice raster cotta + isole DOM in zone assolute** (`frame.webp` + `*Geometry.ts` + lock `aspectRatio` + testo in `cqw`, ~133 asset in `public/assets/ui/hud-real/`). Il difetto ha DUE dimensioni indipendenti (geometria cornice + layout contenuto): fixare solo la cornice produce un'immagine ridimensionabile intorno a un'interfaccia non ridimensionabile. La definizione completa di «scalabile» (cornice / contenuto / superficie) è in `SLICEKIT.md` §1.

## 2. Cosa cambia rispetto alla rev.1

| rev.1 | rev.2 | Perché |
|---|---|---|
| Metodo slice-kit nel corpo del piano (Passi 1–7, spec `specVersion` 2, primitivo, probe V1/V2/V3, classificazione, record di conversione) | Metodo estratto nello standard **`mind-weaver/docs/SLICEKIT.md`** (consumato in RPG via `context/shared/SLICEKIT.md`) | Il metodo serve anche a Mind Weaver e a progetti futuri: un progetto lo usa scrivendo solo il suo profilo |
| Scelte RPG sparse in §2/§3 (floor testo, cornice fuori + ~1px overlap, banda incisa, minimo asset, matrice Chromium+WKWebView, percorsi, pilota) | Consolidate nel profilo **`context/mockup-pipeline-profile.md`** `[P6][P8][P9][P11]` | Stessa divisione nucleo/profilo di PLAN-128 rev.2 |
| Domande aperte risolte Q1–Q7 nel piano | Risposte assorbite nello standard (Q7 «arte non-cornice» → «Fuori scope pipeline») | Le risposte sono metodo, non storia del piano |
| Contratto, problema, ordine di lavoro, provenance | Restano qui — sono RPG | Il piano dice cosa costruire e in che ordine |

**Relazione con lo standard:** questo piano applica `SLICEKIT.md`. Se servire
RPG richiede un cambio dello standard, lo standard è sbagliato: correggere
`SLICEKIT.md` (e registrare l'evidenza — regola anti-DSL «≥2 superfici»), non
deviare nel piano.

## 3. Decisioni RPG congelate (non ridiscusse)

Cornici golden `mockup-r357-cornici-aperta.png`; scala uniforme degli ornamenti; cassetto golden ricostruito DOM+pezzi; "frame vuoto rigenerato > patching raster" (learn FROZEN 2026-11-16); Director 2026-08-14 "minimo asset, più CSS/React possibile"; invarianti di progetto (niente viola — T2-testabile, non T3, vedi profilo [P5]; niente testo cotto; i18n; config-first; skin system; visual-fork gate; T-04; solo headless); un elemento alla volta per i mockup; cornice FUORI dal rect del pannello con ~1px di overlap sul bordo interno (ruling cornici → profilo [P6]); banda incisa di scorrimento su ogni pannello lista (→ [P6]). Il formato `specVersion` 2 è ratificato su evidenza night-shift 2026-11-19 (frame5+cassetto, gate ≥2 superfici) e vive in `SLICEKIT.md` Passo 3.

## 4. Ordine di lavoro

1. **Slicer unificato** Python PIL + schema validato secondo `SLICEKIT.md` Passo 3; estratte solo le operazioni richieste dalle superfici pilota; spec in `scripts/hud-real/specs/`, manifest generato `src/generated/slicekit/<spec>Frame.ts` (→ [P8]).
2. **Primitivo condiviso** (estende `PanelFrameOrnaments`) secondo `SLICEKIT.md` Passo 4 + probe V1/V2/V3 secondo Passo 5, matrice in [P9].
3. **Registro di classificazione** `hud-real/*` per la procedura del Passo 6 (OB-5).
4. **N=3 conversioni impegnate** — banda di scorrimento → Roster → Stash ([P11]). **Roster è la prova di scroll lungo che soddisfa OB-8** — fissarlo come tale così OB-8 non viene reinterpretato come "prima che Roster ship" (deadlock). Oltre N=3, touch-driven.
5. **Ricevute, audit e tripwire in-flight (R-365, r003):** ogni passo scrive la sua ricevuta nel record della superficie (`test-results/slicekit/<surface>.json` — schema in `SLICEKIT.md` Passo 7bis, mirror [P8]). **Anti-falsificazione + anti-staleness (r004, chatgpt):** la ricevuta è scritta SOLO dal tool che esegue il controllo e porta evidenza (exit code, `inputSha` del golden, `specHash`, `toolVersion`, file+sha); **l'audit invalida una ricevuta il cui hash registrato ≠ input corrente **o la cui `toolVersion` ≠ versione corrente** — golden, spec o logica del tool cambiati rendono la ricevuta stale = mancante. Campi attestati dall'agente sono marcati `declared:` e non bastano — servono a fermare gli skip, non il sabotaggio (modifica manuale del JSON = attacco, boundary dichiarato). **Tripwire in-flight (r003/r004):** `patch_attempts` vive in un **journal append-only** `test-results/slicekit/<surface>.journal.jsonl` scritto dai tool (counter = conteggio entry, non un campo azzerabile — r004, gemini); **il tool che emetterebbe la patch successiva rifiuta a ≥3 senza ricevuta `regenerated`**. Residuo dichiarato (deepseek): ogni path di patch che bypassa i tool emittenti (edit manuale del manifest, copia di asset approvati) non incrementa il counter — il tripwire copre le patch emesse dai tool; il bypass manuale è il boundary già dichiarato. **Audit = transition gate (r003, chatgpt):** `npm run slice:audit -- <surface>` deve essere verde dopo OGNI passo prima del successivo (la skill `mw-slice-run` lo impone a ogni passo — gate sequenziale locale); verifica anche `matrix_coverage` (lista viewport×DPR registrata dalla probe vs minimo del profilo [P9]) — la ricevuta certifica l'invocazione E l'adeguatezza minima. **T-31 dichiarato human-only (r003):** lo stop per ambiguità non è meccanicamente forzabile — resta regola di condotta, il piano non finge enforcement.
6. **Enforcement:** la skill painter rende il caso D il percorso obbligatorio per le superfici incorniciate; `closure:lint` blocca la chiusura senza spec + manifest + evidenza probe + record di conversione e greppa `WHY-NOT-SPEC` su `plugins/*.py` (`SLICEKIT.md` §3). **Wiring scoped (r002):** `slice:audit` entra in `closure:lint` solo quando la chiusura tocca superfici slice-kit — lo scope è riconosciuto per **path pattern meccanico** (`scripts/hud-real/specs/`, `test-results/slicekit/`, `src/generated/slicekit/`, primitivo `PanelFrameOrnaments`), non dal registro di classificazione umano (che resta parallelo — r003, deepseek: niente evasione per superficie non classificata). Stesso pattern scope-aware dei check pre-commit esistenti.
7. **Review di batch** dopo N=3: ricalibrazione soglie del validatore dal record (`SLICEKIT.md` §3).

## 5. Contratto di chiusura (obbligazioni verificabili)

| ID | Obbligazione | Tipo | Bloccante |
|---|---|---|---|
| OB-1 | Slicer unificato + schema validato implementato; estratte solo le operazioni richieste dalle superfici pilota; riprocessate ≥2 superfici esistenti dai loro golden; output confrontato con gli asset approvati (deterministico + visivo); differenze spiegate+approvate | `state` + `human-eye` | sì |
| OB-2 | `<surface>Frame.ts` generato consumato dal primitivo; zero geometria mantenuta a mano per gli slice-kit | `state` | sì |
| OB-3 | Probe V1+V2+V3 verde sul pilota — matrice completa (4 viewport × DPR 1–2 × normale+max-content) nel runtime WebView supportato; matrice ridotta mantenuta per superficie convertita dopo | `state` (probe) | sì |
| OB-4 | `MOCKUP-TO-ASSET-GUIDE.md` + `MOCKUP-TO-PRODUCTION-PIPELINE.md` aggiornati: caso D canonico, A/B legacy; painter li referenzia | `docs` | sì |
| OB-5 | Registro di classificazione: ogni superficie `hud-real/*` classificata per la procedura di decisione con rationale + ref golden + stato migrazione | `docs`/`state` | sì |
| OB-6 | Test di regressione permanenti per superficie convertita + test di validazione spec | `state` (test) | sì |
| OB-7 | `closure:lint` + safeguard scopati verdi o BLOCKED dichiarato | `state` (gate) | sì |
| OB-8 | Primitivo condiviso provato su ≥2 superfici ridimensionabili distinte, incl. una con contenuto a scroll lungo, prima della migrazione ampia | `state` + probe | sì |
| OB-9 | Witness T-04 Director su slice-kit + superfici convertite | `human-eye` | sì |
| OB-10 | Stadio slop gate (Passo 1bis) eseguito su ogni golden prima dell'affettatura — controlli meccanici + rubrica VLM advisory, regioni flaggate annotate nel review bundle, esito (pulito / rigenerato / T-04) registrato nel record di conversione | `state` (+ `human-eye` sull'esito T-04) | sì |
| OB-11 | (R-365, r002) Schema ricevute in `SLICEKIT.md` Passo 7bis + profilo [P8]: tabella passo↔campo↔writer + **proprietà anti-falsificazione** — ricevuta = evidenza prodotta dal tool (exit code, sha input, specHash), mai attestazione; campi agente marcati `declared:`; `npm run slice:gate -- <spec> --record <record>` scrive `sliceability_1ter` con exit code + hash input (evidenza su `panel-frame6.json`, ri-run non distruttivo) | `docs` + `state` | sì |
| OB-12 | (R-365, r003) `npm run slice:audit -- <surface>`: exit 1 su passi mancanti, ricevute `declared:` senza evidenza, `patch_attempts` ≥3 senza `regenerated`, o `matrix_coverage` sotto il minimo di profilo; **transition gate**: la skill impone audit verde dopo ogni passo; **cablato in `closure:lint` scoped** per path pattern | `state` | sì |
| OB-12b | (r004) **Tripwire in-flight**: i tool di montaggio/cattura appendono a `<surface>.journal.jsonl` e **rifiutano la patch successiva** a ≥3 entry senza ricevuta `regenerated` — evidenza: patch simulata su fixture bloccata meccanicamente | `state` | sì |
| OB-15 | (r004, chatgpt+deepseek) **Test di accettazione avversariale**: scenario dove un flusso salta deliberatamente 3 passi + ignora la skill → chiusura DEVE risultare bloccata con elenco esatto delle evidenze mancanti; il test usa i **tool reali** (slicer, gate, audit — non stub) e, tra i casi, ricevute stale (golden modificato post-hoc) **e journal-tamper** (entry che falsifica una ricevuta `regenerated`). Se passa verde, l'enforcement non funziona | `state` | sì |
| OB-13 | (R-365) Skill esecutiva `.devin/skills/mw-slice-run/SKILL.md`: workflow dei Passi 1→7 dove ogni passo dichiara comando + ricevuta attesa + condizione STOP (warning gate → decidere a monte; riferimento ambiguo → 2 opzioni e stop, T-31; 3 patch → rigenerare, T-32; mai metriche aggregate come prova, T-30); referenziata dal profilo | `docs` | sì |
| OB-14 | (R-365, r002) Test di regressione permanente (R-247): fixture record (1 completo + 1 con passi mancanti + 1 con ricevute `declared:` forgiate → audit deve bocciarlo) che fallirebbe senza `slice:audit`; audit sul record reale del pilota allegato al run — mostra quali passi mancavano | `state` + `human-eye` | sì |

## 6. Provenance

- **Run dibattito rev.1:** `mind-weaver/.mw/runs/20261118-hudreal-slicekit-plan/` — status **converged**, 3 round (r001 → r002 → r003/r003a). Elettorato: chatgpt, gemini, grok, deepseek (claude escluso — quota provider 5h esaurita mid-run, reseed fallito, mai votato). Voti: **4/4 ACCEPT** (grok, gemini, deepseek su r003; chatgpt su r003a dopo che la sua obiezione bloccante — il clamp+clip silenzioso del fallback r002 — è stata applicata verbatim).
- **Artefatto votato:** `artifact-r003.md`, sha256 journal `7c38bc590a41688f5079367576e616d3d960df98715c60515367837e489b5fd9`. **Nota:** emendamenti post-voto hanno aggiunto la sezione tooling/feedback (§5 rev.1) — l'hash del journal si riferisce alla revisione votata.
- **Report dibattito:** `mind-weaver/.mw/runs/20261118-hudreal-slicekit-plan/report.md`.
- **rev.2:** split standard/profilo in sessione Devin del 2026-11-19, su richiesta del Director (R-362). La rev.2 **non** è passata da un dibattito multi-AI: il metodo è spostato verbatim in `SLICEKIT.md`, non rinegoziato.
- **Conversazioni (da `state.json` del run):**
  - chatgpt: https://chatgpt.com/c/6afdd458-31f0-83eb-8e4e-f4b2ee331ef5
  - claude (nessun contributo — quota): https://claude.ai/chat/b0b5d267-1171-4f03-9a11-d18600ee77cc
  - deepseek: https://chat.deepseek.com/a/chat/s/d5bc4386-c434-428b-abe9-a8c84c0b5765
  - gemini: https://gemini.google.com/app/6f110d1487124c8a
  - grok: https://grok.com/c/bd47c310-44ee-4444-b9c7-9245390450ab?rid=69df60dc-46f7-4f3c-916c-cd773eecf525
- **Emendamento da ricerca su V3:** lo split runtime del Passo 5 (WebView embedded senza CDP/WebDriver → matrice completa in browser headless + UNA lane nel runtime reale) viene dai finding del subagent di ricerca incorporati in r003 — marcata "research-corrected" nell'artefatto; ora generalizzato in `SLICEKIT.md` Passo 5 e profilo [P9].
- **Nota orchestrator (dal report):** "converged" certifica struttura del journal + accettazione unanime, non verità. L'artefatto assume la convenzione del ruling cornici "frame fuori, ~1px overlap"; se il Director la riapre, il profilo [P6] cambia.
