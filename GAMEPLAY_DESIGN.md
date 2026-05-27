# Gameplay Design — Vertical Slice Steam

**Companion di:** `VERTICAL_SLICE_ROADMAP.md`, `DEVELOPMENT_GUIDELINES.md`
**Versione:** 2 (riscritta dopo correzioni utente del 2026-05-12)
**Cosa è questo file:** descrivere il gameplay reale del progetto e della slice. Non spec tecnica, ma "cosa succede quando si gioca".

---

## 1. Identità del gioco

**Genere:** Village/incremental management RPG con drag & drop, ispirato a board game strategici.
**Ispirazioni e Riferimenti Chiave:**

1. **UI di base & Mappa: Ispirata a *Dispatch***
   *   La UI non è una griglia classica né un mondo esplorabile a scorrimento, ma una **centrale operativa / mappa tattica** in cui i Point of Interest (POI) sono nodi interattivi connessi.
   *   I progressi e i tempi sono rappresentati visivamente tramite indicatori circolari e animazioni di riempimento dei nodi stessi.
   *   Estetica scura/glassmorfica in stile "Gilded Observatory" con glow dorati, ambra e rossi che segnalano gli allarmi o lo stato del villaggio.

2. **Meccanica degli Aloni (Halos): Ispirata a *Cultist Simulator***
   *   Ogni POI e Quest ha un anello esterno (halo) che indica il tempo rimanente o lo stato di avanzamento.
   *   **Fase FOMO (Scadenza - Rosso):** Quando una quest temporanea appare, l'anello è rosso e si riduce progressivamente. Comunica l'urgenza e stimola il giocatore ad intervenire.
   *   **Fase Azione (Risoluzione - Giallo/Ambra):** Quando l'eroe viene assegnato allo slot del POI prima della scadenza, l'halo si resetta, diventa giallo/ambra e comincia a riempirsi visualizzando il progresso del lavoro.

3. **Gameplay Loop & Automazione: Ispirato a *Lords of Waterdeep* (Approfondito)**
   *   **Divisione del Roster:**
       *   *Peasants (Worker):* Lavoratori non-eroici senza stamina. Vengono reclutati (alla Locanda) e assegnati permanentemente ad attività di raccolta base (Taglialegna, Setacciare Oro) per generare risorse. Non possono fare quest.
       *   *Eroi (Avventurieri):* Personaggi unici con statistiche, equipaggiamento e livelli. Consumano stamina per fare quest e guadagnare XP.
   *   **Progressione del Motore:** Il giocatore piazzi i Peasants per stabilizzare la produzione passiva, mentre usa l'Eroe per risolvere le Quest che poppano a tempo sulla mappa. Il completamento delle quest sblocca upgrade di edifici, blueprint e l'acquisto di licenze (es. dal Mercante ambulante).

**Setting:** Avamposto di frontiera dove la civiltà incontra la wilderness. Tono D&D classico, con quest del tipo "recupera l'artefatto / sconfiggi i banditi".
**Visual Style:** Medaglioni circolari board-game per i personaggi (`SlottedMedal.tsx`), action card per quest/lavori/eventi sulla mappa. Niente sprite di camminata, ma una mappa astratta con feedback visivi e audio eccellenti.

---

## 2. Due classi di personaggi

Distinzione fondamentale del gameplay.

### 2.1 Personaggi normali (artigiani / lavoratori)

- **Cosa fanno:** producono risorse concrete — ferro, legname, cibo, gold.
- **Cosa NON fanno:** non vanno in quest, non combattono mostri.
- **Dove vengono:** si comprano (servizio di reclutamento, probabilmente al centro del villaggio o alla taverna).
- **Esempio:** un taglialegna assegnato all'edificio "Taglialegna" produce N legname / ciclo.

### 2.2 Eroi (avventurieri)

- **Cosa fanno:** vanno in quest. Affrontano dungeon, recuperano artefatti, esplorano rovine.
- **Cosa NON fanno:** non lavorano agli edifici di produzione (almeno in principio — possibile eccezione di game design futuro).
- **Dove vengono:** arrivano spontaneamente alla taverna come avventurieri di passaggio. Si pagano per assoldarli (gold costo proporzionale a stat/raredness). Inizi la partita con 1-2 eroi base nel roster.
- **Sblocco progressivo:** dopo quest completate o quando la reputazione del villaggio cresce, nuovi eroi compaiono.

