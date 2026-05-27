# Design Pillars — Riferimenti d'ispirazione e raffinamenti

**Versione:** 1 (creato 2026-05-22)
**Companion di:** `GAMEPLAY_DESIGN.md`, `VERTICAL_SLICE_ROADMAP.md`, `COMPONENTS_SPECIFICATION.md`
**Cosa è questo file:** fissare in modo chiaro i 3 riferimenti d'ispirazione che guidano il gioco e tradurli in scelte concrete di gameplay/UI/visual che la slice deve esprimere. Ogni volta che si decide qualcosa di nuovo (un componente, una micro-interazione, un suono), questo documento è la lente con cui controllare "è coerente con i pillar?".

> **Gerarchia documentale:**
> - `GAMEPLAY_DESIGN.md` v2 → visione attuale (eroe esiliato, Mercante, Locanda, Peasants).
> - `DESIGN_PILLARS.md` *(questo file)* → fonti d'ispirazione e raffinamenti.
> - `VERTICAL_SLICE_ROADMAP.md` v3 → piano operativo.

---

## 1. I tre pillar

### Pillar 1 — UI & mappa: *Dispatch* (centrale operativa)

**Cosa prendiamo:**
- La schermata di gioco non è un mondo esplorabile, è una **dashboard tattica**: una mappa stilizzata con nodi (POI) e pannelli laterali.
- Tutto succede *sulla mappa* o in pannelli che si aprono *sopra* la mappa (overlay), mai con cambi di scena.
- Estetica scura/glassmorfica con accenti ambra/oro/rosso. Tipografia pulita, leggibile, tipo "control room".
- Stato del villaggio leggibile **in colpo d'occhio**: chi sta facendo cosa, quanto manca, cosa sta per scadere.

**Cosa NON prendiamo:**
- Niente sprite di camminata, niente personaggi che si muovono su griglie.
- Niente menù annidati profondi (max 1 livello di overlay).

### Pillar 2 — Meccanica core: *Cultist Simulator* (halo, slot-verbi, carte)

**Cosa prendiamo:**
- **POI = verbo + slot.** Ogni nodo della mappa esprime un'azione ("Cerca", "Taglia", "Combatti", "Riposa") e accetta una o più *carte* (medaglione PG, oggetto, licenza).
- **Halo come timer leggibile.** Anello rosso che si svuota → urgenza. Anello giallo/ambra che si riempie → lavoro in corso. Lo stato del mondo si legge guardando gli anelli.
- **Le carte hanno peso narrativo.** L'eroe, gli oggetti d'equipaggiamento, le licenze sono *cards*: hanno un nome, un'icona, una descrizione, e finiscono nelle slot dei POI per produrre esiti.
- **Skill check come carta dell'esito.** Niente combat animato: si apre una scheda pulita con probabilità, esito narrativo, ricompense.
- **Cronaca degli esiti.** Le carte di esito (success/partial/fail) si accumulano in un piccolo log "memoria del villaggio" — danno senso al tempo passato.

**Cosa NON prendiamo:**
- L'opacità narrativa (Cultist Sim è volutamente criptico). Noi siamo D&D classico, leggibile.
- Il rischio di permadeath senza recupero: la slice non punisce con perdite definitive.

### Pillar 3 — Loop strategico: *Lords of Waterdeep* (approfondito)

**Cosa prendiamo:**
- **Worker placement come decisione scarsa.** I Peasants sono lavoratori limitati: piazzarli su un job è una scelta che ne preclude un'altra.
- **Engine building visibile.** Costruire la Locanda sblocca i peasants, costruire la Fucina sblocca equip migliori, ecc. Ogni edificio nuovo *cambia il rate* di qualcosa, e il giocatore vede il numero salire.
- **Quest come carte con requisiti.** Le quest non sono "click & wait" ma richiedono ingredienti (eroe + stat + licenza + equip). Senza ingredienti, niente quest.
- **Blueprint sbloccati come Intrighi.** Come in LoW si compra Intrighi, qui si comprano Blueprint dal Mercante o si guadagnano completando quest: aggiungono mosse al motore.

