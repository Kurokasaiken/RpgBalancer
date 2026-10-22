# PLAN-050: Cinematic showcase — grammatica ingresso×posa + juice layer (v34)

**Status:** `baptized (2026-10-18)` — Director «procedi»; ledger aperto via `plan:stamp`
**Desiderata:** v34 FROZEN (2026-10-17) · **Richiesta:** R-213 (estensione)
**Relazioni:** figlio di PLAN-046 (spike ratificato, engine live); estende il
vocabolario camera e il manifest senza toccare il renderer core.

**Dibattito:** `mw-ask` ×3 hat `ui` su `q-plan-showcase.md` —
**codex ACCEPT** (88 righe, spec implementation-level completa);
**groq/gemini 429 ripetuti** (provider_dead su 4 tentativi — registrato, non
bloccante: la grammatica sottostante era già ratificata a dibattito 3-way in
`semantic-mapping-synthesis.md`).

**Autorizzazioni Director registrate verbatim (scope):**
- *"lo shake (e qualsiasi altra cosa da videogioco testuale e valore aggiunto/juice)
  fanno parte di questo plan"* → shake + juice layer entro REQ:v34-camera.
- *"quasi tutti i cambi di scena hanno cambiamenti sostanziali […] se usiamo
  spesso hold allora deve diventare quella più curata"* → hold = tier authored,
  non stato nullo.
- *"vorrei che ci fosse un esempio dei tipi di entrata differenti e anche di
  come possiamo fare l'hold […] con le bande nere […] versioni con lo shake
  […] per tutte le immagini che abbiamo già per la quest Sterminio Goblin"*.

## Invarianti (v34 + ratificati, non eludibili)

- Shot unit = **ingresso × posa** (entrance personality on art-change → hold
  authored durante la lettura). Entrance MAI su beat stesso-arte.
- Classi cue chiuse (~8 verbi); un verbo primario + ≤1 accento per beat.
- Stats modulano SOLO parametri numerici, mai verbi. Zero camera su hover.
- Letterbox riservata a harm/death/confrontation (mai juice generico).
- Shake: additivo, rotational > translational, depth-weighted (FG~1.2×/BG~0.3×),
  decay envelope, mai durante lettura/scelta, reduced-motion off.
- Config-first (`questTheatreFx`/`sceneManifest`, Zod); reduced-motion ⇒
  nessun effetto; budget WebView misurato (non asserito); verifiche headless.
- **Un solo path di rendering**: lab e /game condividono DepthScene/camera —
  niente implementazioni "solo lab" (regola codex, anti-divergenza).

## Correzione d'implementazione dopo feedback Director (2026-10-18)

Il Director ha segnalato che parallax non si legge, `rack-land` appare
pixelato, il palo di `agguato-foresta` si deforma e lo shake non è percepibile.
Il lab aveva anche un bug di clock: la query frozen `t=<ms>` veniva sottratta
da uno `shotEpoch` assoluto, inchiodando la capture all'inizio (zoom/blur
massimi); il cambio scena non riavviava l'epoch live. Separatamente, `camVec`
restava costante durante la camera (warp statico anziché parallasse dinamico),
il GPU blur campionava un mip grossolano e i limiti trauma erano troppo bassi;
l'amp `0.03` aggravava lo stretch sulla discontinuità di profondità del palo.

La correzione autorizzata dal feedback esplicito (non è un nuovo fork
estetico: ripristina REQ:v34-depth e i cue di PLAN-050) è:
- rampare il vettore parallax con il progresso eased dello shot;
- tornare ad amp `0.012`, mantenendo il movimento depth-weighted e riducendo
  l'artefatto di disocclusione sul palo;
- usare blur spaziale nel fragment shader, non ingrandire un mip selezionato;
- allineare clock/epoch in live, frozen capture e loop, riavviando l'ingresso
  quando cambia la scena;
- alzare trauma moderatamente e ricertificare l'edge safety;
- non alterare source art/depth bake senza nuova evidenza live.

**T-010 — verificato 2026-10-18:** `.mw/runs/r213-cinematic-effects-regression/bundle.json`
**PASS 5/5**; signoff Director OB-4 legato agli hash dei sette frame.
L'ok chiude il witness per la regressione R-213, non la review completa
OB-8 delle otto scene del showcase, che resta pending.