### 2.3 Sintesi

Gli artigiani producono **i materiali**. I materiali servono a **comprare l'equip** (e magari il cibo per gli eroi). L'equip permette agli eroi di affrontare quest **più difficili**, che danno **più exp e ricompense rare**. Le ricompense rare permettono **level up + upgrade edifici**, che producono più materiali, che permettono equip migliore, ecc.

È un loop economico classico ma con un divisorio netto fra forza lavoro e forza avventuriera.

---

## 3. La città all'inizio della slice

All'avvio della Vertical Slice, il giocatore si trova in un piccolo avamposto di confine. L'incipit vede l'Eroe unico che giunge in questo villaggetto dopo essere stato esiliato, partendo con **stamina molto bassa**.

Il layout iniziale comprende:
*   **Centro del villaggio (POI Permanente):** Il nucleo di controllo dell'avamposto. All'inizio serve principalmente come luogo di riposo per l'eroe per recuperare stamina.
*   **Aree di Raccolta Base (POI Permanenti):**
    *   *Taglialegna:* Consente di raccogliere Legno.
    *   *Setacciare Oro:* Consente di raccogliere Oro.
*   **Quest Ripetibile (POI Speciale):** Richiede un requisito specifico (**"Licenza di Caccia"**) che l'Eroe non possiede all'inizio, bloccandone l'esecuzione immediata.
*   **Pannello di Controllo Villaggio (Village Screen):** Un menu overlay che mostra i blueprint disponibili. Il primo e fondamentale blueprint sbloccato è la **Locanda (Inn)**, acquistabile per 30 Oro e 40 Legno.

---

## 4. POI sulla mappa & Eventi Dinamici

Lo spazio della mappa tattica (in stile *Dispatch*) ospita nodi interattivi (POI) che rappresentano attività e minacce:

### 4.1 POI di Produzione (Permanenti)
Nodi stabili in cui possono essere assegnati eroi o peasants per la produzione di risorse o il recupero di statistiche (es. Centro Villaggio per riposo, Taglialegna, Oro).

### 4.2 POI Temporanei e Quest Urgenti (Ispirati a *Cultist Simulator*)
Durante la partita, compaiono sulla mappa eventi e quest casuali che richiedono immediata attenzione:
*   **Il Mercante Ambulante (Event Countdown):** Un widget di conto alla rovescia segnala l'arrivo imminente del mercante. Quando il countdown scade, il mercante appare come POI temporaneo per 1 giorno. È l'unico che vende la **Licenza di Caccia** per 30 Oro, consentendo di sbloccare la quest ripetibile.
*   **Quest Urgenti (Expiring Quests):** Compaiono con un'anello esterno (halo) **rosso** che si svuota progressivamente. Se il tempo scade prima che l'Eroe venga assegnato allo slot, il POI svanisce. Se l'Eroe viene assegnato in tempo (e soddisfa i requisiti della quest), l'halo diventa **giallo** e inizia a riempirsi visualizzando il progresso del completamento. Se completate con successo, forniscono XP all'eroe e risorse rare.

---

## 5. La meccanica core: drag & drop → action card

### 5.1 Flusso base

1. Il giocatore vede un POI con action card attiva sulla mappa (`QuestCard` / `JobCard` / `MarketActionCard`).
2. Trascina un medaglione circolare (un personaggio dal roster) sopra l'action card.
3. Il medaglione si "incastra" nello slot dell'action card (il componente `SlottedMedal` ha già skin bronze/silver/gold/platinum + halo + ring).
4. Parte un timer visibile (`ActionProgressBar` esistente).
5. Allo scadere del timer, scatta lo skill check (per le quest) o si concretizza il payoff (per i job).

### 5.2 Lo skill check (stile Cultist Simulator)

Quando una quest si risolve, **non c'è un'animazione di combattimento**. Si apre un pannello pulito, statico:

- L'**oggetto-quest** (la card narrativa che descrive la sfida) al centro.
- Le **stat richieste** (es. "Forza 6, Percezione 4") come tag chiari.
- Le **stat effettive** dei personaggi assegnati (eroe + equip + buff temporanei) come tag accanto.
- Un **roll deterministico-ma-probabilistico** in stile carte: tira una probabilità, mostra il risultato.
- L'**outcome** è uno di: critical success / success / partial / fail / disaster — ciascuno con esiti narrativi diversi.

L'estetica: tipografia chiara, pochi colori, layout simmetrico. Nessun effetto fronzolo. Inspiration **Cultist Simulator**: gli oggetti sono carte, le combinazioni sono leggibili, il fato è chiaro.

### 5.3 Quest impossibili senza equip

Regola di design: le quest "interessanti" (cioè quelle che danno exp/loot rari) hanno stat threshold che nessun eroe base raggiunge senza equipaggiamento.

Conseguenza per il giocatore: **non puoi mandare un eroe nudo in dungeon serio**. Devi prima:

1. Far lavorare gli artigiani (job ripetibili) per accumulare materiali e gold.
2. Aspettare il **mercante itinerante** o usare il negozio fisso (se esiste in slice).
3. Comprare equip che porti le stat al threshold richiesto.
4. *Solo allora* mandare l'eroe.

Questa è la **catena di preparazione** che distingue il gioco da un normale clicker / idler.

---

## 6. Il loop di sessione

Una "sessione tipica" del giocatore in slice Steam:

1. **Apertura giornata**: controllo del roster (chi è disponibile, chi è in attività, chi è ferito o stanco).
2. **Assegnazione lavoratori**: drag artigiani → job action card per produrre risorse.
3. **Negoziazione mercante** (se presente): vendi materiali, compra equip per gli eroi.
4. **Assegnazione eroi**: drag eroi → quest action card, considerando le stat threshold.
5. **Attesa attiva**: i timer scorrono, l'HUD risorse cresce, ogni tanto skill check.
6. **Eventi**: quest temporanee compaiono, decidi se cogliere.
7. **End of day**: edifici producono passivamente, eroi guariscono in taverna, day counter avanza.
8. **Level up** (occasionale ma cruciale): un eroe sale di livello → upgrade di un edificio diventa disponibile → la macchina di produzione accelera.

---

## 7. Il "WoW moment" & Vittoria della slice

L'esperienza culmina in due momenti cruciali di progressione:
1.  **L'Automazione (La Locanda):** Il giocatore, accumulando 30 Oro e 40 Legno con sforzi attivi (riposo e lavoro dell'Eroe), sblocca e costruisce la Locanda. Reclutando i **Peasants** e posizionandoli sui job stabili (Taglialegna e Setacciare Oro), sperimenta il sollievo dell'automazione passiva delle risorse base.
2.  **Il Level Up & Fine Slice:** L'Eroe, ora libero dai lavori manuali e dotato della Licenza di Caccia, affronta ed esegue le Quest Urgenti a tempo. Risolvendo un numero target di quest (es. 3), accumula abbastanza XP da effettuare il **Level Up a Livello 2**. Questo sblocca un'animazione trionfale di vittoria e interrompe la Vertical Slice con un teaser del gioco completo.

---

## 8. Cosa la slice Steam mostra (e cosa no)

### 8.1 Mostra
*   **Inizio in esilio:** Roster iniziale con 1 solo Eroe a stamina bassa (15/100).
*   **Gestione stamina:** Loop iniziale di alternanza tra lavoro (Taglialegna/Oro) e riposo (Centro Villaggio).
*   **Event Countdown:** Widget che conta i giorni/tick mancanti all'arrivo del Mercante Ambulante.
*   **Il Mercante Temporaneo:** Visita del mercante con la possibilità di acquistare la "Licenza di Caccia" per 30 Oro.
*   **Quest Ripetibile Sbloccata:** Esecuzione della quest speciale abilitata solo dopo l'acquisto della licenza.
*   **Schermata Villaggio (Village Screen):** Interfaccia di acquisto e upgrade dei blueprint, in particolare la costruzione della Locanda.
*   **Automazione con Peasants:** Reclutamento dei peasant alla Locanda e assegnamento permanente (senza stamina) a Taglialegna/Oro.
*   **Quest Urgenti (FOMO):** Spawn di quest temporanee con halo rosso che si svuota e halo giallo che si riempie in fase di esecuzione.
*   **Progressione & Livellamento:** Il Level Up dell'eroe come condizione di vittoria e completamento della demo.

