# Wanderlust: Triumph — Sintesi del Game Design Document

*Fantasy Strategy / Management Roguelite — PC — v1.0 per candidatura «Prima Pubblicazione»*

---

## 1. Visione e identità

**Premessa.** Un esule giunge in un villaggio di frontiera ai margini di un continente dipinto. Da lì si costruisce una compagnia: gli abitanti del villaggio diventano lavoratori, specialisti e infine eroi. Il mondo è bello e rude — meraviglia, scoperta, fatica — e ostile in misura crescente.

**Fantasia del giocatore.** Non sei l'eroe che scende in campo: sei chi **prepara** gli eroi. Recluti, formi, equipaggi, scegli quali rischi valgono e quali no. La tensione è quella del manager di una compagnia di avventurieri: ogni spedizione è una scommessa calcolata, ogni ritorno una pagina di cronaca, ogni perdita una cicatrice che resta nel mondo.

**Genere e pubblico.** Strategy/management roguelite per PC, per giocatori di gestionali da tavolo (Lords of Waterdeep), strategy narrativi (Battle Brothers) ed esperienze sistemiche atmosferiche (Cultist Simulator).

**Elementi distintivi.**

- **Mappa-mondo dipinta e viva**: un continente illustrato ad alta risoluzione con ciclo giorno/notte, zoom, vita ambientale rara e significativa — il mondo si legge con gli occhi, non con i pannelli.
- **Quest come storie a nodi**: le missioni si svolgono come racconti a bivi, con scelte e skill check che attendono il giocatore — non auto-risoluzione, non combat log.
- **Morte e collasso come design**: la perdita di eroi e della run alimenta un sistema di eredità persistente (memoriale, reliquiario, edifici meta), non un game over sterile.
- **Identità estetica forte**: interfaccia gioiello in ottone e smalto, direzione illustrata coerente, tagline *Prepare · Endure · Triumph*.

## 2. Core Gameplay Loop

Il ciclo si ripete su scala giorni di gioco:

1. **Gestione dell'insediamento** — il villaggio dipinto ospita edifici funzionali (locanda, magazzino, emporio, fucina, torre, santuario…). Si assegnano lavoratori, si gestiscono risorse (oro, cibo, legname) e si investe in upgrade.
2. **Sviluppo e reclutamento degli eroi** — il roster cresce: ogni membro ha attributi, livello, vita e fatica. Gli eroi si formano, riposano, guariscono — e possono morire.
3. **Scelta delle quest** — i punti di interesse sulla mappa offrono missioni con requisiti dichiarati (statistiche chiave primarie/secondarie), durata del viaggio, rischi e ricompense valutabili prima dell'impegno.
4. **Preparazione della spedizione** — il planner compone il party: membri, oggetti da viaggio dal magazzino, bisaccia con consumabili. Previsione deterministica delle probabilità prima di confermare.
5. **Risoluzione e conseguenze** — la quest si svolge in fasi narrative (andata → svolgimento → ritorno) con scelte e skill check; esiti graduati (trionfo, successo, parziale, fallimento, disastro), ferite, morti, ricompense.
6. **Gestione delle minacce** — eventi di mondo e minacce a ondate crescenti mettono pressione all'insediamento, fino al possibile collasso della run.

## 3. Sistemi di gioco

- **Attributi**: sei canali stat — Forza, Agilità, Costituzione, Intelligenza, Percezione, Carisma — più vita, fatica, livello ed esperienza. Equipaggiamento su quattro slot (arma, armatura, cavalcatura, monile) e consumabili di bisaccia.
- **Composizione delle spedizioni**: party a slot, dai primi gruppi di pochi eroi fino a spedizioni ampie (~20 membri nelle fasi avanzate del design). Copertura delle statistiche richieste come problema di allocazione.
- **Requisiti delle quest**: ogni quest dichiara statistiche chiave primarie e secondarie, requisiti materiali (licenze, oggetti), durata e rischio. Intel progressiva rivela dettagli.
- **Skill check**: risoluzione tramite l'*Astrolabio del Destino*, un componente scenografico che mostra probabilità e verdetto; il Mission Planner offre una previsione deterministica prima del lancio e una simulazione probabilistica (analitica + Monte Carlo) in fase di design/bilanciamento.
- **Rischio e probabilità**: esiti graduati a più livelli; possibilità di ritirata ai checkpoint tra le fasi, con anteprima delle conseguenze.
- **Ricompense e progressione**: oro, risorse, esperienza, sblocchi (blueprint ed edifici), narrazione di ritorno con «echi del luogo».

## 4. Progressione e struttura roguelite

- **Difficoltà crescente**: requisiti delle quest, minacce e costi di mantenimento crescono nel tempo; eventi maggiori culminanti (es. invasioni) possono chiudere la run.
- **Ondate e boss**: il modello di campagna è una crisi crescente a ondate, con minacce-capostipite trattate in modo cinematografico.
- **Crescita delle spedizioni**: il numero massimo di membri scala con gli edifici e la fase della run, fino a ~20 eroi.
- **Perdita della run**: il collasso del villaggio o la morte del fondatore chiudono la run — con rapporto di sconfitta, statistiche vere e registrazione di ogni caduto.
- **Progressione tra run** («lose to progress»): l'eredità sopravvive alla run — eroi segnati come eredi, oggetti nel reliquiario, progetti/blueprint negli edifici meta (santuario, magazzino antico, torre del mago), ogni morte nella Sala dei Caduti. Il mondo è pensato come persistente su più run (dell'ordine di 5–10 run per arco narrativo).

## 5. Rigiocabilità e produzione

**Rigiocabilità.** Ogni run combina diversamente: roster e attributi generati, offerte di quest e minacce variabili, scelte di costruzione dell'insediamento, spedizioni e bisacce come problema di ottimizzazione, eredità che cambia il punto di partenza della run successiva. Il giocatore decide *come* perdere e *cosa* tramandare.

**Direzione artistica.** Fantasy illustrato: continente e villaggio dipinti a mano con pipeline 2.5D (parallasse, respiro della materia, luce dinamica — ombre di nuvole, god rays, luci sui POI); UI «gioiello» in ottone e smalto; creature originali da combinazioni di tratti riconoscibili. La produzione visiva usa strumenti di AI generativa sotto direzione artistica e progettuale umana (concept → paintover → integrazione), dichiarato nel form.

**Stato di implementazione (verificabile sulla build pubblica).** Funzionanti oggi: mappa-mondo interattiva ad alta risoluzione con zoom e ciclo giorno/notte; HUD completa (tempo ×1/×2/×4, risorse, navigazione); vista del villaggio; drawer delle quest con party slot, viaggio, rischi/ricompense e conferma; roster con livelli e barre; finestra quest con fasi narrative e rapporto di spedizione; ricompense con cerimonia di level-up; Sala dei Caduti e reliquiario dell'eredità; menu con salvataggi multipli; localizzazione EN/IT; profili grafici desktop/Deck/mobile.

**Prossimi obiettivi.** Assemblare il core loop completo end-to-end (economia reale degli edifici, produzione, minacce a ondate), ampliare il catalogo di quest e contenuti, packaging desktop e pagina Steam «Coming Soon», vertical slice candidabile.

**Produzione.** Un solo autore con pipeline strumentata: design-first con contratti verificabili, test automatici E2E, budget di performance misurati, AI come strumento di produzione (arte, pair-programming) sotto direzione umana.
