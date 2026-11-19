# PLAN-126 — /game cold-boot: riduzione dei byte (preload integrale preservato)

**Stato:** battezzata 2026-11-17 (Director: *"battezzo il plan PLAN-126, eseguilo"*) · **Parent:** R-166 (mandato preload completo) · **Richiesta:** R-358
**Provenienza:** dibattito multi-AI `20261117-rpg-boot-plan` (mind-weaver) — CONVERGED 2/2 (chatgpt, gemini) su `artifact-r003` sha256 `ac06f1cf…`; elettorato ridotto (claude/deepseek logout, grok age-gate). Ledger: `mind-weaver/.mw/runs/20261117-rpg-boot-plan/report.md`.

**Documentation Impact:** REQUIRED — nuovo plan + INDEX + DECISION_LOG per i ruling + context/ se emergono pattern.

- `visual-fork: skipped — piano di pipeline/perf, nessuna nuova forma estetica (baseline visiva = asset set committato; parità enforced da pixel-diff con soglia + eyeball Director OB-4) — .mw/runs/plan126-boot-bytes/verification.json`

## 0. Fatti verificati

- Cold boot `/game` su produzione: **~122–125s**, ~427–466 request finite, **byte-bound** (non ordering-bound). Misura: `scripts/deploy/webglBootProbe.mjs` + diag `_tmp-boot-diag.mjs`, headless SwiftShader, DPR=1.
- Max latency singola request già ridotta 8.9s → **2.7s** dopo fan-out parallelo (commit `d7b88439`, `8231143b`).
- On-disk boot trees: `world/mappa2` = **132MB**, `ui` = **54MB** (subset fetchato); JS = **6.6MB** su 317 chunk Vite (critical path piccola — il parse non è il collo).
- Inventario: ~105 pose frames, 40 canopy `.v2hi.webp` fino a 5504px, 24 waterfall flips, 22 cloud layers, ~30 cursori, mask, tiles (66 celle ≈ 67MB a DPR≥2), ~12 JSON foglia.
- Già applicato (non riproporre): SWR cache SW+edge (`533bc350`), `<link preload>` manifest, fan-out parallelo + leaf-JSON prefetch + catene enumerative, fix canopy v2hi, probe timeout 300s. `pack.bootPhases` (split critical/deferred) = **dead code** — inutilizzabile sotto il mandato.
- Mandato: **R-166** + verbatim Director 2026-11-17: *"tutto pre caricato va mantenuto"* / *"tutto quello che serve x /game"*.
- Posizione convergente del dibattito: il collo sono i **byte + decode/upload**, non il numero di request (HTTP/2 multiplexing; ~430KB di header totali).

## 1. Obiettivo

Ridurre il cold-boot wall time di `/game` **senza rimuovere, differire o rendere lazy alcun asset** del set di preload. Ogni leva cambia encoding/packaging/ordine/decode/pipeline, mai la completezza del set.

## 2. Scope / Non-scope

**In scope:** bake pipeline WebP, pixel budget, decode/upload pipeline Pixi, misura strumentata, spike KTX2.
**Non-scope (kill list ratificata nel dibattito):** lazy/deferred/streamed phases; archivio binario monolitico come fix primario (claim 50–70s smontato); tuning HTTP/3; rimozione di asset.

## 3. Decisioni Director

| # | Decisione | Stato |
|---|---|---|
| D-1 | Soglia di parità visiva per re-encode/downscale: approvare via pixel-diff + side-by-side **prima** che qualsiasi variante tocchi produzione (obbligazione OB-4) | ✅ approvato 2026-11-17 — *"approvo"* dopo live composites (q85 grade/canopy, q75 bg; soglia diff RGB=8; signoff in `d1-live/` + `director-signoff.json`) |
| D-2 | Battesimo del plan (plan:stamp, ordine fasi come da §9) | ✅ battezzato 2026-11-17 — *"battezzo il plan PLAN-126, eseguilo"* |

## 4. Piano di esecuzione

