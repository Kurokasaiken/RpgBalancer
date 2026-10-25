# Digest critiche — village-building-tooltip (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-village-building-tooltip`, turn T-001 (+retry T-002
chatgpt/claude del worker precedente), prompt verbatim R-282, 3 shot
allegati (ctx-a, ctx-b, iso-0).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` su T-001 e T-002 ("no upload affordance
  found"), pattern persistente del giorno. Dettagli in `chatgpt.md`.
- **claude** [RECUPERATO v. sezione merge] — POSTED su `/new` mai promosso a conversazione, collect
  fallito `did not stabilize`; reconcile prova il prompt ASSENTE dalla
  trascrizione. Causa evidenziata: draft stantia multi-allegato nel
  composer `/new` del profilo condiviso + contention con altri worker
  critique attivi. Dettagli in `claude.md`.

**Grounded:** solo deepseek (T-001, risposta recuperata via `reconcile`
read-only — la collect del worker precedente aveva chiuso SUCCESS ma il
testo non era persistito). Verbatim in `deepseek.md`. Risposta in
italiano, ~4.3k chars; fatti corretti: "WAREHOUSE", costi 80 cibo / 25
legno / 60 oro, tempo "4d", effetto "Storage capacity: 24 → 48",
pulsante "OPEN WAREHOUSE".

## Niente convergenza misurabile

Un solo provider grounded: non esiste convergenza 2/2 o 3/3 da
riportare. I punti sotto sono i temi della singola critica grounded.

## Punti della critica (deepseek, 1/1)

1. **Manca il feedback di affordability.** Il tooltip mostra costi e
   tempo ma non dice se il giocatore può permetterselo: «Non c'è un
   indicatore visivo di "risorsa mancante". Il giocatore deve fare
   calcoli mentali o guardare l'HUD… e poi tornare al tooltip». Proposta:
   bottone UPGRADE disabilitato con missing-resource esplicito
   (`disabled: true, tooltip: 'Manca X risorsa'`).

2. **Gerarchia dell'azione invertita.** «L'effetto "Storage capacity:
   24 → 48" è ottimo, ma è visivamente più debole del pulsante "OPEN
   WAREHOUSE" che è già attivo. Il giocatore è spinto ad aprire un
   magazzino vuoto invece di potenziarlo». Proposta: layout in 3
   sezioni Header (nome+livello) / Body (effetto) / Footer (costi+
   tempo+azione dominante).

3. **Notazione ambigua.** «il trattino prima del tempo è ambiguo:
   sembra una sottrazione, non un costo temporale» sulla riga
   `Cost: 80 ▪ 25 ▪ 60 ▪ - 4d`. Icone risorse «generiche e piccole».

4. **Posizionamento.** Tooltip «ancorato al centro dello schermo,
   lontano dal cursore»: va vicino all'elemento selezionato; click
   fuori deve chiudere.

5. **"Delta preview" di contesto.** Mostrare stato pre/post upgrade
   («Capacità Attuale: 24/24 → Dopo: 24/48») e stato magazzino pieno
   come trigger ("Sovraccarico — Potenziamento consigliato").

## Misread

Nessuno rilevato sulla risposta grounded: i fatti citati (costi,
capacità 24→48, "OPEN WAREHOUSE") corrispondono agli shot.

## Note operative per il prossimo round

- claude e chatgpt vanno rilanciati quando il composer `/new` del
  profilo condiviso è libero da draft e il pool non è saturato
  (oggi ~90 tab accumulate, CDP handshake intermittente).
- La risposta deepseek è sopravvissuta solo grazie a `reconcile`:
  chi schedula i collect deve salvare lo stdout JSON subito — il testo
  della risposta non è persistito nel run dir.


## Merge claude (refill T-002 su run -r2, post-reset quota 17:20)

claude GROUNDED (~12.4k chars, verbatim in `claude.md`; stesso percorso
CONVERSATION_MISMATCH → recovery + reseed di hud-event-ledger).
**Scope:** claude ha letto DUE componenti nei crop — pannello Events e
card Warehouse/tooltip edificio («Se intendevi solo uno dei due, la parte
che ti serve è comunque separata»). Per village-building-tooltip vale la
sezione B (Warehouse card); la sezione A alimenta hud-event-ledger.

**Convergenza con deepseek (sul tooltip/card):**
- **Costi senza affordability**: deepseek citava i costi 80/25/60 come
  fatti; claude li eleva a difetto: «costi tutti neutri mentre l'HUD mostra
  legno 0 e cibo 0 — il confronto resta a mente» → rosso la risorsa
  insufficiente (convenzione RTS).
- **Bottone disabilitato muto**: claude «UPGRADE disabilitato a contrasto
  bassissimo con "preview only" in corsivo — gergo da sviluppatore»;
  i tooltip su disabled non bastano → motivo sempre visibile.
- **Gerarchia**: deepseek la dava piatta; claude: «5 stili tipografici in
  220px, flavor sopra i dati».
- **Icone costo indistinguibili** a 16px, discriminante solo-colore.

**Punti solo claude**: "OPEN WAREHOUSE" a capo nel bottone; pin/close
cerchi uguali adiacenti (misclick); icona header che si legge come
"annulla"; trasparenza che sporca la leggibilità; ancoraggio assente alla
scena; Esc con tre significati nella stessa schermata; "LV II/III" +
"24 → 48" che mescola stato attuale e anteprima senza delta.

**Sugli Events (sezione A)**: collasso quando vuoto, filtri solo quando
servono — converge con il refill di hud-event-ledger.
