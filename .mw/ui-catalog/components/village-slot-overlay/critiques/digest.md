# Digest critiche — village-slot-overlay (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-village-slot-overlay`,
turn T-001 (+retry T-002 per claude e chatgpt), prompt verbatim R-282, 3 shot
allegati (ctx-a, ctx-b, iso-0).

**Provider failure dichiarati:**
- chatgpt — 3ª image-perception failure del giorno: `image_attached: 3` ma il
  modello dichiara «in questo messaggio non vedo un'immagine del componente»;
  retry T-002 fallito 2× con `ATTACH_FAILED no upload affordance found`
  (stessa conversazione e conversazione nuova). Vedi `chatgpt.md`.
- claude T-001 — risposta non caricata lato provider («Questa risposta non è
  stata caricata. Riprova»); recuperata su retry T-002, image-grounded.
Convergenza = 2/2 provider image-grounded (claude + deepseek).

## Convergenza forte (2/2)

1. **Contrasto/leggibilità sotto il minimo.**
   - deepseek: «Il testo bianco su sfondo chiaro (es. "VILLAGE 6 of 16 built")
     è un errore da principianti… il contrasto deve essere almeno 4.5:1. Qui
     siamo ben sotto».
   - claude: «la legenda in beige a 11px sta su una pillola semitrasparente
     sopra erba e fiume… 4.5:1 per il testo».
2. **Gli indicatori di stato non comunicano stato.**
   - deepseek: «I cerchi tratteggiati… non comunicano lo stato. Un edificio è
     in produzione? È bloccato? L'utente deve indovinare».
   - claude: «Le ellissi tratteggiate sembrano debug… non distinguono slot
     liberi, footprint o hitbox» + «la legenda ha tre stati, ma ne mancano
     due: costruibile ma non me lo posso permettere e bloccato».
3. **UI incollata su un dipinto, non integrata.**
   - deepseek: «un dipinto meraviglioso con sopra incollati elementi UI di un
     prototipo, non un sistema di gioco coeso».
   - claude: «La scena è un rettangolo incollato… i blu e i verdi saturi del
     dipinto litigano con il navy desaturato della UI».
4. **Nessun affordance/feedback.** deepseek: i bottoni «non danno alcun
   feedback di "premuto" o "selezionato"»; claude: «non vedo né hover, né
   focus ring, né selezione, né tooltip».
5. **Rimedi concordi**: fondo scrim/solido dietro testo e pin (deepseek:
   pannello nero 70%; claude: alone scuro + ombra su ogni pin), encoding di
   stato esplicito e multicanale, target/font più grandi.

## Disaccordi / punti di un solo provider (verbatim)

- **Stack di proposta** — deepseek scrive codice **Godot 4/GDScript**
  (StyleBoxFlat, Node2D): engine-mismatch col progetto React/TS, concetti
  trasferibili ma codice non applicabile. claude propone React/TSX+CSS.
- **Pin senz'ancora** — solo claude: «I pin galleggiano, senza ancora…
  non so a quale edificio appartengano» → stelo + ombra a terra.
- **Conti che non tornano** — solo claude: «"6 of 16 built", io sulla scena
  conto circa 11 pin. "REGISTRY 10" sembra un badge di notifica».
- **Risorse = battito del gioco** — solo deepseek: gerarchia risorse come
  P0 («devono essere lette in un millisecondo»); claude non lo tratta.
- **Pin hero legato alla crisi** — solo claude: stato `unaffordable` e pin
  prioritarizzato sulla risorsa critica (food a −6/giorno).
- **Naming diegetico** — solo claude: «"Registry" è un termine da software,
  in un gioco fantasy stona».
- **Scala prospettica** — solo claude: i pin lontani «diventano inclickabili»
  → min 34px, hit area 44px indipendente dalla grafica.

## Quick-wins vs Structural

- Quick-wins: scrim dietro legenda/testi; stato attivo a >1 canale; glifi
  visibili nei medaglioni; un solo linguaggio di marker; rimuovere ellissi
  permanenti (mostrarle solo hover/selected).
- Structural: modello stati pin (built/buildable/unaffordable/locked + hero),
  integrazione scena-UI (vignetta/mask), filtri di livello al posto della
  legenda, navigazione spaziale da tastiera.

## Note di grounding

- claude (T-002): fatti corretti — medaglioni neri ~40px, chevron laterali,
  bandiere gialle, "6 of 16 built", Food 2/20 −6/giorno, hotkey R/Esc/frecce.
- deepseek (T-001): fatti corretti — "VILLAGE 6 of 16 built", cerchi
  tratteggiati, tab Village/Map/Workshop/Tavern.
