# Bug — /game: nuvole senza ombre, ombre senza nuvole

**Data:** 2026-10-10
**Segnalato da:** Director (verbatim)

> "in /game ci sn nuvole senza ombre (soprattutto sul terreno nn ne vedo MAI, ma
> solo sul mare) e ombre senza nuvole (sempre e solo sul mare?)."

## Sintomi

1. **Nuvole senza ombre**: nuvole che attraversano la mappa senza un'ombra al
   suolo. Sul terreno le ombre non si vedono MAI.
2. **Ombre senza nuvole**: macchie scure alla deriva (tipicamente sul mare, dove
   sono più leggibili) senza nessuna nuvola sopra.

## Riproduzione

1. `npm run dev` → `http://localhost:5173/game` (o `?capture=1` per shot pulito).
2. Osservare la mappa per ~30s: macchie scure vagano sul mare con nessuna nuvola
   sopra; nuvole bianche attraversano la terraferma senza ombra.
3. Verificato via Puppeteer su 2 frame a ~8s di distanza (evidence sotto).

## Comportamento atteso

Ogni nuvola proietta la sua ombra al suolo, offset fisso dall'illuminazione
(`cloudShadowOffset`, luce da nord-ovest): la coppia nuvola↔ombra è 1:1 e si
muove insieme. Commento nel codice stesso: *"Clouds: the same bands as their
shadows, drifting above everything"*.

## Comportamento effettivo

In `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` nuvole e ombre sono **due
sistemi indipendenti**:

- **Ombre** (blocco `fxOn.cloudShadows`, ~r.800-846): 16 sprite deterministiche,
  una per entry `band.sprites`, fase fissa `s.delaySeconds`, `y = s.y +
  cloudShadowOffset.y` fisso, larghezza fissa. Replay all'infinito.
- **Nuvole** (blocco `fxOn.clouds`, ~r.1141-1230): sistema random — sprite
  scelto a caso dal pool, `y` random in `[yMin..yMax]` + jitter, larghezza
  `±10%` random, `t0` random (seed iniziale `2×pool` + nascite continue).

→ Nessuna nuvola corrisponde mai a un'ombra: 100% delle ombre è "senza nuvola"
e 100% delle nuvole è "senza ombra". Strutturale, non probabilistico.

## Perché "solo sul mare"

- Le ombre ci sono anche sulla terra (misurato: 60-80% delle bande Y delle ombre
  è su `land_mask`), ma il dipinto terroso è scuro/affollato → una macchia
  `#0b1a14` al 42% si legge solo sul mare piatto e uniforme.
- Senza la corrispondenza nuvola↔ombra il cervello non attribuisce la macchia a
  "ombra di nuvola": il movimento accoppiato è ciò che vende l'effetto.
- Inoltre il bake delle silhouette è forte (alpha core ~255, `cloudShadowOpacity
  0.42`), quindi sul mare le macchie sono vistose.

## Evidenza

- Frame Puppeteer `game-loaded` / `game-frame2` (1400×900, `?capture=1`): blob
  scuri sul mare senza nuvole sopra; nuvole su terraferma senza ombre.
- `public/assets/atmosphere/cloud-shadows/*`: alpha core 255, 60-70% copertura.
- `land_mask.webp` (alpha channel): 60-80% terra nelle bande Y delle ombre.
- Config `/game`: `cloudShadowOpacity 0.42`, `offset {x:90, y:140}`,
  `cloudSpeed 6` (`gameFrameConfig.ts` r.435).

## File coinvolti

- `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` — blocco ombre (~800-846) e
  blocco nuvole (~1141-1230), `cloudX` (~601).
- `src/ui/idleVillage/config/generatedClouds.ts` — band/sprites (consumo: src,
  shadowSrc, width, y, delaySeconds).
- `src/balancing/config/idleVillage/gameFrameConfig.ts` — `worldDressing.motion`
  (opacity/offset/speed).
