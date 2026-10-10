# Plan — accoppiare nuvole e ombre su PixiWorldMap

Bug piccolo, un solo file: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`.

## Cambio

1. **Blocco `fxOn.cloudShadows`**: diventa solo infrastruttura — container
   `shadowLayer` (stesso z-index, sopra i layer di terreno) + baker silhouette
   riusato dal codice attuale. Via il loop che creava 16 sprite deterministiche.
2. **Blocco `fxOn.clouds`**: il pool di ogni banda carica anche la `shadowTex`
   bakeata (cache condivisa). `birthCloud` crea la nuvola E la sua ombra
   accoppiata (stesso `t0`, stessa `w`, stessa `y`):
   - `sh.anchor = 0.5`, `sh.scale` da `c.w / (baked.width - 4*BLUR)`.
   - Per frame: `sh.x = sp.x + cloudShadowOffset.x`,
     `sh.y = sp.y + cloudShadowOffset.y`, morph scale/rotation specchiati,
     `alpha = (cloudShadowOpacity ?? band.shadowOpacity) * formed`.
   - Morte della nuvola → destroy dell'ombra nello stesso splice.
   - L'ombra NON eredita `shown` (cloud-clear sui POI): la nuvola esiste ancora.
   - Le ombre stanno in UN container condiviso senza parallasse (sono al suolo),
     aggiunto a `world` dove stava il vecchio layer.
3. `fxOn.cloudShadows && !fxOn.clouds` → layer vuoto: niente ombre orfane.

## Verifica

- Puppeteer `/game?capture=1`: ogni blob scuro ha una nuvola sopra (offset
  +90/+140), e le nuvole hanno ombra; confronto su più frame.
- Safeguard: `npm run lint -- src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`,
  `npm run test -- pixiSpike|worldSurface`, `npm run build:check`,
  `npm run kanban:lint`.
