# Asset Steam — mappa file → slot Steamworks (R-117)

> **Aggiornamento 2026-10-13:** la fonte di verità per l'upload è **`upload/`** (nomi e misure degli slot Steam attuali; vedi `PUBLISH-CHECKLIST.md`). I file in `assets/` con le misure 616×353 / 460×215 / 231×87 / 374×448 e i vecchi `0N-*.png` sono **superati** (mappa + logo, misure pre-2024).

> **Aggiornamento 2026-10-25 (R-288):** tutte le capsule con logo sono passate per `tools/capsule-brand-fix.py` — logo dipinto cancellato via blur, halo scuro + logo authored con drop shadow (leggibilità verificata a 120 px). `vertical` e `library capsule` ora usano la composizione-eroe (era panorama). Per rigenerare: `python3 marketing/steam/tools/capsule-brand-fix.py` → `assets/candidates/fixed/` → copiare in `upload/`.

Generati dalla sorgente a 3072×2049 (`public/assets/world/wanderlust/base/
layers/base_flat.graded.webp`) + screenshot in-engine 1920×1080 + logo
tipografico Cinzel (`tools/make-logo.mts`).

**Stato: candidati verificati visivamente (2026-10-10, seconda passata).**
Prima versione scartata: crop con bordi pergamena tagliati + logo clipped
(trim troppo stretto). Rigenerati da crop centrati sul villaggio, logo
ri-trimmed con margini. Restano placeholder tipografici — l'arte finale con
logo disegnato va prodotta/commissionata prima dell'upload. Le dimensioni
sono dalla checklist storica — **riverificare sulla doc Steamworks
corrente** (regola del plan: CONFIRMED solo con URL ufficiale).

## Capsule & artwork store

| File | Slot | Dim |
|---|---|---|
| `capsule-main-616x353.png` | Main Capsule | 616×353 |
| `capsule-header-460x215.png` | Header Capsule | 460×215 |
| `capsule-small-231x87.png` | Small Capsule | 231×87 |
| `capsule-vertical-374x448.png` | Vertical Capsule | 374×448 |
| `page-background-1438x810.png` | Page Background | 1438×810 |
| `event-capsule-800x450.png` | Event/Update capsule | 800×450 |

## Libreria utente (post-acquisto)

| File | Slot | Dim |
|---|---|---|
| `library-capsule-600x900.png` | Library Capsule | 600×900 |
| `library-hero-3840x1240.png` | Library Hero | 3840×1240 |
| `library-logo.png` | Library Logo (trasparente) — **authored**: placca dorata + sole centrale | 1492×1023 |
| `library-logo-1280x720.png` | (superseded — wordmark tipografico) | 1280×720 |
| `logo-trim.png` | (superseded — wordmark tipografico) | ~1000×230 |

## Icone & community

| File | Slot | Dim |
|---|---|---|
| `community-icon-184x184.png` | Community Icon | 184×184 |
| `client-icon-32x32.png` | Client Icon | 32×32 |

## Media

| File | Slot | Dim |
|---|---|---|
| `01..07-*.png` | Screenshot (min 5) | 1920×1080 |
| `about-clip-gameplay.gif` | GIF descrizione (non più referenziata nel copy R-145 — disponibile) | 640×?, 2.9MB |
| `assets/about-anim-map.gif` | GIF About — mappa viva (da map-animated.mp4) | 800px, ~6s, 2.4MB |
| `assets/about-anim-astrolabe.gif` | GIF About — animazione astrolabio completa EN | 560px, 24s, 8.1MB |
| `media/map-animated.mp4` | Carousel video | 1920×936, ~6s |
| `media/poi-quest.mp4` | Carousel video (dettaglio) | 386×364, ~14s |
| `media/astrolabe.mp4` | Carousel video — skill check/astrolabio, animazione intera EN (slam→throw→spin→snap→verdetto VICTORY) | 810×810, 24s |
| `media/medallion.png` | Medaglione eroe (componente) | PNG |
| `media/skill-check.png` | Astrolabio statico (superseded da astrolabe.mp4) | PNG |

## Manca (da produrre)

- [x] **Logo disegnato** — recuperato `Downloads/library logo.png` (placca dorata + sole, alpha nativa) → `assets/library-logo.png`; tutte le capsule rigenerate col logo authored via `make-capsule.mts`
- [ ] **Video trailer slot 1** — lo produce il Director
- [ ] Screenshot "planner con party bilanciato" (rifare, forecast ≠ 100% death)
- [ ] Shot EN con contenuto quest tradotto (o accettare IT nel frame)
- [ ] **Ruolo nominato del giocatore** — provvisorio «Hero», decisione rimandata (Director 2026-10-12): se il ruolo entra nel copy/lore va nominato in modo consistente
- [ ] **Numero di scala quest** — rimandato (Director 2026-10-12): copy usa «vast number»; valutare un numero impegnabile pre-demo
- [ ] **Steam Achievements** — confermati dal Director (2026-10-12): abilitare in Steamworks + definire lista obiettivi
- [ ] System Requirements misurati su build Tauri (togliere il placeholder dalla preview)
- [ ] Icone app .ico multi-size (da client-icon 32×32 al momento dell'exe)

## v2 (REVIEW-2026-10-12)

| Cosa | File | Come si rifà |
|---|---|---|
| Capsule/hero/logo ricavati dalla key art | `assets/candidates/from-keyart/` | ritagli da `Downloads/{Header,Small,Library} Capsule.png`, `library hero.png` (Library Hero = upscale 2.5×) |
| Screenshot EN (mappa, scelta, conseguenza, ritorno) | `assets/screenshots-v2/` | `npx tsx marketing/steam/tools/capture-v2.mts` (dev server :5173, Node 20, Chromium headed) |
| GIF 1 — offerta di quest | `assets/about-gifs-v2/gif-1-quest-offer.gif` (1.3 MB) | `tools/record-offer-gif.mts` + ffmpeg |
| GIF 2 — Astrolabio | `assets/about-gifs-v2/gif-2-astrolabe.gif` (4.4 MB) | da `media/astrolabe.mp4`, 2.5 s → +10 s |
| GIF 3 — party/forecast | `assets/about-gifs-v2/gif-3-party.gif` (2.7 MB) | `tools/record-party-gif.mts` + ffmpeg (la ripresa dura ~90 s: lenta in Chromium headed) |
| Screenshot planner con forecast | `assets/screenshots-v2/b-planner-forecast.png` | `capture-v2.mts` (viewport 1920×1080 solo per questo shot) |