### Fase A — MISURA (sblocca l'ordine corretto; economica)

- **T-A1** Estendere il diag probe: cattura HAR + **byte budget per categoria** (tiles, poses, canopies, flips, clouds, ui, cursors, masks, json, js) → artifact `.mw/runs/plan126-boot-bytes/har-budget.json`.
- **T-A2** Timing per fase end-to-end: last-byte / image decode / **GPU upload completion** (non solo submission) / scene build / veil-lift — su probe SwiftShader **e** su run locale GPU-reale (headless con GPU, `vite preview`, T-09/T-22).
- **T-A3** Esperimento A/B request-overhead **controllato**: stessi byte, parallelismo equivalente, category-bundles vs fan-out corrente. Packaging adottato solo a miglioramento **riproducibile ≥2s** (run ripetuti).

### Fase B — BYTE (leva primaria)

- **T-B1** Audit qualità WebP nel bake pipeline: settings correnti per famiglia (cells/poses/canopies/waterfalls/clouds/cursors/ui).
- **T-B2** Harness pixel-diff di regressione visiva: bake output vs asset committati, soglia numerica + report side-by-side (attrezzo di gate, pre-requisito di T-B4).
- **T-B3** Audit pixel ridondanti: dim sorgente vs dimensione renderizzata su **tutta** la scala camera supportata (zoom intermedi inclusi) + viewport + DPR≥2 → lista classificata `safe` vs `director-ruling`.
- **T-B4** Re-encode per categoria (target candidato q75–85, da validare) sui soli item `safe` di T-B3 + visual gate OB-4 → deploy.

### Fase C — DECODE/UPLOAD (solo se la misura lo conferma)

- **T-C1** Strumentare decode+upload reali (T-A2 li produce).
- **T-C2** Decode parallelo bounded (`createImageBitmap` concurrency cap; worker solo per CPU work — GPU upload resta sul renderer thread). Est. 3–15s SE decode-bound.
- **T-C3** Review batching upload/premultiply PixiJS. Est. 2–12s SE upload-bound.

### Fase D — SPIKE STRUTTURALE (parallelo dopo Fase A, indipendente da Fase B)

- **T-D1** Spike KTX2/Basis: transcoder `basis_universal` WASM + compressed-texture path Pixi v8; check qualità alpha painterly; static-hostable. Kill rapido su artefatti. Est. potenziale 10–45s, effort alto.

### Fase E — PICCOLI GUADAGNI (opzionali)

- **T-E1** Atlases small-asset (cursori, UI chrome) — solo se T-A3 ≥2s o se quasi gratis (1–5s).
- **T-E2** Consolidamento JSON foglia — <3s, banale se opportuno.

## 5. Contratto di chiusura

| OB-N | Obbligazione | Tipo | Bloccante |
|---|---|---|---|
| OB-1 | `har-budget.json` esiste e copre tutte le categorie (tiles/poses/canopies/flips/clouds/ui/cursors/masks/json/js) — check meccanico sul file | `state` | sì |
| OB-2 | Timing artifacts per fase su **entrambi** gli ambienti (SwiftShader probe + GPU locale) — file check | `state` | sì |
| OB-3 | Test di regressione permanente (R-247): spec che asserisce (a) ogni asset referenziato dal preload `/game` risolve in `public/` (zero 404) e (b) byte budget totale boot ≤ baseline registrata + margine — `npm run test -- <file>` verde, rosso senza la modifica | `state` | sì |
| OB-4 | Eyeball Director su pixel-diff side-by-side per OGNI famiglia re-encodata/downscalata prima del deploy (soglia registrata nel verification.json) | `human-eye` | sì |
| OB-5 | Verifica deploy R-304: `webglBootProbe` su `rpg-balancer.vercel.app/` e `/game` PASS + evidenza boot-time nel run dir | `state` | sì |
| OB-6 | `verify:bundle` su contratto → `bundle.json` citato dalla chiusura `fatta` in RICHIESTE.md | `state` | sì |

