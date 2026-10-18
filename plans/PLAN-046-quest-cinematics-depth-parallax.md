# PLAN-046: Cinematica scene quest — depth-parallax + regia dei beat (v34)

**Status:** `baptized (2026-10-18)` — approvato dal Director ("procedi") dopo
dibattito multi-AI web (`mind-weaver/.mw/runs/20261017-quest-cinematics-debate/`,
decision_memo; artifact-r011 sha256 `36fde4690488bc53bd7541c867e80333861638ce092f7a4dbff3743de5cc4257`;
ACCEPT: claude, deepseek; chatgpt stale-loop non-responsive dopo r007;
gemini/grok provider_dead in clarification; 11 revisioni, ~15 obiezioni
sostanziali disposizionate)
**Desiderata:** v34 FROZEN (2026-10-17) · **Richiesta:** R-213
**Relazioni:** figlio concettuale di DESIGN_PILLARS §1 (deformazione in-place,
mai translate di quad full-canvas); estende `questTheatreFx.cinema` (PLAN-043)
invece di creare un sistema camera parallelo.

## Invarianti (da v34 FROZEN — non eludibili)

- Qualità cinematografica **sistematica** su tutti gli asset presenti e futuri.
- Parallasse via **depth map precalcolata** + **deformazione in-place dei pixel**
  (niente translate di quad, ampiezza contenuta + overscan anti-bordo).
- Mosse di camera dirette dal tipo di beat, config-driven in `questTheatreFx`.
- Overlay atmosferici separabili per scena.
- Cutout 2-layer manuale solo su scene hero scelte dal Director.
- Escluse: slice sistematico in N layer; layered-by-prompt; video loop AI.
- Prima slice = **spike dimostrabile** su una scena reale, eye-check Director.
- Config-first, reduced-motion ⇒ nessun effetto, skin token, budget WebView
  profilato, verifiche headless/background.

## 1. Rendering

Mesh quad 4-vertici + `GlProgram` custom (GLSL ES 3.0) in **una Pixi
Application dedicata per Theater montato** (mai condivisa con world map;
destroy on unmount). 1 draw call, 1 sampling della texture sorgente:

```
uvC = coverFit(uvScreen)                        // rect [c_a, 1−c_a] ⊂ [0,1]
uvC = (uvC − .5)/uZoom + .5 + uPan              // camera (pan in sampled-UV)
d   = depth(uvC) − uFocal                       // |d| ≤ 0.5; focal plane fermo
uvC += d · uAmp · uCamVec · ampMul              // deformazione in-place
uvC = (uvC − .5)·(1 − uOverscan) + .5           // shrink anti-bordo
uvC = clamp(uvC, 0, 1)                           // mai raggiunto per invariante
```

- Rejected: `DisplacementFilter` (extra RT + pass, map per ripple);
  subdivided-mesh vertex displacement (tearing ai bordi); WebGL2 raw.
- Filter-on-Sprite = escape hatch documentato (~40 righe, math identica),
  deciso da T-009 solo se il Mesh oppone resistenza.
- `uEnabled=0` → passthrough: stesso shader renderizza il rest frame per i
  parity diff. Ticker attivo solo durante shot attivi o idleDrift;
  altrimenti render-once + stop.

## 2. Fallback & lifecycle

- Selezione upfront: reduced-motion, depth mancante, `webglOk=false` → canvas
  mai creato.
- Canvas creato → `<img>` sempre montata sotto, nascosta via `visibility`
  **dopo il primo frame renderizzato** del canvas.
- Context loss / init failure → hide canvas, img già visibile: zero remount,
  zero re-decode, zero flash. Toggle one-way per mount. Costo accettato ~8MB
  decoded copy.

## 3. Vocabolario camera

- `cut` resta dispatch effetti (tag esistenti immutati; `push` resta dolly).
- Nuovo namespace ortogonale `questTheatreFx.camera`: `presets`
  {push-in, pan, hold, verdict-zoom, none} + `shots`
  {push-hard:{zoomTo:1.06,ms:1600,ease,ampMul}, pan:{…}, hold:{…}, verdict:{…}}.
- Precedenza: `stageDirection.camera` > `stageDirection.cut` >
  `camera.byNodeKind[nodeKind]` o `byBeatKind[beat.kind]` > `cutOn` defaults >
  `idleDrift` (16s attuale, sopravvive come default).
- `push` implica `push-in` salvo override. Ampiezza depth = `ampMul` per-shot.
- Zod: preset referenziati esistono; chiavi byNodeKind/byBeatKind ⊆ kind noti.

## 4. Depth bake

- `scripts/bake-depth.py` standalone (Depth Anything V2 Small, Apache-2.0;
  NON mergiato in `rpg-gen-mockup.py` — deps diverse; model cache condivisa).
- Output `public/assets/depth/<artId>.webp` half-res, 8-bit, ≤200KB, box blur
  leggero (`bake.blurRadius` ~1.5px). Bilateral NO in slice 1.
- Mitigazioni tearing: `uFocal` dead zone + `uMaxDisp` clamp + invariante Zod.
- Escalation bilateral/`taps:3` solo se eye-check flagga smearing.

