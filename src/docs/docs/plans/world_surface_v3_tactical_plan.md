---
title: World Surface V3 — Tactical Plan
status: Draft
owner: Strategy-Lead
last_updated: 2026-08-12
desiderata: .mw/desiderata.md v2
---

# World Surface V3 — Piano tattico per budget, trigger e tier eventi

## 0. Obiettivo

Risolvere i 3 punti aperti della desiderata v2 — **budget layer/effetti**, **trigger ambientali**, **tier eventi** — ancorando le decisioni tecniche sullo scaffold V3 esistente (`src/ui/idleVillage/worldSurface/`) e rispettando i vincoli RPG (config-first, Zod, i18n, Style Lab, Tauri WebView, PersistenceService, telemetry).

**Scope P0 (questa fase):** una fondazione piccola, deterministica e osservabile per i tre sistemi, con una demo verticale. **Non** l'intera World Surface.

**Deferito a milestone successive:** catalogo wonders completo, underwater esteso, event lifecycle gameplay completo, stagioni avanzate, audio design, bestiario/narrativa.

### Riferimenti

- Desiderata: `.mw/desiderata.md` v2 — *World Surface: mappa viva da esplorare con gli occhi*.
- Direzione: `DESIGN_PILLARS.md` §Pillar 1.
- Strategia: `world_surface_v3_strategic_plan.md`.
- Runtime: `world_surface_runtime_implementation_plan.md`.
- Component-based alternativo: `component_based_world_surface_plan.md` (deferito).
- Review multi-AI 2026-08-12: ChatGPT Web, Claude Web, Gemini Web, Codex.
- Cold read ChatGPT API 2026-08-12.

---

## 1. Contesto e ancoraggio

La mappa `/world-surface-v3` deve passare da scaffold render-safe a **mondo giocabile e visivamente ricco**. Il lavoro non è una riscrittura: è una consolidazione dello scaffold esistente, con tre sistemi mancanti (budget, trigger, tier) e un catalogo di contenuti coerente.

La direzione visiva è pittorica/fantasy (Hearthstone/Marvel Snap come riferimento emotivo), con una cornice intagliata a gargoyle/drago, continente dipinto, creature, vita atmosferica e rare scoperte. Il target è Tauri desktop; il rendering resta WebView e va profilato.

**Nota importante:** il piano è stato rivisto dopo due round di review multi-AI. Le modifiche principali: scope P0 ridotto, LayerBudget con cost class numeriche e quality profiles, 80/15/5 come attention budget temporale, World Attention Director unico, AttentionZone camera-first con state machine e QuadTree, EventSeverity con FSM e de-escalation, object pool per wonders, catalogo biomi e stagioni come prerequisiti, Engine Pipeline Pattern, texture warmup, background pause, HiDPI scaling.

---

## 2. Scope P0 — fondazione dei tre sistemi

### In scope (P0)

- `LayerBudget` / `EffectAdmissionController` (contratto, Zod, enforcement, quality profiles).
- `AttentionZone` (schema, state machine, resolver, hook, demo).
- `EventSeverity` (schema, FSM, tier table, de-escalation, global counter, presentation policy).
- Una demo verticale su `/world-surface-v3`: una AttentionZone reazionaria, un evento Tier 1, un Tier 3 mockato.
- Profilazione Tauri base (frame time, DPR, compositing).
- Catalogo biomi e stagioni minime (prerequisiti tecnici).
- World Clock (frozen kit `clockKit`) integrato come time source.

### Out of scope (deferito)

- Underwater completo (caustiche, bioluminescenza, creature subacquee) → V4.
- Observation-chain trigger → V4.
- Audio design completo → V4.
- Bestiario/narrativa → futuro.
- Event lifecycle gameplay completo con TimeEngine → milestone successiva.
- Wonder scheduler avanzato con famiglie/cooldown → milestone successiva.
- Catalogo esteso biomi/creature oltre il V0 → milestone successiva.

---

## 3. Architettura di rendering: Engine Pipeline Pattern

**Decisione:** la pagina `WorldSurfaceV3Page` monta **due soli controller di alto livello**, non sei layer React distinti. Questo evita il collo di bottiglia del re-rendering in React 19.

```text
                                  WORLD SURFACE V3 ENGINE
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
    ┌──────────────────────┐                                 ┌──────────────────────┐
    │  DOM / CSS VIEWPORT  │                                 │ PIXI 8 OVERLAY CANVAS│
    ├──────────────────────┤                                 ├──────────────────────┤
    │ - Base Painted Map   │                                 │ - Unified Render Loop│
    │ - Gargoyle Frame     │ ◄── [Viewport Matrix Sync] ───► │ - Object Pool (15/5)│
    │ - UI Badges / i18n   │                                 │ - Particelle Context │
    │ - Attention Zones    │                                 │ - Underwater/Caustics│
    └──────────────────────┘                                 └──────────────────────┘
```

**DOM Layer (Static & Frame):** gestisce la mappa statica base, le AttentionZone (div invisibili overlay per accessible hovering) e la cornice intagliata in CSS.

**Pixi 8 Overlay Pipeline (Single Stage):** gestisce un unico loop Pixi che raggruppa in 4 `Pixi.Container` interni:

- `Container_Breath` (nebbia, nuvole)
- `Container_Events` (incendi, fumo, segnalini)
- `Container_Wonders` (Kraken, draghi)
- `Container_Underwater` (caustiche marine, V4)

Questo approccio riduce i ponti di comunicazione React-Pixi a un solo bridge basato su Zustand Selector, azzerando il garbage overhead.

**React non deve re-renderizzare a 60 FPS:** per CSS/DOM, custom properties aggiornate al massimo in `requestAnimationFrame`, idealmente animazioni CSS compositor-only. Per Pixi: ticker unico. Mai un hook/timer per layer o particella.

---

## 4. LayerBudget / EffectAdmissionController

**Decisione:** il budget non è un numero di layer. È un **EffectAdmissionController** con cost class numeriche, quality profiles, e enforcement esplicito. La memoria è misurata offline, non usata come soglia runtime hard.

### Cost class e budget

| Cost class | Cost | Esempi |
|---|---|---|
| LIGHT | 1 | breath element, particle leggera, tint |
| MEDIUM | 3 | parallax layer, water ripple, fog |
| HEAVY | 6 | storm, caustics, underwater tint |
| CINEMATIC | 10 | Tier 3 vignette, freeze, grayscale |

**Budget:** `maxEffectCost = 10` (default, profilabile).

Esempio: water ripple (1) + clouds (1) + particles (2) + storm (6) = 10 OK. Storm (6) + caustics (6) = 12 BLOCK.

### Quality profiles

| Profilo | DPR max | DOM animati | Sprite simultanei | Heavy effect | Frame-time p95 |
|---|---:|---:|---:|---:|---:|
| `high` | 2.0 | 16 | 48 | 1 | ≤ 16.7 ms |
| `balanced` (default) | 1.5 | 12 | 32 | 1 | ≤ 22.2 ms |
| `low` | 1.0 | 8 | 16 | 0 | ≤ 33.3 ms |
| `reducedMotion` | 1.0 | 0–4 | 0–8 | 0 | non applicabile |

