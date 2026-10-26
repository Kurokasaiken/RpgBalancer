# Digest critiche — village-registry (round 1, 3/3 image-grounded)

Provider: chatgpt, claude, deepseek — run `20261025-critique-village-registry`,
turn T-001 (+retry T-002 per claude; **refill chatgpt T-002 su run
`20261025-critique-village-registry-r2`** post-reset quota serale ~20:56),
prompt verbatim R-282, 3 shot allegati (ctx-a, iso-0, iso-1).

~~**Provider failure dichiarato:** chatgpt~~ — RECUPERATO al refill serale:
T-001 `CONVERSATION_MISMATCH` (conversation URL locale non persistita),
T-002 `ATTACH_FAILED` ("no upload affordance", quota immagini esaurita);
refill su run `-r2` con binding fresco → POSTED + collect SUCCESS,
risposta grounded (fatti corretti: filtri All/Built/Buildable/Locked,
categorie Production/Civic/Defense, edifici Warehouse/Inn/Infirmary,
flavor "lock and key"). claude T-001 ha raccolto un messaggio di
errore UI ("Questa risposta non è stata caricata"); ritentato come T-002
con esito grounded (fatti corretti: "6 of 16 built").

Convergenza effettiva = **3/3 provider image-grounded**.

## Convergenza forte (3/3)

1. **Zero informazione decisionale: il flavor occupa lo slot dei fatti.**
   - claude: «Nessuna informazione decisionale… lo slot più prominente è
     occupato dal flavor ("Keeps the village's stock under lock and key").
     Il flavor va nel tooltip, e al suo posto serve l'effetto: "+120
     storage"» — costo inline, risorsa mancante in rosso+sottolineatura.
   - deepseek: «sembra un'interfaccia progettata per "mostrare tutto"
     piuttosto che per "far capire cosa fare"… un "catalogo" invece di
     uno "strumento di gioco"» — progressive disclosure: di default solo
     Nome, Icona e Costo; descrizione solo in hover/focus.
   - chatgpt: «il registro presenta gli edifici come un catalogo
     illustrato, quando dovrebbe funzionare come uno strumento
     decisionale» → riga = nome + descrizione + stato + **azione
     esplicita** (Costruisci/Dettagli/Requisiti) con costo inline.

2. **Stato (built/buildable/locked) illeggibile o ambiguo.**
   - claude: «Lo stato è codificato tre volte e illeggibile… ◆ e + a
     circa 8px sono indistinguibili… Built, buildable e locked sembrano
     la stessa riga» → stato = forma + testo, mai solo colore.
   - deepseek: «L'icona del lucchetto è minuscola… se un edificio è
     bloccato, dovrebbe essere l'elemento più ovvio, non un dettaglio da
     cercare» → icona desaturata + lucchetto prominente + messaggio
     "Richiede X" al click.
   - chatgpt: «un piccolo puzzle interpretativo ripetuto su ogni riga…
     il lucchetto comunica un'indisponibilità generica, non dice se
     mancano risorse o prerequisiti; il + è troppo generico» → tre stati
     primari a trattamento consistente, colore solo come rinforzo.

3. **Gerarchia piatta: cornice oro ovunque = cornice da nessuna parte.**
   - claude: «Tutto ha cornice oro… Quando tutto è incorniciato, niente
     lo è. Le barre di categoria, che sono struttura, sono più scure e
     leggere delle righe».
   - deepseek: «i titoli delle categorie hanno la stessa importanza
     visiva dei nomi degli edifici… il giocatore deve leggere, non
     riconoscere».
   - chatgpt: «il problema è la somma dei trattamenti… manca un
     contrasto netto fra struttura, contenuto, controlli e decoro.
     Il bordo dorato perde valore quando è ovunque» → ottone riservato
     a selezione/azioni attive, righe a separatori sottili.

4. **Overflow/scalabilità non dichiarata.** 6-of-16 in header ma ~11 righe
   visibili, niente scrollbar né fade.
   - claude: «Contenuto probabilmente troncato… il pannello finisce senza
     scrollbar né fade» (P0, da verificare nel DOM).
   - deepseek: «Se il giocatore ha 30 edifici, come si comporta? Manca
     un'indicazione chiara di scroll o di paginazione» → ListView
     virtualizzata.
   - chatgpt: titolo+filtri sticky durante lo scroll, categorie
     espandibili senza salti visivi.

5. **Il pannello non riflette lo stato di crisi del gioco.** Con Food 0
   e Wood 0 nell'HUD, il registro non dice cosa costruire per uscirne.
   - claude → gruppo "Needs attention" in cima, da `critical`+`relieves`.
   - deepseek → peso visivo dipendente dal contesto (Palisade sotto
     attacco), focus guidato sul primo elemento selezionabile.
   - chatgpt: «Se voglio costruire qualcosa adesso, dove devo guardare?
     Il filtro Buildable è la risposta ma non riceve enfasi» → filtro
     attivo a superficie piena + costo/azione subito visibili;
     distingue "non costruibile per risorse" da "bloccato per
     progressione" (sfumatura della crisi, convergenza parziale).

## Disaccordi / divergenze preservate

- **Sidebar vs pannello:** deepseek legge "VILLAGE 6 of 16 built" come
  elemento fluttuante di «due giochi diversi» rispetto al registro e
  propone di fonderli in un unico header; claude non segnala la
  frattura e tratta header e lista come un solo pannello (critica solo
  i disallineamenti di ~11px dei bordi); chatgpt non la solleva.
- **Stack tecnico degli esempi:** claude propone TSX/CSS coerente col
  progetto; deepseek risponde con Unity UXML/C# — esempi fuori stack,
  utile solo il principio (virtualizzazione, classi di stato); chatgpt
  consegna React+TypeScript generico, dichiarato «non una patch
  verificata sul repository».
- **Filtri vs progressive disclosure:** claude mantiene i chip filtro e
  li potenzia (conteggi, auto-apertura categorie); deepseek punta tutto
  sul disclosure a hover; chatgpt mantiene i filtri ma chiede stato
  attivo a superficie piena e costo/azione inline. Tutti demotano il
  flavor: convergenza di principio, divergenza di meccanica.
- **Punti unici chatgpt:** i glifi ciano a destra come «linguaggio
  visivo incompleto» (ogni icona interattiva deve avere funzione
  univoca + spiegazione accessibile); le categorie «sembrano
  intestazioni ma si comportano da controlli» → differenziarle per
  superficie; la riga come «contenitore di troppe cose» → colonna
  identità | stato | azione.

## Priorità emersa

P0 condiviso (3/3): effetto/costo inline al posto del flavor; stato a
ridondanza forma+testo; risolvere l'overflow nascosto. P1: gerarchia
cornici (struttura ≠ contenuto), superficie della crisi corrente,
affordance click/hover→pin sulla mappa (solo claude: «registro e mondo
non dialogano»), enfasi sul filtro Buildable + azione esplicita
(chatgpt). P2: tipografia ~11px sotto soglia (chatgpt: descrizioni
12–13px min, contrasto ≥4.5:1 da misurare), allineamenti, modello
focus gamepad.
