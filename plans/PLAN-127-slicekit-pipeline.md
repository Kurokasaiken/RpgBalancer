# PLAN-127 — Pipeline canonica mockup→componente scalabile ("slice-kit")

**Stato:** **rev.2 — DA RIBATTEZZARE.** La rev.1 era stata battezzata il 2026-11-18
(ruling Director «battezzo», stamp `open` in `context/plan-timing.jsonl`
2026-11-18T19:48Z). Il Director ha poi chiesto, il 2026-11-19, di dividerla in
standard generico + parti specifiche RPG — lo stesso split di PLAN-128 rev.2.
Le regole di formato vogliono una spec immutabile dopo il battesimo, quindi
questa rev.2 è valida solo dopo un nuovo battesimo del Director. Il testo
della rev.1 è conservato verbatim in
`mind-weaver/.mw/runs/20261119-plan127-split/plan-127-rev1-battezzato.md`
(sha256 `b3d1ba09…ba884`). **Aggiornamento rev.2 (2026-11-19, R-365):**
assorbiti i task e le obbligazioni del draft PLAN-129 («pipeline esecutiva
con ricevute») — stessa rev.2, stesso ribattesimo; il draft è eliminato.
Motivazione Director: un piano separato sullo stesso tema è rumore.

**Parent:** R-361 (`RICHIESTE.md`, verbatim Director 2026-11-18: *"per adesso abbiamo un problema sempre + fastidioso. abbiamo dei componenti mockati. Devono diventare componenti corretti del progetto. Noi possiamo sia modificare le cose qua, che farle ricreare da gemini. Xò nn credo che i componenti che stiamo usando adesso siano utilizzabili scalando, quello che si chiama 9 slice o qualcosa del genere. Dobbiamo avere una pipeline o qualocsa del genere finale. … Questo processo è molto importante. anche soluzioni tipo chiedere d rigenerare senza le scritte va bene. Fa una ricerca, proponi, ecc"*).

**Documentation Impact:** REQUIRED — `mind-weaver/docs/SLICEKIT.md` (standard Fase A),
`mind-weaver/docs/MOCKUP-TO-COMPONENT.md` (nucleo metodo), `context/mockup-pipeline-profile.md`
(profilo RPG), `context/MOCKUP-TO-PRODUCTION-PIPELINE.md` (caso D canonico),
`.mw/specs/hud-real/MOCKUP-TO-ASSET-GUIDE.md`, `.devin/skills/painter/SKILL.md`
(caso D percorso obbligatorio per superfici incorniciate), `context/recurring-traps.md`,
`context/INDEX.md`, `plans/INDEX.md`.

**Visual-fork:** skipped — piano di tooling/pipeline; ogni conversione di superficie apre il suo fork per-superficie sotto PLAN-047 come già previsto.

---

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
5. **Ricevute e audit di pipeline (R-365):** ogni passo dello standard scrive la sua ricevuta nel record della superficie (`test-results/slicekit/<surface>.json` — schema passo↔campo↔writer in `SLICEKIT.md` Passo 7bis, mirror [P8]); `slice:gate` scrive `sliceability_1ter` via `--record`; `npm run slice:audit -- <surface>` rende i passi saltati visibili e meccanici (exit 1); la skill esecutiva `mw-slice-run` impone il workflow step-by-step con le condizioni STOP di T-30/31/32. Causale dalla retrospettiva pilota (`.mw/runs/plan128-review-2026-11-19/`): il protocollo esisteva ed è stato saltato — un documento non impone, una ricevuta sì.
6. **Enforcement:** la skill painter rende il caso D il percorso obbligatorio per le superfici incorniciate; `closure:lint` blocca la chiusura senza spec + manifest + evidenza probe + record di conversione e greppa `WHY-NOT-SPEC` su `plugins/*.py` (`SLICEKIT.md` §3). **Decisione aperta (R-365):** wiring di `slice:audit`/`slice:gate` dentro `closure:lint` — il gate trusted merita un dibattito a parte.
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
| OB-11 | (R-365) Schema ricevute documentato in `SLICEKIT.md` Passo 7bis + profilo [P8]: tabella passo↔campo↔writer, nessun campo duplicato rispetto al record esistente; `npm run slice:gate -- <spec> --record <record>` scrive `sliceability_1ter` (evidenza su `panel-frame6.json`, ri-run non distruttivo) | `docs` + `state` | sì |
| OB-12 | (R-365) `npm run slice:audit -- <surface>`: legge il record, stampa ✓/✗ per passo richiesto con motivazione del ✗; exit 1 su record incompleto / 0 su completo; non invocato da altri script (wiring in `closure:lint` = decisione aperta) | `state` | sì |
| OB-13 | (R-365) Skill esecutiva `.devin/skills/mw-slice-run/SKILL.md`: workflow dei Passi 1→7 dove ogni passo dichiara comando + ricevuta attesa + condizione STOP (warning gate → decidere a monte; riferimento ambiguo → 2 opzioni e stop, T-31; 3 patch → rigenerare, T-32; mai metriche aggregate come prova, T-30); referenziata dal profilo | `docs` | sì |
| OB-14 | (R-365) Test di regressione permanente (R-247): fixture record (1 completo + 1 con passi mancanti) coperto da `npm run test` o script dedicato che fallirebbe senza `slice:audit`; audit sul record reale del pilota allegato al run — mostra quali passi mancavano | `state` + `human-eye` | sì |

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