**Visual-fork skip:** correzione della semantica tecnica già congelata
(REQ:v34-depth: deformazione in-place via depth map), nessuna scelta tra
rappresentazioni grafiche alternative. Baseline: v34 FROZEN + PLAN-050 §3/§4.

## Correzione T-013 dopo feedback Director (2026-10-18)

Il Director ha respinto il precedente overlay come *visibile ma non
riconoscibile come nebbia* e l'authoring generalizzato. R-227 registra la
richiesta verbatim. L'iterazione precedente e il suo bundle `.mw/runs/plan050-t013-atmosphere-kit/`
restano evidenza storica del kit sprite, ma **non** valgono come acceptance
percettiva né come chiusura corrente di OB-13.

Revisione in corso: `kind: 'fog' | 'sprite'`; il fog è composto da veli
radiali indipendenti, con moto/fase diversi, variazione di scala e bordi
irregolari tramite noise, opacità normale che attenua l'immagine (non sola
schiarita `screen`). Authoring atmosferico ammesso per ora solo su
`agguato-foresta`. `fuga-goblin` è vuota; `carro-nascosto`,
`accampamento-raider`, `sentiero-tracce`, `saccheggio`, `assalto-goblin` e
`ritorno` restano senza kit finché una review non giustifica un effetto.
Il mapping non trasforma l'effetto visibile in approvazione: l'eye-check
Director resta necessario.

**R-228 — rigetto della prova statica:** il Director ha giudicato la cattura
una striscia bianca, non nebbia, e ha precisato che la presenza/pixel
differente non dimostra il significato voluto. La cattura fissa non prova
un'animazione e non è acceptance per la richiesta corrente. La proposta
implementata fin qui è respinta sul piano percettivo: niente altro tuning
di opacità o di visibilità va presentato come soluzione.

## 1. Asset inventory (Sterminio Goblin — 8 art uniche)

| artId | File | Depth | Scene d'uso (nodeId gob-*) |
|---|---|---|---|
| sentiero-tracce | scene-library/sentiero-tracce.jpg | **da bakare** | esplora, tracce-per, tracce-perfor |
| carro-nascosto | scene-library/carro-nascosto.jpg | **da bakare** ⚠ stale v3 (carro) | bottino |
| accampamento-raider | scene-library/accampamento-raider.jpg | ✓ | accampamento, stealth, assalto |
| assalto-goblin | scene-library/assalto-goblin.jpg | **da bakare** | combattimento |
| fuga-goblin | scene-library/fuga-goblin.jpg | **da bakare** | incalzare, incalza-check |
| saccheggio | scene-library/saccheggio.jpg | **da bakare** | esplora-extra, cerca |
| agguato-foresta | scene-library/agguato-foresta.jpg | ✓ | agguato, agguato-scelta, ultimo-scontro |
| ritorno | quest-goblin/ritorno.jpg | **da bakare** | ritorno |

(`gob-fine` usa village `contain` → DOM path, fuori showcase depth.)

## 2. Depth bake ×6

- `scripts/bake-depth.py` (già pronto): half-res WebP ≤200KB per asset sopra.
- **Review in movimento**, non su still grayscale (criteri codex): rifiuta se
  inversione depth (FG arretra), bleeding/halo soggetto sui pan, banding su
  cielo/fog/pareti piatte, allucinazione semantica (fumo/luce dipinta/ombre =
  geometria), focusAnchor con depth peggiore dell'incidentale.
- Fix: paintover mask (flatten fog/cielo, feather bordi soggetto, clamp
  distante rumoroso, boost focale). Una mappa bella NON è accettazione;
  moto stabile a sweep+shake massimi sì.

## 3. Vocabolario camera — ingressi × pose

Nuovi preset in `questTheatreFx.camera.shots` (tutti certificati edge-safety):

| Preset | Personalità | Bozza parametri |
|---|---|---|
| `enter-sweep` | arrival — laterale ampio → quadro | panFrom [±0.04,0], zoomFrom 1.14, blurFrom 3, ~3s |
| `enter-creep` | discovery — converge su focusAnchor | panFrom verso anchor, zoomFrom 1.06→1.0, blurFrom 2, ~3.5s |
| `enter-settle-cover` | observation — atterra basso/laterale | panTo ≠0 (off-center rest), zoomFrom 1.10, ~3s |
| `enter-direct` | confrontation — frontale, più rapido | zoomFrom 1.12→1.0 pan centrale, ~1.6s |
| `pose-watch` | hold nascosto: rest off-center + micro-drift | zoom 1.02, pan residuo, ampMul 0.3, drift ≤0.5px/s |
| `pose-rest` | hold arioso: centrato, ambient max | zoom 1.0, drift lento, ampMul 0.5 |
| `pose-tense` | hold stretto: leggero zoom-in fermo | zoom 1.04 locked, ampMul 0.4 |