**Cosa estendiamo rispetto a LoW:**
- **Eroi che salgono di livello, non solo workers.** Gli eroi sono *campioni* con stamina, XP, equipaggiamento — questa è la deviazione RPG.
- **Tempo continuo, non a round.** Lo stato del villaggio scorre in tick continui, non in turni discreti. Ma le "decisioni significative" sono comunque rade (1-2 per giorno), così resta strategico.

---

## 2. Tabella di sintesi — pillar → meccaniche del progetto

| Meccanica della slice                | Pillar dominante         | Pillar secondari               | Stato componente nel repo                             |
| ------------------------------------ | ------------------------ | ------------------------------ | ----------------------------------------------------- |
| Mappa con POI nodi                   | Dispatch                 | Cultist Sim                    | `MinimalGameplayPage` + `map/` ✅                      |
| Halo (rosso → giallo) su POI         | Cultist Sim              | Dispatch                       | `ActionHalo.tsx` ✅                                    |
| Drag medaglione → slot POI           | Cultist Sim              | LoW (worker placement)         | `SlottedMedal` + `ActionCardBase` ✅                   |
| Quest card con requisiti (stat/eq.)  | Cultist Sim              | LoW                            | `QuestActionCard` ✅ (manca preview requisiti)         |
| Skill check resolution pannello      | Cultist Sim              | —                              | **MANCA** (vedi `vertical_slice_completion_analysis`) |
| Job ripetibile (taglialegna/oro)     | LoW (worker placement)   | Dispatch                       | `JobActionCard` ✅                                     |
| Peasants assegnati permanenti        | LoW (worker placement)   | —                              | **DA AGGIUNGERE** (regola di config + UI badge)       |
| Pannello Village + Blueprint/Upgrade | LoW (engine building)    | Dispatch (overlay)             | `BuildingCard` ✅ (manca screen Villaggio)             |
| Mercante con countdown               | Dispatch (countdown vis) | Cultist Sim (POI temporaneo)   | `MarketActionCard` ✅                                  |
| Day clock / event timeline           | Dispatch                 | Cultist Sim                    | **DA AGGIUNGERE** (widget timeline)                   |
| Cronaca esiti (log narrativo)        | Cultist Sim              | —                              | **DA AGGIUNGERE** (strip in basso)                    |
| Level up eroe + animazione           | LoW (engine breath)      | Cultist Sim (carta evento)     | `SlottedMedal` ring ✅ (manca trigger + FX)            |

---

## 3. Raffinamenti proposti, pillar per pillar

Questa è la sezione operativa: cosa cambiare/aggiungere per rendere il gameplay più interessante e soddisfacente, **senza** uscire dallo scope della slice. Ogni raffinamento ha: *cosa*, *perché psicologico/UX*, *dove agire nel codice*.

### 3.1 Raffinamenti Dispatch (UI / mappa)

**R1.1 — Layout "control room" fisso a tre regioni**
- *Cosa:* la pagina `/minimal-gameplay` è divisa in tre regioni stabili: **Mappa centrale**, **Roster a sinistra** (verticale, scrollabile), **HUD risorse + day-clock in alto**. Il pannello Villaggio si apre come overlay glassmorfico sopra la mappa (non spinge).
- *Perché:* il giocatore deve sapere *dove guardare* per ogni informazione. Lo stesso pattern di Dispatch: chi-cosa-quando sempre nello stesso posto.
- *Dove:* refactor minimale di `MinimalGameplayPage.tsx`; il roster esiste già (`VillageRosterSection`), l'HUD risorse esiste (`VillageResourcePanel`).

**R1.2 — Day-clock e timeline eventi**
- *Cosa:* un widget orologio in alto (o un arco-sole) che mostra l'avanzamento del giorno + **una timeline a tacche** con icone degli eventi futuri ("Mercante T-3", "Quest urgente possibile dopo G2").
- *Perché:* dare orizzonte. Senza orizzonte il giocatore non pianifica. Con orizzonte, il riposo dell'eroe non è "tempo perso" ma "tempo investito in preparazione".
- *Dove:* nuovo componente `DayClockTimeline.tsx` in `src/ui/idleVillage/components/`. Si alimenta dai counter già esistenti nel `TimeEngine`.