**Misurazione:** rolling window di 120 frame. Metriche: `frameTimeP50`, `frameTimeP95`, `longFrameCount` (>50ms), sprite attivi, nodi DOM animati, effetto pesante attivo, DPR effettivo, stato pagina (`visible`, `hidden`, `prefers-reduced-motion`).

**Politica di degradazione:**

- Se p95 supera il budget per 3 finestre consecutive: degradare di un livello.
- Se resta sotto il 70% del budget per 10s: si può risalire, mai durante un Tier 2/3.
- La degradazione spegne prima polvere/caustiche/wonders, poi riduce densità e DPR; non spegne mai segnali gameplay Tier 1+.
- `document.hidden` sospende ticker, emissione, dwell e telemetria di frame.

**Background throttling detection:** se il frame rate scende improvvisamente da >30fps a <5fps, è background, non degradazione. Non contare come violazione.

**HiDPI scaling:** su monitor 4K o MacBook Retina, il WebGL viewport di Pixi 8 e la mappa DOM scalano diversamente se non si mappa esplicitamente `window.devicePixelRatio`. Inizializzare Pixi con `resolution: window.devicePixelRatio || 1` e sincronizzare le trasformazioni di pan/zoom usando trasformazioni traslazionali CSS matrice speculari per il DOM.

**Background pause:** Tauri quando minimizzato sospende o rallenta drasticamente il loop di `requestAnimationFrame`. Quando l'utente riapre la finestra, i timer accumulati potrebbero far scattare tutte le Wonders e gli Eventi contemporaneamente (Burst Effect). Mitigazione: implementare in `useWorldSurfaceState.ts` un controllo di `document.visibilityState`. Se la pagina passa in background, i controller di spawn mettono in pausa i timer Delta anziché accumularli.

### Schema Zod — LayerBudget

```typescript
export const LayerBudgetSchema = z.object({
  maxPixiObjects: z.number().int().positive().default(150),
  maxEffectCost: z.number().int().positive().default(10),
  targetFps: z.number().min(30).max(120).default(60),
  minFps: z.number().min(20).max(60).default(45),
  textureVramBudgetMb: z.number().positive().default(128),
  heavyEffectQueuePolicy: z.enum(['drop', 'queue', 'degrade']).default('queue'),
  heavyEffectQueueTtlMs: z.number().positive().default(5000),
  violationAction: z.enum(['log', 'log_and_emit', 'log_and_throw']).default('log_and_emit'),
  profilingIntervalMs: z.number().positive().default(1000),
  degradationStrategy: z.enum(['DISABLE_UNDERWATER', 'DISABLE_BREATH_PARTICLES', 'FALLBACK_DOM_ONLY']).default('DISABLE_UNDERWATER'),
});

export type LayerBudget = z.infer<typeof LayerBudgetSchema>;

export const HeavyEffectSchema = z.object({
  id: z.string(),
  type: z.enum(['caustics', 'storm_cinematic', 'tier3_vignette', 'wonder_kraken']),
  cost: z.number().int().min(1).max(10),
  priority: z.number().int().default(0),
  durationMs: z.number().positive(),
  requestedAt: z.number(), // WorldClock.now(), non Date.now()
});

export type HeavyEffect = z.infer<typeof HeavyEffectSchema>;
```

### Contratto di enforcement

```typescript
export interface BudgetGuard {
  requestHeavyEffect(effect: HeavyEffect): 'accepted' | 'queued' | 'dropped';
  releaseHeavyEffect(id: string): void;
  getActiveHeavyEffects(): HeavyEffect[];
  tick(state: { activePixiObjects: number; memoryMb?: number }): BudgetSnapshot;
}

export interface BudgetSnapshot {
  timestamp: number;
  activePixiObjects: number;
  effectCost: number;
  violations: BudgetViolation[];
}

export interface BudgetViolation {
  reason: 'pixi_objects' | 'effect_cost' | 'memory' | 'fps_drop';
  value: number;
  threshold: number;
}
```

**Comportamento coda (policy: 'queue'):**

- Se `effectCost >= maxEffectCost`, il nuovo effetto entra in coda con `requestedAt`.
- Quando un effetto attivo termina (`releaseHeavyEffect`), il primo in coda viene promosso se `WorldClock.now() - requestedAt < ttlMs`, altrimenti scartato come "expired".
- Se la coda ha più di 2 elementi, il terzo viene scartato con `log_and_emit`.

**Preemption matrix:** Tier 3 (priority: 10) preempte immediatamente una Wonder (priority: 1). La wonder viene terminata con un fade rapido (300ms), non troncata bruscamente. Non c'è coda FIFO per Tier 3: il Tier 3 vince sempre.

**Caso limite:** due sistemi indipendenti (wonder spawner + event Tier 3) richiedono heavy effect contemporaneamente. Il `priority` field risolve: Tier 3 (priority: 10) vince su Wonder (priority: 1). Il Wonder viene queued con TTL breve (3s) — se non può partire entro 3s, viene scartato silenziosamente.

### Object pool per Pixi sprites (requisito architetturale)

Le wonders durano 2–20s. Se ogni wonder alloca e distrugge sprites, il GC si attiva ogni 2–20s, producendo microstutter da 5–15ms su V8.

```typescript
// wonderSpawner.ts — pattern corretto
class WonderPool {
  private pool: Map<WonderType, Sprite[]> = new Map();

  acquire(type: WonderType): Sprite {
    const available = this.pool.get(type)?.find(s => !s.visible);
    if (available) { available.visible = true; return available; }
    return this.createNew(type); // solo se pool esaurita
  }

  release(sprite: Sprite): void {
    sprite.visible = false;
    sprite.alpha = 0;
    // Non distruggere: rimane nel pool
  }
}
```

**Texture warmup:** caricare la texture di una Wonder solo durante la fase di Presage (ossia 30s prima dello spawn effettivo) e rilasciarla con `texture.destroy(true)` 10 secondi dopo il completamento dell'animazione. Non caricare tutte le texture all'avvio.

**Evidenzia:**

- Schema `LayerBudget` e `HeavyEffect` nel contratto centrale `src/ui/idleVillage/config/worldSurfaceConfig.ts` (non duplicare sotto `worldSurface/`).
- Modulo `EffectAdmissionController.ts` con test unitari puri (no React/Pixi).
- Object pool in `wonderSpawner.ts`.
- Profilazione iniziale su desktop Tauri target (da definire: hardware, fps target, memoria).

**Stato aperto da chiudere in esecuzione:**

- Target hardware Tauri concreto (CPU/GPU/RAM minime).
- FPS, memoria e dimensione bundle target (placeholder da profilare).
- Se il budget va adattato a bassa potenza (es. MacBook Air M1 vs desktop gaming).
- Soglia `maxPixiObjects` è un placeholder; va calibrata con profiling reale.

