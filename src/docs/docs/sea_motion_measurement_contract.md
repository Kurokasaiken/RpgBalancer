# Sea Motion Measurement Contract (PLAN-013 T1)

Retro-documentato 2026-10-19 alla chiusura di PLAN-013 (Q10 di PLAN-049):
il componente e il port Pixi erano già in produzione; questo contratto
formalizza **come si misura** il requisito percettivo, così ogni futura
taratura o regressione usa lo stesso metodo.

## Requisito da misurare

- Il mare a zoom mappa (~0.33) deve risultare **"leggermente vivo"** — moto
  percepibile ma subliminale, mai una texture che scorre.
- `Mare.webp` non riceve mai transform/parallax: il moto è solo delle mark.

## Metodo (finestra 100 ms)

1. **Campionamento opacità:** per ogni `.ws-sea-mark` (DOM) o mark sprite
   (Pixi), leggere `opacity`/`alpha` ogni ~100 ms su una finestra ≥ 2.5 s.
   - *Pass:* almeno una mark varia di >0.01 entro la finestra — il ciclo
     cross-fade `visibleFraction` del config è live.
   - *Fail:* tutte le alpha costanti a 0 (kit spento/config disabled) o
     costanti >0 (marks permanenti: non è più "rare linee organiche").
2. **Drift:** per una mark attiva, `x`/`y` devono variare entro il suo ciclo
   entro il bound del config (`driftX`/`driftY`, 1–4 world px nominali).
   Deriva oltre ~8 world px = movimento leggibile, viola "quasi subliminale".
3. **Bounds `sea_mask`:** nessuna mark può renderizzare fuori dalla maschera
   mare (`layer.mask` su Pixi, `localMaskStyle` su DOM). Violazione = mark
   su terra — fallimento immediato.
4. **`prefers-reduced-motion`:** con media feature `reduce`, ogni mark deve
   avere alpha 0 permanente (DOM: `animation: none`; Pixi: clock `t` congelato
   a 0 — le mark non avanzano mai nel loro ciclo di fade-in).

## Esecuzione meccanica

`tests/e2e/idleVillage/seaMarks.spec.ts` implementa i punti 1 e 4 contro il
lab `/sea-effect-lab` (tile `01a/01b/01c` montano i config
coast/open/both di `seaMarksConfig`). Il punto 3 è garantito
strutturalmente dalle mask; un breach sarebbe visibile nel testimone.

## Target minimo accettabile

- Kit 20–40 mark per config (spec PLAN-013); il gate E2E fallisce sotto 20.
- `opacity` di picco = `seaMarksConfig.opacity` (attuale 0.75): una
  taratura futura sopra ~0.85 rende la mark elemento grafico, non
  "leggermente vivo" — serve nuovo gate Director.
- `cycleSeconds` (attuale 24 s per-mark): sotto ~12 s il mare "pulsa" —
  violazione percepibile della premessa.
- Drift bound (attuale ±4/±3 world px): oltre ~8 world px il movimento
  diventa leggibile — viola "quasi subliminale".

## Riferimenti

- `src/ui/idleVillage/config/seaMarksConfig.ts` — kit + timing (Zod).
- `src/ui/idleVillage/components/WorldSurfaceSeaMarks.tsx` — DOM overlay.
- `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` — port Pixi (produzione
  `/game`), stesso config.
- `public/assets/atmosphere/terrain/sea_mask.webp` — bounds autorizzati.