### 8.2 Non mostra (out of scope per the slice)
*   Combattimento tattico o visuale di scontro in tempo reale.
*   Costruzione libera o posizionamento su griglia 3D degli edifici.
*   Salvataggi multipli (slot) o persistenza cloud.

---

## 9. Componenti già esistenti da usare

| Aspetto gameplay | Componente esistente | Path |
| --- | --- | --- |
| Medaglione circolare drag&drop | `SlottedMedal` + halo + ring | `src/ui/idleVillage/components/SlottedMedal.tsx` |
| Token alternativo (rettangolare) | `PgCard` | `src/ui/idleVillage/components/PgCard.tsx` |
| Overlay durante drag | `CustomDragOverlay` | `src/ui/idleVillage/components/CustomDragOverlay.tsx` |
| Action card base | `ActionCardBase` | `src/ui/idleVillage/map/actionCards/ActionCardBase.tsx` |
| Quest action card | `QuestCard` (via `QuestActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx` |
| Job action card | `JobCard` (via `JobActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/JobCard.tsx` |
| Anello e Progresso Halo | `ActionHalo` | `src/ui/idleVillage/map/actionCards/ActionHalo.tsx` |
| Roster personaggi | `VillageRosterSection` | `src/ui/idleVillage/roster/VillageRosterSection.tsx` |
| Pagina canonical runtime | `MinimalGameplayPage` | `src/ui/idleVillage/MinimalGameplayPage.tsx` |
| Store di stato | `useMinimalGameplay` | `src/store/useMinimalGameplay.ts` |
| Regole e Calcoli Engine | `minimalGameRules` | `src/engine/game/idleVillage/minimalGameRules.ts` |
| Rotta di test | `/minimal-gameplay` | `src/ui/idleVillage/MinimalGameplayPage.tsx` |
| Stili e Color Palette | WL-STY-004 e StyleLab presets | `src/ui/styleLab/presets/` |

---

## 10. Constraint tecnico — bug pickup alignment

Dall'handoff (`idle_village_conversation_context_handoff.md` §5.1):

> Al drag start, il cursore/hand non è centrato sul token — è spostato a destra. Pickup alignment è ROTTO, regression dopo lavori su spring-return.

Implicazione per la slice: **il primissimo task di runtime fix è centrare il pickup**. Tutto il resto del gameplay design dipende da un drag&drop che si sente *giusto*. Finché il token "salta" quando lo afferri, l'esperienza Cultist-Simulator-clean non funziona.

Vedi `VERTICAL_SLICE_ROADMAP.md` Settimana 1 per il piano di intervento puntuale.

---

## 11. Cosa serve definire ancora (decisioni utente pendenti)

Per finalizzare il design senza più invenzioni:

1. **Risorse esatte** della slice: ferro/legname/cibo/gold confermati. Vanno tutti e 4 o si parte con 2 (legname+gold) per semplicità?
2. **Equip minimo**: che tipi di oggetti compra l'eroe? Arma / armatura / amuleto generico, oppure più specifico?
3. **Stat dell'eroe**: quante stat ha? (Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma — full D&D? oppure subset, es. Forza/Percezione/Spirito?)
4. **Numero quest nella slice**: 2-3 quest narrative + N job ripetibili è il target?
5. **Durata target**: hai detto >10 min per Steam. Che ordine di grandezza — 30 min? 1h? 3h di gameplay diverso prima di vedere "End of slice"?
6. **Save slot**: uno automatico oppure permettiamo "New Game / Continue"?
7. **Tono narrativo**: tooltip e dialoghi in stile asciutto-cronaca (Banished) o evocativo-letterario (Cultist Simulator)?

Quando rispondi a queste, finalizzo il design e parto con l'implementazione.
