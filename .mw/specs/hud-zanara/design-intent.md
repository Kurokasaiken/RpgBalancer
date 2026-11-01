# HUD Zanara — design-intent (PLAN-107, T-002)

## Intento

Portare la direzione visiva dei mockup "Zanara" (smalto smeraldo + oro antico opaco + alabastro) sui componenti reali di `/game`, come **sistema di componenti materici** — non un reskin verde-oro della HUD attuale.

## Coerenza del mix (perché questa baseline regge)

La baseline provvisoria è tutta `zanara-v1` tranne il sigillo (`mockup1-classic`, unica fonte). v1 è l'iterazione che la critica 2026-11-01 giudicava la più raffinata: smalto verde profondo, oro antico NMM, alabastro con gerarchia editoriale. Il sigillo classico condivide lo stesso vocabolario (oro, gemma, smalto) → il mix è coerente perché viene da UNA famiglia di linguaggio, non da family diverse. La sua implementazione segue le stesse regole: oro opaco, gemma incastonata, smalto scuro.

## Ruling Director (applicati)

- D-1: emblem only (riuso logo boot) — la placca testo WANDERLUST NON va in HUD.
- D-2/D-3: bussola+coords e sigillo restano, con binding funzionale reale + **animati** (amend v2: rosa dei venti e ornamenti simili hanno piccole animazioni).
- D-4: zanara preset selezionabile accanto a `base` (base = default).
- Fissi della critica: astrolabio ridotto (non più 4 ripetizioni), via decorazioni morte (forziere diventa roundels funzionali), pannello con illustrazione verticale, medaglioni differenziati.

## Vincoli materiali (non negoziabili)

- Metalli **opachi NMM**: niente trasparenze, niente specular gradienti CG.
- Niente marrone/grigio nei controlli; oro antico deve restare luminoso.
- Viola solo come accento gemma, mai superficie.
- Tipografia Cinzel + EB Garamond; ≥12px solo per elementi secondari.
- Tre layer per superficie: **cornice** (metallo: microtexture, incisioni, bevel, riflessi) / **superficie interna** (gradienti naturali, profondità cromatica) / **inserti** (gemme, vetro, smalto indipendenti).
- Nitidezza: niente sfocatura o pixel visibili alle dimensioni di produzione.

## Modalità di presentazione ornamenti (T-002, declared up-front)

| Ornamento | Modalità intesa | Binding da verificare |
|---|---|---|
| cornerBL bussola+coords | persistente | readout coordinate reali della mappa + animazione rosa |
| seal vittoria | persistente | stato legacy/vittoria reale + shimmer gemma |
| brand emblem | persistente | nessun binding (è il logo, non un ornamento) |
| nav astrolabio | persistente (ridotto) | ornamento centrale nav — animazione leggera |

Ogni elemento persistente conta nel budget 18%; floating/on-demand no.

## Animazioni (amend v2)

Piccole animazioni sugli ornamenti funzionali: rosa dei venti (rotazione/movimento ago), sigillo (shimmer gemma), gemme di stato roster (pulse leggero). Mode decise dagli spike: preferenza transform/mask CSS o shader Pixi leggero; sprite-sheet solo se necessario e dentro budget. `prefers-reduced-motion` rispettato.
