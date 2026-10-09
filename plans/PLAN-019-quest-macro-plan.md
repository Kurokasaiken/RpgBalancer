---
title: 'Macro plan Quest — prima una quest vera e divertente, poi integrazione, poi generazione'
status: active
created: 2026-10-01
baptized: 2026-10-01 (Director: "procedi", v3 dopo 2 round di critica multi-AI web)
revised: 2026-10-01 (v3 — round 2: chatgpt + claude minor revision; correzioni di precisione applicate); 2026-10-02 (v4 — desiderata rev.2: modello obiettivo/reward, compound dalla partenza, slot leader/bodyguard, rischi per slot condizionati al verdetto)
desiderata: v24 (FROZEN 2026-10-01) + rev.1 + rev.2
request: R-076
children: PLAN-019-S1 ([battezzato 2026-10-02](PLAN-019-S1-quest-interessante.md)), PLAN-019-S2 ([draft 2026-10-09](PLAN-019-S2-quest-vera.md) — slice R-107 «2 POI funzionanti», completato 2026-10-09), PLAN-019-S3 ([draft 2026-10-09](PLAN-019-S3-parte-precedente.md) — R-118, in attesa di battesimo), S4–S5 (S5 = PLAN-026 active per deroga)
related: PLAN-018 (precedente implementativo da adattare, v24 punto 6)
---

# PLAN-019 — Macro plan Quest

Macro plan: definisce **stadi, gate, artefatti di passaggio, dipendenze e decisioni aperte**.
Non contiene soluzioni implementative: schema, motore, test e file sono materia dei plan figli. Il
figlio di uno stadio si scrive quando il precedente ha passato il gate; le sezioni di S2–S4 qui
sotto sono **contratti** (domanda, ingresso, uscita), non design.

## Ancoraggio (desiderata v24 FROZEN + rev.1 + rev.2)

1. Cinque stadi in sequenza: S1 quest interessante → S2 quest vera → S3 parte precedente → S4
   integrazione → S5 oltre lo scritto a mano.
2. S5 fuori dal contratto di S1–S4: previsto, non progettato ora.
3. Modello da validare: `PARTY → QUEST → PHASE → SITUATION → APPROACH → CHECK/CHOICE →
   CONSEQUENCE → NEXT PHASE`. Combat sostituibile da risoluzione astratta; se la spedizione non
   regge senza combat, è un'informazione da registrare.
4. **Criterio "interessante" (v24 punto 4, integrale):** durante la quest il giocatore prende
   decisioni che cambiano concretamente il problema successivo e ha motivo di preoccuparsi delle
   conseguenze (situazione → informazione incompleta → scelta dell'approccio → check su
   combinazione di stat → conseguenza → nuova situazione modificata). Fallisce con *"ho cliccato
   sulle opzioni migliori che mi dava il gioco"*. **S1 PASS = Gate A (Director)**; Gate B fuori da
   S1, video facoltativo.
5. Invarianti trasversali (config-first/Zod, i18n, `skinConfigRegistry`, primitive, slice
   verticali). **S1 può derogare agli invarianti infrastrutturali** (formulazione v24, non estesa
   dal piano); il codice S1 non deve poter essere scambiato per architettura definitiva. Prototipo
   in **pagina lab isolata**.