---

## 5. 80/15/5 come attention budget

**Decisione:** 80/15/5 è un **budget percettivo temporale**, non una percentuale geometrica di regioni visibili. Si misura su una finestra rolling di 5 minuti.

- **80% Calm:** nessun cue che richiede attenzione.
- **15% Active:** cue ambientali/eventi localizzati.
- **5% Surprise:** sorpresa/wonder.
- **Tier 2/3** tracciati separatamente: non devono essere normalizzati nel 5%.

**Implementazione:** `EffectAdmissionController.ts` classifica ogni secondo lo stato corrente della viewport (`calm` | `active` | `wonder`) e logga in dev ogni 60s. Se `calm < 75%` su 5 min → warning.

---

## 6. World Attention Director

**Decisione:** un solo scheduler globale per la categoria, non un timer per evento.

```text
World Attention Director
        │
        ├── Ambient
        ├── Active event
        └── Wonder
```

- `gameplayEvents`: guidato dallo stato di gioco (TimeEngine/world state), mai RNG decorativo.
- `wonders`: una sola opportunità ogni 8–15 min, con `spawnChance` 0.35–0.50 e una sola wonder selezionata tra quelle eleggibili.
- `ambient`: loop locali senza "spawn event".
- `tier 3`: non più di uno per run/finestra significativa; `maxPerRun: 1`, `minMsSinceLastTier3: 30 * 60_000`, `requiresNoActiveTier2Or3: true`, `requiresEligibleGameplayState: true`.

**Separazione wonder vs evento:** Meteor è contemporaneamente wonder e Tier 3. Separare esplicitamente:

- `wonder.meteor_shower`: puramente visiva, Tier 0/wonder presentation.
- `worldEvent.meteor_impact`: raro evento gameplay con conseguenza, Tier 3.

Lo stesso vale per "Massive Storm" wonder versus `Storm` gameplay.

---

## 7. Breath e atmosphere

Il respiro della mappa è la vita inconscia: il giocatore non deve notare l'animazione, ma se la togli, il mondo muore.

### Elementi e parametri

| Elemento | Ciclo | Ampiezza | Opacità | Tecnica |
|---|---|---|---|---|
| Nuvole | 45–90s su tutta la viewport | ±3px | 0.15 | sprite-sheet drift |
| Nebbia | 30–60s | ±2px | 0.10 | overlay gradient |
| Acqua | 3–5s | ±4px | 0.12 | texture/sprite motion (no UV ripple se non profilato) |
| Alberi | 5–8s | ±1.5px | 0.08 | transform sway |
| Polvere/deserto | burst 2–4s, 1 ogni 45–120s per biome visibile | rare | 0.05 | particle loop |

**Perception test:** il giocatore dice "la foresta respira", non "la foresta oscilla".

### Stagioni (prerequisito minimo)

```typescript
export const SEASON_BREATH_MODIFIERS = {
  spring: { leaves: false, snow: false, fog: 0.8, pollen: true },
  summer: { leaves: false, snow: false, fog: 0.5, pollen: false },
  autumn: { leaves: true,  snow: false, fog: 1.2, pollen: false },
  winter: { leaves: false, snow: true,  fog: 1.5, pollen: false },
} as const;
```

**Low power fallback:**

```typescript
export const BREATH_LOW_POWER_FALLBACK = {
  disableParticles: true,
  reduceCycleFrequency: 0.5,
  maxActiveBreathElements: 2,
} as const;
```

**Schema Zod:** `BreathConfigSchema` e `ParallaxConfigSchema` devono essere Zod-validati, non solo const.

```typescript
export const BreathConfigSchema = z.object({
  clouds:  z.object({ cycle: z.number(), amplitude: z.number(), opacity: z.number() }),
  fog:     z.object({ cycle: z.number(), amplitude: z.number(), opacity: z.number() }),
  water:   z.object({ cycle: z.number(), amplitude: z.number(), opacity: z.number() }),
  trees:   z.object({ cycle: z.number(), amplitude: z.number(), opacity: z.number() }),
  dust:    z.object({ interval: z.tuple([z.number(), z.number()]), opacity: z.number() }),
});
```

---

## 8. Depth / Parallax

La parallasse crea profondità senza tiltare la camera. **Il frame è ancorato a 1.00x sempre** — il parallax si applica solo ai layer interni alla viewport. Un frame DOM con transform che si muove può produrre tearing o artefatti su Tauri/WebView.

### Moltiplicatori camera-relative

| Layer | Moltiplicatore | Note |
|---|---|---|
| Clouds | 1.20x | si muove più veloce, più lontano |
| Atmosphere | 1.10x | |
| World map | 1.00x | riferimento |
| Water depth | 0.90x | più lento, più vicino |
| Underwater | 0.75x | molto lento, molto vicino |
| Frame | 1.00x | **anchored, non si muove** |

**Regole:**

- Movimento del frame **impercettibile** (max 2–3px).
- Mouse move → offset dal centro → clamp → smooth 0.3–0.5s easing.
- Dead zone 5% al centro = nessun movimento.

```typescript
export const PARALLAX_CONFIG = {
  maxOffsetPx: { clouds: 12, atmosphere: 8, worldMap: 0 },
  easingDuration: 400,
  easingFunction: 'ease-out',
  deadZonePercent: 0.05,
} as const;
```

---

## 9. Hidden Reaction Triggers (AttentionZone)

**Decisione:** il trigger principale è **camera/viewport attention**; l'hover è un acceleratore secondario. Il sistema è una **state machine**, non polling del viewport. La risoluzione spaziale usa un **QuadTree** per evitare polling continuo del centro viewport.

### Trigger principale

- **camera-enter:** la viewport entra nella zona e resta per almeno 1s. Nessuna azione del giocatore richiesta.
- **pointer-dwell (secondario):** `pointerenter` su landmark hitbox semantica, `1.200 ms` default, massimo `2.000 ms`. Tre secondi è già un'attesa percepibile. Se il mouse si muove oltre una soglia di tolleranza di Δ15px, il timer si resetta immediatamente.
- **focus-dwell:** tastiera/controller.
- **world-state:** valutato al cambio stato, non in polling.
- **revisit:** basato su un ledger sessione, non su timer impliciti.
- **observation-chain:** rimosso da V3, deferito a V4.

### State machine

```text
UNSEEN
  ↓ camera-enter / pointerenter
ELIGIBLE
  ↓ dwell / condition met
ATTENDING
  ↓ timeout + revalidation
OBSERVED
  ↓ reaction dispatched
COOLDOWN
  ↓ cooldown elapsed / oncePer consumed
LOCKED (per contenuti già consumati)
```

**Regole di cancellazione:** su `pointerleave`, `pointer capture`, drag, apertura modal, pan/zoom, `visibilitychange`, unmount.