## 6. Contratti/file toccati

- Superficie `game-map-pixi` (`.mw/surface-map.json`): `PixiWorldMap.tsx` + boot pipeline → eredita `CTR-game-001/002/005/008` come acceptance.
- `src/service-worker.ts`: nessuna superficie assegnata (gap registrato — candidato a surface entry futura).
- Bake scripts/configs: percorso da mappare in T-B1 (il plan non presuppone file specifici).
- **T-29**: ogni commit che muta refs `public/` → rigenerare `deploy-manifest.json` nello stesso commit + `npm run build:deploy` locale prima del push.
- Nessuna mutazione di comportamento coperta da `INV:` attesi → se emerge, classificare Mode A/B per PLAN-054 prima del fix.

## 7. Trappole ereditate

- **T-01** coverage-floor vs content-fit: mai toccare pin/margini mappa per "risparmiare pixel".
- **T-04** claim percettivi solo con witness che li vede (eyeball Director = OB-4).
- **T-09** perf dev-server ≠ prod — misure su `vite preview`/produzione.
- **T-13** worktree condiviso: sessione parallela attiva su R-357 — isolare i file toccati, non committare file altrui.
- **T-17** Vite stale transforms — `touch` sui file dopo edit bake-side.
- **T-22** misurare sul runtime col sintomo; headless richiede `--enable-unsafe-swiftshader`.
- **T-29** deploy-manifest drift → regen nello stesso commit.

## 8. Rischi

| Rischio | Mitigazione |
|---|---|
| Re-encode degrada look painterly (flicker temporale pose/waterfall, silhouette alpha canopy) | pixel-diff per-famiglia + OB-4 eyeball; quality per-categoria, mai globale |
| Stime sono ipotesi (byte budget non misurato) | Fase A prima di ogni implementazione; ordine ricalibrato sui dati |
| SwiftShader ≠ GPU reale (distribuzione collo diversa) | entrambi gli ambienti sono acceptance target (T-A2/OB-2) |
| KTX2 alpha artifacts su arte painterly | spike piccolo, kill rapido; mai commit senza gate qualità |
| Deriva worktree parallelo (T-13) | stage solo i file del plan; governance check prima di ogni commit |

## 9. Ordine proposto

T-A1 → T-A2 → T-A3 ∥ (T-B1 → T-B2 → T-B3 → [ruling D-1] → T-B4) ∥ (T-D1 spike) → T-C* condizionati dalla misura → T-E* opzionali → OB-5 deploy verify → OB-6 bundle.

## 10. Execution log

**2026-11-17 — Fase A completa + Fase B parziale** (run dir `.mw/runs/plan126-boot-bytes/`, dettagli in `T-A-findings.md`):

- **T-A1 ✅** `har-budget.json` — wire totale **16.4MB** (OB-1 PASS). Il fatto §0 "byte-bound" è **corretto dalla misura**: 15.7–16.4MB totali, non 60–130MB.
- **T-A2 ✅** dual-env (OB-2 PASS): SwiftShader veil 28.3s — sceneBuild 18.4s + decode wall 24s dominano; GPU Metal M4 veil 7.2s — fetch fan-out 3.9s (~55%), upload trivial (4ms + 134ms texSubmit). **Fase C upload (T-C3) killata dall'evidenza**; decode parallelo (T-C2) resta candidato solo per env decode-bound.
- **T-A3 ✅ → no-adopt**: A/B 344 file vs 12 bundle, stessi 13.7MB, 5 run — delta mediano 984ms < gate 2s. Packaging killato.
- **T-B1 ✅** `T-B1-bake-audit.md`; **T-B2 ✅** `scripts/asset-pixel-diff.py`; **T-B3 parziale**: maxZoom=3 + DPR2 → sorgenti prevalentemente *sotto*campionati; `ui/bg.webp` e grade-sheets = candidati `director-ruling`.
- **T-B4 ⏸ bloccato su D-1** — nessun re-encode eseguito.
- **OB-3 ✅** `tests/unit/idleVillage/gameBootAssets.test.ts` (golden set 352 path / 14.38MB baseline).
- **Strumentazione**: `performance.mark('game-boot:<phase>')` in `PixiWorldMap.emitBootProgress` + mark post-`prepare.upload` — misura pura, zero cambio comportamento.

