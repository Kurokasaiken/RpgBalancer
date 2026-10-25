# Digest critiche — hero-level-ceremony (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-hero-level-ceremony`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 3 shot allegati (ctx-a, iso-0, iso-1).

**Provider failure dichiarati (2/3):**
- chatgpt — `ATTACH_FAILED` su T-001 e T-002. Pattern persistente del
  giorno (upload affordance assente / quota free-tier).
- claude [RECUPERATO v. merge] — T-001 `POSTED` con `image_attached: 3` ma generazione mai
  partita: collect "response did not stabilize"; DOM verbatim «limite di
  messaggi di 5 ore. Verrà ripristinato alle ore 12:20». Cap quota,
  dichiarato.

**Convergenza = n/a (solo deepseek grounded).** Fatti corretti: tre card
level-up affiancate, valori stat con freccia («24 → 29»), label
«Damage», pulsante «Continue», font dorato sui nomi eroe, sfondo con
roster/mappa/risorse. Risposta in italiano, ~6.8k char.

## Punti critici deepseek (unico provider)

1. **Ridondanza cognitiva (P0):** «tre modali identici affiancati creano
   un muro visivo» — «stai urlando tre volte lo stesso concetto (Level
   Up)». Un giocatore esperto «vuole sapere cosa è cambiato, non vedere
   tre schermate che si sovrappongono».
2. **Interruzione del flusso (P0):** il giocatore «è costretto a cliccare
   "Continue" tre volte in sequenza, un attrito inaccettabile» — viola
   User Control and Freedom; manca un'icona "X" per chiudere la card.
3. **Delta numerico debole:** «la differenza tra il valore vecchio e nuovo
   è affidata solo alla freccia, troppo sottile per una lettura rapida» —
   serve colore d'accento (verde) + etichetta +diff.
4. **Contrasto/accessibilità:** testo secondario («Damage») in grigio
   spento su scuro, «potrebbe non superare il rapporto 4.5:1».

## Soluzioni proposte (deepseek)

Un unico `<dialog>` «Level Up Summary» con card compatte per i tre eroi
(«Il livello è un dettaglio, non un evento»); chiusura via Esc / click su
overlay / "X" con aria-label; nuovo valore in verde `#4ade80` con
`.stat-diff`; focus-visible outline oro; label stats a contrasto
migliorato (`#a0aec0`). Codice React + CSS completo in `deepseek.md`.
Sintesi: da «un "muro" che dice guardami» a «una "finestra" che dice ecco
cosa è successo, ora torna a giocare».

## Priorità emersa

P0: unificare i tre modali in un summary singolo (1 click di chiusura),
evidenziare il delta con colore+diff. P1: "X" di chiusura, gestione
focus/Esc. P2: contrasto label secondarie ≥4.5:1.


## Merge claude (refill T-001 su run -r2, post-reset quota 17:20)

claude GROUNDED (~15k chars, verbatim in `claude.md`). Fatti corretti:
tre card level-up affiancate, delta «24 → 29», label «Damage», CTA
Continue, nomi eroe in oro, roster/mappa dietro.

**Convergenza (claude + deepseek)**: gerarchia (tre card uguali, nessuna
cerimoniale), CTA debole.

**Punti solo claude** (12): «tre modali simultanee senza scrim»; stato
desincronizzato (roster dietro non riflette il level-up); nessun volto
(i ritratti mancano proprio nella cerimonia del personaggio); gerarchia
invertita; «il delta non c'è» (24→29 senza +N evidenziato); tutto-oro
inflazionato; righe stat senza icone; ordine arbitrario; CTA triplicata;
HP mescolati agli stat di classe; nessun gancio futuro (cosa sblocca il
livello); caveat su ciò che lo shot non prova (animazioni, suono).
Rimedi: scrim + pausa sim + un solo CTA + sync Roster (P0).
