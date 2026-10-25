# Digest critiche — settlement-lost-overlay (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-settlement-lost-overlay`, turn T-001 (+retry T-002
chatgpt), prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati (2/3):**
- chatgpt — `ATTACH_FAILED` su T-001 e T-002. Pattern persistente del
  giorno (upload affordance non raggiungibile / quota free-tier).
- claude [RECUPERATO v. merge] — T-001 `POSTED` con `image_attached: 2` ma generazione mai
  partita: collect scaduto ("response did not stabilize"); DOM del bundle
  verbatim «Hai raggiunto il limite di messaggi di 5 ore. Verrà
  ripristinato alle ore 12:20». Cap quota, dichiarato.

**Convergenza = n/a (solo deepseek grounded).** Fatti corretti: titolo
«Settlement Lost», lista «What was lost» (mura violate, eroi caduti,
scorte perse), card «Days survived / Residents lost / Gold earned»,
CTA «Begin a new settlement», sottotitolo «What was learned carries on»,
pannello «Director» a destra con «Goblin invasion / Show quest / POI
types». Risposta in italiano, ~10.7k char.

## Punti critici deepseek (unico provider)

1. **Ridondanza lista↔card (P0):** la lista testuale «ripete concetti già
   trasmessi dai numeri, creando ridondanza senza aumentare la
   comprensione» — riassunto generico valido per qualsiasi sconfitta.
2. **CTA cieca (P0):** «Begin a new settlement» senza contesto della causa
   → «premere quel bottone è un atto di fede cieca, non una scelta
   strategica». Manca la causalità della caduta.
3. **Pannello Director = sabotaggio visivo (P0):** tool debug visibile al
   giocatore, «occupa il 20% dello schermo e attira l'occhio» → nascondere
   dietro hotkey o ridisegnare; «mina l'immersione».
4. **Gerarchia tipografica/cromatica piatta:** titolo troppo piccolo per
   il peso emotivo; le 3 card identiche pur avendo implicazioni diverse —
   «Residents lost» dovrebbe dominare in rosso d'allarme.
5. **Vicolo cieco narrativo:** «What was learned carries on» promette una
   lezione mai mostrata — nessun bonus/conoscenza concreta.

## Soluzioni proposte (deepseek)

Layout 2 colonne (narrativa+causa | metriche gerarchizzate); 2 CTA
contestuali («Ricomincia con lo stesso insediamento» con malus /
«Fonda un nuovo insediamento» con tooltip know-how); debug panel nascosto
di default (toggle `showDebug`); box «Lezione appresa» concreto
(es. «Le mura di legno non reggono contro i goblin») o ricompensa
«+1 Tecnologia di difesa». Codice React + CSS completo in `deepseek.md`.

## Priorità emersa

P0: mostrare la causa della caduta, gerarchia metriche (rosso su
residents lost), nascondere Director panel. P1: CTA duale con tooltip,
«lezione appresa» concreta. P2: deduplicare lista vs card.


## Merge claude (refill T-001 su run -r2, post-reset quota 17:20)

claude GROUNDED (~13.2k chars, verbatim in `claude.md`). Fatti corretti:
titolo «Settlement Lost», lista «What was lost», tile Days survived/
Residents lost/Gold earned, CTA «Begin a new settlement», sottotitolo
«What was learned carries on».

**Convergenza (claude + deepseek)**: gerarchia piatta («quando tutto è in
caps tracciate, nulla emerge»); tile statistiche con stesso peso e numeri
piccoli; singola azione senza alternative.

**Punti solo claude** (12 punti):
- Falsi affordance: le 3 righe "lost" sembrano bottoni/input cliccabili.
- Incoerenza narrazione↔dati: «heroes have fallen» vs stats 0/0, più il
  bug «1 Days survived» (plurali rotti).
- Promessa vuota: «What was learned carries on» annuncia meta-
  progressione invisibile nella UI (la scena «Legacy» esiste nel
  Director ma non qui).
- Bottone teal-verde = «successo» semantico su schermata di sconfitta,
  e fuori palette oro.
- Mondo non reattivo: mappa viva e HUD fantasma al 20% dietro →
  desaturare/scurire/braci.
- Rischio input accidentale: serve disarmo breve del bottone.
- Focus trap WAI-ARIA assente (verificabile).
- Questione filosofica (Cage/Hades): il game over come muro vs scena.
- Rimedi: titolo grande + riga di causa concreta («Goblin raid, giorno 1,
  mura a 0 HP»), autopsia interattiva, tile con record/delta, secondaria
  «review the map», disarmo bottone.