6. PLAN-018 = precedente da adattare; mappatura riusa/adatta/superato/manca in S2/S3.
7. **Regole decise (rev.1 + rev.2):**
   - **rev.1:** preview sui check certi; checkpoint continua/ritirati **prima** di ogni check
     rischioso; fuga = fallimento ma si tiene il bottino; gold per acquisti + inventario
     consumabili; competenze di quest **derivate** dalle stat del balancer (Percezione ← `txc`,
     Forza ← `damage`, Costituzione ← `hp`), balancer intoccato.
   - **rev.2 (2026-10-02):** il **reward di quest** è legato a una **prova-obiettivo precisa**
     (non più alla soglia ≥50%, che resta solo come misura descrittiva degli esiti, non condizione
     di vittoria); la riuscita *stimata dalla partenza* è **compound** dei rischi e dei percorsi
     prima dell'obiettivo; acquisito in fase si tiene sempre, fasi vinte possono dare extra; il
     **leader morto fa perdere la reward di quest** anche a obiettivo già superato; HP separati
     da ferita/morte; rischi ferita/morte **per slot** con modificatori dipendenti dal verdetto
     del check **prima** dei tiri personali (`win` −5pp a ferita e morte, `fail`/`almost` neutri,
     critici con downgrade morte→ferita / upgrade ferita→morte, quantità aperte); slot opzionale
     `bodyguard` che intercetta **solo** esiti di ferita/morte da skill check; stop delle
     iterazioni S1 = parere del Director (D-4); possibile scelta «continua ad esplorare» dopo
     l'obiettivo.
   - **Ancora aperti:** conseguenze precise dei fallimenti sulla prosecuzione (da validare in
     S1); trigger del board wipe; comportamento bodyguard su ferite multiple e da ferito;
     quantità e ordine dei modificatori critici e cumulo con il −5pp; eventuale death save
     (proposta, non regola); danni extra della fuga; mappatura completa competenze
     (Intelligenza, Carisma, …); precisione della preview compound con consumabili e
     diramazioni ignote.
8. Quest di riferimento: struttura del Director (Partenza → Viaggio/mercante → Esplorazione →
   Conseguenza → Scelta di approccio → Evento → Nuova esplorazione → Scoperta/lore → Ulteriore
   evento/ricompensa → Obiettivo → Ritorno). Bozza contenuti:
   `.mw/runs/20261001-s1-reference-quest-draft/draft.md` (da correggere dal Director).
   **Materiale correlato (2026-10-04, non modifica lo spec):** seconda quest authored «Le Rovine
   sotto il Fiume» — mockup in `.mw/runs/20261004-rovine-preview-chatgpt/rovine-mockup.md`,
   implementata nel lab S1 come `questScenarioRovine.ts`; spec preview Monte Carlo per S3 in
   `preview-prompt.md` della stessa directory (tensione MC vs DP esatta aperta, vedi R-082).

## Fatti dal repo (2026-10-01)

- **Debito strutturale quest:** due `QuestEngine` (`src/engine/quest/` → `QuestBranchDiagram`,
  `QuestDecisionFeed`, `QuestPhaseList`, telemetria; `src/engine/game/idleVillage/` → POI quest e
  Planner) e tre definizioni di fase (`engine/quest/types.ts`, `idleVillage/types.ts`,
  `questBlueprints.schema.ts`).
- **Schema blueprint:** tipi di fase `check | fight | stealth | trap | explore | dialogue | branch |
  timedChoice`; `branch`/`timedChoice` senza nessun blueprint che li usi; 4 blueprint scritti a mano.
- **PLAN-018:** MP-00…MP-06 completati (MP-06 il 2026-10-01). MP-07 (docs/test/evidence) non
  assegnato.
- **Skill check attuale:** weakest tag su `checkStatTags` (D100, `partyStatMult`); Astrolabe V1 è
  il componente canonico per lo skill check delle quest (desiderata v3).
- **Stat:** `strength/agility/endurance/intelligence/perception` in `idleVillage/defaultConfig.ts`
  sono mock. Il balancer (`balancer-default-config.json`) ha 25 stat tutte di combattimento,
  `hp` incluso; **nessuna stat sociale o percettiva** → la derivazione di Carisma/Intelligenza non
  ha oggi un candidato ovvio.
- **Item:** consumabili mock (`questItemsMock.ts`, ERR-026). Risorsa `gold` esiste.
- **Chain/lore:** `QuestChainProgressTracker` non collegato al runtime; `LoreDropService`
  collegato via `loreDropStore`.
- **Trial by Fire:** solo piano draft, nessun motore. **Slot obbligatori/secondari:** decisione in
  `DECISION_LOG` 2026-10-01, forma nel repo non verificata.
- **MASTER_PLAN Phase 11 "Tactical Missions"** (0%, concept): nodi 3-5, check non-combat su stat,
  risk/reward, testi brevi, *partial success = reward in base ai successi*. Coperto da S1–S4;
  il "reward proporzionale ai successi" è sostituito dal **modello obiettivo/reward** di
  rev.2 (D-8 superata).

## Divergenze PLAN-018 / runtime ↔ v24