**R1.3 — Linee di connessione fra POI**
- *Cosa:* sottili linee/sentieri dal Centro Villaggio agli outpost (Taglialegna, Oro). Quando un peasant è in lavoro, una piccola particella si muove lungo la linea ogni N tick.
- *Perché:* dà profondità al concetto di "avamposto di frontiera" e crea micro-feedback di "il villaggio respira".
- *Dove:* layer SVG sotto i nodi nella `MapPage.tsx`. Solo decorativo, non interattivo.

**R1.4 — Notifica diegetica per eventi che spawnano**
- *Cosa:* quando il Mercante arriva o spawna una quest urgente, una "vignetta" entra dal bordo della mappa con un sussurro audio ("Un viandante è in vista...") e poi atterra come POI.
- *Perché:* eventi importanti meritano un battito drammatico. Spawn istantanei senza fanfara fanno perdere il momento.
- *Dove:* hook su `MarketActionCard` mount + nuovo `MapNotificationLayer.tsx`. Audio cue tramite il sistema audio esistente.

**R1.5 — Stato "notte" come desaturazione globale**
- *Cosa:* quando scende la notte (se la slice ha day/night, e i componenti `DayNightActionCard` lo suggeriscono), la mappa si desatura leggermente, le luci dei POI attivi spiccano di più.
- *Perché:* ritmo. Il giocatore percepisce il giorno scorrere senza dover leggere un counter.
- *Dove:* CSS filter applicato a `MapPage.tsx`, opzionale on/off in config.

### 3.2 Raffinamenti Cultist Simulator (halo / carte / verbi)

**R2.1 — Ogni POI ha un'etichetta nominale chiara, non un verbo** *(decisione utente: nominale)*
- *Cosa:* sopra ogni POI un'etichetta sostantivata: "Taglialegna", "Setaccio dell'Oro", "Centro Villaggio", "Caccia Grossa", "Trattativa". Niente imperativi. Lo *stato* del POI (ozioso / occupato / urgente) è invece comunicato dall'halo, dal verb-tag colorato in micro-tipografia ("in corso", "urgente") e dall'icona attività.
- *Perché:* tono gestionale più sobrio (Banished/Frostpunk), coerente con un setting di frontiera. La fame di azione la dà l'halo e il countdown, non la grammatica imperativa.
- *Dove:* prop `label` (già esistente su `ActionCardBase`); aggiungere `statusTag` per il micro-stato sotto il nome.

**R2.2 — Anteprima requisiti e probabilità al drop hover**
- *Cosa:* quando trascini un medaglione PG sopra una quest card, prima del rilascio l'anteprima mostra **le stat richieste vs le stat del PG** e una probabilità di successo stimata.
- *Perché:* in Cultist Sim la combinazione delle carte si "preannuncia". Riduce la frustrazione del "non sapevo che fallivo".
- *Dove:* extension di `QuestActionCard` con stato `previewing`. Il calcolo esiste già in `minimalGameRules`.

**R2.3 — Halo a stati emotivi distinti**
- *Cosa:* tre stati dell'halo con micro-animazione propria:
  - **Rosso pulsante** (urgent quest fresca): pulsa una volta ogni 2s, *poi si fissa* e inizia a svuotarsi → vuoi attirare attenzione senza stressare per sempre.
  - **Giallo crescente** (lavoro in corso): riempimento liscio, leggero glow.
  - **Verde lampo** (completato): un lampo verde di 600ms prima di sbloccare il "Raccogli".
- *Perché:* gli stati emotivi del giocatore corrispondono a quelli dell'halo. Adesso `ActionHalo.tsx` ha già la struttura: serve solo coreografare le animazioni.
- *Dove:* `ActionHalo.tsx` + state machine in `useActionCardStyling.ts`.

**R2.4 — Skill check come scheda-carta**
- *Cosa:* quando una quest si risolve, **non** un modal generico ma una *carta* che si gira al centro dello schermo, con:
  - Lato A (prima del flip): l'icona della quest, le stat richieste, le stat effettive.
  - Lato B (dopo il flip): l'esito (Trionfo / Successo / Parziale / Fallimento / Disastro) e la lista ricompense.
