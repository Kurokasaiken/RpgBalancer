# Gameplay Design — Vertical Slice Steam

**Companion di:** `CLAUDE_PROJECT_BRIEFING.md`, `VERTICAL_SLICE_ROADMAP.md`, `idle_village_conversation_context_handoff.md`
**Versione:** 2 (riscritta dopo correzioni utente del 2026-05-12)
**Cosa è questo file:** descrivere il gameplay reale del progetto e della slice. Non spec tecnica, ma "cosa succede quando si gioca".

---

## 1. Identità del gioco

**Genere:** village/incremental management RPG con drag & drop, in stile board game.
**Riferimenti dichiarati dall'utente:**

- *Banished* (inizio partita: piccolo avamposto, risorse scarse, pochi abitanti)
- *Neverwinter / Baldur's Gate* (frontiera dei Forgotten Realms, atmosfera D&D classica)
- *Lord of Waterdeep* approfondito (assegni meeple a luoghi, ma con una catena di preparazione vera)
- *Cultist Simulator* (skill check elegante: oggetti-carta che si combinano, niente UI fronzolo)

**Setting:** avamposto di frontiera dove civiltà incontra wilderness. Niente apocalisse, niente dark fantasy estremo: tono D&D classico, con quest "recupera l'artefatto / pulisci la cripta / sconfiggi il bandito".

**Tipo di tile/visual:** medaglioni circolari da board game per i personaggi (componente `SlottedMedal.tsx`), action card per quest/lavori/eventi sulla mappa (componenti `QuestCard`, `JobCard`, `ActionCardBase`). Niente sprite, niente pixel art, niente animazioni di camminata.

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

Una piazza centrale con **3-4 edifici fissi** visibili dal primo secondo:

| Edificio | Funzione | Stato slice |
| --- | --- | --- |
| **Taverna** | Punto di incontro. Qui spawnano eroi reclutabili (avventurieri di passaggio). Probabilmente anche alcune quest narrative iniziano qui. | Visibile, interagibile |
| **Centro del villaggio** | Hub gestionale. Spawna quest casuali, gestisce reputazione, sblocca upgrade. | Visibile, interagibile |
| **Taglialegna** | Edificio di produzione base. Assegni un artigiano → produce legname. Esempio di "work station" upgradabile. | Visibile, attivo dall'inizio |
| *(opzionale 4° edificio: Fucina o Magazzino)* | Da definire in base alle ricompense reali del primo level up. | Da decidere W1 |

**Regola dura per la slice:** **non si costruiscono nuovi edifici**. Gli edifici esistono già, all'avvio. L'unica evoluzione strutturale è l'**upgrade** di edifici esistenti.

---

## 4. POI sulla mappa

Lo spazio attorno alla piazza centrale ospita due tipi di POI (Point of Interest):

### 4.1 POI permanenti (legati a edifici)

Action card ricorrenti che vivono accanto al loro edificio.

- **Job ripetibile**: "Taglia legna" (action card sopra l'edificio Taglialegna). Assegni un artigiano, parte un timer, alla fine ricevi legname.
- **Quest narrativa edificio-driven**: "Pattuglia le rovine vicine" (dal Centro Villaggio). Assegni un eroe, parte il timer, skill check, outcome.

Questi POI **restano sempre disponibili**. Sono il flusso di base.

### 4.2 POI temporanei (spawnati nella mappa)

Eventi che compaiono in posizioni libere della mappa e scadono dopo un tempo o un trigger.

- **Mercante itinerante** (ogni X giorni): action card temporanea che permette scambi (vendere materiali → comprare equip / cibo / contratti eroi).
- **Quest spawnate** dal centro del villaggio o eventi narrativi: "Cripta scoperta a nord-ovest — squadra di banditi avvistata — disturbo nei boschi".
- **Eventi mistici / random encounter** (futuro): meteoriti, pellegrini, cacce al tesoro.

Questi POI **sono pressione narrativa**: il giocatore deve decidere se rispondere mentre sono attivi, altrimenti scadono.

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

Il loop si ripete con sempre più contenuti sbloccati man mano che il villaggio cresce.

---

## 7. Il "WoW moment" della slice

L'utente lo ha indicato esplicitamente: **un eroe sale di livello e si sblocca l'upgrade di un edificio**.

Significato di design:

- Il giocatore vede una progressione **personale** (eroe più forte) e **strutturale** (villaggio più produttivo) in un unico evento.
- Visivamente: animazione level up sul medaglione dell'eroe (anche solo un glow del ring + cambio skin bronze → silver), e un'icona "upgrade disponibile" che lampeggia sull'edificio.
- Narrativamente: l'eroe ha portato fama → il villaggio attira più mercanti / più richieste / più lavoratori / migliori strumenti.

È il primo momento in cui il giocatore **sente** che le sue scelte hanno costruito qualcosa.

---

## 8. Cosa la slice Steam mostra (e cosa no)

### 8.1 Mostra

- Roster con 1-2 eroi iniziali + qualche artigiano.
- 3-4 edifici interattivi (taverna, centro villaggio, taglialegna, +1 da definire).
- Job ripetibili attivi dal minuto zero.
- Mercante itinerante (almeno una visita durante la slice).
- 2-3 quest D&D classiche con skill check Cultist Simulator-style.
- Sistema di equipaggiamento minimo (comprare equip → migliorare stat → fare quest difficile).
- Almeno **un level up + un upgrade edificio** durante la slice.
- Reputazione che cresce, **un eroe nuovo che arriva spontaneamente alla taverna** come risultato.
- Skill check estetica curata.

### 8.2 Non mostra (out of scope per la slice)

- Combattimento tattico (le quest si risolvono via skill check, non turn-based).
- Costruzione di nuovi edifici da zero.
- Multiplayer / cloud save.
- Localizzazione completa (slice in EN con stub IT predisposto per dopo).
- Tutorial scriptato (basta UI auto-esplicativa + tooltip).
- Più di un biome / più di una mappa.

---

## 9. Componenti già esistenti da usare (no reimplementazione)

Mappa diretta visione → codice. Verificati nel repo.

| Aspetto gameplay | Componente esistente | Path |
| --- | --- | --- |
| Medaglione circolare drag&drop | `SlottedMedal` + halo + ring | `src/ui/idleVillage/components/SlottedMedal.tsx` |
| Token alternativo (rettangolare) | `PgCard` | `src/ui/idleVillage/components/PgCard.tsx` |
| Overlay durante drag | `CustomDragOverlay` | `src/ui/idleVillage/components/CustomDragOverlay.tsx` |
| Action card base | `ActionCardBase` | `src/ui/idleVillage/map/actionCards/ActionCardBase.tsx` |
| Quest action card | `QuestCard` (via `QuestActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx` |
| Job action card | `JobCard` (via `JobActionCard.tsx`) | `src/ui/idleVillage/map/actionCards/wrappers/JobCard.tsx` |
| Market action card | **TODO non implementato** | `src/ui/idleVillage/map/actionCards/MarketActionCard.tsx` |
| Hook gestione action cards | `useActionCardsV2` | `src/ui/idleVillage/hooks/useActionCardsV2.ts` |
| Resident state | Character → Resident pipeline (handoff §1.4) | `src/engine/game/idleVillage/TimeEngine.ts` + Village Resident Store |
| Roster | `VillageRosterSection` | `src/ui/idleVillage/roster/...` |
| Pagina canonical runtime | `MinimalGameplayPage` | `src/ui/idleVillage/MinimalGameplayPage.tsx` |
| Surface route | `/minimal-gameplay` | confermata dall'handoff §1.3 |

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