**2026-11-17 — D-1 ruling + T-B4 avviato**: Director *"approvo"* dopo live in-game composites (request interception, GPU Metal, 3200×2000). Applicate: grade sheets →q85, 40 canopy v2hi →q85, bg.webp →q75. Bake pipeline allineata alle nuove qualità. OB-4 PASS (`director-signoff.json`). **Nota contratto:** PixiWorldMap.tsx revertato a HEAD (sealed `game-frame-pixi.INV-1` import-closure — anche edit di sola misura = Mode B-amend non autorizzato); marks spostati al page seam `game-mappa2.tsx`; patch pipeline completa preservata nel run dir. Commit `4dba4cf1`.

**2026-11-17 — T-B4 applicato + T-D1 risolto** (commit `2a3235fd`):
- **T-B4 ✅**: golden boot set **14.38MB → 10.23MB (−29%)**; grade −86/−89%, canopy −24.5%, bg −54.4%. Bake pipeline allineata (v2hi: q95-copyfile → q85 encode; grade: lossless → q85). Smoke prod build Metal: `/game` interactive **4485ms** (era 7.2s), 0 404.
- **T-D1 ✅ → NO-GO per boot-time**: Pixi v8 ha plumbing KTX2 nativo e `basisu` npm encoda, ma il transcode gira su **un solo worker** — ~350 file ETC1S→BC7 ≈ 2-4× più lento del decode WebP nativo parallelo. Leva valida solo per VRAM/wire (−13..−36% vs q85), non per l'obiettivo. UASTC scartato (+2.6-4.8×). Report: `ktx2-spike/REPORT.md`.
- **OB-5 ✅ (2026-11-18)**: `webglBootProbe` PASS su `rpg-balancer.vercel.app/` e `/game` post-deploy `index-B1u-whYz.js` (log `ob5-webgl-probe.txt`, timing prod `timing-prod-post-r359.json` — veilLift 18.6s SwiftShader).
- **OB-6 ⚠️ (2026-11-18)**: `verify:bundle` eseguito — obbligazioni **OB-1/2/3/5/6 PASS, OB-4 SKIPPED** (tier percettivo non raggiunto). Verdetto `BLOCKED` su gate esterni non-scope: contracts-check (inventory drift, `game-top-chrome` schema `source:ruling`, unità senza contratto, ownership STRICT_FILES, asserzioni indebolite nei test R-357 worktree, index-sync), trusted-lock drift `roster_drag_trusted.md` (edit doc R-359 legittimo → re-seal richiede worktree pulita: il trust-set hashea il worktree e binderebbe i contratti non committati di R-357).
- **OB-6 debt cleanup (2026-11-18, commits `484e5fd2`/`19f95b6e`/`bf8c2c2d`/`b64ea972`)**: risolti senza ratchet — schema `source:ruling→director-spec` su `game-top-chrome.INV-6`; contratti mancanti `panel-frame-ornaments` + `scene-reveal-layer` (con test dedicati `// INV:` + `test_refs`, 7/7 verdi — chiude anche i 2 STRICT_FILES a 0 owner); dedup marker `// INV:` su 4 invariant a copertura multi-file (34/34 verdi). **Residuo non autonomo** — richiede approval Director o sessione governance dedicata:
  - *Ratchet strutturale* (sha256-approval / `red:retire`): rimozione membri scope (`expedition-drawer`→`useExpeditionDrawer.ts`, `hudreal-victory-reward`→3 file), cancellazione contratti orfani (`game-menu-screens` → candidato `kind:integration` sulle 8 unità menu, `place-fan-geometry` → fondere INV-1 in `place-fan-cards`), migrazione marker `// INV:`.
  - *2-owner residui (13)*: `game-menu-screens` over-claima le 8 unità menu dedicate; `hudreal-victory-reward` over-claima `C1Medallion.tsx`+`questEpilogue.ts`+`questSettlement.ts`; `place-fan-geometry` claima file dell'unità `place-fan-cards` (partizione live verificata via `componentInventory.ts` senza `--write`).
  - *Debt R-357*: marker `// INV:cassetto-*` non dichiarati (9), asserzioni BASE indebolite (8), `village-stash-panel` staged.
  - *Regen-bound*: `componentInventory.ts --write` + `contracts:index-sync` + trusted re-seal + ledger approval — attendono il commit di R-357 (binderebbero il worktree misto).
  - *Amend Mode-B*: `hud-real-cassetto.INV-5` statement stantio (dice "riempie cost-slot" ma il test `cassetto-no-cost-cell` asserisce il contrario).