- *Perché:* la rivelazione "flip" dà drammaticità senza essere flashy. Cultist Sim usa molto la metafora "carta = momento".
- *Dove:* componente nuovo `QuestResolutionCard.tsx`, montato sopra la `MapPage` come overlay. Sostituisce il `QuestSuccessModal` previsto in `vertical_slice_completion_analysis.md`.

**R2.5 — Cronaca esiti (Log narrativo)**
- *Cosa:* strip orizzontale in basso (collassabile) con le ultime 5 carte-esito. Click per riaprire la scheda. Le quest perse appaiono sbiadite.
- *Perché:* dà al giocatore la sensazione che il villaggio ha una *storia*. È la versione minimale del "Mansus" cultista.
- *Dove:* nuovo `ChronicleStrip.tsx`. Persisterà via `PersistenceService`.

**R2.6 — Carta "Licenza di Caccia" come oggetto-card, drag manuale** *(decisione utente: drag manuale)*
- *Cosa:* dopo l'acquisto al Mercante la Licenza **non è** un boolean nascosto né si equipaggia da sola. Appare:
  1. **Al momento dell'acquisto:** una piccola animazione fa scivolare la carta dal POI Mercante in un nuovo pannello laterale "Inventario / Carte di Equipaggiamento" (sotto o accanto al roster).
  2. **In inventario:** la carta è una vera tile cliccabile/trascinabile, con icona pergamena, nome ("Licenza di Caccia"), descrizione breve ("Necessaria per la Caccia Grossa").
  3. **Per equipaggiarla:** il giocatore la trascina sul medaglione dell'eroe. Sul medaglione appare un piccolo badge "pergamena" che indica "equipaggiato". Una volta equipaggiata resta sull'eroe per il resto della slice (drag-off opzionale, ma non necessario nella demo).
  4. **Effetto sulla quest:** sulla `QuestCard` "Caccia Grossa" il requisito mostra `Licenza di Caccia: ✓` solo quando il PG trascinato sulla quest *ha* la licenza equipaggiata. Senza, il drop viene rifiutato con un micro-shake e un tooltip "Licenza assente".
- *Perché:* la tangibilità del drag rende l'acquisto un *momento*, non un toggle invisibile. È il pillar Cultist Sim al suo meglio: la carta esiste, si vede, si tocca, si combina con un altro pezzo (l'eroe) prima di entrare nella quest. Inoltre prepara visivamente il sistema equipaggiamento del gioco completo (arma/amuleto useranno lo stesso pattern).
- *Dove:*
  - Nuovo pannello `InventoryStrip.tsx` accanto a `VillageRosterSection`.
  - Nuova entità "Item Card" minimale: id, label, icon, `equippableOn: 'hero' | 'peasant' | 'any'`, `effects: [{questRequirement: 'licenza_caccia'}]`. Persistita via `PersistenceService`.
  - Estensione `SlottedMedal` con un layer "equipped badges" in basso (1-2 slot visibili).
  - Hook su `QuestActionCard` `onDragOver`: verifica requirements del PG trascinato e mostra preview di accettazione/rifiuto (lega bene con R2.2).
  - Audio cue: "snap" quando la carta si incastra sul medaglione.

### 3.3 Raffinamenti Lords of Waterdeep (worker placement / engine building)

**R3.1 — Cap peasants per slot, sorgente: `dynamicConfig.json`** *(decisione utente: config-driven)*
- *Cosa:* il cap è il valore `maxResidents` che è già esposto **per ogni slot** in `src/data/dynamicConfig.json` → `mapSlots.<slotId>.maxResidents` (oggi `village_square: 6`, `village_gate: 4`). Per la slice si ribilanciano i valori job per job (es. `taglialegna: 2`, `setaccio_oro: 2`, `centro_villaggio: 4` per il riposo). Visivamente lo slot mostra N "alloggi" pieni/vuoti pari a `maxResidents`.
- *Perché:* la scarsità *fa* il game, ma il valore esatto resta una manopola di bilanciamento che si tocca dal JSON senza rilascio: posso testare 2 vs 3 vs 4 in playtest senza ricompilare.
- *Dove:* lettura via `dynamicConfig.json` (già caricato dal client); l'UI di `JobActionCard` consuma il cap dallo slot e disegna gli alloggi. Nessun nuovo file di config.