Origine comune: PLAN-018 modella una **sequenza lineare di fasi**; v24 un **grafo di nodi con
scelte e informazione**. Quasi tutte le righe derivano da questo cambio di modello.

| Tema | PLAN-018 / runtime attuale | v24 rev.1 + rev.2 |
|---|---|---|
| Struttura | fasi lineari | nodi con scelte, info, eventi, percorsi alternativi |
| Informazione | assente (tutto noto nel Planner) | primaria nota, secondarie rivelate da esplorazione |
| Check | weakest tag su `checkStatTags` | primaria + secondarie; l'approccio scelto cambia la stat |
| Successo | `isPassingVerdict = win\|bigwin` per fase + ≥50% delle fasi del blueprint | **prova-obiettivo precisa** → reward di quest; il conteggio dei check non decide più la vittoria |
| Preview | DP esatta su sequenza lineare, rischi per membro indipendenti dal verdetto | chance **compound dalla partenza** fino all'obiettivo, dichiarata come stima su ipotesi (consumabili/scelte future non fissati) |
| Rischio | roll per membro indipendenti dal verdetto del check; cover additiva | rischi **per slot** condizionati dal verdetto prima dei tiri; bodyguard intercetta solo danni da skill check |
| Checkpoint | dopo **ogni** fase | **prima** di ogni check rischioso |
| Uscita anticipata | ritiro → tier sulle fasi giocate; wipe → `deadly` | fuga = fallimento, si tiene il bottino; leader morto = reward persa |
| Morte | il morto esce dalle fasi successive | + morte = spesa di una risorsa PG (persistente); morte del leader = reward persa |
| Stat | mock idleVillage | competenze derivate dal balancer |

## Stadi

Per ogni stadio: **domanda** (v24), **ingresso**, **artefatto di uscita**, **gate**.

### S1 — La quest interessante (PLAN-019-S1)
- **Domanda:** "Questa quest è un gioco interessante?"
- **Ingresso:** (a) bozza contenuti corretta e **congelata** dal Director (la versione giocata al
  gate è identificata); (b) conseguenze di ciascun fallimento sulla **prosecuzione** definite
  nella matrice della quest (rev.2: finché non sono definite, nessuna chance compound è
  significativa); (c) definizioni di **check rischioso** e **check certo** confermate (vedi sotto).
- **Perimetro:** la quest di riferimento giocabile end-to-end in pagina lab isolata, con le regole
  rev.1 + rev.2. Le conseguenze si giocano **dentro la quest** (il morto esce dalle fasi
  successive, la ferita pesa, il bottino si accumula, la fuga chiude con fallimento, la morte del
  leader perde la reward di quest); la loro **persistenza** nel villaggio è mock in S1 e diventa
  reale in S2. Mock ammessi per stat, item, gold, persistenza (deroga infrastrutturale v24).
- **Regole gameplay rev.2 da provare in S1** (ipotesi di gameplay, non architettura):
  slot con rischi ferita/morte diversi; verdetto del check che modifica le chance per slot prima
  dei tiri personali (`win` −5pp ferita+morte, `fail`/`almost` neutri, critici con downgrade/
  upgrade, quantità aperte); slot `bodyguard` opzionale che intercetta solo danni da skill check;
  reward di quest legata alla prova-obiettivo e persa se il leader muore; possibile scelta
  «continua ad esplorare» dopo l'obiettivo; eventuale death save **da valutare**, non da aggiungere
  in silenzio.
