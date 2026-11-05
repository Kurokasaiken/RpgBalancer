---
title: PLAN-108 — `mappa2` Stormo che vola via: famiglia `stormo` sull'AmbientDirector (fauna slice 1a)
status: implementato — OB-5 human-eye Director pendente
owner: agente locale (planner)
created: 2026-11-02
source_request: R-306 («ho creato della fauna, degli uccellini… ma ancora non li ho visti animati davvero, vedo solo le cose della vecchia mappa che nn vanno + bene. Come procediamo? uno stormo d uccellini che vola via per iniziare»)
parent: PLAN-097 (fauna di terra) → PLAN-089
depends_on: PLAN-094 (AmbientDirector — implementato)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md R-306 (vettore + esito)
  - plans/ASSETS-mappa2.md (riga A2: stato strip)
  - test-results/plan-108-stormo/ (evidence)
---

# PLAN-108 — Stormo su `/mappa2-lab` (fauna slice 1a)

> **Scelta di rotta (Director, 2026-11-02):** rotta **B** — famiglia `stormo`
> dentro AmbientDirector fin da subito (niente slice rapida sul meccanismo
> legacy). Determinismo e spawnlog dal primo frame.

## Perché

R-306: il Director ha prodotto gli sprite dipinti (pilota A2,
`context/research/2026-10-29-mappa2-sprite-pilot/`: `a2-pose-1..6.png` +
`a2-stormo-v5strip-0.png`, design **battezzato** 2026-10-29, taglia 20–24px)
ma su `/mappa2-lab` non li ha mai visti volare. Quello che si vede oggi è
l'effetto legacy `birds`: strip ardesia di `/game` + 3 voli authored per la
mappa vecchia (2 su 3 cadono fuori da mappa2 — finding documentato in
PLAN-097).

Questo plan è la **prima famiglia di terra** dell'AmbientDirector e il primo
task eseguito di PLAN-097. Solo stormo in volo: niente branchi, aironi,
carovana (slice successive).

## Visual-fork

`visual-fork: skipped — design e taglia già battezzati dal Director (ruling 2026-10-29: v4 + taglia 20–24px) — context/research/2026-10-29-mappa2-sprite-pilot/README.md`

La formazione (V lasa vs cluster) è variazione di dettaglio, non
rappresentazione materialmente diversa: default **V lasa** (coerente col
dipinto e col volo legacy), regolabile in config.

## Asset disponibili (intake)

- `a2-pose-1..6.png` (~300×210–390 px, alpha): pose di volo vista dall'alto.
  Ciclo usabile documentato nel README pilota: **1→2→4→5** (pose 1 e 3 simili).
- Taglia in mondo battezzata: **20–24px** (default 22, config-first).
- Manca la strip definitiva 8+3+3 (volo+decollo+atterraggio): fuori scope.
  Il decollo si vende con spawn a filo chioma + salita — l'atterraggio non
  esiste in v1 (lo stormo vola via e svanisce oltre il volo).

## Architettura

Specchio della famiglia `shoal` (PLAN-094): il Director ammette, l'adapter
renderizza. Canvas-safe: `Sprite` su atlas, niente shader/mesh/mask.

1. **Atlante** `public/assets/world/mappa2/base/fx/fauna/stormo_flight.webp`:
   celle uniformi (~400×400), pose 1→2→4→5 in fila, montate da script one-off
   (`scripts/build-stormo-atlas.py`, PIL — integrazione in
   `build-mappa2-assets.py` rinviata come per le maschere foam ad-hoc).