**R3.2 — Numeri "rate" visibili sul pannello Villaggio**
- *Cosa:* ogni edificio nel pannello mostra "Produce X / giorno con N peasants assegnati". Quando assegni un peasant in più, mostra la differenza con frecciette gialle.
- *Perché:* engine building è gratificante solo se *vedi* il motore accelerare. È la stessa dopamina dei "click counter" + i contatori di Lords of Waterdeep.
- *Dove:* nuovo `VillageScreenOverlay.tsx` (overlay sopra la mappa) che ricicla `BuildingCard` come tile.

**R3.3 — Blueprint come catalogo a tre stati**
- *Cosa:* nel pannello Villaggio i blueprint sono in tre stati visivi:
  - **Costruibile** (hai le risorse): tile chiara, bottone "Costruisci".
  - **Conosciuto ma povero** (manca risorse): tile sbiadita, mostra cosa manca.
  - **Sconosciuto** (locked, sblocco da quest): silhouette grigia "?" con hint "Sblocca da quest".
- *Perché:* fame di scoperta. Il giocatore vede quanti blueprint ci sono ma non tutti, e questo lo motiva a fare quest per sbloccare.
- *Dove:* `VillageScreenOverlay.tsx` + struttura `BlueprintCatalog` in config.

**R3.4 — Equip e XP come "carburante" tangibile del motore**
- *Cosa:* sulla card dell'eroe (medaglione esteso al click): barra XP segmentata in 3 tacche (lvl 1 → 2), slot equip (arma, amuleto) visibili. Quando l'eroe completa una quest, la barra XP si riempie con animazione *sopra* il medaglione, non solo nel modal.
- *Perché:* feedback ricco e immediato. È quello che manca alla maggior parte degli idle: il "vedo il numero salire" deve avvenire nel posto giusto, sul *personaggio*.
- *Dove:* estensione `SlottedMedal` o un layer `MedalXPRing.tsx` da sovrapporre.

**R3.5 — Tempo continuo, senza battito di fine giornata** *(decisione utente: continuo)*
- *Cosa:* niente pausa con summary. Il tempo scorre senza interruzioni e il giocatore può intervenire quando vuole. Per compensare l'assenza del "battito strategico" senza svuotare la dimensione gestionale, si aggiungono **due sostituti diffusi**:
  - **Day-clock + tacche eventi (R1.2):** la timeline mostra in anticipo "tra X tick farà notte / arriva il Mercante / scade quella quest". È lì che il giocatore *legge* il futuro prossimo.
  - **Highlight della scelta corrente:** quando un peasant è ozioso o un eroe è a riposo completo, il loro medaglione pulsa molto delicatamente nel roster. Niente popup, niente modali — solo un richiamo periferico per dire "qui c'è una decisione da prendere".
- *Perché:* la scelta è coerente col feel idle puro. Il rischio di non avere mai un *istante di riflessione* viene neutralizzato dal day-clock + dall'highlight passivo, che fanno da "sostituti delicati" del battito End-of-Day.
- *Dove:* `DayClockTimeline` (R1.2) gestisce la previsione; il pulse passivo è un layer sul `SlottedMedal` nel roster. Nessun `EndOfDaySummary.tsx` da creare.