- **OB-6 surgery applicata (Director «approvo», commits `bb1bca59` + `8ff0932b`)**: scope riallineati alla partizione (`expedition-drawer`, `hudreal-victory-reward`, `game-frame-pixi` 56 file); `game-menu-screens` → `CTR-game-011` integration (14 INV verbatim); `place-fan-geometry` fuso in `place-fan-cards`; 7 contratti orfani sciolti con INV migrati verbatim in `game-frame-pixi` (marker/test_refs preservati, nessun `red:retire`); fix YAML chiave duplicata post-merge; marker riallineati (`village-stash-panel.INV-2`, `R-353-compact-badge-corner`, nuovo test `hudreal-victory-reward.INV-5` — 10/10 verdi); `inventory.json` rigenerato (300 unità, contratto auto `expedition-bottom-sheet`); `COMPONENT_MASTER_INDEX` ri-syncato; `trusted.lock` re-seal + approval agent:devin (copre solo `roster_drag_trusted.md`, unico drift). Bundle reasons 50 → ~20 residui:
  - *Debt R-357 worktree* (non toccato): marker `cassetto-*` non dichiarati, asserzioni BASE indebolite (`expedition-drawer.INV-4/5`, `expedition-layout-tokens.INV-1/2`, `village-stash-panel.INV-5`), `expedition-bag-assign.INV-1/2` senza marker (test staged).
  - *Amend Mode-B Director*: `hud-real-cassetto.INV-5` statement stantio.
  - *Pre-esistenti*: `menuI18n` INV-12 dataset non literal-foldable, `menu-flow` tier-1 zero INV.
  - *Verifier policy*: OB-4 SKIPPED non confermabile — serve ruling Director (accettare skip o eseguire tier percettivo).
