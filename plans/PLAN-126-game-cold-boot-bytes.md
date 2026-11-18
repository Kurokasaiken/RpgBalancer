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
- **Residui**: chiusura `fatta` R-358 bloccata sul cleanup governance multi-sessione (re-seal trust-set + index-sync + inventory regen) da eseguire post-commit R-357.