**Esempio:** il mouse entra/esce/rientra rapidamente — non deve creare tre timer e tre reaction.

### Risoluzione zone sovrapposte

**Decisione:** "smallest wins with floor priority".

1. Al `pointerenter`, risolvi la zona più specifica.
2. Ordina per `priority` decrescente; a parità vince area minore; poi ID stabile.
3. Avvia un solo timer.
4. Non c'è merge: una sola zona è attiva per volta.
5. Le zone non-vincitrici entrano in stato `suppressed` e vengono rivalutate ogni 250ms.

### Spatial indexing (QuadTree)

L'algoritmo di AttentionZone usa coordinate bounds assolute. Se la mappa supporta Pan & Zoom, i test di intersezione coordinate falliscono o causano un overhead immenso se calcolati ad ogni frame senza un Spatial Indexing. Mitigazione: usare un **QuadTree** o Bounding Volume Hierarchy in memoria per interrogare le zone. L'intersezione rettangolo-zona va calcolata solo quando camera/viewport cambia, non in polling.

### Schema Zod — AttentionZone

```typescript
export const AttentionZoneTriggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('camera-enter'),
    dwellMs: z.number().min(1000).max(5000).default(1000),
  }),
  z.object({
    type: z.literal('pointer-dwell'),
    dwellMs: z.number().min(1200).max(2000).default(1200),
    tolerancePx: z.number().default(15),
  }),
  z.object({
    type: z.literal('enter'),
  }),
  z.object({
    type: z.literal('revisit'),
    minGapMs: z.number().default(300_000),
  }),
  z.object({
    type: z.literal('world-state'),
    condition: z.enum(['night', 'rain', 'snow', 'storm', 'tier3_active']),
  }),
]);

export const AttentionZoneSchema = z.object({
  id: z.string(),
  coordinateSpace: z.enum(['world_pixels', 'viewport_pixels', 'normalized']),
  bounds: z.object({
    x: z.number(), y: z.number(),
    width: z.number(), height: z.number(),
  }),
  trigger: AttentionZoneTriggerSchema,
  cooldownMs: z.number().default(60_000),
  priority: z.number().int().min(0).default(0),
  reactionId: z.string(),
  biome: z.enum([
    'forest', 'desert', 'mountain', 'ocean', 'swamp',
    'tundra', 'volcano', 'plains', 'coast', 'ruins',
  ]).optional(),
  enabled: z.boolean().default(true),
  oncePer: z.enum(['session', 'run', 'ever']).default('session'),
  minZoom: z.number().optional(),
  suppressedBy: z.array(z.enum(['tier3_active', 'tier2_active'])).default([]),
});
```

### Loop di polling — specifiche precise

- Polling ogni 250ms (non ogni frame — è intenzionale).
- Il polling **non deve aggiornare stato React direttamente**. Usare un `ref` per lo stato interno delle zone, e aggiornare stato React solo quando una zona cambia stato (idle → active, o fire → cooldown). Il 99% dei tick non produce re-render.
- Per `pointer-dwell` usare `pointerenter/leave`; per `camera-enter` calcolare l'intersezione rettangolo-zona solo quando camera/viewport cambia.

### Casi limite obbligatori

- zone sovrapposte;
- pan/zoom mentre il dwell è in corso;
- mouse che passa sulla zona durante drag;
- overlay/modale sopra il landmark;
- tab inattiva o ripristinata;
- touch, tastiera, controller;
- reazione già in corso;
- coordinate manifest normalizzate versus pixel;
- zoom molto basso, dove una hitbox diventa troppo facile da attivare;
- errore/missing `reactionId` a validazione config;
- `world-state` (es. night) non deve attivarsi se c'è un evento Tier 3 attivo — il Tier 3 domina la lettura visiva.

### Persistence keys

```typescript
`worldSurface.attentionZone.visited.${zoneId}`       // boolean, no TTL
`worldSurface.attentionZone.lastVisited.${zoneId}`   // timestamp, per 'revisit'
```

**Decisione:** il cooldown è per sessione (in-memory), eccetto per le zone `enter` (prima visita) che devono essere persistite. Le zone `revisit` usano PersistenceService con TTL configurabile.

### Lista iniziale zone (contratto minimo per V3)

| ID | Bioma | Trigger | DwellMs | Reaction |
|---|---|---|---|---|
| `village_market_01` | plains | pointer-dwell | 1200 | `merchant_idle_whisper` |
| `enchanted_forest_heart` | forest | world-state (night) | — | `firefly_bloom` |
| `old_lighthouse` | coast | revisit | — | `ghost_ship_silhouette` |
| `desert_oasis` | desert | pointer-dwell | 1500 | `mirage_ripple` |
| `mountain_peak_01` | mountain | camera-enter | 1000 | `eagle_screech` |
| `swamp_edge` | swamp | world-state (rain) | — | `fog_thickens` |
| `ocean_deep_01` | ocean | pointer-dwell | 2000 | `kraken_hint_shadow` |
| `ruined_temple_01` | ruins | pointer-dwell | 1200 | `dust_particles_burst` |

**Nota:** ogni reazione che produce testo user-facing ha un `labelKey` i18n nel namespace `idleVillage`.

**Evidenzia:**

- Schema `AttentionZone` nel contratto centrale.
- Hook `useAttentionZone.ts` in `src/ui/idleVillage/worldSurface/hooks/`.
- Test RTL + demo su `/world-surface-v3`.

**Stato aperto da chiudere in esecuzione:**

- Lista completa di zone e reazioni oltre il floor minimo.
- Se il trigger principale sarà `camera-enter` o `pointer-dwell` o una combinazione (dipende da test UX).

---

## 10. Event lifecycle FSM

**Decisione:** le 4 fasi (Presage → Threat → Event → Consequence) devono essere una **finite state machine esplicita** con stati, transizioni, condizioni, timeouts e eventi di input.

### FSM esplicita

```text
         [IDLE]
            │ spawn_condition_met
            ▼
        [PRESAGE]  ◄─────────────────────────────────────┐
            │ presage_duration_elapsed                    │ player_action_resolved (Tier 1-2 only)
            ▼                                             │
         [THREAT]                                         │
            │ threat_duration_elapsed                     │
            ▼                                             │
         [ACTIVE] ──────────────────────────────────────►│
            │ event_duration_elapsed OR                   │
            │ player_resolved (Tier 1-2)                  │
            ▼                                             │
      [CONSEQUENCE]                                       │
            │ consequence_duration_elapsed                │
            ▼
          [IDLE]
```

**Tier 3 special path:**

```text
[ACTIVE] ──► player_NOT_resolved ──► [CONSEQUENCE: permanent]
         └──► player_resolved ────► [CONSEQUENCE: recoverable, longer]
```

**Condizioni di transizione:**