`enter-settle`/`rack-land` esistenti restano (varianti generiche).

Manifest per scena guadagna: `entrance?: shotId`, `pose?: shotId`,
`focusAnchor?: [x,y]` (img-normalized — target di enter-creep e delle
modulazioni perc), `ambient` (già esiste — authoring per le 6 scene nuove).

## 4. Shake — spec meccanismo (codex, adattato)

- `cameraAt()` resta **pura**. Canale separato `traumaAt(t) → {x,y,roll,strength}`
  (noise band-limited seeded + decay esponenziale). Composizione **dopo**
  cameraAt, prima dell'upload uniform:

  ```
  finalCam = { ...authored,
               pan: authored.pan + trauma.xy,
               roll: trauma.roll,
               camVec: authored.camVec + trauma.xy·parallaxDrive }
  ```

- Shader: stesso displacement pass. `depthWeight = mix(0.3, 1.2, smoothstep
  (far, near, depth))`; offset UV `uTraumaXY·depthWeight`; micro-rotazione
  attorno al centro UV con lo stesso fattore → FG≈1.2×, BG≈0.3× senza
  secondo pass. Translation sotto il bound overscan esistente; **rotazione
  dominante** (su arte piatta la traslazione piatta appiattisce).
- Edge-safety: trauma max incluso nel bound (|pan|+|disp|+|traumaMax|) —
  il budget trauma è un parametro Zod certificato come gli altri.
- DOM fallback: UN `translate3d`+`rotate` whole-image, ampiezza −40%, clip
  nel wrapper overscan, marcato `degraded`. Reduced-motion → trauma zero.
- API: `injectTrauma(strength)` su DepthScene; trauma decresce da solo;
  nessun preset lo contiene (additivo, cancellabile, deterministico in test).

## 5. Letterbox nel lab + cerimonia

- Il primitive `bars` di `cinemaFx.tsx` viene esposto a DepthScene come prop
  (`bars: 'none'|'hold'|'entranceHold'`) — NON riimplementato.
- **Per-beat, non per-scena** (codex): la stessa scena può entrare ariosa e
  poi confrontarsi. `entranceHold`: bande scendono durante l'ingresso
  (complete a ~65-75%), **persistono nella posa** solo su confront/harm/
  revelation; retraggono al prossimo cut o prima delle scelte se riducono
  l'area leggibile.
- Su /game resta un cut tag, non booleano sparso in QuestRunWindow.

## 6. Juice catalog — ship vs defer (verdetto codex, ratificato)

**Ship in questo milestone** (massimo valore percepito / minimo rischio):
1. **Choice commit lock + press UI**: ~200ms commit state (button depress,
   ink response), poi il cue del beat. L'agenzia diventa tangibile senza
   rubare tempo di lettura.
2. **Whoosh pre-move + settle hit ~85%**: mappa cue esistenti di
   `questTheatreAudio` su entrata/atterraggio — una coppia sobria rende
   l'intento camera leggibile.
3. **Verdict text slam**: un singolo evento scala/opacità/luce sincronizzato
   al verdict stinger esistente — payoff sul cambio di stato reale.
4. **Label ancorati all'artwork**: etichette luogo/beat attaccate a
   `focusAnchor` (cavalcano il parallasse via mappa img→view già esistente),
   fallback collision-safe.

**Defer / solo authored stretto**: dip-to-black (rischia look da loading),
screen-light pulses su FX (chrome mobile-game, conflitto con arte dipinta),
micro-vignette responses (rumore invisibile che sporca il testo).

## 7. Lab UI (estende TheaterLabPage)

- Picker **ingresso** (4 personalità + settle/rack esistenti), picker
  **posa** (watch/rest/tense), toggle **bande** (none/hold/entranceHold),
  pulsante **shake!** (injectTrauma on-demand sullo stesso quadro),
  mantenendo time-scaler ×3 e chip FX per-effetto.
- Picker scena: le 8 art goblin (depth-enabled), escluse quelle senza
  depth dal picker primario.

## 8. Tasks (ordine — critical path prima)

