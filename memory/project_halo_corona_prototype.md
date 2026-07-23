---
name: halo_corona_prototype
description: Prototipo corona halo con macchina a 3 stadi (calm/alert/critical) per POI a tempo; testato nel lab
metadata:
  type: project
---

## Stato: ✅ Trapianto completato, pronto per commit e prossima fase (particelle)

### Completato
**Fase 1 — Prototipo nel lab:**
1. **HaloCorona.tsx** — componente prototipo con 3 stadi monotòni:
   - Calm (>50%): colore base, no rotation
   - Alert (≤50%, >15%): transizione colore + CCW rotation + medium pulse
   - Critical (<15%): colore max + CCW rotation + aggressive pulse + tremor
   - Fill antiorario da top (12 o'clock) verso basso
   - Perf-gated via data-perf-tier, respects prefers-reduced-motion

2. **HaloCoronaLab.tsx + HaloCoronaTestPage.tsx** — stazione di test nel lab
   - Timer simulato 30s ciclo + pause/play controls
   - Debug panel live (remaining %, stage, pulse intensity)
   - Verificato: transizioni smooth tra CALM → CRITICAL

3. **Palette-per-tipo (poiMedallionRecipe.ts)** — ricetta isolata, additiva:
   - Quest → Ambra (218,165,32)
   - Event → Brace (200,70,80)
   - Job → Verderame (100,150,80)
   - Activity → (rimossa, tipo non valido)
   - getPoiPalette(cardKind) → (base, alert, critical, glow) per stadio

**Fase 2 — Trapianto in GenericPoiSkin (ora):**
1. **expiryStageEngine.ts** — motore riutilizzabile per escalation monotòna
   - `getExpiryStage(fraction)` → 'calm' | 'alert' | 'critical'
   - `computeStageState(fraction, palette)` → color + rotation + pulse per stadio
   - Separato dalla logica del componente, testabile indipendentemente

2. **GenericPoiSkin.tsx** — integrazione:
   - Rimossi tick ring + dot cardinali (riga 458-472)
   - Sostituita logica di scadenza con `computeStageState()` (riga 155-171 orig)
   - Aggiunta prop `cardKind` per mappare a palette-per-tipo
   - Aggiunta prop `totalDurationMs` (default: 60000 per backwards-compat)
   - Updated dependency array per `stageState` nella rAF loop

3. **Test verificati:**
   - HaloCoronaTestPage: 3 stadi visivi confermati (calmo → allerta → critico)
   - MinimalPoiPage: GenericPoiSkin carica senza errori, POI renderizzati

### Decision log
- **Quando arriva a zero**: POI triggera evento, non sparisce passivamente ✅
- **Ready state**: halo pieno + pulse leggero (implementato) ✅
- **Clock**: eredita estetica corona, logica separata (non countdown) ✅
- **Particelle**: perf-gated solo su hover/selected ← prossimo spike dopo corona stabile