- `spawn_condition_met`: deciso dal TimeEngine/world state, non RNG.
- `presage_duration_elapsed`: da config `phases.presageDurationMs`.
- `player_action_resolved`: solo per Tier 1-2; Tier 3 richiede azione specifica o fallimento. **Correzione:** da `ACTIVE` va a `CONSEQUENCE`, non a `PRESAGE`.
- `event_duration_elapsed`: da config `phases.activeDurationMs`.
- `consequence_duration_elapsed`: da config `phases.consequenceDurationMs` (diverso per resolved/unresolved).

---

## 11. Event Presentation Tiers (EventSeverity)

**Decisione:** `EventSeverity` classifica la posta in gioco; **non** possiede il rate limit o decide lo scheduling. Introduciamo tre concetti:

- `EventSeverity`: cosa rischia il giocatore.
- `PresentationPolicy`: come comunicarlo.
- `EventAdmissionPolicy`: quando lo scheduler può avviarlo.

### Tier 0 — Ambient

- Nessun rischio permanente, alta frequenza.
- Effetto: tint/particelle locali, animazione leggera.
- Nessuna interruzione, nessun audio invasivo.

### Tier 1 — Threat

- Conseguenza temporanea e reversibile, il giocatore può reagire.
- Effetto: avviso localizzato (badge, pulsazione), audio sottile.
- Non blocca l'interazione.

### Tier 2 — Major

- Conseguenza significativa ma non run-ending.
- Effetto: presentazione più marcata (nudge camera/regione, overlay, shake localizzato).
- Audio più forte, ma non bloccante.

### Tier 3 — Run-Threatening

- Conseguenza permanente o run-ending; fallimento può chiudere/danneggiare il run.
- Effetto: **non** freeze/grayscale di default. La policy consigliata è:
  - nudge camera una sola volta, max 180–250 px equivalenti;
  - focus ring sul luogo minacciato;
  - vignette ≤ 20% opacity;
  - nessun loop di camera shake;
  - azione richiesta immediatamente leggibile;
  - `reducedMotion` sostituisce la cinematica con contrasto, badge e messaggio i18n.
- Cap esplicito nello scheduler: `maxPerRun: 1`, `minMsSinceLastTier3: 30 * 60_000`, `requiresNoActiveTier2Or3: true`, `requiresEligibleGameplayState: true`.

**Nota:** il Pillar 2 dice di non punire con perdite definitive. Se "chiudere il run" è davvero voluto, serve una decisione di gameplay esplicita: recovery, persistenza, messaggio e conseguenze.

### Mappatura completa eventi — fonte di verità unica

| Evento | Tier | Presage | Threat | Active | Consequence (resolved) | Consequence (unresolved) |
|---|---|---|---|---|---|---|
| Flock of Birds | 0 | — | — | 3–5s | — | — |
| Festival | 0 | — | — | 1–2h | — | — |
| Discovery | 0 | — | — | 30min | — | — |
| Storm | 1 | 5min | 2min | 30–60min | 1h (clear sky) | 2h (mud/damage) |
| Fire (small) | 1 | 3min | 1min | 1–2h | 2h (rebuild) | 4h (ruin) |
| Plague | 2 | 10min | 5min | 4–8h | 3h (recovery) | 12h (quarantine) |
| Goblin Raid | 2 | 8min | 3min | 2–4h | 2h (repair) | 6h (damage) |
| Dragon | 2 | 10min | 3min | 5–10s (fly) | 1h (scorched) | 3h (heavy scorch) |
| Goblin Invasion | 3 | 15min | 5min | 2–4h | 4h (rebuild) | permanent (ruin state) |
| Meteor | 3 | 2min | 30s | 5s (impact) | 6h (crater) | permanent (crater) |

**Nota:** `Flock of Birds` è classificato come wonder in alcune tabelle ma qui è un evento Tier 0. La fonte di verità unica è questa tabella: se è un wonder, è visuale e Tier 0; se è un evento gameplay, segue il tier.

### Schema Zod — EventSeverity

```typescript
export const EventSeveritySchema = z.object({
  tier: z.number().min(0).max(3),
  labelKey: z.string(),

  phases: z.object({
    presageDurationMs: z.tuple([z.number(), z.number()]),
    threatDurationMs: z.tuple([z.number(), z.number()]),
    activeDurationMs: z.tuple([z.number(), z.number()]),
    consequenceDurationMs: z.object({
      resolved: z.tuple([z.number(), z.number()]),
      unresolved: z.tuple([z.number(), z.number()]),
    }),
  }),

  visual: z.object({
    presage: z.object({
      tint: z.string().optional(),
      particles: z.array(z.string()).default([]),
    }),
    active: z.object({
      overlay: z.enum(['none', 'localized', 'region', 'cinematic']).default('none'),
      cameraNudge: z.boolean().default(false),
      shake: z.enum(['none', 'subtle', 'strong']).default('none'),
      grayscale: z.boolean().default(false),
      vignette: z.boolean().default(false),
    }),
    consequence: z.object({
      persistentTint: z.string().optional(),
      recoveryVisual: z.string().optional(),
    }),
  }),

  audio: z.object({
    presageCue: z.string().optional(),
    activeCue: z.string().optional(),
    resolveCue: z.string().optional(),
  }),

  cap: z.object({
    maxPerWindowMs: z.number(),
    windowMs: z.number(),
    globalCooldownMs: z.number(),
  }).optional(),

  deescalation: z.object({
    playerCanResolve: z.boolean().default(false),
    autoResolveAfterMs: z.number().optional(),
    resolvedConsequenceFaster: z.boolean().default(true),
  }),
});
```

### Contatore globale Tier 3

```typescript
interface Tier3GlobalState {
  lastTier3At: number | null;
  tier3CountInWindow: number;
  windowStartAt: number;
}

// Regola: max 1 Tier 3 per run, min 30 min tra Tier 3
// Se viene richiesto un secondo Tier 3 entro la finestra:
// → Viene degradato a Tier 2 visivamente
// → Mantiene il suo tier logico per il gameplay
// → Emette telemetry: event_tier_degraded
```

**Evidenzia:**

- Schema `EventSeverity` nel contratto centrale.
- Modulo `WorldEventSeverity.ts` con funzione `getEventTier(eventId: string): EventTier` e unit test su eventi noti.
- Update di `useEventSystem.ts` per consumare il tier.
- FSM implementata in `eventPresageSystem.ts` con stati espliciti.

**Stato aperto da chiudere in esecuzione:**

- Mappatura di ogni evento esistente a un tier.
- Definizione esatta del cap e delle condizioni per Tier 3.
- Se i tier influenzano anche la UI esterna alla mappa.

---

## 12. Wonder system

Le wonders sono scoperte, non animazioni ambientali. Devono essere rare, brevi, silenti o con audio sottile, e senza impatto gameplay.

### Catalogo wonders (V0)