| # | Task | Verify |
|---|---|---|
| T-001 | Manifest esteso (`entrance`, `pose`, `focusAnchor`) + 6 bake + ambient anchors per scena | Zod+lint manifest; review in movimento per bake |
| T-002 | Preset camera §3 in `questTheatreFx` + edge-safety | vitest Tier1/Tier2 su tutti i nuovi shot, entrambi gli aspect |
| T-003 | Shake: `traumaAt` + composizione post-cameraAt + uniform shader + DOM degraded | test decay deterministico, zero a expiry, FG/BG weight, reduced-motion |
| T-004 | Letterbox prop in DepthScene + variante entranceHold | capture: bande complete a ~70% ingresso |
| T-005 | Lab UI §7 | headless: 0 navigazioni sui click, stato aggiornato |
| T-006 | Juice ship-now §6 su /game: commit lock, whoosh/settle audio, verdict slam, label ancorati | e2e: choice commit → cue → verdict senza moto in lettura |
| T-007 | Wiring /game: manifest→cue (entrance su art-change reale, posa dopo) | unit resolveCue + e2e quest goblin |
| T-008 | Evidence: capture strip tutte le 8 scene × ingresso/posa × bande × shake × reduced-motion → `artifacts/cine-showcase/` | eye-check Director (gate) |
| T-009 | Budget: p95 frame su build di produzione misurato e registrato nel bundle | nessun long frame aggiunto in hold statico; 1 pass shader |
| T-010 | Correggere clock/epoch del lab, parallax statico, blur GPU a mip grossolano e shake impercettibile; rivedere il palo con l'amp moderato | unit+edge-safety, shader test, preview live; eye-check Director separato |
| T-011 | Chiudere le invarianti runtime ereditate da PLAN-046: derivare/verificare `viewAspectRange` contro il layout reale; asserire mesh/draw-call, texture e stop del ticker quando non ci sono effetti temporali attivi | test legati alle sorgenti layout + assert strutturali del renderer; chiarire e documentare come `idleDrift` interagisce con "ticker idle-stopped". **Verificato 2026-10-18** — `cameraHasTemporalWork`, ticker stop/re-arm in DepthScene (+rAF DOM), `hasFx` in AmbientLayer, `runtimeInvariants.test.tsx` 13 test; bundle `.mw/runs/plan050-t011-runtime-invariants/` **PASS 5/5** |
| T-012 | Profiling manuale su un vero target WKWebView, non SwiftShader: registrare device/OS/build, p50/p95/p99 e overhead; produrre `docs/cinematic/profiling-slice1.md` | evidenza nel bundle; confrontare il target proposto ≤3ms/60fps e riportare esplicitamente ogni superamento, senza inferire PASS |
| T-013 | Kit atmosfera distinto da `AmbientLayer`: registry Zod, transform camera-coherent, stesso path lab/game e authoring selettivo. Correzione R-227/R-228: semanticamente nebbia, non nube o striscia; nessun overlay senza ragione narrativa | **Eye-check Director PASS (2026-10-19):** fog depth-pooled su `sentiero-tracce` approvato («va bene», moto «approvato»); transizioni approvate dopo focus-pull `blurSettleFrac` («approvo»). Kit: texture fBm tileable (`bake-fog-noise.py`) dentro pool derivato dalla depth map (`bake-fog-mask.py`), 4 veli a direzioni/speed diverse + breath, authoring solo `sentiero-tracce`. Suite 234/234, lint, build:check, contractsCheck, closure:lint PASS; catture + live frames in `.mw/runs/plan050-t013-fog-revision-3/`. Bundle: 5/6 obbligazioni PASS — BLOCKED solo su drift governance di sessione parallela (T-13: contractsCheck post-approval, playtest scripts non mappati, trusted-lock pendente Director seal) |

Parallelizzabili dopo T-001: bake/review per scena, audio mapping, lab UI,
capture harness. /game integration (T-006/007) solo dopo API camera+shake stabili.

## 9. Contratto (obbligazioni verificabili)

- **OB-1** 8/8 art goblin con manifest valido + depth asset (6 bake nuovi,
  half-res ≤200KB, provenance registrata).
- **OB-2** Preset §3 in config: vitest edge-safety (Tier1+Tier2+DOM bound)
  verdi su entrambi gli aspect; golden cameraEval per ogni nuovo shot.