- **Definizioni proposte (da confermare all'ingresso):**
  - *check rischioso* = check che può produrre ferita, morte o perdita di HP (rev.1 p.6, HP ora
    separati — rev.2) → è preceduto dal checkpoint;
  - *check certo* = check presente in **tutti** i percorsi ancora possibili dal punto corrente e
    con stat nota → è l'unico che entra nella preview (rev.1 p.10);
  - *prova-obiettivo* = la prova (o condizione) che assegna il **reward di quest** (rev.2); le
    altre fasi danno bottino/vantaggi/costi e possono modificare le condizioni della prova-
    obiettivo senza decidere da sole la vittoria.
- **Gate A:** **S1 PASS = giudizio del Director** (v24), informato da tre criteri osservabili
  annotati per run:
  1. esistono punti di scelta in cui l'opzione preferita **cambia** al variare di party o
     informazione raccolta (nessuna scelta dominante in tutte le run giocate);
  2. un'**informazione** raccolta cambia la scelta successiva;
  3. una **conseguenza** modifica il problema successivo (difficoltà, stat rilevante, percorso,
     risorse).
  **Evidenza minima proposta** (da confermare al battesimo di S1, non è una soglia di PASS):
  almeno 3 run con party diversi e almeno 2 approcci diversi alla scelta di approccio.
- **Artefatti di uscita:**
  - nota di playtest (`test-results/`): run giocate, party, percorsi, decisioni, annotazione dei
    criteri 1–3, giudizio del Director con **classificazione del FAIL** se negativo
    (core loop / contenuto / sistema di supporto / pacing / inconclusivo);
  - **regole validate** — *nome storico dell'artefatto: in S1 significa "proprietà di design
    osservate in questa quest", non validazione sistemica* (critica r3 del plan figlio) — tabella
    con, per riga: *regola* · *proprietà decisionale che sostiene* (criterio 1/2/3) · *tipo*
    (regola fissa / parametro da bilanciare / contenuto specifico della quest) · *dipende da stat
    mock* (sì/no) · *portabilità verso S2* (sì / da riverificare / no). S2 trasferisce le regole
    fisse, ribilancia i parametri, e sa quali proprietà sono a rischio al passaggio mock →
    balancer;
  - **nota combat**: la spedizione regge senza combat? sì/no + osservazioni (v24 punto 3).
- **Se FAIL:** si itera dentro S1 su contenuti/regole; il criterio di stop è una decisione del
  Director (vedi D-4).

### S2 — La quest vera (PLAN-019-S2)
- **Domanda:** "Possiamo farla davvero, senza trucchi?"
- **Ingresso:** S1 PASS + "regole validate" + **D-3 chiusa** (mappatura competenze). **Primo
  step di S2:** spike sui due motori → chiude D-2 prima di qualsiasi altro lavoro S2.
- **Contratto:** la quest di riferimento gira su un solo modello canonico quest/fase, con
  competenze derivate dal balancer, item reali e conseguenze persistenti (ferite, morte = spesa
  risorsa PG, loot, gold). Mappatura PLAN-018 riusa/adatta/superato/manca prodotta come artefatto.
  Il codice S1 non viene promosso: si trasferiscono le **regole validate**, non l'implementazione.
- **Gate:** (a) nessun mock nel percorso di risoluzione; (b) **preservazione delle proprietà
  validate**: rigiocata sul runtime, la quest soddisfa ancora i criteri 1–3 di Gate A per le righe
  di "regole validate" (i numeri possono cambiare, le proprietà decisionali no; le righe con
  *dipende da stat mock = sì* sono verificate per prime); (c) giudizio del Director.

### S3 — La parte precedente ([PLAN-019-S3](PLAN-019-S3-parte-precedente.md), draft 2026-10-09)
- **Domanda:** "Preparare la spedizione è altrettanto interessante?"
- **Ingresso:** S2 completato + righe di "regole validate" relative all'informazione (S1).
- **Contratto:** planning e preparazione (slot obbligatori/secondari, assegnazione PG, loadout,
  informazione nota/ignota, preview sui check certi), adattando il Planner PLAN-018 dove le regole
  validate lo permettono.
- **Gate:** (a) la scelta del party non si riduce a "il numero più alto": esistono trade-off reali
  (chi non lavora al villaggio, chi rischia, cosa non si sa); (b) **la quest non è risolta nel
  Planner**: dopo la miglior preparazione restano decisioni significative dentro la quest (se no,
  **rientro in S1**); (c) preview e resolver concordano sui check certi; (d) Gate Director.

### S4 — Integrazione (PLAN-019-S4)
- **Domanda:** "È diventata parte del gioco, non una demo isolata?"
- **Ingresso:** S3 completato.
- **Contratto:** villaggio → planning → quest → ritorno → conseguenze sulla superficie di gioco
  canonica, con schermate corrette e interessanti e invarianti rispettati. Destino della pagina lab
  S1 deciso (archiviata o strumento di test).
- **Gate:** (a) le conseguenze della quest sono **visibili e agiscono** sul villaggio (non solo
  persistite); (b) il giocatore riconosce il legame planning → esito → conseguenza; (c) loop
  completo verificato end-to-end e safeguard di progetto verdi
  (`.windsurf/rules/00-project-invariants.md`); (d) giudizio del Director. Gate B candidato qui
  (D-5).
- **Artefatto finale del macro plan:** **"definizione di buona quest"** — sintesi di regole
  validate e proprietà emerse in S1–S4. È l'ingresso di S5.

### S5 — Oltre lo scritto a mano (fuori contratto)
Personalizzazione fasi → chain quest → generazione → narrativa emergente. Si pianifica dopo S4 a
partire dalla "definizione di buona quest": le regole di generazione si subordinano ai pattern di
interesse scoperti, non il contrario. Nessun vincolo di design su S2–S4 per conto di S5.
Proposta consolidata della conversazione di generazione (R-091/108/111/112/113):
`context/QUEST_GENERATION_SPEC.md` (specchietto riassuntivo, living doc) +
`context/QUEST_GENERATION_ARCHITECTURE.md` (analisi FACT/PROPOSAL/OPEN e stato-repo) +
`context/QUEST_GENERATION_CONTRACTS.md` (contratti v0 + gap motore verificati).
**Deroga registrata 2026-10-10:** il Director ha ratificato S5 come
[PLAN-026](PLAN-026-quest-generation.md) `active` **in parallelo a S3/S4**
— i campi fun-judgment restano `experimental` fino al gate S4, P6
(integrazione) resta subordinato ai gate qui sopra.

## Rientri

- S3 gate (b) fallisce → si torna a S1 sulle regole della quest.
- S2 gate (b) fallisce → si corregge S2; se la proprietà persa dipende da una regola non
  realizzabile sul runtime, si riporta al Director prima di cambiare le regole validate.

## Decisioni aperte (Director)

| id | Decisione | Va chiusa entro | Blocca |
|---|---|---|---|
| D-1 | ✅ **CHIUSA 2026-10-01** — *"D1 lo facciamo ora"*: MP-07 di PLAN-018 procede ora | — | — |
| D-2 | Quale motore quest diventa canonico. Evidenza: **spike** come primo step di S2. Criteri dello spike: supporto a grafo di nodi con scelte e informazione, percorso variabile (denominatore dinamico della vittoria), conseguenze persistenti, costo di migrazione dei consumer esistenti | fine dello spike, prima del resto di S2 | S2 |
| D-3 | Mappatura competenze → stat balancer (Intelligenza, Carisma, …). Se una competenza **non è derivabile** senza toccare il balancer, l'AI la porta al Director come scelta esplicita (non come rinvio) | ingresso S2 | S2 |
| D-4 | ✅ **CHIUSA 2026-10-02** — criterio di stop delle iterazioni S1 = **parere del Director**, nessun timebox automatico | — | — |
| D-5 | In quale stadio rientra Gate B (playtest esterno) | battesimo di PLAN-019-S4 | S4 |
| D-6 | Trial by Fire: S2 (conseguenza persistente), S4 o S5 | battesimo di PLAN-019-S2 | S2/S4 |
| D-7 | ✅ **CHIUSA 2026-10-02** — HP **separati** da ferita/morte; valori ed effetti si definiscono nei contenuti della quest | — | — |
| D-8 | ⚠️ **SUPERATA 2026-10-02 da rev.2** — la soglia ≥50% non decide più la vittoria: il reward di quest è legato a una **prova-obiettivo precisa** e richiede il leader vivo al ritorno. Restano validi: sconfitta (fuga/obiettivo fallito) = nessuna reward di quest; bottino raccolto resta. Il conteggio dei check resta una statistica descrittiva della run | — | — |
| D-9 | ✅ **CHIUSA in contenuto 2026-10-02** (matrice `quest-design.md`): leader = slot fisso; ferita = +rischio; wipe = tutti morti; bodyguard intercetta tutto finché vivo; `bigwin` cumulato; fonte non-check = incidente in viaggio; post-obiettivo non si perde nulla in fuga. Aperti solo i **parametri numerici** (da bilanciare nel lab) e il death save (valutazione al Gate) | parametri nel lab S1 | S1 |

## Rischi

- **S1 valida su stat mock:** le competenze derivate potrebbero non riprodurre le distinzioni
  giocate in S1 (soprattutto Carisma/Intelligenza, senza candidato nel balancer). Mitigazione: D-3
  all'ingresso di S2 e gate S2 (b) sulla preservazione delle proprietà.
- **Gate A autoreferenziale:** chi conosce il sistema vede meno le scelte dominanti. Mitigazione:
  criteri 1–3 osservabili e annotati per run; Gate B più avanti (D-5).
- **Quest risolta nel Planner:** mitigata dal gate S3 (b) con rientro in S1.
- **S2 è lo stadio più grande** (motore, schema, competenze, item, persistenza): il suo plan figlio
  andrà probabilmente diviso; non si stima ora.
- **Iterazione infinita di S1:** chiusa da D-4 (parere del Director).
- **Prototipo scambiato per architettura:** pagina lab isolata + regola "S2 trasferisce regole, non
  codice".
- **Preview compound ingannevole (rev.2):** consumabili e scelte future rendono la stima
  dipendente da ipotesi dichiarate; una percentuale secca rischia di mentire. Mitigazione: in S3
  la preview dichiara le ipotesi o mostra stima + incertezza; in S1 nessuna formula esatta dove il
  modello non copre le scelte.

## Non in scope

Generatore di quest/testo, archi narrativi, chain quest, narrativa emergente (S5); modifiche al
balancer; combat animato.

## Critica multi-AI web — round 1 (2026-10-01)

Evidence: `.mw/runs/20261001-plan-019-web-critique/` (chatgpt, claude: major revision; grok solo
conclusione; deepseek, gemini-web falliti).

**Accolte:** Gate A con criteri osservabili; artefatto "regole validate" in uscita da S1 e "nota
combat"; gate S2 = preservazione delle proprietà, non equivalenza di esiti (la versione v1
"stessi esiti seeded" era irrealizzabile con stat diverse); gate S3/S4 di design oltre che tecnici;
rientro S3→S1 per "quest risolta nel Planner"; dipendenza S1→S3 sul modello dell'informazione;
matrice decisioni → scadenza/blocco; spike sui motori come fonte di evidenza di D-2; divergenze
mancanti (informazione, successo, fuga, morte); ancoraggio senza "già deciso" su punti aperti;
deroga S1 riportata alla formulazione v24; dettagli implementativi rimossi dal macro plan; destino
della pagina lab; artefatto "definizione di buona quest" per S5; confronto con Phase 11.