2. **Contratto leaf** `public/assets/world/mappa2/base/fauna.json` + schema
   strict `src/ui/idleVillage/config/mappa2FaunaConfig.ts` (stessa forma di
   `mappa2AmbientDirectorConfig.ts`: leaf importato solo quando
   `manifest.world === 'mappa2'`, zero cascata su `/game`):
   - `atlas.file`, `atlas.cellPx`, `atlas.frames` (ordine pose);
   - `takeoffs[]`: anchor `{id, x, y, biome, heading:[dx,dy], weight}` —
     **hand-authored in v1** (2–4 punti su margini `temperate_forest`/`meadow`,
     verificati a occhio sul dipinto; il bake da `biome_ids.png` è T-003 di
     PLAN-097, non questo plan);
   - `stormo`: `{enabled, slotSec, probability, cooldownSec, biomeCooldownSec,
     maxActive, sizeWorldPx, flockCount:[min,max], formation, lifeSec:[min,max],
     speedPxS:[min,max], flapHz, opacity, climbPx, climbScaleIn}` — la
     cadenza (slotSec/probability/cooldown) vive **qui**, non in
     `ambient-director.json` (che resta shoal-only). `enabled:false` = kill
     switch: niente uccelli su mappa2 e **mai** fallback legacy (cielo vuoto
     deliberato in attesa della slice 1b).
3. **`ambientDirector.ts`**: `families` diventa `{ shoal, stormo }`;
   `Admission.family: 'shoal' | 'stormo'`; le zone diventano per-famiglia
   (lo schema zone ha già il literal `family`) — il tick valuta per ogni
   famiglia abilitata il suo set di zone con le sue probabilità/cooldown.
   `triggerStormo(zoneId?)` speculare a `triggerShoal`.
   **Ordinali per-famiglia** (namespace): uno `stormo` non rinumbra mai gli
   ordinali `shoal` → spawnlog shoal **byte-identico** (regressione dedicata).
   Se l'adapter non può renderizzare (pool pieno, `enabled:false`, toggle
   off, reduced-motion) l'admission resta consumata e il log registra
   `outcome:'suppressed'` con motivo — deterministico e indipendente dalla
   camera; il gating «spawn solo se nel viewport» è un non-goal: il Director
   ammette a prescindere dalla vista.
4. **`ambientStormo.ts`** (adapter): pool flock (cap `maxActive`, proposto 2);
   su admission: N uccelli (da `flockCount`, hash-seeded) in formazione V lasa
   — **offset calcolati in coordinate heading-local e ruotati nel mondo**
   (una V verso sinistra non si ribalta in una V verso destra; lo specchio
   `scale.x` riguarda solo il frame, non la formazione) — con fase di
   sbattimento desincronizzata (`hash01(seed, i)`), flap = swap frame atlas a
   `flapHz` su `simTime` (render), `climbPx` = breve drift verso l'alto
   schermo + leggero scale-in nel primo ~25% di vita (Sprite transform,
   Canvas-safe) per leggere «si alza», poi volo lungo `heading` e despawn a
   `lifeSec`/fuori canvas con fade. Cap pool == `maxActive` letto dalla
   STESSA config (nessuna doppia costante).
   Nessun `Math.random()`: tutto da `hash01(seed, …)`.
5. **Wiring `PixiWorldMap.tsx`** (solo branch `manifest.world === 'mappa2'`):
   fetch `fauna.json`, parse schema, monta layer stormo **sotto la banda
   nuvole** (gli uccelli volano sotto le nuvole dipinte), sopra canopy/wonder;
   occupancy `declare('stormo','sky',0.3)` che **sostituisce** il declare
   legacy `birds` quando la fauna è presente; il blocco legacy `birds`
   (strip `/game`) gira **solo se non c'è fauna** (mappa2 con fauna =
   stormo, `/game` = legacy invariato).
6. **Lab `/mappa2-lab`**: il toggle `birds` del tab `sky` pilota la famiglia
   `stormo` su mappa2; trigger manuale `triggerStormo` sul debug seam
   (`__ambientDebug`), utile al Director e alle probe.

## Task

- [x] **T-001** Atlante `stormo_flight.webp` da `a2-pose-*.png` (celle
  uniformi, ordine 1→2→4→5, facing normalizzato head-right) + script
  one-off. Evidence: sha256 delle 6 pose sorgente + dell'atlante. · `depends:` none