**R3.6 — Sinergia Locanda → peasants, IN SLICE** *(decisione utente: in slice)*
- *Cosa:* la Locanda, oltre a sbloccare il reclutamento dei peasants, attiva una sinergia osservabile:
  1. **Effetto meccanico:** ogni peasant *reclutato dalla Locanda e attualmente assegnato* a un job riceve un piccolo bonus passivo. Default proposto (da `dynamicConfig.json`, ribilanciabile):
     - **+10% rate di produzione** sul job a cui è assegnato, oppure in alternativa
     - **-1 tick di "stanchezza" notturna** (recupero più rapido quando torna a riposare).
     Si sceglie *uno* dei due per la slice — propongo il **+10% rate**, perché è leggibile sui contatori. La stanchezza è più sottile e rischia di non vedersi nella finestra dei 30 min.
  2. **Lettura visiva:** una linea sottile dorata pulsa lentamente dalla Locanda verso ogni POI dove c'è almeno un peasant suo. La linea è gentile (opacità bassa, animazione di "respiro" lenta), non un effetto invadente.
  3. **Lettura testuale:** nel pannello Villaggio, la card della Locanda mostra esplicitamente "Bonus attivo: +10% produzione su N peasants reclutati (su M assegnati)". Numeri sempre aggiornati.
  4. **Trigger temporale:** la sinergia si attiva *appena* la Locanda è costruita e si applica retroattivamente al primo peasant reclutato — così il primo peasant è già "premio doppio" (nuovo lavoratore + edificio che lo potenzia). Questa coincidenza temporale dà la prima vera "scarica" di engine building.
- *Perché:* engine building si sente solo quando gli edifici si parlano. Una *sola* sinergia visibile, ma chiara e quantificabile, comunica la promessa del gioco completo (Fucina che potenzia equip, Tempio che cura, ecc.). Inoltre crea un'asimmetria interessante tra peasants "reclutati alla Locanda" e potenziali peasants "reclutati altrove" più avanti — gancio narrativo gratuito.
- *Dove:*
  - Config in `dynamicConfig.json`: nuova sezione `buildings.inn.synergies` con `{ target: 'recruited_peasants', effect: 'production_rate', value: 0.10 }`.
  - Engine: estensione di `minimalGameRules` per applicare il bonus al calcolo del payoff dei job, *solo* quando il worker ha origine `inn`.
  - UI: linea SVG dorata (riusa il layer di R1.3) + numeri nella `BuildingCard` della Locanda nel pannello Villaggio.
  - Origine peasant: aggiungere un campo `recruitedAt: 'inn' | 'fortunaEvent' | ...` su Resident, popolato dal flow di reclutamento.

---

## 4. Refinements trasversali (psicologia & ritmo)

Questi non appartengono a un singolo pillar ma sono ortogonali e servono ad aumentare la soddisfazione complessiva.

**R4.1 — Tre "scariche di dopamina" nella slice, scritte e coreografate**
1. **Primo peasant assegnato** (dopo Locanda): visual flash + suono caldo, il numero risorse comincia a salire da solo per la prima volta.
2. **Prima quest urgente risolta in tempo**: la `QuestResolutionCard` flippa con flash dorato.
3. **Level up eroe**: il ring del medaglione passa bronzo→argento, fermo immagine 1.5s, fanfara.

Sono i tre *momenti firma* della demo. La slice deve essere ritmata per garantirli tutti e tre in ~30 min.

**R4.2 — Tutorial *invisibile* via gating**
- *Cosa:* niente tutorial pop-up. L'unico tutorial è che all'inizio *solo certe cose sono cliccabili*: Taglialegna e Centro Villaggio sono illuminati, gli altri POI sono velati con un sottile "non ancora". Man mano che il giocatore avanza, si illuminano.
- *Perché:* tutorial diegetico = scoperta. Non rompe lo stato di flow.

**R4.3 — Sound design come "scheletro"**
- *Cosa:* tre famiglie di suoni:
  - **Drop / Pickup** (legno, ottone) — feedback fisico del drag.
  - **Halo states** (drone basso sui rossi, chime sui gialli completati).
  - **Eventi** (campana lontana per nuova quest, fischio per mercante).
- *Perché:* l'audio raddoppia la leggibilità visiva. Una persona che gioca senza guardare il monitor *sente* lo stato.

**R4.4 — Niente penalità definitive nella slice**
- Eroe ferito → si riposa N giorni → torna. Niente death. Le risorse non si perdono. La slice deve far innamorare, non punire.

---

## 5. Anti-pillar (cosa NON costruiamo, per non confondere il marchio)