- **OB-3** Shake: test decay deterministico, trauma zero a expiry, assert
  FG/BG weight, DOM degraded −40%, reduced-motion → zero.
- **OB-4** Bars `entranceHold` visibili in capture (complete ≈70% ingresso);
  per-beat non per-scena.
- **OB-5** Lab: picker ingresso/posa/bande/shake! funzionanti, 0 navigazioni
  ai click, solo scene depth-enabled nel picker.
- **OB-6** Juice su /game: commit lock ~200ms, audio whoosh/settle agganciati
  a cue esistenti (nessun nuovo engine), verdict slam sincrono allo stinger,
  label ancorati a focusAnchor.
- **OB-7** 59 test esistenti verdi + nuovi; `build:check`, `lint`, `closure:lint`.
- **OB-8** Capture strip `artifacts/cine-showcase/` per tutte le 8 scene
  (ingresso×posa×bande×shake, normal+reduced-motion), più la prova spike
  PLAN-046 `artifacts/cine-spike/` e il regression set R-213 — **eye-check
  Director esplicito su questi artefatti e sul preview live, pending/approved
  mai inferito dai pixel o dal signoff provvisorio di un agente** (T-04).
- **OB-9** Perf misurata su production build: p95 frame budget registrato nel
  bundle; hold statico = zero long frame aggiunti; 1 displacement pass.
- **OB-10** Clock frozen/loop e epoch coerenti; la strip di showcase distingue
  inizio, metà e atterraggio al tempo effettivo (tempo lab ×3); T-010 corretto
  e visual review Director ancora separata.
- **OB-11** `viewAspectRange` è verificato contro le costanti/limiti effettivi
  del Theater; il renderer dimostra ≤1 mesh/draw-call, no filter pass e ≤2
  texture; il ticker si ferma quando shot/ambient/trauma non hanno lavoro
  temporale. L'eventuale conflitto tra idleDrift continuo e ticker fermo è
  dichiarato e risolto nel piano prima del PASS.

  **Risoluzione registrata (T-011, 2026-10-18):** `idleDrift` è uno shot
  *finito* (16s, `cameraAt` clampa `t` a `durMs`): atterra e resta — non è
  moto perpetuo, quindi "ticker idle-stopped" non è in conflitto. Il
  predicato `cameraHasTemporalWork(shot, elapsed, trauma)` decide lo stop:
  il ticker Pixi renderizza il frame atterrato e poi si parcheggia
  (`settledRef` → `ticker.stop()`); si ri-arma solo quando cambia un prop
  che muove la camera (shot/epoch/trauma/aspect/amp) o su resize host
  (ResizeObserver). La stessa regola vale per il rAF del fallback DOM.
  `AmbientLayer` è un loop 2D separato: i suoi particellari SONO lavoro
  temporale continuo by design, ma con lista `effects` vuota il suo rAF
  non parte nemmeno. Assert meccanici in
  `tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx`:
  range legato a `questWindow.theaterAspect`/`expandedTheaterAspect`
  (2.4/2.1, margine ≤0.1), 1 Mesh su stage, solo `uScene`+`uDepth` nello
  shader, zero filter, stop/re-arm del ticker su settle/epoch/trauma.
- **OB-12** Profilo WKWebView reale documentato in
  `docs/cinematic/profiling-slice1.md` (device, OS, build, campione e
  p50/p95/p99), con confronto esplicito al budget proposto ≤3ms/60fps.
- **OB-13** Overlay atmosferico asset-backed configurato dal manifest,
  trasformato con la camera sul path condiviso lab/game; mapping asset
  verificato e reduced-motion/fallback non montano overlay animati.

## Aggregazione dell'audit PLAN-046 (2026-10-18)

Il crosswalk non sposta né dichiara completata PLAN-046: riusa le capability
già presenti e porta qui le acceptance residue, perché PLAN-050 estende lo
stesso renderer e la stessa superficie cinematica.