## 5. Manifest, schema & invariante edge-exposure

`sceneManifest.ts` keyed by `NODE_ART` id:

```ts
{ [artId]: {
    depth?:    { src, w, h, focal?, ampMul? },
    overlays?: [{ kit:'fog'|'shafts'|'particles', asset, enabled,
                  params:{speed,alpha,parallax,blend} }],
    camera?:   { shot?: id, overrides?: Partial<Shot> },
    hero?:     { fg:{src, parallax}, bgDepth:true }  // slice 1: schema+parser only
} }
```

- Validazione vitest on typecheck: file esiste, aspect ≈ JPG ±1%, ≤200KB
  (solo WebP depth), kit noti. Depth mancante → DOM path + warn dev-only.
- **Premesse Zod**: `uFocal∈[0,1]`; `|uCamVec|≤1` per asse; `ampMul`/`uCamVec`
  shot-constant enforced sullo shot RISOLTO (nessun override re-introduce
  time-variance); `z_min>0`; `c_a ≤ 0.45`.

### Bound edge-safety (prova analitica — forma finale r011)

Per shot risolto s, asse a, istante t:

```
M(s,a,t) = (0.5 − c_a)/zoom_s(t) + |pan_s,a(t)| + 0.5·uAmp·|uCamVec_s,a|·ampMul_s
prova:     (1 − uOverscan) · M(s,a,t) ≤ 0.5 − ε     ∀ s,a,t ∈ [0,dur_s]
```

- `ε` (es. 0.002) definito una sola volta in config. Somma `|pan|+|disp|`
  conservativa per design (allineamento segni) — dichiarato agli autori.
- Easing = cubic-bezier/curve nominate: `valueRange`/`maxDeriv` **calcolati in
  forma chiusa** dai control point (derivata quadratica → estremo chiuso;
  overshoot via radici). Sweep numerico = solo diagnostico, non prova.
- **Tier 1**: `zoom_min`/`|pan|_max` analitici → bound disaccoppiato garantito.
- **Tier 2** (borderline): grid dt≤16ms + errore Lipschitz certificato
  `L = (0.5−c_a)·dmax_z/z_min² + dmax_pan`, `E = L·dt/2`, prova
  `(1−o)·(max_grid M + E) ≤ 0.5−ε`. `dmax_*` = derivata della curva finale in
  unità config. Lipschitz copre cambi segno/non-C¹; grid include t=0 e t=dur.
- `c_a` = crop cover-fit **reale per-asset**, funzione del view-aspect su
  `viewAspectRange:[min,max]` — config Zod pinnato in T-001 dalle costanti di
  layout reali (fallback: mount-assertion dev-loud/prod-silent-DOM).
  `E_a = 1/(1−2c_a)` derivato nel mirror. **Worst-case sull'intera
  disuguaglianza** a entrambi gli endpoint + stazionario interno;
  `max_grid M`, `L`, `E`, `L_DOM`, `E_DOM` ricalcolati allo STESSO endpoint.
- Conseguenza voluta: pan a zoom=1 e c_a=0 espone il bordo → l'invariante
  deriva lo **zoom minimo dei preset pan**; errore Zod riporta il valore
  ("pan .03 richiede zoomTo ≥ 1.083, got 1.05").
- **Fallback DOM, bound separato in CSS space**: `s_base` derivato nel mirror
  come `1/(1−uOverscan)` (rect DOM↔shader coincidenti a rest); per asse
  `overflow_a = (s_base·zoom·E_a −1)/2 ≥ |t_a| + ε_view`;
  `pan_view = pan_uv·zoom/(1−2c_a)`; `L_DOM` proprio (overflow + product-rule).
  Gate bloccante: `L_DOM` verificato riga-per-riga sul CSS transform reale.
- **Parity test**: rect shader ≡ rect DOM a rest, endpoint e mid-shot zoom≠1,
  al piano focale d=0.
- Divisione ruoli: Zod/vitest = prova edge-safety; property test = witness
  mirror↔GLSL (stessa sorgente transform); clamp = ultima spiaggia, se attivo
  = smear = fallimento.

## 6. Overlay & hero cutout

- `AtmosphereLayer` kit parametrizzato (DOM/CSS translate, asset
  `public/assets/atmosphere/`); config-gated via `manifest.overlays`;
  reduced-motion → assenti.
- Hero cutout: solo schema `hero.fg` in slice 1; pipeline manuale fuori repo;
  demo slice 3.

## 7. Tasks — slice 1 (spike)

