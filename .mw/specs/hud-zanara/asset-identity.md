# HUD Zanara — asset-identity (PLAN-107, T-002)

Identità di ogni asset raster candidato. Un asset esiste solo se lo spike dimostra che CSS/primitive non lo riproducono fedelmente (gate v6).

## Palette canonica (per tutti gli asset)

- **Smalto smeraldo**: verde profondo saturo, superficie vetrificata — dal board `#0B5F4E`; range forest→jade nei gradienti.
- **Oro antico NMM**: `#D4AF37` base, luminoso mai brunito, riflessi controllati (niente specular lucido).
- **Alabastro**: `#E8E3D6` base, venature naturali, gamma avorio→perla→crema.
- **Gemme**: smeraldo dominante; viola `#8A5BD6` SOLO accento.
- Sfondo superfici scure: teal/smalto scuro `#0f2a35→#060f16` (continuità con `base`).

## Asset candidati (decisione finale post-spike)

| Asset | Uso | Identità |
|---|---|---|
| `enamel-microtexture` | superfici interne placche | Smalto vetrificato con micro-variazione; tileable, sottile (non rumore) |
| `gold-engraved-border` | cornici placche | Metallo inciso: bevel + filigrana + riflessi controllati; 9-slice |
| `alabaster-frame` | pannello contestuale | Cornice pietra chiara venata + bordo oro; 9-slice |
| `alabaster-inner` | interno pannello | Gradienti avorio→perla→crema naturali (testato in T-102b INSIEME alla cornice) |
| `hero-medallion` | roster | Disco oro inciso + gemme + ritratto; stati via gemma sovrapposta |
| `nav-ornament` | centro nav | Astrolabio ridotto (una sola occorrenza) — può essere CSS/svg se spike passa |
| `gem-inlay` | stati, risorse, seal | Gemme piccole incastonate; varianti colore per stato |
| `compass-rose` | cornerBL | Rosa dei venti animabile (ago mobile) — wired coords |
| `victory-seal` | seal | Sigillo oro+gemma con shimmer — wired legacy state |
| `corner-roundels` | cornerBR | Bottoni metallici incisi funzionali |
| `emblem` | brand | Emblema WANDERLUST senza testo (riuso logo boot) |

## Modalità scaling per asset

| Tipo | Regola |
|---|---|
| Cornici/placche | 9-slice: angoli+bordi mai deformati, centro tile/gradiente |
| Medaglioni/sigilli | dimensioni di produzione per uso (niente downscale>1.5×) |
| Inserti/gemme | asset nativi alla dimensione target |
| Ornamenti animati | layer separati (parte mobile isolata, es. ago rosa) |
