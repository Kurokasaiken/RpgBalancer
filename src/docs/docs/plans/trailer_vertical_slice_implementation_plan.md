---
title: Idle Village — Trailer Vertical Slice Implementation Plan
status: draft
owner: Cascade
last_updated: 2026-07-13
description: "Strategia di implementazione per il trailer da 45s Steam-first, con timebox spietato, story map, asset pipeline e domande aperte."
---

# Idle Village — Trailer Vertical Slice Implementation Plan

> **Goal:** produrre un trailer cinematografico da 45s, Steam-first, giocabile in-game via `/trailer` e capturabile per la pagina Steam.  
> **Non-goal:** non è una build giocabile, non è una nuova feature del loop Idle Village.

---

## 1. Strategic foundation

La vertical slice del trailer è un **artefatto marketing**, non un pezzo di gameplay. Deve:

- Essere **scriptata**, con seed fissi e timer deterministici.
- Usare **config-first** (`src/balancing/config/idleVillage/trailerConfig.ts`) per tempi, copy, palette e camera keyframes.
- Riusare **frozen kits** esistenti (`pgcardKit`, `slotRackKit`, `skillCheckKit`, `questPoiSkinConfig`) invece di duplicare stili.
- Avere una CTA finale per la wishlist coerente con `go_to_market_steam_first.md`.

**Pilastri creativi (Gilded Observatory):**

- **Tono:** analitico, premium, oro/avorio su obsidian.
- **Hook:** i primi 15s devono mostrare il fantasy del villaggio e del loop.
- **Payoff:** Celestial Forge + wishlist CTA.

**Research notes (online):**

