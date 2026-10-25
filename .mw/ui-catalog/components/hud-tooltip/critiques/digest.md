# Digest critiche — hud-tooltip (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-hud-tooltip`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` ×2 (T-001, T-002). `chatgpt.md`.
- **claude** [RECUPERATO v. sezione merge] — quota free esaurita fino a 12:20 CET (banner verificato,
  submit disabilitato provider-side); nessun send per non avvelenare la
  draft condivisa. `claude.md`.

**Grounded:** solo deepseek (T-001 SUCCESS, 6.6k chars, italiano).
Verbatim in `deepseek.md`. Fatti corretti: pulsante «HIDE HUD» con hint
«[H]», cluster risorse Oro/Cibo/Legno in alto a destra, nav
Village/Map/Workshop/Tavern, posizione basso-destra.

## Niente convergenza misurabile

Un solo provider grounded; i temi sotto sono della singola critica.

## Punti della critica (deepseek, 1/1)

1. **Azione secondaria con peso sbagliato.** «Il pulsante "HIDE HUD" ha
   lo stesso peso visivo del testo che descrive le risorse» — un'azione
   QoL rara occupa spazio permanente e rischia click accidentali.
   Proposta: rimuovere il pulsante, solo shortcut + toast di conferma.

2. **Hint di input hardcoded.** «Mostrare "[H]" su un controller è un
   pugno in un occhio»: i prompt dei tasti devono adattarsi al device
   (tastiera/controller/touch); inoltre il toggle di stato va reso
   distinto da un'azione momentanea.

3. **Toggle senza stato.** Il componente è un interruttore
   (hide/show) ma non comunica lo stato corrente né la via di ritorno
   quando l'HUD è nascosto (come riattivarlo?).

4. **Touch target e posizione.** «Progettato per un mouse» — area
   probabilmente sotto soglia touch, angolo basso-destra scomodo;
   «input-agnostic» come requisito AAA.

5. **Pattern proposti:** relegare a menu pausa/impostazioni; hotkey con
   toast conferma; se resta visibile, icona occhio (👁/🚫) al posto del
   testo + tooltip.

## Misread (lieve, flagged)

- Deepseek afferma che «il resto dell'interfaccia (Village, Map,
  Workshop, Tavern) sembra essere in italiano» mentre "HIDE HUD" è in
  inglese — le etichette nav citate sono inglesi: la premessa
  «interfaccia in italiano» è un **misread**; la conclusione
  (incoerenza di caso/lingua del label) resta comunque un'osservazione
  di stile valida.

## Note operative

- claude irraggiungibile fino a 12:20 CET; chatgpt attach rotto tutto
  il giorno → convergenza di fatto impossibile in questa batch.
- deepseek risponde in italiano leggibile (non cinese come
  village-stash-panel): nessuna traduzione necessaria nel digest.


## Merge claude (refill T-001, post-reset quota 17:20)

claude GROUNDED (~10.7k chars, verbatim in `claude.md`), scoping onesto:
«giudico da un ritaglio di ~134px — dove stimo, è da verificare».

**Convergenza (claude + deepseek)**: fatti corretti («HIDE HUD», hint
«[H]», cluster risorse, nav Village/Map/Workshop/Tavern, posizione
basso-destra). Punti comuni:
- **Hotkey hardcoded [H] mente su touch/gamepad** — deepseek l'aveva tra
  i punti; claude P0 con riferimenti (CoH3, FFXIV gamepad combo,
  My Summer Car due-passaggi, War Thunder F12 con/senza HUD).
- **Tipografia ~11-12px maiuscoletto** sotto soglia di lettura comoda.
- **Stati invisibili** (hover/pressed/focus non verificabili dagli shot).

**Punti solo claude**: «lo stato nascosto non è definito — se il pulsante
sparisce con l'HUD, il recupero dipende da un tasto dimenticato» (P0
peggiore); ambiguità col pulsante-occhio sotto; «"HUD" è gergo da
programmatori — rompe la finzione fantasy»; keycap che non sembra keycap;
linguaggio spezzato (pillola nuda vs medaglioni circolari); peso
gerarchico eccessivo a riposo; manca il secondo livello (nascondi anche
cursore per screenshot); transizione 150-200ms per comunicare causa
effetto. Spec di design: «Nascondi interfaccia» i18n, 36px/44px coarse,
keycap 22×22 solo su input tastiera, glifo controller su gamepad.
