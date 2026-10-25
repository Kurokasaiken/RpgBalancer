# Digest critiche — village-registry (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-village-registry`,
turn T-001 (+retry T-002 per chatgpt e claude), prompt verbatim R-282,
3 shot allegati (ctx-a, iso-0, iso-1).

**Provider failure dichiarato:** chatgpt — T-001 `CONVERSATION_MISMATCH`
(conversation URL locale non persistita), T-002 `ATTACH_FAILED`
("no upload affordance"). Terzo episodio del giorno di failure attach/
percezione immagini su chatgpt web. Escluso dal conteggio: convergenza =
2/2 provider image-grounded. claude T-001 ha raccolto un messaggio di
errore UI ("Questa risposta non è stata caricata"); ritentato come T-002
con esito grounded (fatti corretti: "6 of 16 built", filtri
All/Built/Buildable/Locked, categorie Production/Civic/Defense,
flavor "Keeps the village's stock under lock and key").

## Convergenza forte (2/2)

1. **Zero informazione decisionale: il flavor occupa lo slot dei fatti.**
   - claude: «Nessuna informazione decisionale… lo slot più prominente è
     occupato dal flavor ("Keeps the village's stock under lock and key").
     Il flavor va nel tooltip, e al suo posto serve l'effetto: "+120
     storage"» — costo inline, risorsa mancante in rosso+sottolineatura.
   - deepseek: «sembra un'interfaccia progettata per "mostrare tutto"
     piuttosto che per "far capire cosa fare"… un "catalogo" invece di
     uno "strumento di gioco"» — progressive disclosure: di default solo
     Nome, Icona e Costo; descrizione solo in hover/focus.

2. **Stato (built/buildable/locked) illeggibile o ambiguo.**
   - claude: «Lo stato è codificato tre volte e illeggibile… ◆ e + a
     circa 8px sono indistinguibili… Built, buildable e locked sembrano
     la stessa riga» → stato = forma + testo, mai solo colore.
   - deepseek: «L'icona del lucchetto è minuscola… se un edificio è
     bloccato, dovrebbe essere l'elemento più ovvio, non un dettaglio da
     cercare» → icona desaturata + lucchetto prominente + messaggio
     "Richiede X" al click.

3. **Gerarchia piatta: cornice oro ovunque = cornice da nessuna parte.**
   - claude: «Tutto ha cornice oro… Quando tutto è incorniciato, niente
     lo è. Le barre di categoria, che sono struttura, sono più scure e
     leggere delle righe».
   - deepseek: «i titoli delle categorie hanno la stessa importanza
     visiva dei nomi degli edifici… il giocatore deve leggere, non
     riconoscere».

4. **Overflow/scalabilità non dichiarata.** 6-of-16 in header ma ~11 righe
   visibili, niente scrollbar né fade.
   - claude: «Contenuto probabilmente troncato… il pannello finisce senza
     scrollbar né fade» (P0, da verificare nel DOM).
   - deepseek: «Se il giocatore ha 30 edifici, come si comporta? Manca
     un'indicazione chiara di scroll o di paginazione» → ListView
     virtualizzata.

5. **Il pannello non riflette lo stato di crisi del gioco.** Con Food 0
   e Wood 0 nell'HUD, il registro non dice cosa costruire per uscirne.
   - claude → gruppo "Needs attention" in cima, da `critical`+`relieves`.
   - deepseek → peso visivo dipendente dal contesto (Palisade sotto
     attacco), focus guidato sul primo elemento selezionabile.

## Disaccordi / divergenze preservate

- **Sidebar vs pannello:** deepseek legge "VILLAGE 6 of 16 built" come
  elemento fluttuante di «due giochi diversi» rispetto al registro e
  propone di fonderli in un unico header; claude non segnala la
  frattura e tratta header e lista come un solo pannello (critica solo
  i disallineamenti di ~11px dei bordi).
- **Stack tecnico degli esempi:** claude propone TSX/CSS coerente col
  progetto; deepseek risponde con Unity UXML/C# — esempi fuori stack,
  utile solo il principio (virtualizzazione, classi di stato).
- **Filtri vs progressive disclosure:** claude mantiene i chip filtro e
  li potenzia (conteggi, auto-apertura categorie); deepseek punta tutto
  sul disclosure a hover. Entrambi demotano il flavor: convergenza di
  principio, divergenza di meccanica.

## Priorità emersa

P0 condiviso: effetto/costo inline al posto del flavor; stato a
ridondanza forma+testo; risolvere l'overflow nascosto. P1: gerarchia
cornici (struttura ≠ contenuto), superficie della crisi corrente,
affordance click/hover→pin sulla mappa (solo claude: «registro e mondo
non dialogano»). P2: tipografia ~11px sotto soglia, allineamenti,
modello focus gamepad.