**Round 2** (`.mw/runs/20261001-plan-019-web-critique-r2/`): chatgpt **minor revision** (3/3
blocking risolti), claude **minor revision** (3/3 parziali, residui di precisione), grok major
revision senza rilievi specifici (non azionabile), deepseek fallito. Le tre respinte del round 1
giudicate legittime rispetto a v24 da chatgpt e claude. **Accolte in v3:** PASS = giudizio del
Director informato dai criteri 1–3 (il criterio 4 era il giudizio stesso); evidenza minima proposta;
formato tabellare di "regole validate" con tipo regola/parametro/contenuto e dipendenza da stat
mock; D-7 e definizioni di check rischioso/certo all'ingresso di S1; spike come primo step di S2 con
criteri; D-3 con uscita esplicita al Director; perimetro S1 chiarito (conseguenze dentro la quest,
persistenza mock); "modello dell'informazione validato" e "safeguard verdi" resi puntuali.

**Respinte (round 1):**
- *Gate A con soglie numeriche / osservatore esterno in S1* (claude): v24 rev.1 punto 4 toglie Gate
  B da S1 per decisione del Director; i criteri osservabili restano a supporto del suo giudizio.
- *Prototipare la derivazione delle competenze dentro S1 come precondizione di PASS* (claude): in
  conflitto con rev.1 punto 13 ("è secondario", non bloccante per S1). Il rischio è registrato e
  chiuso all'ingresso di S2 (D-3).
- *Vincolo minimo su S2 per non precludere S5* (claude): in conflitto con v24 punto 2 (S5 fuori dal
  contratto, non si progetta oggi per il generatore).