| Wonder | Rarità | Scope | Visuale | Durata | Bioma |
|---|---|---|---|---|---|
| Kraken | 1 per 15 min | Underwater | Giant shadow, tentacles | 3–5 sec | ocean |
| Whale | 1 per 20 min | Ocean surface | Breach, water spray | 2–3 sec | ocean |
| Dragon | 1 per 30 min | Sky | Silhouette, shadow | 5–10 sec | mountain/forest |
| Meteor (wonder) | 1 per 25 min | Sky | Streak, impact glow | 2–4 sec | any |
| Aurora | 1 per 40 min | Sky (north) | Color bands, shimmer | 10–20 sec | tundra |
| Ghost Ship | 1 per 35 min | Ocean | Translucent hull, lights | 5–8 sec | ocean |
| Massive Storm (wonder) | 1 per 45 min | Sky | Lightning, dark clouds | 8–15 sec | any |
| Flock of Birds | 1 per 10 min | Sky | V-formation, shadow | 3–5 sec | plains |

**Nota:** il Flock of Birds è classificato come wonder ma ha frequenza vicina a "constant". La fonte di verità unica è la tabella in §11: se è un wonder, è visuale e Tier 0; se è un evento gameplay, segue il tier.

### Eligibility

- `mustBeInViewport: true` — una wonder non spawnare fuori dalla viewport.
- No spawn se c'è un evento Tier 3 attivo — il Tier 3 domina la lettura visiva.
- No spawn se il budget guard ha già un heavy effect attivo.
- Bioma eligibility: ogni wonder ha un bioma; spawn solo se il bioma è visibile.

### Seeded RNG

```typescript
// wonderSpawner.ts
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const seed = hashFnv32a(`${runId}:${dayIndex}:${biomeId}`);
const rng = mulberry32(seed);
```

**Regole:**

- Non sempre visibili: il giocatore può mancarle.
- Spawn RNG-based (seeded per determinismo in replay).
- Brief (2–20s max), silenziose o audio sottile.
- Telemetry: `wonder_spotted`.
- Una sola wonder visibile alla volta.

---

## 13. Underwater (V3 ridotto)

**Decisione:** per V3, underwater è ridotto a **surface ripple + silhouette shadow**. Il resto (caustiche, bioluminescenza, depth tint completo, creature subacquee, rovine) va in V4 o in un piano dedicato.

### Sotto-livelli V3

1. **Surface:** ripples, foam where water meets land, reflection of sky.
2. **Silhouette:** ombre di creature subacquee (Kraken, balena) come shadow sotto la superficie.

**Vietato in V3:** shader custom per caustiche, refrazione fisica, volumetric underwater fog.

**Evidenzia:**

- `useUnderwaterSystem.ts` implementa solo surface ripple e silhouette.
- `causticEffects.ts` resta TODO/stub con commento esplicito "deferito a V4".

---

## 14. Particle system: context-driven only

Ogni particella deve avere un motivo. Il contesto (bioma, stagione, evento, ora del giorno) decide.

### Particelle consentite

| Location | Particella | Motivo | Frequenza |
|---|---|---|---|
| Deserto | Sand dust | Vento | Costante, bassa densità |
| Foresta | Falling leaves | Autunno/vento | Stagionale, bassa densità |
| Montagna | Snow | Inverno | Stagionale, altitudine |
| Evento fuoco | Embers | Combustione | Solo evento attivo |
| Plague | Miasma | Malattia | Solo evento attivo |
| Swamp | Fireflies | Bioluminescenza | Notte, raro |
| Costa | Sea spray | Wave action | Costante, bassa densità |
| Waterfall | Mist | Impatto acqua | Location statica |

### Particelle vietate

- Golden sparkles (fantasy generico)
- Floating orbs (magia generica)
- Parchment dust (UI generico)
- Constant glitter (visual noise)

**Transizione tra biomi:** il giocatore pan da forest a desert. Le particelle di foglie devono fare fade-out, quelle di sabbia fade-in. La transizione deve essere configurabile:

```typescript
biomeTransitionDurationMs: 2000,
```

---

## 15. Catalogo biomi (prerequisito)

I sistemi di breath, particles, AttentionZone e wonders dipendono dal bioma. Questo catalogo è un prerequisito, non un backlog.

| Bioma | Vita calma | Cue ambientale | Creature ambientali | Wonders eligibili |
|---|---|---|---|---|
| Costa/alto mare | gabbiani, foam, vele lontane | spray durante vento | gabbiano, granchio | balena, nave fantasma |
| Foresta antica | falene, cervi, corvi | lucciole di notte | cervo, volpe, uccelli | drago lontano |
| Montagne | aquile, neve rada | nuvole basse | aquila, capra | meteora |
| Palude | aironi, rane | bioluminescenza notturna | rospo, ibis, serpente acqua | will-o'-wisp |
| Deserto | lucertole, avvoltoi | polvere solo con vento | scorpione (rare), serpente | miraggio |
| Pianure/campi | corvi, carri | grano mosso | coniglio, corvo, pecora | stormo |
| Tundra | corvi bianchi, neve | aurora se notte | renna, gufo neve | aurora |
| Arcipelago profondo | pesci, ombre marine | caustiche rare (V4) | pesci | Kraken |
| Vulcano | cenere, calore | ember ash, lava drip | nessuna (ostile) | eruzione (Tier 3 wonder) |
| Rovine | polvere, vento | dust burst, smoke wisps | corvo, topo, serpe | Ancient Golem awakening |

**Fallback:** se la camera si trova su una regione senza bioma assegnato (es. mare aperto), usa 'ocean' per aree d'acqua, 'plains' per terra.

---

## 16. Stagioni (prerequisito minimo)

Le stagioni influenzano breath, particles e wonders. Servono almeno le regole di base.

```typescript
export const SEASON_BREATH_MODIFIERS = {
  spring: { leaves: false, snow: false, fog: 0.8, pollen: true },
  summer: { leaves: false, snow: false, fog: 0.5, pollen: false },
  autumn: { leaves: true,  snow: false, fog: 1.2, pollen: false },
  winter: { leaves: false, snow: true,  fog: 1.5, pollen: false },
} as const;
```

**Schema Zod:** `SeasonModifierSchema` deve essere Zod-validato.

---

## 17. Struttura file e contratti

**Ownership del contratto:** il contratto centrale esistente `src/ui/idleVillage/config/worldSurfaceConfig.ts` è l'owner degli schemi condivisi. Il modulo V3 locale (`src/ui/idleVillage/worldSurface/config/`) può solo contenere preset/config già validati dal contratto centrale. Non duplicare schemi.

**Single coordinate space:** un solo sistema di coordinate canonico (`world_pixels` con origin `top_left`). Conversioni con zoom + pan + parallax. Pixi + DOM possono produrre errori di z-order, scaling e coordinate con zoom/DPR; serve un solo coordinate-space canonico.

