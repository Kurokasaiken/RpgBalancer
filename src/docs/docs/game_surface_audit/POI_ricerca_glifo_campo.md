# POI Sigillo — ricerca: leggibilità del glifo sul campo senza scurirlo (explorer, 2026-10-20)

Domanda del Director: «invece di scurire non c'è un'altra soluzione? fai una ricerca online con i cappelli adeguati e un prompt di ricerca potenziato».
Problema misurato (`shots/poi-brief/applied/strip-pergamena.png`): sul campo pergamena la tenda (scura) si legge; le rovine e la croce (chiare) svaniscono. Prima, sul campo quasi nero, era il contrario (PLAN-058: glifi «scuri sulla lacca»).

## Prompt di ricerca potenziato (usato per le query)

```
Ruoli: (1) art director di UI di gioco fantasy, (2) cartografo (generalizzazione e figure-ground), (3) icon designer (icone a 26–55 px), (4) esperto di accessibilità (WCAG 1.4.11, daltonismo).
Contesto: un medaglione-marker di 55 px sopra una mappa dipinta a 8 biomi. Dentro un campo circolare c'è un glifo dipinto (tenda scura, rovine chiare, croce dorata). Il campo non deve scurirsi (Director) e il glifo non va ridipinto subito. Materiali ammessi: ottone, avorio, ferro, inchiostro; niente cerchi-con-simbolo da UI kit, niente semaforo.
Domanda: quali tecniche separano un glifo del valore sbagliato dal suo sfondo senza cambiare il valore del campo? Per ogni tecnica: come funziona, costo (asset / SVG / CSS), rischi a 55 px e in scala di grigi, esempi in cartografia o in giochi.
Vincoli sulle fonti: preferire documentazione ufficiale (W3C, Esri, Mapbox, guide di accessibilità di piattaforma); marcare ciò che è deduzione; scartare pagine di spam.
Output: tabella tecnica × costo × rischio, poi test da fare sul marker reale. Nessuna scelta: opzioni.
```

## Cosa dice la ricerca (fonti verificate, poche e parziali)

- **Alone / contorno** è la tecnica standard di cartografia per staccare simboli dallo sfondo: Mapbox espone larghezza e sfumatura dell'alone ([docs Mapbox](https://docs.mapbox.com/android/maps/api/latest/mapbox-maps-android/com.mapbox.maps.extension.style.layers.generated/-symbol-layer/-companion/)); Esri difende gli aloni come parte degli standard di accessibilità, pur non amando quelli bianchi e spessi ([Esri](https://esri.com/about/newsroom/?p=474922)).
- **Contorno nella tinta dell'icona, non nero puro, più un solo punto di luce** dal lato della luce; non sovra-ombreggiare icone piccole ([Wayline, HUD pixel art](https://www.wayline.io/learn/game-ui-art/2)).
- **Ombra o contorno** come correzione per icone dal valore sbagliato; l'ombra di default può risultare dura, meglio un grigio scuro ([forum Factorio](https://forums.factorio.com/viewtopic.php?p=686424)); un'ombra leggera è usata anche da KDE per icone su sfondi chiari o carichi ([KDE](https://phabricator.kde.org/D16014?id=43040)).
- **Bordi o contorni come rimedio di contrasto** nelle linee guida Xbox; conviene renderlo configurabile ([Xbox](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/102)).
- **Soglia:** un'icona necessaria alla comprensione deve avere almeno 3:1 contro il colore adiacente (WCAG 1.4.11, tecnica [G207](https://www.w3.org/WAI/WCAG22/Techniques/general/G207)).
- **Giudicare in scala di grigi** il valore di un elemento sulla mappa ([forum ProFantasy](https://forum.profantasy.com/discussion/comment/123821)).
- **Non trovato:** un confronto diretto «glifo scuro su pergamena contro glifo chiaro su scuro». Le query hanno restituito anche pagine di spam (scartate). Perciò le opzioni qui sotto sono in parte **deduzione mia** da queste regole, non da una fonte.

## Opzioni diverse dallo scurire il campo (nessuna scelta)

| | Tecnica | Costo | Rischio |
|---|---|---|---|
| 1 | **Contorno del glifo** in una tinta scura calda (non nero), sottile; filtro SVG sul glifo | basso (SVG, nessun asset) | a 55 px un contorno >1 px impasta i dettagli (rovine, tenda) |
| 2 | **Ombra morbida** grigio-scuro caldo sotto il glifo, sul campo | molto basso (CSS) | aiuta i glifi chiari, poco quelli dorati; effetto «adesivo» se troppo forte |
| 3 | **Pozza scura locale** dietro il solo glifo (alone scuro sfumato al centro, campo chiaro ai bordi) | basso (gradiente) | si legge come un buco scuro, simile al campo scuro di prima ma con anello chiaro |
| 4 | **Valore del campo per glifo**: campo chiaro per glifi scuri, campo scuro per glifi chiari (dato nel registro icone) | medio (un campo in più per POI) | le famiglie cambiano aspetto da POI a POI; il bordo/metallo resta l'unico filo comune |
| 5 | **Ridipingere i glifi** al valore giusto (rovine più scure, croce più scura) | alto (asset, 1 ciclo per glifo) | è il rimedio pulito, ma rimette in moto il flusso icone di PLAN-058 |

Test comune da fare sul marker reale prima di scegliere: 55 px, scala di grigi, 8 biomi, rapporto glifo/campo ≥ 3:1 misurato su pixel (lo stesso calcolo del `poi-terrain-gate`).