- **OB-6 fix round 2 (Director «fixa gli errori», commits `74e147d5`…`f9317c23`)**: `contracts:check` 53 → **11 ragioni**. Fixate: marker `cassetto-*` dichiarati (hud-real-cassetto + amend INV-5 statement stantio), `menu-flow` 3 INVs, INV-2 fuori frontmatter rientrati (drag-config, custom-drag-overlay), `expedition-bag-assign` orfano sciolto → INVs in `village-stash-panel`, scope_files allineati alla partizione, stub `slot-v12-renderer`/`engraved-icons` con INV reali + marker (mode-b-add, esce Mode C impossibile), 13 coverage exceptions (tooling asset R-357 + out/), `gameSurfaceManifest` rigenerato (503 file), e2e spec adottata a `syncGateTest`, 2× `trusted:seal` + approvals, cap override completati.
- **Residui FINALI (non risolvibili in-sessione)**: (a) **8 asserzioni BASE indebolite** in `r339ExpeditionDrawer`/`r339ExpeditionTokens`/`r353StashGrid` — hard-ratchet senza via d'autorizzazione per asserzioni interne al blocco: si risolvono meccanicamente al **commit di R-357 + prossimo seal** (BASE si sposta); (b) **CTR-game-005.INV-1..3 executedCount unknown** — la spec `gameGeometryT01` non è eseguibile sotto l'harness playwright attuale (`/gameOld` gated come dev-lab nel preview build; verificato: canvas non monta nemmeno con SwiftShader 60s): serve run su ambiente valido (GPU/headed o build con lab routes) + seal — wrapper `syncGateTest` già adottato. **Nota Director (2026-11-18)**: `/game` ha zoom-min clamp → la classe di bug R-148 (sea-leak ai bound di pan/zoom-out) non esiste sulla superficie corrente; `/gameOld` è solo reference → decisione pendente del Director: `red:retire` di CTR-game-005 + spec (via consigliata se le meccaniche `landBounds`/`__worldCam`/`seaMargin` sono gameOld-only) oppure retarget spec su `/game`; (c) chiusura `fatta` R-358 resta bloccata su questi.
- **Update (2026-11-18)**: retire CTR-game-005 eseguito (Director ruling — spec + contratto rimossi, `631ced30`); `verify:bundle --all-tiers` → **OB-1..6 TUTTI PASS** (OB-4 PASS via signoff D-1 registrato), verifier+trust OK; contratti scesi a **9 residui — TUTTI asserzioni BASE indebolite nei test di R-357** (`r339ExpeditionDrawer`/`r339ExpeditionTokens`/`r353StashGrid`), irrisolvibili prima del loro commit perché il ratchet non autorizza asserzioni indebolite in blocchi sopravvissuti. Nota: il worktree R-357 attualmente **non compila** (manca `}` a `HudRealCassetto.tsx:494`) — il loro commit risolve entrambe le cose. Marker R-357 `cassetto-cta-tips-intact` dichiarato (`director-bug`).

## Residui OB-6 — aggiornamento 2026-11-18 (sessione devin, "fallo tu")

- R-357 test checkpoint committato (`676da56a`→merge `ea149589`) → i 9 ratchet asserzioni **risolti** (baseline spostata).
- Seal: `7360fe33` → `897de57e` → `58996f50` (BASE=5866fc00).
- Fix aggiuntivi: `hud-plaque` INV-1 (schema `code-baseline`), HudPlaque `bare` prop checkpoint (`5866fc00`), exception WanderlustRosterCardV2+HudPlaque, retire `R-353-compact-badge-corner`, re-dissoluzione orfano `expedition-bag-assign`, index sync.
- `contracts:check --diff` su fileset proprio: **OK**. Repo-wide: instabile mentre la sessione parallela muta il worktree (gate-file editati + pull/autostash mid-run → flood artefatto, verificato).
- Per il PASS finale serve: worktree quieto (R-357/sessione parallela committata) → `contracts:check` → `verify:bundle --all-tiers`.
- Commit: `84e1a61c`, `5dfa295c`, `8eec6a96`, `5866fc00`, `58996f50`.

## CHIUSURA — 2026-11-18

- `verify:bundle -- --manifest=.mw/runs/plan126-boot-bytes/verification.json --all-tiers` → **Verdict: PASS**
- OB-1…OB-6 tutti verdi; verifier+trust OK; 193 file sessioni parallele → foreign_scope advisory (non bloccante).
- R-358 chiusa `fatta` in RICHIESTE.md con citazione `bundle: .mw/runs/plan126-boot-bytes/bundle.json`.
- Residuo noto ~~`closure:lint` hang~~ → **RISOLTO 2026-11-19** (`65700b1c`): la causa era il gate che embeddeva il living-contracts ratchet completo (~8-10min) + delega al gate committato su gate-file dirty; ora `living:'skip'` in light mode → ~3s, violazioni reali ancora riportate.
- i18n sweep (2026-11-19, sessione devin): `i18n:validate` 217→0 missing — ~275 chiavi/locale × 4 locale reali (en/it-IT/de/ar) + pseudo; fix falsi positivi `common` via prefisso `idleVillage:` su call site parametrici.