| # | Task | Verify |
|---|---|---|
| T-001 | Schema + manifest skeleton (`questTheatreFx.schema.ts`, `sceneManifest.ts`) + **pinning viewAspectRange** dalle costanti layout reali (CRITICAL PATH) | test invariante Zod (Tier1+Tier2, per-endpoint), manifest linter |
| T-002 | `scripts/bake-depth.py` → depth WebP su agguato-foresta + accampamento-raider | size ≤200KB, histogram sanity, commit output |
| T-003 | `cameraClock.ts` (`document.timeline` prod, iniettabile test) + `cameraEval.ts` pure fn | golden values t=0/mid/end per shot; idle == keyframes attuali |
| T-004 | `DepthScene.tsx` + `depthShader.ts`: Application propria (autoStart:false), cover-fit, contextlost listener | parity diff rest-frame vs DOM img (tolleranza da baseline misurata, target ≤1.5% MAE) |
| T-005 | Integrazione Theater (QuestRunWindow solo): img sotto + canvas sopra post-primo-frame, 4 path | e2e ×4 (depth ok, no depth, context loss, reduced-motion) |
| T-006 | Wiring camera: precedenza §3; WAAPI letterbox/flash ancorate a shot.t0 | test precedenza + uniform assertions a clock iniettato |
| T-007 | Lab dev-only `/theater-lab?scene=<id>&beat=<kind>&t=<ms>` monta Theater reale + cue push/pan/verdict/replay | e2e route senza quest state |
| T-008 | Evidence: frame strip t∈{0,25%,50%,100%} push-hard + amp×3 + depth-off → `artifacts/cine-spike/` | rest==baseline; mid≠rest di delta minimo (deformazione ≠ solo zoom) |
| T-009 | Budget: asserzioni statiche (1 draw call, 2 texture, no filter pass, ticker idle-stopped) + `performance.now()` dev-only + **profiling manuale WKWebView** → `docs/cinematic/profiling-slice1.md` + byte-size CI | PASS strutturale + doc |

Spike scene: **agguato-foresta** (fallback accampamento-raider).

## 8. Acceptance evidence set

1. Unit cameraEval golden; invariante Zod rifiuta config cattiva.
2. Uniform assertions a clock iniettato (t∈{0,400,1600}ms).
3. Parity diff rest-frame vs DOM img (tolleranza misurata).
4. Deformation proof: mid-shot ≠ zoom-only di delta minimo.
5. Frame strip + amp×3 — **eye-check Director** (segnale primario, T-04).
6. Budget strutturale + byte gates CI.
7. e2e fallback ×4 path.
8. Profiling manuale WKWebView: ≤3ms added / 60fps **proposto**, sign-off su misura.

## 9. Deferred

StageBand parity (slice 4); hero cutout demo (slice 3); crossfade
old-canvas-hold (decisione post eye-check); pointer parallax; audio sync;
overlay su 3 scene + bake tutte le 18 scene + travel byNodeKind (slice 2).

## 10. Open risk

- Overscan ⇒ ~4% softness — eye-check nella spike.
- Crossfade 450ms: possibile pop mid-fade — decisione post eye-check.
- `viewAspectRange` = critical-path T-001.
- Budget numerici (~200KB, ≤3ms) proposti, validati da T-009, non frozen.

## Contratto (obbligazioni verificabili — slice 1)

- **OB-1** `questTheatreFx.camera` + `sceneManifest` Zod-compilanti; vitest
  invariante edge-safety (Tier1 disaccoppiato + Tier2 Lipschitz + bound DOM
  separato, per-endpoint) rifiuta config violante; errore col valore derivato.
- **OB-2** `public/assets/depth/agguato-foresta.webp` (+ accampamento-raider)
  committati, half-res, ≤200KB.
- **OB-3** `Theater` renderizza path canvas su scena con depth e DOM img sui
  3 fallback; reduced-motion → zero canvas; e2e ×4 verdi.
- **OB-4** Frame strip `artifacts/cine-spike/` prodotta headless: rest-frame
  parity vs baseline, mid-shot deformazione ≠ zoom-only, amp×3 comparison.
- **OB-5** Budget strutturale: 1 draw call, ≤2 texture, ticker idle-stopped,
  byte gates — asserzioni in test, non occhio.
- **OB-6** `human-eye`: eye-check Director sul frame strip (segnale primario
  di accettazione, T-04) + profiling manuale WKWebView con doc.
- **OB-7** Safeguards: `npm run lint -- <scope>`, `test -- <scope>`,
  `build:check`, `closure:lint` verdi; smoke dev-server headless.

**Documentation Impact:** REQUIRED — `plans/INDEX.md` riga, `RICHIESTE.md`
R-213, `test-results/` evidence log, `CURRENT_STATE.md`/`SESSION_HANDOFF.md`
a milestone spike, `context/INDEX.md` se emergono fatti durevoli (es.
viewAspectRange pinning, convenzione depth manifest).

## Dipendenze e note implementative

- PixiJS v8 già in uso (WorldSurfaceRenderer) — riusare pattern di lifecycle,
  niente nuove dipendenze render.
- Depth Anything V2 Small: licenza Apache-2.0 (verificata in ricerca); bake
  offline, nessuna dipendenza runtime.
- `stageDirection.camera` estende `stageDirection.cut` (PLAN-043) — campo
  nuovo nel tipo nodo, retro-compatibile (assente = precedenza normale).
- Nessuna nuova stringa user-facing in slice 1 (warn dev-only console);
  lab route dev-only non indicizzata.
- I residui accettati del dibattito sono obblighi operativi: zoom minimi
  derivati riportati early; test L_DOM scritto PRIMA dei preset; mirror↔GLSL
  da una sola sorgente; mount-assertion dev-loud/prod-silent.
