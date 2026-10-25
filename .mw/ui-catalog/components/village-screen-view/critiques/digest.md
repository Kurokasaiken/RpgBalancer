# Digest critiche — village-screen-view (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-village-screen-view`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 3 shot allegati (ctx-a, iso-0, iso-1).

**Provider failure dichiarati (2/3):**
- chatgpt — `ATTACH_FAILED` su T-001 e T-002 ("no upload affordance
  found"). Pattern persistente del giorno (quota upload free-tier /
  affordance non raggiungibile). Dichiarato, nessun altro retry.
- claude [RECUPERATO v. merge] — `ATTACH_FAILED` su T-001, ma la causa è di quota: il DOM del
  failure bundle riporta verbatim «Hai esaurito i messaggi gratuiti fino
  alle 12:20». Composer upload assente perché l'account è in cap fino alle
  12:20 — un retry sarebbe fallito identico. Dichiarato.

**Convergenza = n/a (solo 1 provider grounded).** deepseek è corretto sui
fatti: cita «15 GOLD», «8 / 20 FOOD» con «-6/d», «VILLAGE 6 of 16 built»,
«Day 1», i bottoni bottom-bar «VILLAGE, MAP, WORKSHOP», i cerchi
tratteggiati attorno agli edifici. Risposta in italiano, ~7k char.

## Punti critici deepseek (unico provider)

1. **Leggibilità/contrasto P0:** contatori risorse e label direttamente su
   cielo/montagne, contrasto insufficiente; icona Wood con valore 0 «quasi
   invisibile… mimetizzata tra gli alberi».
2. **Architettura informazione dispersa:** tempo a sinistra e risorse a
   destra → «ping-pong continuo» dell'occhio; «Day 1» troppo timido per
   essere la risorsa più critica di un gestionale.
3. **Semantica risorse ambigua:** «8 / 20 con il -6/d è confuso. È una
   produzione netta o un consumo?» — gerarchia tipografica + colore per
   trend (rosso negativo/verde positivo).
4. **Hotspot senza affordance:** i cerchi tratteggiati attorno agli
   edifici — «Se sono aree cliccabili, il feedback visivo è terribile. Se
   non lo sono, sono rumore visivo» → outline-glow on hover, visibili solo
   in build mode.
5. **Bottom bar "mobile-izzata":** bottoni troppo grandi/centrati/piatti
   per desktop → barra contestuale sottile, azioni dell'edificio
   selezionato vicino al punto di interesse.
6. **Gerarchia visiva piatta:** «Tutto ha lo stesso peso visivo» — manca
   uno stato di allerta (risorse in esaurimento → rosso pulsante).

## Soluzioni proposte (deepseek)

TopHUD unificata full-width (tempo | risorse | sistema) con
`bg-black/60 backdrop-blur`; ResourceItem con valore/max/trend separati;
CSS resource-container con contrasto garantito; bottom bar contestuale;
hover outline-glow + tooltip sugli edifici.

## Priorità emersa

P0: sfondo scuro solido dietro i contatori (contrasto), chiarire la
semantica di food `-6/d`, unificare tempo+risorse in una strip. P1:
stati hover/pressed dei cerchi edificio, bottom bar contestuale. P2:
indicatori di allerta per risorse critiche.


## Merge claude (refill T-002, post-reset quota 17:20)

claude GROUNDED (~19.3k chars, verbatim in `claude.md`). Fatti corretti:
risorse HUD, pin/marker multipli, ellissi tratteggiate, bande nere sopra/
sotto la scena, legenda in basso.

**Convergenza (claude + deepseek):**
- **Marker/pin illeggibili o vuoti**: deepseek citava i cerchi; claude P0
  «i marker sono il punto più debole dello schermo… glifi mancanti».
- **Ellissi tratteggiate = rumore da editor**: identico al rilievo
  dell'analisi village-slot-overlay (entrambi: marching-ants che non
  distinguono slot/footprint/hitbox).
- **Gerarchia informativa**: claude «~32% dello schermo è morto» (bande)
  + «la legenda è una confessione» (fa troppi lavori); deepseek coerente.
- **Allarme Food debole**: claude P0 «l'allarme deve urlare» —
  converge col tema risorse=survival già emerso nel catalogo.

**Punti solo claude**: ancoraggio spaziale (marker a coordinate
dell'arte via hook di fit); doppioni/icone anonime; interazione
invisibile; proposte — silhouette illuminata + dimming scena al posto
delle ellissi, doppio anello + pip livello, legenda→filtri interattivi +
hint contestuali, lint automatico del contrasto in CI.

**Rimedi tabella** (claude, P0→P1): glifi sempre pieni + forma per
categoria; via ellissi → hover silhouette; Food ≥13px + alert + azione;
doppio anello + pip, target ≥44px, focus ring teal; fasce nere → ambient
blur + scrim HUD.