```text
src/ui/idleVillage/worldSurface/
├── config/
│   ├── eventConfig.ts
│   ├── wonderConfig.ts
│   ├── underwaterConfig.ts
│   ├── attentionZoneConfig.ts
│   └── worldSurfaceDebugContract.ts
├── hooks/
│   ├── useWorldSurfaceState.ts
│   ├── useParallax.ts
│   ├── useBreathAnimation.ts
│   ├── useAttentionZone.ts
│   ├── useEventSystem.ts
│   ├── useWonderSystem.ts
│   └── useUnderwaterSystem.ts
├── layers/
│   ├── WorldLayer.tsx
│   ├── BreathLayer.tsx
│   ├── ParallaxController.ts
│   ├── EventLayer.tsx
│   ├── WonderLayer.tsx
│   └── UnderwaterLayer.tsx
├── utils/
│   ├── EffectAdmissionController.ts
│   ├── WorldEventSeverity.ts
│   ├── eventPresageSystem.ts
│   ├── wonderSpawner.ts
│   ├── particleContext.ts
│   └── causticEffects.ts
└── pages/
    └── WorldSurfaceV3Page.tsx
```

**Nota architetturale:** `useWorldSurfaceState` attuale crea stato isolato per ogni hook. Event, wonder e underwater non condivideranno davvero stato finché non esiste un owner unico locale o Zustand. Questo è un rischio architetturale immediato. Decisione: un solo `useWorldSurfaceState` condiviso (Zustand o Context) è prerequisito per i tre sistemi.

**i18n race condition:** se react-i18next carica il namespace `idleVillage` lazy, e le reazioni delle AttentionZone usano chiavi in quel namespace, c'è un race condition. Mitigazione: `WorldSurfaceV3Page.tsx` deve attendere `i18n.hasLoadedNamespace('idleVillage')` prima di montare l'hook AttentionZone.

---

## 18. World Clock (frozen kit)

**Decisione:** il World Clock esiste già come frozen kit certificato `clockKit`. Si importa con una singola riga:

```typescript
import { ClockWidgetStandalone } from '@/ui/idleVillage/frozen/kits';
```

`ClockWidgetStandalone` è pre-wrapped nel suo provider chain (`SkinSystemProvider` + `SandboxTimingProvider`). Il contratto è `clockKit`, status `certified`, route di riferimento `/minimal-clock`.

**Uso in World Surface:** il `WorldClock` / `TimeEngine` deve essere la fonte di tempo per tutti i sistemi (AttentionZone dwell, Event lifecycle, Wonder spawn, Budget profiling). Non usare `Date.now()` direttamente; usare un adapter `WorldClock` che legge dal TimeEngine.

**Evidenzia:**

- `src/ui/idleVillage/frozen/kits/clockKit.tsx` — frozen kit certificato.
- `src/ui/idleVillage/frozen/registry.ts` — entry `clockKit` con status `certified`.
- `src/pages/minimal-clock.tsx` — pagina di riferimento.

---

## 19. Fasi d'esecuzione

Ogni step produce uno stato verificabile.

1. **Congelare il piano.** Approvazione del `world_surface_v3_tactical_plan.md` v2.2 da parte del Director; `RICHIESTE.md` e `kanban:lint` aggiornati.
2. **Consolidare contratto centrale.** Estendere `src/ui/idleVillage/config/worldSurfaceConfig.ts` con `LayerBudget`, `AttentionZone`, `EventSeverity`, `ReactionConfig`, `BreathConfig`, `ParallaxConfig`, `SeasonModifier` con Zod + referential validation.
3. **EffectAdmissionController.** Implementare `EffectAdmissionController.ts` puro + unit test (no React/Pixi).
4. **AttentionZoneResolver.** Implementare resolver puro + hook sottile di input + test RTL e demo su `/world-surface-v3`.
5. **EventSeverityResolver.** Implementare `WorldEventSeverity.ts` puro + `PresentationPolicy` + unit test.
6. **Event lifecycle FSM.** Implementare `eventPresageSystem.ts` con stati espliciti + test.
7. **Wonder spawner + pool.** Implementare `wonderSpawner.ts` con seeded RNG (Mulberry32) e object pool + test.
8. **Demo verticale.** `/world-surface-v3` dimostra: market hover → sussurro; Storm Tier 1; Goblin Invasion Tier 3 mockata.
9. **Breath e parallax.** Consolidare `useBreathAnimation.ts` e `useParallax.ts` con i valori di config e stagioni.
10. **Underwater V3.** Implementare `useUnderwaterSystem.ts` ridotto (surface + silhouette).
11. **Documentazione.** Aggiornare `world_surface_v3_strategic_plan.md` e `COMPONENT_MASTER_INDEX.md` se tocca contratti.
12. **Safeguards.** `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run kanban:lint`.

---

## 20. Testing plan

Ogni sistema ha test dedicati.

### Unit test

- `WorldSurfaceV3Budget.test.tsx` — verifica che `EffectAdmissionController.ts` blocchi effect cost > budget, gestisca la coda, e rispetti il background throttling detection.
- `WorldSurfaceV3Attention.test.tsx` — verifica che `useAttentionZone.ts` emetta `zone_observed` dopo il dwell, rispetti cooldown, cancelli su leave/drag/pan/zoom, e gestisca zone sovrapposte (smallest wins).
- `WorldSurfaceV3Severity.test.tsx` — verifica che `WorldEventSeverity.ts` mappi correttamente gli eventi noti ai tier, applichi il cap Tier 3, e gestisca de-escalation.
- `WorldSurfaceV3Events.test.tsx` — estendere per coprire la FSM a 4 fasi.
- `WorldSurfaceV3Wonders.test.tsx` — estendere per seeded RNG, spawn rate, eligibility, e object pool.
- `WorldSurfaceV3Underwater.test.tsx` — estendere per surface ripple e silhouette (V3 ridotto).
- `WorldSurfaceV3Config.test.tsx` — parsing Zod negativo per ogni schema e cross-reference invalide.

### Test aggiuntivi (da review multi-AI)

- fake timers per dwell, cooldown, rientro tab e lifecycle;
- seed snapshot: stesso seed + tick + world state = stessa selezione;
- proprietà: nessun scheduler genera più di un heavy effect o una wonder concorrente;
- E2E pointer leave/return, zoom durante dwell, drag sopra hotspot, `prefers-reduced-motion`;
- visual regression per Tier 0–3 a 1080p e DPR 1/2;
- test di degradazione qualità con frame times sintetici;
- test che un Tier 3 non venga perso dal fallback low-spec;
- test telemetry: emissione una sola volta, sampling/rate limit, nessun timestamp o identificatore superfluo;
- test GC/pool wonders: nessuna nuova allocazione Pixi per wonder ripetute;
- test polling no-rerender: il 99% dei tick non produce re-render;
- smoke manuale Tauri con p95, heap/texture estimate, avvio a freddo e 20 minuti di idle.

### E2E / demo

- `/world-surface-v3` deve dimostrare: parallax, breath animation, almeno una AttentionZone reaction, un evento Tier 1 e un Tier 3 mocked.

---

## 21. Telemetry

Eventi da tracciare (se presente sistema analytics):