- [x] **T-002** `fauna.json` + `mappa2FaunaConfig.ts` (Zod strict) + takeoffs
  authored con **trajectory gate**: per ogni anchor la polilinea
  `anchor + heading·speed·life` resta in canvas ≥80% della vita e non
  attraversa la zona villaggio; id bioma risolti da `biomes.json` accanto
  agli anchor. · `depends:` none
- [x] **T-003** `ambientDirector.ts`: famiglia `stormo`, zone per-famiglia,
  `triggerStormo`, union `Admission.family`. · `depends:` T-002
- [x] **T-004** `ambientStormo.ts` adapter + wiring PixiWorldMap + gate
  legacy birds + occupancy. · `depends:` T-001, T-003
- [x] **T-005** Test: schema/parse, determinismo admission stormo +
  spawnlog shoal invariato, lifecycle adapter (spawn→active→despawn).
  `tests/unit/idleVillage/mappa2Stormo.test.ts`. · `depends:` T-004
- [x] **T-006** (witness prodotto; occhio Director OB-5 pendente) Lab toggle + witness headless (2 frame distanti, stormo in
  volo dentro il bioma) + `test-results/` + occhio Director. · `depends:` T-005

## Contratto di chiusura

- **OB-1** `npm run test -- tests/unit/idleVillage/mappa2Stormo.test.ts`
  verde: schema strict; admission + traiettoria/count/fasi stormo pure da
  seed (adapter replay); spawnlog shoal byte-identico (ordinali per-famiglia);
  cap admission == cap pool (stessa config); `suppressed` loggato con motivo;
  reduced-motion → zero uccelli e hide stesso frame; cadenza shipped a
  intensity 1 → rate entro banda dichiarata e gap minimo ≥ cooldown; test
  parametrici sui valori config (il retuning non li rompe).
  *(blocking — anche obbligazione R-247: il test fallisce senza la famiglia.)*
- **OB-2** `fauna.json` parse OK; coordinate takeoff dentro canvas
  2752×1536 e su `temperate_forest`/`meadow` (gate nel test su
  `biome_ids.png` o check authored).
- **OB-3** Safeguard: `npm run lint -- <scope>`, `npm run build:check`,
  `npm run closure:lint`. `contracts:check` dichiarato: file in scope
  `pixi-world-map` (`PixiWorldMap.tsx`, `ambientDirector.ts`, nuovo
  `mappa2FaunaConfig.ts`); classificazione **Mode B-add** (famiglia
  additiva, nessun INV esistente mutato). Nota nota: il check oggi fallisce
  per drift condiviso del worktree (come R-299): BLOCKED su drift altrui va
  dichiarato, non fixato (T-13).
- **OB-4** Evidence `test-results/plan-108-stormo/`: screenshot headless
  (`--enable-unsafe-swiftshader`) con `triggerStormo` (seed riproducibile) a
  2 istanti pinnati (15% e 60% della `lifeSec` risolta) — bbox dello stormo
  dentro il rettangolo bioma del takeoff, ON/OFF.
- **OB-5** `human-eye` Director su `/mappa2-lab` — T-04. Checklist:
  (a) lo stormo si alza e vola via; (b) la strip ardesia legacy **non**
  appare mai su mappa2; (c) con fauna simulata assente, cielo vuoto
  (nessun uccello).
- **OB-6** Doc: riga `plans/INDEX.md`, `plans/ASSETS-mappa2.md` (A2 →
  integrato-volo), RICHIESTE R-306 `in corso`→`fatta` con `bundle:`.

## Trappole pre-flight (context/recurring-traps.md)

- **T-04**: claim percettivo → OB-4+OB-5, verifica a occhio in browser reale.
- **T-07**: fase flap per-uccello derivata dal seed dell'admission
  (proprietario = adapter), non da `Math.random()` né da loop paralleli.
- **T-13**: worktree condiviso — probe in retry+reload, niente commit scoped,
  drift `contracts:check` dichiarato non fixato.
