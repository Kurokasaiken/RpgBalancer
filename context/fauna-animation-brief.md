# Brief — animazioni fauna su `mappa2` (da dare all'AI esterna)

Contesto: gioco fantasy, mappa dipinta `mappa2` 2752×1536 px, vista dall'alto
leggermente obliqua (non profilo, non isometrica). Renderer PixiJS v8
(WebGL + Canvas fallback). La fauna è gestita da un sistema ad **eventi rari**:
non loop continui, non particle noise — uno stormo o un branco appare, vive la
sua animazione, sparisce e lascia il mondo vuoto per ~1-2 minuti.

## Architettura che esiste già (da riusare, non reinventare)

- **AmbientDirector** (`src/ui/idleVillage/pixiSpike/ambient/ambientDirector.ts`):
  scheduler di ammissione deterministico. Tick logici da 100ms, probabilità
  per slot, cooldown per-famiglia e per-bioma, cap globale. Emette `Admission`
  {family, zoneId, biome, tick, seed} — NON renderizza niente.
- **Family adapter**: ogni famiglia di fauna ha un adapter (es.
  `ambientStormo.ts` per gli uccelli, `ambientShoal.ts` per il mare) che
  possiede sprite, pool e animazione. Pattern: `spawn(admission, simTime)`
  → costruisce il gruppo; `update(simTime, reducedMotion)` → muove/fa flap;
  despawn a `lifeSec` con fade.
- **Contratto dati**: leaf `fauna.json` strict-Zod
  (`src/ui/idleVillage/config/mappa2FaunaConfig.ts`). Ogni famiglia ha il suo
  blocco di parametri + un array di **takeoffs/anchors** {id, x, y, biome,
  biomeIndex, heading:[dx,dy], weight} + rect di esclusione (villaggio).
- **Determinismo assoluto**: MAI `Math.random()`. Tutto da
  `hash01(seed, …)`/`hash32(seed, …)` — conteggi, offset di formazione, fasi di
  sbattimento, velocità. Stesso seed → replay identico.
- **Canvas-safe**: solo `Sprite`/`Container`/`Texture` — niente shader, mesh,
  maschere, blend mode esotici.
- **Biomi, non territori**: gli anchor si piazzano per bioma
  (`biome_ids.png`: temperate_forest=3, meadow=4, alpine=1, highland=2,
  red_badlands=5, …) — vedi `biomes.json` per l'indice completo.

## Regole di asset (quello che funziona)

- **Strip atlante orizzontale** a celle uniformi, `.webp` con alpha:
  ogni cella ≈400×400px, soggetto **ritagliato sul suo bbox alpha e ricentrato
  nella cella** (altrimenti il flap jittera). Facing normalizzato **muso a
  destra (+x)**: il runtime ruota lo sprite sull'heading e specchia con
  `scale.x` per i voli a sinistra.
- **Stile**: dipinto coerente con la mappa (Hearthstone-ish, non pixel-art né
  foto). I soggetti si leggono da lontano: silhouette chiara + un accento di
  colore caldo (il petto ambrato dello stormo è il trucco che funziona).
- **Taglie**: uccellini battezzati a 20–24px in mondo (10–14px risultano
  invisibili — misurato). Altre creature: commisurare alla scala della mappa
  (un villaggio è ~500×400px mondo).
- **Pose di volo usabili subito**: `a2-pose-1..6` nel pilota
  (`context/research/2026-10-29-mappa2-sprite-pilot/`); il ciclo in produzione
  è rimontato a 6 pose 1→2→3→4→5→6 (2026-11-04, R-314: il ciclo a 4 frame
  1→2→4→5 leggeva steppy) in `fx/fauna/stormo_flight.webp` con `flapHz:9`.
- **Cosa manca / da produrre**: strip definitiva **8 pose volo + 3 decollo +
  3 atterraggio**; e per le altre famiglie (aironi, branchi fantasia, carovana)
  i propri atlas.

## Come lo stormo si anima (riferimento per le prossime famiglie)

- Nasce su un takeoff: **climb** = breve drift su schermo-y + leggero
  scale-in nel primo ~25% di vita (vende «si alza» senza pose dedicate).
- Formazione **V lasa** in coordinate heading-local ruotate nel mondo (offset
  per-uccello da hash del seed, jitter incluso).
- **Flap**: swap di frame a `flapHz` su `simTime` con fase per-uccello
  (`hash01(seed, 'ph'+i)`) — mai legata al tick 100ms.
- Traiettoria retta lungo `heading` + fade in/out ~1.2s; despawn a `lifeSec`.
- Pool cap = `maxActive` **flock**, non uccelli.
- Kill switch `enabled:false` → cielo vuoto; reduced-motion → hide istantaneo.

## Direzione creativa (ruling Director)

- Vita ambientale **rara**, non rumore di fondo.
- Creature **più fantasy che ovvie** per le famiglie future (niente semplici
  cervi — meglio varianti fantastiche).
- Prima fa' funzionare UNA cosa leggibile; le famiglie si aggiungono una per
  volta come figlie di PLAN-097 → PLAN-089.

## File di riferimento nel repo

- `plans/PLAN-108-mappa2-stormo-flock.md` — il plan implementato (contratto completo)
- `plans/PLAN-097-mappa2-land-fauna.md` — piano fauna di terra (macro)
- `plans/ASSETS-mappa2.md` — inventario asset per bioma (righe A1..A2x)
- `public/assets/world/mappa2/base/fauna.json` — il contratto dati vivo
- `context/research/2026-10-29-mappa2-sprite-pilot/` — pilota di stile + pose