- `attention_zone_observed` — `{ zoneId, trigger, timestamp }`
- `wonder_spotted` — `{ wonderId, biome, timestamp }`
- `event_tier_assigned` — `{ eventId, tier, timestamp }`
- `event_presaged` — `{ eventId, phase: 'presage' }`
- `event_active` — `{ eventId, phase: 'active' }`
- `event_tier_degraded` — `{ eventId, fromTier, toTier, reason }`
- `budget_violation` — `{ reason, activePixiObjects, effectCost }`
- `heavy_effect_queued` — `{ effectId, type, priority }`
- `heavy_effect_dropped` — `{ effectId, reason }`

**Nota:** telemetria wonders senza consenso/provider e senza schema tipizzato è debito, non osservabilità. Definire schema tipizzato prima dell'implementazione.

---

## 22. Performance budget e Tauri

Il target è Tauri desktop. Il rendering resta WebView, ma il bundle non è una tab browser e può tenere il frame rate più stabile.

### Target iniziale (placeholder da profilare)

- Hardware: desktop mid-range (es. 8GB RAM, GPU integrata o entry-level).
- FPS: 60 stable, min 45.
- Memoria render: < 200 MB (offline profiling only, non runtime hard threshold).
- Bundle World Surface: chunk iniziale ≤ 250 KB gzip; overlay Pixi lazy-loaded; asset critici iniziali ≤ 4 MB compressi.
- Active Pixi objects: < 150 (placeholder da calibrare con profiling reale).

### Profilazione

- Step iniziale: `EffectAdmissionController.ts` logga `activePixiObjects`, `effectCost`, `frameTimeP95` ogni secondo in dev.
- Thresholds: se `effectCost > maxEffectCost`, logga `budget_violation`.
- Misurazione su hardware target prima di accettare nuovi effetti.
- Matrice WebView: macOS WKWebView, Windows WebView2, Linux WebKitGTK se supportato. "Tauri desktop" non è un singolo renderer.

### Rischio compositing

PixiJS usa un canvas WebGL. Su Tauri/WebView, se ci sono altri elementi DOM con `transform: translateZ(0)` o `will-change: transform` (molto probabili in un RPG idle con animazioni CSS), il browser può creare layer compositing multipli che competono per memoria GPU. Mitigazione: limitare `will-change` solo agli elementi che lo necessitano davvero, testare con Chrome DevTools Layers panel su Tauri, verificare che il canvas PixiJS sia in un solo stacking context isolato.

---

## 23. Content backlog (separato)

### Prerequisiti tecnici da risolvere prima dell'implementazione

- Catalogo biomi (fatto in §15).
- Stagioni minime (fatto in §16).
- Audio cue framework (struttura, non contenuto).
- Persistence keys per AttentionZone (fatto in §9).
- Single coordinate space (fatto in §17).
- World Clock / TimeEngine adapter (fatto in §18).

### Feature future da pianificare separatamente

- Lista completa dei biomi e delle loro creature ambientali.
- Stagioni avanzate e come influenzano breath, particles, events.
- Audio design: cue per ogni tier, ambient loop per bioma.
- Narrativa delle wonders: perché il Kraken appare? C'è una lore?
- Interazione del giocatore con le wonders: possono essere fotografate? C'è un "bestiario"?
- Reazioni del mondo ai progressi del giocatore: più villaggi = più life?
- Eventi concatenati: Goblin Raid può diventare Invasion se non affrontato?
- Underwater completo (V4).
- Observation-chain trigger (V4).

---

## 24. Domande aperte

- Quale trigger principale per le AttentionZone? `camera-enter` o `pointer-dwell` o una combinazione (dipende da test UX).
- Se il budget va adattato a bassa potenza o è fisso.
- Se i tier eventi influenzano anche la UI esterna alla mappa.
- Se le wonders hanno un minimo di lore o sono puramente visive.
- Se il sistema di AttentionZone richiede una desiderata separata per il "bestiario delle scoperte".
- Se "chiudere il run" (Tier 3) è davvero voluto, data la tensione con il Pillar 2 (non punire con perdite definitive). Serve una decisione di gameplay esplicita.
- Se il World Clock / TimeEngine deve essere esteso per supportare `WorldClock.now()` come fonte unica di tempo per tutti i sistemi World Surface.

---

## 25. Guardrails

- **YAGNI:** nessun nuovo renderer o motore oltre lo scaffold V3; Pixi resta l'overlay dinamico.
- **Config-first:** tutti i numeri, nomi e soglie vivono in config Zod, non nel codice.
- **i18n:** ogni stringa user-facing passa da `react-i18next`, namespace `idleVillage`.
- **Telemetry:** schema tipizzato prima dell'implementazione.
- **Tauri:** profilare su target desktop, non supporre GPU high-end.
- **Component reuse:** prima di creare nuovi componenti UI, verificare se esiste già in `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`.
- **React non deve re-renderizzare a 60 FPS:** per CSS/DOM, custom properties aggiornate al massimo in `requestAnimationFrame`, idealmente animazioni CSS compositor-only. Per Pixi: ticker unico. Mai un hook/timer per layer o particella.
- **Frozen kit reuse:** il World Clock è già un frozen kit certificato (`clockKit`); importarlo con una singola riga, non ricrearlo.

---

## 26. Changelog

| Data | Autore | Modifica |
|---|---|---|
| 2026-08-12 | Strategy-Lead | Piano tattico iniziale per budget, trigger, tier eventi. |
| 2026-08-12 | Strategy-Lead | Espansione completa con catalogo layer, breath, parallax, event lifecycle, wonders, underwater, particles, AttentionZone, EventSeverity, struttura file, testing, telemetry, performance budget, content backlog, domande aperte. |
| 2026-08-12 | Strategy-Lead | Integrazione review multi-AI (ChatGPT Web, Claude Web, Codex): scope P0 ridotto, LayerBudget con cost class, 80/15/5 come attention budget temporale, World Attention Director, AttentionZone camera-first con state machine, EventSeverity con FSM e de-escalation, object pool per wonders, catalogo biomi e stagioni come prerequisiti, underwater ridotto V3, observation-chain rimosso, backlog separato, background throttling detection, i18n race condition, compositing risk, single coordinate space, ownership contratto centrale. |
| 2026-08-12 | Strategy-Lead | Integrazione Gemini Web e Claude Web (full): Engine Pipeline Pattern, QuadTree/spatial indexing, hover intent tolerance, texture warmup, background pause, HiDPI scaling, preemption matrix, wonder timeline, catalogo biomi con ambient life, FrameBudget/quality profiles, World Clock frozen kit, correzioni FSM, Tier 3 de-escalation, persistence keys, testing aggiornato. |
| 2026-08-13 | Strategy-Lead | Decomposizione del piano in 9 sub-plan draft (A–I) con classificazione `strategist` di Mind Weaver e contesto mandate RPG, indice in `world_surface_v3_subplans_index.md`, pronti per delibera multi-AI sul nodo A. |
