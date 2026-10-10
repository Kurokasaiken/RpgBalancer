# Pattern candidate — constraint conflict → pin del bordo per intent

## Segnale

Fit/camera con DUE vincoli che possono contraddire: "lo sfondo deve coprire
tutto lo schermo" (floor) vs "il contenuto deve stare nell'area libera"
(fit). Quando il floor vince, il contenuto centrato sborda su entrambi i
lati e finisce sotto entrambi i chrome.

## Fix riusabile

Quando i vincoli sono in conflitto, non centrare: pinnare il bordo che il
design vuole difendere (`land.y1` su `H - insets.bottom`, per l'intent
«islands sit just above the nav») e lasciare che l'eccesso sbordi dalla
parte meno critica. Cresci i margini solo come misura accessoria: il
conflitto non ha bound, quindi serve la regola strutturale.

## Test consigliato

Viewport matrix: normale (fit ok, comportamento invariato), largo-basso
(pin attivo, bordo sud visibile), estremo (pan bound non blocca il pin).
Leggere la camera da un hook dev (`__worldCam`) invece di ispezionare
pixel.

## Caso d'uso

`.mw/bugs/2026-10-10-game-island-under-hud/` — PixiWorldMap.refit().
