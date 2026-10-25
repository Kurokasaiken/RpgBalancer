# Digest critiche — quest-expedition-detail (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-quest-expedition-detail`, turn T-001 (+retry T-002
chatgpt), prompt verbatim R-282, 3 shot allegati (ctx-a, iso-0, iso-1).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` ×2 (T-001, T-002). `chatgpt.md`.
- **claude** [RECUPERATO v. merge] — quota free esaurita fino a 12:20 CET (banner verificato,
  submit disabilitato provider-side); nessun send. `claude.md`.

**Grounded:** solo deepseek (T-001 SUCCESS, 8.6k chars, italiano).
Verbatim in `deepseek.md`. Fatti corretti: layout 3 pannelli (Roster |
Marching Order 4 slot circolari | Forecast), CTA «SEND EXPEDITION»
grande e disabilitata, «Fill the required slots for an estimate»,
requisiti STR/PER, icone ruolo (corona Leader, cappello Fighter, lente
Scout), «DANGER HIGH».

## Niente convergenza misurabile

Un solo provider grounded; i temi sotto sono della singola critica.

## Punti della critica (deepseek, 1/1) — "5 peccati capitali"

1. **Fitts ignorata: slot piccoli, CTA enorme ma morta.** «I quattro
   slot circolari sono piccoli e distanziati, mentre il bottone SEND
   EXPEDITION è gigantesco ma permanentemente disabilitato e grigio» —
   il feedback deve seguire l'azione; slot decorativi, CTA «blocco di
   cemento».

2. **Ping-pong oculare.** «Per capire se un personaggio è adatto:
   guarda roster a sx → clicca sperando nei dettagli (che non ci sono)
   → guarda Forecast a dx → torna al centro per i requisiti STR/PER».
   Riferimento esplicito a Darkest Dungeon/XCOM: dettagli contestuali
   e gerarchicamente prioritari.

3. **«Fill the required slots» = ammissione di sconfitta.** Il testo
   sostituisce ciò che la UI dovrebbe mostrare: barre STR/PER che si
   riempiono/animano col delta rispetto al requisito a ogni pick;
   «Expedition Readiness Bar» con % di successo stimato
   (65%→80%→95%).

4. **Errore passivo.** Disabled comunicato solo col grigio: serve
   lucchetto + tooltip che dice *cosa manca* («Serve un Leader con
   STR ≥ 5»); click su slot vuoto non filtra il roster sui candidati
   validi.

5. **Mismatch iconografico + muro di testo.** Icone ruolo (corona,
   cappello, lente) ≠ icone stats del Forecast (spada, PER); il
   pannello destro «sembra un'enciclopedia, non un HUD di gioco».

## Soluzioni proposte (deepseek)

- Roster → griglia di Character Cards (ritratto, livello, STR/PER
  visibili); click su slot → filtro auto + glow sui candidati validi.
- Readiness bar dinamica al posto del testo placeholder.
- CTA: stato disabled con motivo esplicito; stato ready con
  colore/pulsazione contrastante.
- «DANGER HIGH» → barra di rischio a tacche (teschio 3/5) + feedback
  non solo colore (a11y). Codice TS allegato nel verbatim.

## Misread

Nessuno rilevato: struttura 3 pannelli, label e stato disabled
corrispondono agli shot.

## Note operative

- claude giù fino a 12:20 CET; chatgpt attach rotto tutto il giorno.


## Merge claude (refill T-001, post-reset quota 17:20)

claude GROUNDED (~11.5k chars, verbatim in `claude.md`). Fatti corretti:
layout 3 pannelli, slot circolari Marching Order, «SEND EXPEDITION»,
«Fill the required slots for an estimate», STR/PER, «DANGER HIGH».

**Convergenza (claude + deepseek):**
- **CTA disabilitata senza via d'uscita**: deepseek segnalava il CTA grande
  e disabilitato; claude P0 «il CTA è invisibile e la gerarchia è
  invertita» — il controllo più importante è il più debole.
- **Slot vuoti muti**: entrambi — i 4 slot circolari non dicono cosa
  manca né chi ci va; claude aggiunge stati (empty/filled/incompatible)
  e il «decidere al buio» (niente forecast prima della selezione).
- **Tipografia sotto soglia** — entrambi.
- **Info triplicata e criptica**: claude «STR e PER compaiono 3 volte con
  3 trattamenti diversi, e "COVERS STR — PER" non spiega cosa copre cosa».

**Punti solo claude**: oro inflazionato (troppi elementi dorati);
tre uscite quasi identiche (minimizza/chiudi/"Back to map") con controlli
sopra l'arte a contrasto variabile; borsa illeggibile; requisiti come
blocker dichiarati in config; CTA «onesto» (abilitato con motivo visibile).

**Rimedi**: schema requisiti in config, slot con stati reali, CTA con
motivo/bloccker sempre visibile, token dedicati.