| Anti-pillar                              | Perché lo evitiamo                                          |
| ---------------------------------------- | ----------------------------------------------------------- |
| Costruzione libera su griglia (Townscaper, Banished) | Toglierebbe il focus dalle decisioni di worker placement.   |
| Combattimento in tempo reale animato     | Conflitto col pillar Cultist Sim (esiti = carte, non scene). |
| Numeri esposti senza contesto narrativo  | Conflitto col pillar Cultist Sim (frame narrativo sempre).   |
| Albero di skill complesso per l'eroe     | Conflitto con la sobrietà di LoW (decisioni rade ma pesanti). |
| Tutorial scriptato con bolle             | Conflitto con il tutorial diegetico (R4.2).                  |

---

## 6. Mappa dei prossimi passi (collega con Roadmap)

Questa lista NON sostituisce `VERTICAL_SLICE_ROADMAP.md` ma indica quali raffinamenti vanno inseriti in quali macro-fasi:

- **Fase B (Core loop minimo girabile):** R1.1 (layout), R1.2 (day-clock), R2.1 (verbi POI), R3.1 (cap peasants), R3.2 (rate visibili).
- **Fase C (Skill check Cultist Sim):** R2.2 (preview prob), R2.4 (resolution card), R2.6 (Licenza come card).
- **Fase D (Reward + Level up):** R3.4 (XP sul medaglione), R4.1 (i 3 momenti firma).
- **Fase E (contenuto Steam-presentabile):** R2.5 (Chronicle), R3.3 (Blueprint catalogo), R3.5 (end of day), R3.6 (sinergia).
- **Fase F (Polish):** R1.3 (linee SVG), R1.4 (notifiche diegetiche), R1.5 (notte), R2.3 (coreografia halo), R4.3 (sound).

---

## 7. Decisioni di direzione (consolidate)

Tutte e cinque le scelte di direzione sui pillar sono state prese (2026-05-22):

- ✅ **R2.1 Verbi POI** → **Etichette nominali** ("Taglialegna", "Setaccio dell'Oro", "Trattativa"). Lo stato/urgenza vive sull'halo e su un piccolo `statusTag`.
- ✅ **R2.6 Licenza di Caccia** → **Drag manuale**: la Licenza è una carta visibile in un `InventoryStrip`, va trascinata sul medaglione dell'eroe per equipaggiarla, e solo a quel punto sblocca il drop sulla quest. Prepara il pattern di equipaggiamento del gioco completo.
- ✅ **R3.1 Cap peasants per slot** → **Da `dynamicConfig.json` (`mapSlots.<slotId>.maxResidents`)**. Non hardcoded, ribilanciabile in playtest.
- ✅ **R3.5 End of Day** → **Tempo continuo, niente battito**. Compensato dal day-clock (R1.2) + pulse passivo sui medaglioni oziosi.
- ✅ **R3.6 Sinergia Locanda → peasants** → **In slice**: +10% produzione per peasants reclutati alla Locanda e attualmente assegnati a un job. Linea SVG dorata + bonus quantificato nella `BuildingCard` della Locanda.

Da qui si può passare a un **implementation plan iterativo** per la slice. Suggerimento d'ordine (vedi §6 per il mapping completo macro-fase → raffinamenti):

1. **Layout control-room (R1.1)** — riorganizzazione di `MinimalGameplayPage.tsx` in tre regioni stabili (mappa / roster+inventario / HUD+day-clock). Pre-requisito di tutto il resto: niente raffinamento ha senso prima.
2. **Day-clock + tacche eventi (R1.2)** — perché il tempo continuo (R3.5) diventa pilotabile solo con il day-clock.
3. **Cap slot da `dynamicConfig.json` (R3.1)** — base del worker placement, da fissare prima di balancing.
4. **InventoryStrip + drag Licenza (R2.6)** — il primo pezzo "carta-oggetto", che apre la strada alla logica equip.
5. **Preview requisiti al hover (R2.2)** — naturale estensione di R2.6: senza preview il drop manuale frustra.
6. **Sinergia Locanda + linea SVG (R3.6)** — primo motore di engine building visibile.
7. **Pannello Villaggio overlay (R3.2 + R3.3)** — diventa significativo solo con almeno una sinergia attiva.
8. **Resolution card flippabile (R2.4)** — chiude il loop quest, sostituisce il pianificato `QuestSuccessModal`.

Quando vuoi, parto dalla #1 con un piano di task minimo e iteriamo lì.
