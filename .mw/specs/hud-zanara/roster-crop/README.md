# Roster ritagliato da zanara-v2: test (2026-11-02)

Ipotesi: si arriva a "identico" se i pixel della cornice vengono dal mockup e il contenuto
è live, non se si rigenera ogni pezzo.

- Script: `scripts/hud-roster-crop.py` (riproducibile; geometria misurata, niente stime a occhio)
- Asset: `public/mockups/hud-lab/roster-crop/` (`top-cap`, `row-tile`, `bottom-cap`, `mount.json`; `ref/` serve solo come riferimento)
- Componente: `src/pages/hud-lab/spikes/RosterCropSpike.tsx` (`RosterCropColumn`)
- Pagina: `/hud-roster-crop`, con mockup | ricostruzione (ritratti del mockup) | versione viva su mappa (7 eroi, scroll). Modalità side/overlay/diff, zoom 1–2×
- Evidenza: `side-by-side.png` (Playwright headless, DPR 2)

## Misure
- Passo tra le righe 94 px (anelli rilevati con Hough a y 274/368/460/556); foro del ritratto r=35 centrato in (86.8, 47.1), ricavato dal fit del bordo interno d'oro (R=36.8)
- Riga Kael, cornice (alpha=255) contro il mockup: MAD 2.6/255. Righe 2–4: MAD ≈30, perché il mockup disegna ogni riga in modo diverso; qui la tile viene ripetuta
- Testo: le estensioni dei glifi di nome e livello coincidono al pixel con il mockup (nome y 259–269 x 144–168; Lv y 279–286)
- Testa (emblema): MAD 0 nei pixel tenuti

## Limiti aperti
- Scontorno della testa (emblema + ala): la maschera geometrica lascia tagli netti (tacca in alto a destra, taglio a x=196 dove inizia la placca WANDERLUST) e ciuffi dell'ala spezzati. Serve una maschera fatta a mano o un modello di matting
- Coda: arricciolo sinistro della banda parziale
- Risoluzione 1:1 col mockup (scala 0.957 nello spazio 1600×900): sopra 1080p sarà morbido, l'upscale non è ancora fatto
- Mancano: bottone di espansione, indizio di scroll, stati hover/focus (non sono nel mockup, quindi non li ho inventati), i18n di "Lv.", binding allo store