- Vertical slice scoping deve separare *scope* (cosa includere) da *estimate* (quanto tempo).  
  Fonte: [New Game Plus — Scoping Your Vertical Slice](https://www.newgameplus.guide/post/scoping-your-vertical-slice)
- Una buona vertical slice include loop, level, art, UI, audio, performance e capture route.  
  Fonte: [StraySpark — Build a Real Vertical Slice](https://www.strayspark.studio/blog/game-development-tutorials-build-real-vertical-slice)
- Per i trailer indie, 60-90s è la finestra ideale; la decisione del giocatore avviene nei primi 15s.  
  Fonte: [YouthGeekers — Game Trailer Production Guide](https://youthgeekers.com/blogs/game-trailer-production-guide)
- Un workflow real-time in-engine senza Sequencer può ridurre il tempo a 15-25h per un trailer 60-90s.  
  Fonte: [StraySpark — Cinematic Game Trailer Without Sequencer](https://www.strayspark.studio/blog/cinematic-game-trailer-without-sequencer-indie-guide)

---

## 2. Story map (45s)

| Phase | Time | Viewer sees | Key components | Status |
|-------|------|-------------|----------------|--------|
| **A — Title & Loading** | `00:00–00:06` | Titolo, progress bar, villaggio vivo | `TrailerIntroPage`, `VillageBackdrop`, `TrailerProgressBar` | MISSING |
| **B — POI Map** | `00:06–00:14` | Mappa con diversi POI che compaiono; scelta di quale affrontare e quale ignorare | `PoiMap`, `PoiMapMarker`, `PoiMapRiskBar`, `PoiMapTransition` | MISSING |
| **C — Mock UI Screens** | `00:14–00:22` | Forgia, magia, eroe in montaggio | `ForgeScreen`, `HeroSheet`, `AnimatedNumber`, `MathFlash`, `MockScreenCarousel` | MISSING |
| **D — Astrolabe Ball** | `00:22–00:32` | Palla che schiva spine, loot explosion | `AstrolabeTrailerController`, `LootExplosion` | MISSING |
| **E — Forge Unlock & CTA** | `00:32–00:45` | Villaggio dissolve, forgia si alza, wishlist CTA | `VillageDissolveTransition`, `ParticleField`, `CelestialForgeUnlockAnimation`, `WishlistSign`, `PostTrailerPage` | MISSING |

---

## 3. Component inventory & timebox

> **Totale stimato: 22–25h** di sviluppo puro, più asset/copy.

### Phase A — Title & Loading (4h)

| Component | Time | Note |
|-----------|------|------|
| `VillageBackdrop` | 2h | Loop shader o immagine/video. Non è un render in-game reale. |
| `TrailerIntroPage` | 1h | Orchestratore: titolo, sfondo, progress bar. |
| `TrailerProgressBar` | 1h | Riempimento deterministico, cinematico. |

### Phase B — POI Map (4h)

| Component | Time | Note |
|-----------|------|------|
| `PoiMap` | 1.5h | Wrapper su `MapPage` con comparsa/selection POI. |
| `PoiMapMarker` | 1h | Marker POI con stati appear/selected/rejected/high-risk. |
| `PoiMapRiskBar` | 0.5h | Barra rischio per marker. |
| `PoiMapTransition` | 1h | Cross-fade / camera pan dal marker scelto al POI. |
| `PoiMapConfig` | 0.5h | Schema in `trailerConfig.ts`. |

### Phase C — Mock UI Screens (4h)

| Component | Time | Note |
|-----------|------|------|
| `ForgeScreen` | 1h | Mock UI Forgia Celeste. |
| `HeroSheet` | 1h | Scheda eroe. |
| `AnimatedNumber` | 0.5h | Numeri animati. |
| `MathFlash` | 0.5h | Finti slider/valori che lampeggiano. |
| `MockScreenCarousel` | 1h | Carosello 3 schermate. |

### Phase D — Astrolabe Ball (3h)

| Component | Time | Note |
|-----------|------|------|
| `AstrolabeTrailerController` | 2h | Script path, successo garantito, camera. |
| `LootExplosion` | 1h | Particelle dorate. |

### Phase E — Celestial Forge & CTA (6h)

| Component | Time | Note |
|-----------|------|------|
| `VillageDissolveTransition` | 2h | **Timebox 2h.** Se shader WebGPU diventa troppo, fallback a transizione video/post-produzione. |
| `ParticleField` | 1h | Campo particelle oro/avorio. |
| `CelestialForgeUnlockAnimation` | 2h | Edificio che si alza e si illumina. |
| `WishlistSign` / `SteamCTA` | 0.5h | End-card con copy wishlist. |
| `PostTrailerPage` | 0.5h | Orchestratore finale. |

### Phase F — Integration & QA (2h)

| Task | Time | Note |
|------|------|------|
| `/trailer` route + timer | 0.5h | Deterministic state machine. |
| `/trailer-phase-a` ... `/trailer-phase-e` routes | 0.5h | Per review isolate. |
| Storybook stories | 0.5h | Una per fase + full. |
| Capture / visual regression | 0.5h | Playwright o OBS. |

---

## 4. Implementation roadmap

### M0 — Scope lock (0.5–1h)

- [ ] Confermare risposte alle **Domande aperte** qui sotto.
- [ ] Congelare inventory existing vs missing.
- [ ] Creare `src/balancing/config/idleVillage/trailerConfig.ts` con timing, copy, seed, palette, camera keyframes.
- [ ] Kick-off asset list (audio, copy, placeholder art, Steam link).

### M1 — Phase A (Title & Loading)

- [ ] Implementare `VillageBackdrop`, `TrailerIntroPage`, `TrailerProgressBar`.
- [ ] Route `/trailer-phase-a`.
- [ ] Visual regression: `trailer-phase-a`.

### M2 — Phase B (POI Map)

- [ ] Implementare `PoiMapConfig`, `PoiMap`, `PoiMapMarker`, `PoiMapRiskBar`, `PoiMapTransition`.
- [ ] Route `/trailer-phase-b`.
- [ ] Visual regression: `trailer-phase-b`.

### M3 — Phase C (Mock UI Screens)

- [ ] Implementare `ForgeScreen`, `HeroSheet`, `AnimatedNumber`, `MathFlash`, `MockScreenCarousel`.
- [ ] Route `/trailer-phase-c`.
- [ ] Visual regression: `trailer-phase-c`.

### M4 — Phase D (Astrolabe Ball)

- [ ] Implementare `AstrolabeTrailerController` e `LootExplosion`.
- [ ] Configurare percorso scriptato, spike avoidance, successo garantito.
- [ ] Route `/trailer-phase-d`.
- [ ] Visual regression: `trailer-phase-d`.

### M5 — Phase E (Forge Unlock & CTA)

- [ ] Implementare `VillageDissolveTransition`, `ParticleField`, `CelestialForgeUnlockAnimation`, `WishlistSign`, `PostTrailerPage`.
- [ ] Route `/trailer-phase-e`.
- [ ] Visual regression: `trailer-phase-e`.

### M6 — Full integration & capture

- [ ] Wire `/trailer` con timer deterministico.
- [ ] Storybook stories per ogni fase e per il trailer completo.
- [ ] Capture video (Playwright o OBS) e consegna per Steam.
- [ ] Eseguire `npm run build:check`, `npm run lint -- src/ui/idleVillage/trailer`, `npm run test:unit`.

---

## 5. Asset pipeline

| Asset | Stato | Note |
|-------|-------|------|
| **Copy / timing** | Da creare | `trailerConfig.ts` deve essere single source of truth. |
| **Musica** | Da definire | Traccia 45s oppure loop. Se mancante, usare royalty-free placeholder. |
| **SFX** | Da definire | Click, success astrolabio, unlock forgia, CTA. |
| **Village backdrop** | Da creare | Shader semplice o immagine/video loop. |
| **Celestial Forge asset** | Da creare | Illustrazione/animazione edificio. |
| **Wishlist copy** | Da definire | Deve essere localizzato EN/IT + top 3 regioni target. |
| **Steam page link** | Da definire | Necessario per CTA. |
| **Key art / capsule** | Da definire | Per Steam, ma non necessario per la slice. |

---

## 6. Risk & escalation

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| `VillageDissolveTransition` in WebGPU diventa troppo costoso | Over-time | Timebox 2h, poi fallback a transizione video/post-produzione. |
| `PoiMap` diventa troppo articolata | Over-time | Fissare 3 POI in posizioni statiche; niente animazioni complesse. |
| Asset audio/arte non pronti | Blocco | Placeholder royalty-free e palette del trailer. |
| Performance < 60fps | Trailer non fluido | Profilare prima di aggiungere particelle; usare `will-change` e layers. |
| Wishlist copy non localizzato | CTR inferiore | Scrivere EN/IT/DE/FR prima del lock. |

---

## 7. QA & capture

- **Per fase:** route `/trailer-phase-<a-e>` per review rapida.
- **Storybook:** una story per fase + una story `/trailer` completo.
- **Visual regression:** Playwright spec per ogni route (`tests/visual/trailer-phase-a.spec.ts` etc.).
- **Capture:** Playwright per screenshot/video automatizzato, o OBS per capture manuale.
- **Safeguards:** `npm run build:check`, `npm run lint -- src/ui/idleVillage/trailer`, `npm run test:unit`.

---

## 8. Telemetry

- `trailer_phase_completed` (phase id, timestamp, duration).
- `trailer_wishlist_cta_shown` (opt-in, quando la CTA è visibile).
- Flag `TRAILER_TELEMETRY_ENABLED` in `trailerConfig.ts`.

---

## 9. Decisions (locked)

| # | Question | Decision | Note |
|---|----------|----------|------|
| 1 | Output finale | **Video da montare in post-produzione** | `VillageDissolveTransition` può essere un overlay semplice; il capture finale viene montato esternamente. |
| 2 | Node map vs. lista | **POI Map** | Né node map né lista; si implementa una mappa con POI che compaiono e si sceglie quale affrontare. |
| 3 | Asset audio | **Placeholder royalty-free** | Traccia/SFX generici finché non arrivano asset finali. |
| 4 | Celestial Forge asset | **Da creare da zero** | Nessun asset esistente; si costruisce un placeholder stilizzato con la palette del trailer. |
| 5 | Copy CTA | **Placeholder** | "Wishlist on Steam" / "Coming Soon" — da sostituire quando il copy è approvato. |
| 6 | Deadline | **Nessuna milestone hard** | Si seguono i timebox del piano; se una deadline emerge, si ri-prioritizza. |

## 10. Open points

- Quando il copy CTA è pronto, sostituire placeholder in `trailerConfig.ts`.
- Se la deadline cambia, rivedere timebox in `§3`.

---

## 10. Related docs

- [Trailer Vertical Slice Plan](trailer_vertical_slice_plan.md)
- [Trailer Vertical Slice Tasks](trailer_vertical_slice_tasks.md)
- [Go-To-Market Steam First](../strategy/go_to_market_steam_first.md)
- [MASTER_PLAN.md](../MASTER_PLAN.md)