| PLAN-046 slice-1 | Copertura trovata | Chiusura in PLAN-050 |
|---|---|---|
| T-001 schema, manifest, edge-safety e viewAspectRange | `questTheatreFx.ts`, `sceneManifest.ts`, `edgeSafety.test.ts` coprono schema e bound agli endpoint; il range `[2.05, 2.45]` esiste, ma non è emersa un'asserzione che lo leghi alle costanti reali del layout | T-011 verifica la derivazione contro il layout reale |
| T-002 bake depth e byte gate | `scripts/bake-depth.py`; depth asset delle 8 scene e gate ≤200KB in `sceneManifest.test.ts`/PLAN-050 OB-1 | Coperto da T-001/OB-1; non duplicare |
| T-003 clock e camera evaluator | `cameraEval.ts` + test golden/precedence; regressione clock frozen/live corretta da T-010 | Coperto da T-002/T-010; OB-10 verifica il clock |
| T-004 renderer, parity e fallback | `DepthScene.tsx`, shader, `edgeSafety.test.ts`, `questCinematics.spec.ts` coprono parity e fallback (no-depth, no-WebGL, reduced-motion, context-loss) | Coperto da T-002/OB-2, T-010 e OB-7 |
| T-005 Theater integration | `QuestRunWindow.tsx` usa il renderer condiviso; E2E PLAN-046 esercita i path | Coperto; mantenere il path unico lab/game |
| T-006 precedenza camera e cue | `resolveShot` ha test di precedenza; Plan-050 aggiunge bars/cue/juice su /game | Coperto da T-004/T-006/T-007 e OB-4/OB-6 |
| T-007 lab senza quest state | `/theater-lab` e `questCinematics.spec.ts` già presenti | Coperto da T-005/OB-5 |
| T-008 frame strip e prova di deformazione | `r213-quest-cinematics-spike` ha bundle meccanico PASS e `cine-spike/`; lo strip più ampio è in Plan-050 | Riutilizzato in OB-8; eye-check Director resta pending |
| T-009 budget strutturale + profiling WKWebView | byte gate e misura production/SwiftShader esistono; non trovati test espliciti per ticker idle-stop né `docs/cinematic/profiling-slice1.md`; il profilo WKWebView è dichiarato non eseguito nel signoff spike | Residui aggregati in T-011/T-012 |
| §6 AtmosphereLayer asset-backed | `AmbientLayer` esegue FX procedurali, ma `sceneManifest.atmosphere` è riservato e non c'è un kit che carichi/mappi asset atmosferici | Non coperto da PLAN-050 prima dell'audit; aggregato in T-013/OB-13, senza sostituire o duplicare `AmbientLayer` |

Il contratto di authoring per gli anchor delle **nuove** immagini quest è
separato in PLAN-052 (R-222, draft), figlio di PLAN-046 e complementare a
PLAN-050: non duplicarne i task qui. Gli elementi fuori dalla slice 1 —
StageBand parity, demo hero-cutout, crossfade, pointer-parallax, overlay sulle
18 scene e travel-by-node-kind — restano intenzionalmente deferred come in
PLAN-046 §9; T-013 realizza solo il kit asset-backed, non la copertura delle
18 scene. StageBand parity e demo hero-cutout restano slices separate.

**Stato ereditato:** il bundle storico PLAN-046 `PASS 7/7` non chiude da solo
OB-6: il suo `signoff.json` è esplicitamente provvisorio (autore
`devin-agent`), dichiara profiling WKWebView non eseguito e Director eye-check
pending. Non trattare quel PASS meccanico come approvazione percettiva.

## 10. Deferred

- `resolveCinematicCue` semantico completo (dramaticFunction, revisited-art,
  lethal-option) — il plan porta il VOCABOLARIO, il resolver semantico è la
  slice successiva (spec già in `semantic-mapping-synthesis.md`).
- Pipeline auto-ambient (bake-ambient fase 1/2): manifest ambient restano
  authored manuali.
- Dip-to-black, screen pulses, micro-vignette (juice defer §6).
- Hero cutout 2-layer (resta slice separata v34).
- Micro-shake durante pericolo continuo (Perlin ±1px) — solo inject on-demand.

## 11. Open risk

- **Uniformità da template** (rischio eye-check #1, codex): stessa creep+fog+
  bande su ogni scena → authoring per-scena nei manifest è il counter.
- **Rubber painting**: bake cattivi su arte dipinta peggiorano più di
  nessun parallasse → review in movimento obbligatoria (T-001).
- **Letterbox/shake diluiti**: se appaiono su beat ordinari perdono valore —
  i trigger restano i tag semantici, non il lab.
- **Lab/game divergence**: shared DepthScene è non-negoziabile (invariante §).
- Provider partial: debate plan = codex-only (429 groq/gemini) — mitigato dal
  fatto che la grammatica era già ratificata 3-way; se il Director vuole, un
  secondo pass di review sul plan può essere rilanciato a quota ripristinata.
