---
title: World Life Pass — scheda di produzione asset per il teaser
status: Draft
owner: Lead Systems Design
created: 2026-08-11
scope: SOLO teaser trailer. Non è la roadmap del sistema completo.
related: world_surface_v3_tactical_plan.md §7 (breath), §15 (catalogo biomi), world_surface_v3_critique_and_counterplan.md
---

# World Life Pass — cosa generare adesso

## Il criterio

L'obiettivo è **un teaser**, non il sistema atmosferico completo. Quindi il criterio di
selezione non è "cosa rende il mondo vivo" ma **"cosa si vede in un'inquadratura di
otto secondi con la camera che si muove"**.

Tre cose fatte bene battono nove abbozzate. In ordine di resa-su-sforzo:

| # | Asset | Perché per primo | Chi lo produce |
|---|---|---|---|
| 1 | Nuvole (3 profondità) | Movimento su tutto il frame, parallasse gratuita, **ombre sul terreno** | AI genera, noi animiamo |
| 2 | Schiuma costiera | È il dettaglio che fa dire "l'acqua tocca la terra" | **Maschera derivata dal codice**, texture da AI |
| 3 | Uccelli | Vita animale con 60 KB di asset | AI genera i frame, il moto è procedurale |

Tutto il resto (pioggia, neve, tempesta, sottomarino, barche, Weather Director)
**non entra nel teaser.** Va in roadmap, non in produzione adesso.

---

## 1. Nuvole — priorità massima

### Cosa generare

Tre bande, una per piano di profondità. **Non sono tre varianti della stessa cosa**:
cambiano densità, scala e contrasto, perché è quello che crea la profondità.

| File | Dimensione | Contenuto | Opacità a runtime | Deriva |
|---|---|---|---|---|
| `clouds_far.webp` | 2048×1024 | velature sottili, molto diffuse, nessun bordo netto | 0.18 | 90 s / ciclo |
| `clouds_mid.webp` | 2048×1024 | cumuli medi separati, bordi morbidi | 0.28 | 55 s / ciclo |
| `clouds_near.webp` | 2048×1024 | pochi cumuli grandi, più contrasto e volume | 0.35 | 32 s / ciclo |

### Vincoli non negoziabili

- **Sfondo trasparente.** PNG con alpha, poi convertito in WebP dalla pipeline.
- **Tileable orizzontalmente**: il bordo destro deve combaciare col sinistro, altrimenti
  il loop mostra uno stacco. È la specifica che le AI sbagliano più spesso — va verificata
  affiancando due copie prima di accettare il risultato.
- **Niente ombre proprie scure**: le nuvole devono essere quasi monocrome chiare. Il colore
  glielo diamo a runtime col tint del visual state (alba/tramonto/tempesta), altrimenti
  restano bloccate su un'ora del giorno.
- Edge massimo sotto i 4096 px (limite texture WebKit — vedi Slice 0).

### Prompt di partenza

> *painterly fantasy map clouds, top-down aerial view, soft wispy cumulus, pure white and
> pale grey only, transparent background, horizontally seamless tileable, no ground, no
> horizon, no landscape, watercolour and ink illustration style*

Varianti da chiedere: **4-6 per banda**, poi si sceglie. Il costo di scartarne 5 è zero,
il costo di animare quella sbagliata è alto.

### Il moltiplicatore quasi gratuito: le ombre

Una seconda copia di `clouds_mid`, tinta scura, `mix-blend-mode: multiply`, opacità ~0.12,
sfalsata di 60-100 px e alla **stessa velocità di deriva**. Le ombre che scorrono sul
terreno sono il singolo segnale più forte di "mondo vivo", e non costano un asset nuovo.

---

## 2. Schiuma costiera — la maschera la fa il codice

### Perché è più fattibile di quanto sembri

L'ostacolo apparente è "la schiuma deve seguire la costa dipinta, e l'AI non sa dove sia".
Ma la costa **è già nel repo**: i layer isola sono PNG con canale alpha, e la linea di costa
è esattamente il bordo dell'alpha.

Quindi:

1. Uno script di build legge i 6 layer isola, estrae il bordo alpha, lo dilata di N px verso
   il mare e produce `foam_mask.webp` — una maschera in scala di grigi allineata al pixel
   con la mappa. **Nessuna AI coinvolta, nessun problema di allineamento.**
2. L'AI genera solo la *texture* di schiuma: un pattern tileable, che non deve sapere nulla
   della geografia.
3. A runtime la texture scorre e pulsa **dentro** la maschera.

### Cosa generare

| File | Dimensione | Contenuto |
|---|---|---|
| `foam_texture.webp` | 512×512 | schiuma bianca su trasparente, tileable su entrambi gli assi, grana irregolare |

> *sea foam texture, white frothy bubbles on transparent background, seamless tileable both
> axes, top-down, painterly illustration, no water colour, no background*

Serve **una sola texture**. La varietà viene dalla maschera e dall'animazione, non dall'asset.

---

## 3. Uccelli — asset minimo, moto procedurale

### Cosa generare

Un solo sprite sheet. Gli uccelli a questa scala sono silhouette di pochi pixel: il
realismo sta nel **moto**, non nel disegno.

| File | Dimensione | Contenuto |
|---|---|---|
| `bird_frames.webp` | 384×64 (6 frame da 64×64) | silhouette scura di uccello in volo, ciclo d'ala completo, trasparente |

> *simple dark bird silhouette flying, side view, 6 frame wing flap cycle in a horizontal
> strip, transparent background, minimal flat shape, no detail, no colour*

### Cosa NON generare

Traiettorie, stormi, varianti di specie. Quelli li fa il codice: 3-8 individui per stormo,
percorsi curvi, sfasamento del battito d'ala per individuo, ingresso ed uscita dal frame.
Un secondo asset di uccello non aggiunge nulla che un cambio di scala e velocità non dia.

### Regola di rarità

Dal piano §5 (80% calmo / 15% comunicativo / 5% sorprendente): uno stormo ogni **40-90 s**,
mai due contemporaneamente, mai in loop visibile. Un uccello sempre presente è decorazione;
un uccello che passa è vita.

---

## Cosa NON generare adesso, e perché

| Elemento | Perché fuori scope teaser |
|---|---|
| Pioggia, neve, tempesta | Richiedono il Weather Director per non sembrare un filtro appiccicato |
| Layer sottomarino | Merita un design dedicato — è una feature, non un effetto |
| Barche, navi, relitti | Devono seguire rotte coerenti con la geografia: sistema, non asset |
| Nebbia localizzata | Ha senso con i biomi; senza, è una macchia grigia |
| Chiome alberi separate | Richiede il **file sorgente stratificato** della mappa. Se non esiste, la strada è chiusa e resta il displacement |

---

## Ordine di lavorazione consigliato

1. **Nuvole far/mid/near + ombre** → il frame si muove, la parallasse esiste
2. **Schiuma costiera** → la costa smette di essere un bordo e diventa un confine vivo
3. **Uccelli** → il primo segno di vita animale

Dopo queste tre, il teaser ha: acqua che si muove (già fatto, displacement), cielo che
scorre, ombre che passano, costa che respira, e vita che attraversa il frame.

È abbastanza. Il resto si aggiunge man mano che gli asset arrivano — ogni nuovo layer
atmosferico costa **una entry** nella mappa di configurazione, non un refactor.
