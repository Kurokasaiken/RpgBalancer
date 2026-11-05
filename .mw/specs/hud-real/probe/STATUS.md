# Probe C1 ring — stato 2026-11-02 (run plan110-probe-c1, conv app/a43296edffe393b6)

## Pipeline: FUNZIONA end-to-end
canary attach 3/3 con ruoli riconosciuti → send G-3 + 3 allegati → Gemini genera **2 varianti per send** → `scripts/hud-gen-fetch.py` (screenshot element, blob/https entrambi) → gate → ledger.

## Esiti (3 send guidati spesi, 37 rimasti/finestra)
- v1 (design=colonna intera): REJECT — testo "Seraphine" + scope drift intera colonna. FIX: design = crop di zona.
- v2 gen-4 (anello vuoto): REJECT purple 0.006 (margine eps 0.005 — probabile falso positivo su interno teal scuro)
- v2 gen-5 (anello+ritratto): **Tier-A PASS** — bello, fedele, no testo
- v3 gen-6: REJECT purple 0.006 (stesso margine)
- v3 gen-7: **Tier-A PASS** — ornamento più ricco, no testo

## Finding metodologici
1. Ogni send → 2 immagini: lo slot quota reale rende doppio.
2. Soglia viola eps: ricalibrare su anello vuoto (interno teal scuro triggera 0.006).
3. Glyph detector: falso positivo su incisioni ornamentali (tierB ok, non Tier-A — corretta la scelta di spostarlo).
4. Tier-B vs base S0-row è scope-mismatched: in pilota il base deve essere il crop di zona (E-01).
5. Pattern output stabile: 1 anello vuoto + 1 anello+ritratto per send.

## Da fare: v4 (4a guidata) + 2 senza guida + 2 slack → poi /hud-defects per l'occhio Director.

## Update — probe completata guidata (2026-11-03)
- v4: gen-7 **Tier-A PASS** / gen-8 REJECT viola 0.006 (stesso margine).
- Guidate: 3 PASS su 4 send → regola di stop SUPERATA (≥2/4). Pilota apribile.
- NON guidate: 2 tentativi falliti (risposta vuota; 1° per mismatch prompt 3-img/2-allegati, 2° con frase corretta — possibile rate-limit image-gen dopo ~6 turni) → diagnostica INCONCLUSIVE.
- Slack (7-8) non speso. Quota: window nuovo 2026-11-03, ledger + resume ok.
- Candidati PASS da vedere: gen-results/v2/gen-5.png, v3/gen-7.png, v4/gen-7.png.

## Revisione 2026-11-03 (verdetto annullato)
I PASS erano schermate della pagina (UI di Gemini dentro l'immagine); v3/gen-7 = v4/gen-7 (stesso sha256). Originali scaricati in `originals/` con `scripts/hud-real/harvest-originals.mjs`. Resa alta, ma struttura derivata: anello K1 di riferimento incollato come anello esterno; frammento della riga sotto. Correzioni in PLAN-110 §13.5 (ultima voce). La probe va ripetuta dopo le correzioni.