- **T-15**: eventuali script probe via tsx → `page.evaluate` solo con
  sorgenti stringa.

## Decisioni aperte

- **O-1** Formazione: V lasa (proposta) vs cluster informe — slider/flag in
  config, default V.
- **O-2** Cadenza: evento raro (proposta: slotSec ~20, probabilità bassa,
  cooldown ~90s — «vita ambientale rara», DESIGN_PILLARS §22). Il molti-
  plicatore lab è **debug-only** (mai persistito nei default shipped).
- **O-3** Ombra a terra dello stormo in volo (legame col dipinto):
  rinviata a slice successiva — in v1 nessuna ombra.
- **O-4** Punti di decollo authored (2–4): da scegliere sul dipinto in T-002;
  il bake per-bioma resta a PLAN-097 T-003.

## Rischi

- Sprite a 22px ancora piccoli? Il ruling 20–24px è preso; se l'occhio
  Director lo boccia, `sizeWorldPx` è config-first (una riga).
- Pose 1→2→4→5 = ciclo a 4 frame: se lo sbattimento legge male a `flapHz`
  alto, scendere Hz o rimontare l'atlante con 6 pose (asset pronto).
  **Eseguito 2026-11-04 (R-314):** Director «l'animazione ha bisogno di più
  framerate» → atlante rimontato a 6 pose (ordine strip 1→2→3→4→5→6),
  `atlas.frames:6` + sha256 aggiornato, `flapHz` 6→9 (stesso tempo di
  battito, +50% risoluzione di frame). Witness: ciclo 0..5 live su
  `:5173/mappa2-lab`.

## Iterazione motion (R-316, 2026-11-05)

Director: *«ancora troppo scattosa… una V perfetta mi sembra poco naturale»*.
La scattosità non era framerate ma **discontinuità di moto**: velocità
istantanea al decollo, salita lineare con snap di velocità a fine climb
(25% vita), flap quasi in sync, blocco rigido in traslazione uniforme.

`ambientStormo.ts` — tutto `hash01(seed)` (replay identico, INV-3 intatta):

- **Accelerazione**: `TAKEOFF_TAU` — v(t)=speed·(1−e^−t/τ) invece di
  snap a velocità di crociera; climb/scale-in con smoothstep (niente snap
  di velocità a fine climb né a inizio).
- **Traiettoria**: meandro perpendicolare `SWAY_PX` (freq/phase seeded) +
  lieve bank del root — il volo non è una retta.
- **V lasa**: rankJ 0.75–1.35 per uccello, crossover occasionali sull'altra
  ala, jitter maggiori; gli uccelli partono **sparsi** dal punto di decollo
  e si compongono in formazione in `GATHER_SEC` (~2.4s).
- **Vita individuale**: wander continuo attorno all'ancora (amp/freq/phase
  per uccello), flap desync (`flapJ` 0.85–1.15 + fase frazionaria), boost
  di battito in salita (`TAKEOFF_FLAP_BOOST`), micro-bob del corpo
  sincronizzato al battito (`FLAP_BOB`).

Verifica: test 7/7, `build:check` ✅; witness live
`test-results/plan-108-stormo/r316-*.png` + serie posizioni
(`scripts/_tmp-stormo-motion-witness.mjs`): rampa 22→82 px/s, scatter→V lasa,
|by| non uniformi (19.9/35.5/44.7/46.9). Nota probe: sotto swiftshader i poll
rAF sono starved per secondi — l'età del flock va letta su `born`/`life`
(simTime), non sul wall-clock del probe (falso "despawn precoce", investigato
e smentito: il flock vive la `lifeSec` piena). Occhio Director OB-5 resta il
gate estetico (T-04).
- `ambientDirector.ts` refactor tocca la famiglia shoal in produzione:
  OB-1 copre il byte-identical spawnlog.
- `fauna.json` hand-authored: gli anchor potrebbero cadere su copertura
  non ideale (chioma, acqua) — mitigato da check-authored + occhio in T-006.
