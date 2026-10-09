---
title: "Quest Gameplay That Produces Strong Feelings — risposta Devin"
type: research-response
author: Devin (con accesso al repository)
date: 2026-10-10
brief: "Research Plan: Quest Gameplay That Produces Strong Feelings (Round 4 del Director)"
---

# Quest Gameplay That Produces Strong Feelings

Risposta alla ricerca del Director. Il vantaggio di questo contributo: ogni
affermazione sul sistema è verificata sul codice, e il progetto ha già una
bibliografia scientifica verificata (`context/QUEST_GAMEPLAY_SCIENCE.md`,
principi P1–P63 con citazioni). Dove posso cito quella invece di ri-derivare.

Legenda: **FACT** = verificato nel codice/doc · **EVIDENCE** = studio o
postmortem pubblicato (citato in QUEST_GAMEPLAY_SCIENCE) · **INFERENCE** =
mio ragionamento dai fatti · **HYPOTHESIS** = affermazione da testare.

---

## 1. Vincoli di design verificati (FACT)

Dal codice e dal decision log:

| Vincolo | Fonte |
|---|---|
| Quest = grafo di nodi authored per quest; kind: `choice`, `check`, `combat`, `info`, `harm`, `end`. Non un motore generale | `questRun.ts` header |
| 5 bande di verdetto: bigwin / win / almost / fail / epicfail | `resolveCheck` in `questRun.ts` |
| Preview con numeri esatti (F%/M% per slot, best contributor) — decisione del Director, chiusa | R-108; `previewCheck` |
| Targeting posizionale 1/2/3/4 membri = `[100]`, `[20,80]`, `[0,20,80]`, `[0,0,20,80]` | `positionalWeights` in `questRun.ts` |
| Bodyguard interception verso il bodyguard vivo | `resolveCheckHarms` |
| Allarme a stati nominati `quieto → allertato → sveglio` (il meter numerico è stato rimosso per decisione esplicita) | DECISION_LOG 2026-10-03 |
| Ritirata conserva il loot raccolto ma abbandona l'obiettivo; agguato possibile al ritorno | `gob-agguato`, `applyChoice` |
| TAKEN≠SECURED: fuga post-obiettivo lascia l'obiettivo → run fallita | `questRun.ts` end logic |
| Mortalità DD/XCOM-like: morti possibili, wipe rari, sopravvivenza pulita relativamente fortunata | R-105, desiderata |
| ~3-4 decisioni cruciali per run | R-108 |
| Skill del giocatore: gestione probabilità/rischio, **non** lettura di pattern avversari | R-108 |
| Emozioni prioritarie: attaccamento/sacrificio, avidità/rimpianto | R-108 |
| Cure/consumabili solo ai nodi decisione, non a metà risoluzione | `useQuestRun` |
| Epicfail confinato dentro la banda M dichiarata — niente morte non annunciata | `resolveCheckHarms`, regola Director 2026-10-03 |
| Persistenza: ferite/morti ricadono sul roster del villaggio | layer management |

**Tensione da dichiarare**: il brief dice "il giocatore deve capire abbastanza
per decidere senza conoscere l'esito esatto" — la preview a numeri esatti è
compatibile (decidi con le odds, non col risultato), ma riduce la componente
"incertezza pura" (P47: ambiguità e rischio sono esperienze neuralmente
diverse; con numeri esatti vendiamo solo la seconda). Non è un errore: è una
scelta estetica coerente con "skill = gestione del rischio". La segnalo per
completezza, non per riaprirla.

---

## 2. Evidence report — pattern emotivi

Per ogni pattern: emozione target, sequenza decisionale, stato informativo,
perché la decisione è reale, differenza esperienziale tra esiti, esempio di
gioco, livello di prova, failure mode.

### P-A · La posta accumulata sul tavolo (push-your-luck vero)

- **Emozione**: avidità, tentazione, rimpianto, sollievo.
- **Sequenza**: accumula valore visibile → decidi stop/continua → il rischio
  cresce con ciò che hai già.
- **Info**: il mucchio esatto in gioco e la probabilità di perderlo.
- **Perché è reale**: la posta è *già tua* (endowment effect, Kahneman/
  Knetsch/Thaler 1990 — P4); fermarsi non è "rinunciare a un guadagno" ma
  "assicurare una proprietà". Diversa struttura mentale, diversa emozione.
- **Esiti**: continua+vinci = euforia di chi l'ha rischiata; continua+bust =
  rimpianto *attribuibile* (hai premuto tu il bottone); ferma = sollievo ma
  con il dubbio del controfattuale (P22 — il rimpianto richiede di sapere
  cosa avrebbe fatto l'opzione non scelta).
- **Esempio**: Incan Gold / Can't Stop (Grok e Claude lo citano
  indipendentemente); Darkest Dungeon "continue exploring after quest
  complete".
- **Livello**: EVIDENCE (psicologia pubblicata + nostra validazione MC: la
  dispersione delle policy e il regret-proxy misurano la struttura
  decisionale, NON l'emozione — vedi §6).
- **Failure mode**: se il bust è troppo caldo la scelta collassa in "fermati
  sempre" (misurato: ramp 12% → dispersione ~0); se troppo freddo è decorativo
  (8% bust su epicfail → ~0.8g medi persi). La temperatura è tutto.

### P-B · TAKEN ≠ SECURED — l'estrazione come fase

- **Emozione**: suspense, sollievo, disperazione crescente.
- **Sequenza**: prendi l'obiettivo (è tuo ma non è salvo) → la strada del
  ritorno è una nuova situazione → decidi come uscire.
- **Info**: sai cosa porti e quali route esistono; il pericolo del ritorno
  dipende da ciò che hai fatto all'andata.
- **Perché è reale**: goal-gradient — l'appetito al rischio aumenta vicino al
  traguardo (Becker & van der Pligt 2016, Hull 1932, Kivetz 2006 — P19/P41);
  l'estrazione è il climax naturale, non una formalità.
- **Esiti**: uscita pulita (fortunata), uscita a costo (ferite/sacrificio),
  perdita dell'obiettivo sul ritorno (la sconfitta più narrativa: "ce
  l'avevo fatta").
- **Esempio**: Hunt: Showdown / Tarkov (banish → extract); la quest S1 del
  progetto ha già l'implementazione `estrazione` con 3 route gated
  (FACT, commit b35295c6).
- **Livello**: EVIDENCE (goal-gradient) + FACT (meccanica già nel motore).
- **Failure mode**: se l'estrazione è gratuita → anticlimax (S1 pre-fix:
  TAKEN==SECURED, run che si auto-conclude — documentato nel playtest
  2026-10-03). Se la perdita è totale e non telegrafata → arbitraria.

### P-C · Sacrificio attribuito — chi paga lo decidi tu

- **Emozione**: attaccamento, colpa, orgoglio funereo.
- **Sequenza**: la minaccia colpirà qualcuno → tu scegli *chi* → il danno
  segue la tua decisione.
- **Info**: costo atteso del sacrificio vs beneficio per il gruppo.
- **Perché è reale**: l'attaccamento richiede investimento (uso in decisioni
  rischiose, contributo ai guadagni — Lewis/Weber/Bowman 2008; morti tra i
  momenti più forti *solo* con personaggio costruito — Bopp et al. 2016,
  P45). Il sacrificio deve portare un nome e la decisione deve avere un
  autore, altrimenti è "il gioco mi ha tolto un pezzo" (loco esterno →
  rabbia, non dolore — P36, Weiner).
- **Esiti**: sacrificio riuscito (il copritore salva il frugatore, sopravvive
  ferito) = sollievo+poca gloria; sacrificio che uccide = morte attribuita a
  una tua scelta, non a un dado; nessun copritore = il rischio resta sul
  bersaglio "naturale".
- **Esempio**: l'intercetto del bodyguard (FACT, esiste) esteso a scelta del
  giocatore; XCOM "body-blocking"; i morti per nome del roster DD.
- **Livello**: EVIDENCE parziale (attachment literature) + INFERENCE forte
  (l'attribuzione è la differenza tra "ho perso Kran" e "ho mandato Kran a
  morire"). I nostri dati MC confermano solo la *meccanica* (copritore non
  dominante, riduce wipe nei party deboli).
- **Failure mode**: copritore dominante = non è più una scelta; sacrificio
  senza memoria (il morto dimenticato) → spreca il picco emotivo (P11).

### P-D · Informazione a costo — paghi per vedere, o voli cieco

- **Emozione**: prudenza, paranoia produttiva, "me l'aveva detto".
- **Sequenza**: segnale ambiguo → decidi se spendere (tempo/esposizione) per
  chiarirlo → agisci informato o rischi la sorpresa.
- **Info**: asimmetrica per design — il personaggio vede tracce, il giocatore
  decide se fidarsi.
- **Perché è reale**: la sorpresa è *equa* solo se era evitabile (P28 threat
  readability, Thief postmortem: la pressione funziona quando il giocatore
  capisce *perché* sale). L'informazione deve cambiare le **opzioni**, non
  solo i bonus (altrimenti è un selettore di EV).
- **Esiti**: hai scortato → la sorpresa diventa una scelta informata; non hai
  scortato → l'agguato è *causalmente tuo* ("non ho guardato").
- **Esempio**: scout in DD; in RpgBalancer esiste già `gob-cerca-tracce` vs
  `gob-forza-tracce` (FACT — info→opzione gated).
- **Livello**: EVIDENCE (postmortem stealth) + FACT (pattern presente).
- **Failure mode**: info sempre dominante (costo troppo basso → tassa
  obbligatoria); info inutile (non cambia opzioni → flavor travestito da
  meccanica).

### P-E · Pressione a stati leggibili — il campo si sveglia

- **Emozione**: urgenza, claustrofobia strategica, sollievo.
- **Sequenza**: le tue azioni alzano l'allarme → lo stato cambia le regole
  (non solo i numeri) → la finestra si chiude.
- **Info**: lo stato nominato è pubblico; cosa succede al livello successivo
  è detto prima.
- **Perché è reale**: un meter che *trasforma* la situazione (patrol reroute,
  route che si chiudono) ≠ una barra decorativa (P28). Il nostro allarme a
  stati nominati lo fa già: `sveglio` = −10pp + bivio risveglio (FACT).
- **Esiti**: uscire prima dello sveglio = sollievo con loot parziale; restare
  dopo = ogni check successivo giocato in condizioni peggiori.
- **Esempio**: stealth-game alarm states (Thief, Splinter Cell — fonti
  archiviate nel doc di scienza, batch 2).
- **Livello**: EVIDENCE (postmortem, non esperimenti controllati — il gap è
  dichiarato in §Literature gaps del doc).
- **Failure mode**: soglia invisibile → ingiusto; soglia senza
  conseguenze → rumore di fondo; statale troppo binario → no gradient.

### P-F · Conseguenza differita — la ferita che torna

- **Emozione**: peso delle decisioni passate, narrativa emergente.
- **Sequenza**: prendi una ferita/perdi qualcosa in un nodo → nodi dopo quel
  fatto rileggono lo stato e cambiano ciò che puoi fare.
- **Info**: sai che le ferite contano (le vedi); non sai *dove* conteranno.
- **Perché è reale**: memoria = affordance futura, non log (P49); ancorare la
  memoria al personaggio nominato (P50) è ciò che trasforma "danno" in
  "storia di Milo".
- **Esiti**: la gamba ferita dello scout chiude la route veloce → decisione
  passata che si ripresenta; sopravvivenza con cicatrice = il ricordo gioca.
- **Esempio**: Wildermyth (injury→aspect→hook); XCOM (soldato ferito salta
  la missione successiva).
- **Livello**: EVIDENCE (principi emergent-narrative batch P48–P63).
- **Failure mode**: ferite come puro malus numerico che non riappare mai →
  morte differita senza storia; troppe memorie → problema di salienza (P49).

### P-G · La trinità del trade-off — non puoi avere tutto

- **Emozione**: rammarico preventivo, soddisfazione della scelta.
- **Sequenza**: 2-3 beni/opzioni, risorse per prenderne meno di tutti →
  scegli cosa lasciare → l'abbandonato resta visibile.
- **Info**: i costi sono chiari; il costo-opportunità è il gioco.
- **Perché è reale**: choice overload è reale (Iyengar/Lepper 2000 — P42) ma
  2-3 opzioni sono il punto dolce; il rimpianto anticipato modella la scelta
  prima dell'esito (P46, Zeelenberg).
- **Esempio**: il mercante 2-di-3 della quest S1 (audit: "real
  cost-opportunity trade-off" — FACT); Reigns; FTL eventi.
- **Livello**: EVIDENCE (psicologia decisionale consolidata).
- **Failure mode**: opzioni asimmetriche ovvie → non è un trade-off, è un
  quiz (cf. "side door = main door −3%" dell'audit S1 — P9 violation).

### P-H · Sopravvivenza con costo — la terza via tra vittoria e morte

- **Emozione**: sollievo, orgoglio ferito, "ce l'abbiamo fatta per miracolo".
- **Sequenza**: le cose vanno male → il gioco offre un'uscita costosa (non
  vittoria, non wipe) → decidi se pagarla.
- **Info**: il prezzo è dichiarato (P: failure deve fare qualcosa, ma non
  sempre mitigato — P5; retreat crystallizes value, P30).
- **Perché è reale**: senza questo esito il sistema è binario e il comeback
  impossibile; con questo esito la sconfitta parziale diventa materiale
  narrativo (Pyre: la storia continua attraverso la sconfitta — P62).
- **Esiti**: vittoria pulita / vittoria a costo / ritirata con loot / wipe —
  uno spettro, non un bit.
- **Esempio**: i DD "quest failed, survivors return" con penalità; il nostro
  `gob-agguato-scelta` = "molla il trofeo o combatti" (FACT — esiste già!).
- **Livello**: INFERENCE forte su base EVIDENCE (failure taxonomy P14,
  fail-forward P5).
- **Failure mode**: se la ritirata conserva tutto → dominante; se perde
  tutto → mai usata. Il prezzo deve essere *specifico* (questo oggetto, quel
  personaggio), non generico.

### P-I · Il momento della verità anticipato — commit surface

- **Emozione**: suspense, solennità della decisione.
- **Sequenza**: l'opzione è annunciata con le sue conseguenze → il giocatore
  conferma → la risoluzione è *un evento*, non un log.
- **Info**: preview completa prima del commit (FACT, esiste).
- **Perché è reale**: il rimpianto si anticipa al momento del commit (P46);
  il picco emotivo va speso lì, non nella risoluzione automatica (P7/P11).
  L'audit S1 ha trovato la violazione esatta: "ROLL 1 OF 2" auto-risolto —
  l'unica decisione che contava eseguita senza superficie di commit.
- **Esempio**: la preview→commit→risoluzione di RpgBalancer è già corretta
  in architettura; serve solo non auto-risolvere le decisioni pesanti.
- **Livello**: EVIDENCE (P7 dopamina = prediction error; P11 peak-end) +
  FACT (violazione osservata nel playtest).
- **Failure mode**: catene di check auto-risolti al culmine della tensione.

### P-J · L'ultimatum — prendilo o perdi tutto (escalating offer)

- **Emozione**: avidità contro prudenza, in forma *deterministica*.
- **Sequenza**: l'avversario/le circostanze offrono un affare → accetti (e
  chiudi) o rifiuti (e l'affare peggiora o sparisce) → ripetuto 1-2 volte.
- **Info**: sai esattamente cosa prendi accettando; non sai se rifiutando
  otterrai meglio.
- **Perché è reale**: è push-your-luck *senza dado* — il rischio è nella
  controparte, non nel RNG. Interessante per RpgBalancer perché lascia il
  p100% della varianza fuori dalla decisione chiave → adatto ai giocatori
  risk-averse che il PYL aliena.
- **Esiti**: accetti presto = sicuro ma "cosa c'era dietro"; rifiuti troppo =
  affare ritirato + prezzo maggiore.
- **Esempio**: ultimatum game (economia comportamentale); offerte della
  Strega in Darkest Dungeon-adjacent; cultura dei negotiation eventi in
  Sunless Sea/Fallen London (Failbetter).
- **Livello**: HYPOTHESIS — solide basi teoriche, nessun postmortem diretto
  nel nostro corpus. È il candidato con il miglior rapporto
  novità/costo.
- **Failure mode**: se l'affare migliore è sempre l'ultimo → dominante; se
  il rifiuto è sempre punito → non è un'offerta.

### Pattern NON adatti (conflicting evidence da conservare)

- **Duello RPS a pattern**: prima scelta unanime delle AI Round 1, ma
  richiede decisioni frequenti e lettura del pattern avversario — entrambi
  *esclusi* dalle risposte del Director (R-108). Tier 3.
- **Meter numerico di allarme/suspicion**: rimosso per decisione esplicita
  (2026-10-03); la letteratura stessa è incerta sul meter-vs-diegetico.
- **Decisioni frequenti per-round**: incompatibili col vincolo 3-4/run.
- **Near-miss come feature**: "ALMOST" che non cambia nulla è una pelle
  numerica (P32, Clark 2009 / Finserås 2021 mixed).

---

## 3. Alternative non-ancorate alla quest goblin

Pattern per *una* quest, diversi tra loro. Meccaniche esistenti = riuso;
"richiede primitiva" = lo dico esplicitamente.

**ALT-1 · Escort il fragile** — il payload è una persona/cosa con HP propri
(prigioniero liberato, alleato ferito, l'uovo rubato). Le decisioni sono:
chi lo scorta, quanto rallentare per proteggerlo, lasciarlo se peggiora.
Emozioni: attaccamento, tensione da protezione. Nuova primitiva: un'entità
"payload" con esposizione propria — NON coperta dai kind attuali (ma
simulabile con un membro NPC temporaneo del party, se il roster lo permette).

**ALT-2 · Il budget di tempo** — i rinforzi arrivano in N battiti; ogni
azione costa battiti. Le decisioni sono allocazione di una risorsa che si
esaurisce: esplorare costa 2, curare costa 1, l'uscita chiude a 0.
Emozioni: pressione, prudenza, "un'altra stanza o scappiamo". Meccanica:
un contatore nello stato (FACT: `exploreTurn` è già un precedente) —
nessun nuovo kind, i nodi authored leggono il contatore.

**ALT-3 · L'ultimatum del capo** — il boss goblin offre: "prendi il tributo
e vattene". Accettare chiude la quest con X; rifiutare inizia il combattimento
per 3X. Ripetuto una volta con affare peggiore. Emozioni: avidità, sfida,
"mi ha fregato / l'ho fregato". Meccanica: `choice` node con opzioni
esistenti — zero primitive nuove.

**ALT-4 · Le due metà del bottino** — due obiettivi separati, risorse per
uno: il prigioniero E la cassa, distanti e con allarme condiviso. L'emozione
è scegliere *cosa abbandonare* — la perdita è una decisione, non un esito.
Meccanica: due rami del grafo che condividono il budget allarme — authored,
no nuovi kind.

**ALT-5 · Scout the unknown** — la mappa ha 3 route, una sola è sicura ma
non sai quale; puoi spendere tempo/rischio per sondare. Le decisioni:
quanto investigare prima di commettere. Emozioni: paranoia produttiva,
soddisfazione della scommessa informata. Meccanica: info-node che sblocca
flag — esiste già (FACT: `gob-cerca-tracce` gating).

Ognuna produce un arco emotivo diverso: ALT-1 è *protezione*, ALT-2 è
*pressione*, ALT-3 è *bluff*, ALT-4 è *triage*, ALT-5 è *paranoia*. Non
sono varianti dello stesso loop.

---

## 4. Fit evaluation per RpgBalancer

| Pattern | Emozione | Decisioni | Fit motore | Nuove primitive | Costo | Rischio dominanza | Validabile MC? |
|---|---|---|---|---|---|---|---|
| P-A push-your-luck | avidità/rimpianto | 1 ciclo stop/cont | ✅ F6 esiste | trappola+frugatore+copritore (authored) | basso | ramp calibrata (5-7%) | ✅ fatto |
| P-B estrazione | suspense/sollievo | 1-2 | ✅ TAKEN≠SECURED esiste | estendere route ritorno | medio | no (le route sono gated) | parziale |
| P-C sacrificio | attaccamento | 1-2 | parziale (bodyguard auto) | chi copre = estensione authored | basso | se copritore gratis→dominante | ✅ fatto |
| P-D info-a-costo | prudenza | 1 | ✅ gating esiste | nessuna | basso | costo mal calibrato | sì |
| P-E allarme stati | urgenza | onnipresente | ✅ esiste | nessuna | zero | no | sì |
| P-F conseguenza differita | peso/storia | implicito | parziale (memoria non collegata a nodi) | flag-read nei nodi | medio | no | sì |
| P-G trade-off 2-of-3 | rammarico | 1 | ✅ mercante esiste | nessuna | basso | opzioni squilibrate | sì |
| P-H sopravvivenza-con-costo | sollievo | 1 | ✅ agguato-scelta esiste | nessuna | basso | prezzo generico | sì |
| P-I commit surface | suspense | tutte | ✅ preview esiste | nessuna | zero | no | no (è UX) |
| P-J ultimatum | avidità no-RNG | 1-2 | ✅ choice | nessuna | basso | affare dominante | sì |

La mappa vero scarto: i pattern migliori **non richiedono nuovi kind** —
richiedono che i nodi authored *usino* ciò che esiste. Il gap non è di
motore, è di authoring (conferma la diagnosi Round 1: "outcomes without
decisions").

---

## 5. Rivalutazione della quest goblin

Dopo la ricerca, come *un* candidato tra tanti — non il default.

### Cosa la struttura attuale può produrre

- **Avidità/rimpianto**: F6 esiste ma il mucchio non è mai davvero a
  rischio (nessun bust) → la tentazione non ha denti. La validazione MC
  conferma: BE@6% è il punto dove entrambe le scelte restano razionali.
- **Attaccamento/sacrificio**: il bodyguard intercetta ma l'assegnazione
  è automatica → il sacrificio non ha autore. Con `chi copre` diventa una
  decisione.
- **Suspense**: commit surface esiste, allarme a stati esiste — l'apparato
  è pronto; manca la posta (lo stesso verdetto dell'audit S1: "machinery
  right, game missing").
- **Sollievo**: `gob-agguato-scelta` (molla il trofeo o combatti) è già
  P-H funzionante — il miglior pezzo authored che abbiamo.
- **Sorpresa equa**: F7 ambush era nel vecchio scenario condizionato a F5;
  nella canonica l'agguato è parte del ritorno. I check tracce sono P-D.
- **Curiosità**: debole — la mappa è quasi lineare, poco da scoprire.
- **Cleverness/mastery**: i check selezionano probabilità più che
  strategie; la mastery vera sarebbe "ho capito *quando* fermarmi", non
  "ho scelto il check con F% più basso".

### Decisioni reali vs selettori di probabilità

Reale: F6 stop/continue (una volta che il bust esiste), agguato-scelta,
stealth-vs-assalto (cambia il grafo), insegui/lascia-fuggire.
Selettore puro: cerca-tracce vs forza-tracce (cambia solo le odds del
check, non le opzioni), bottino prendi/lascia (dove "prendi" è quasi
sempre corretto — candidato trade-off P-G non realizzato).

### Due design alternativi

**G-ALT-1 · "Il ritorno lungo" (estrazione-centrica, no push-your-luck)**
La parte facile è prendere il trofeo; la parte difficile è portarlo a
casa. Struttura: campo goblin = 2-3 nodi tattici; poi il ritorno è la
quest vera — la foresta si sveglia, tre route con costi diversi, chi
porta il trofeo è rallentato/esposto (allocazione del rischio), feriti
rallentano tutti. Emozioni: dread crescente, sollievo, sacrificio ("lo
lasciamo?"). Le decisioni cruciali: quando scappare, chi porta, quale
via. Riusa: allarme a stati, targeting posizionale, agguato-scelta.
Novità authored: il trofeo come entità trasportabile (flag+weight su un
membro).

**G-ALT-2 · "L'offerta dello Sciamano" (ultimatum, no push-your-luck)**
I goblin non sono un dungeon: sono una controparte. Arrivi al campo →
lo Sciamano offre: "prendi X e vattene" → accetti (quest chiusa, loot X)
o rifiuti (combatti per 3X, o accetti l'offerta peggiorata dopo il
primo clash). Le decisioni: leggere se il campo è più forte di quanto
sembra (info-a-costo prima), bluffare sull'ultimatum, gestire l'avidità
*deterministica*. Emozioni: sfida, "mi ha fregato", sollievo
dell'accordo giusto. Riusa: tutto il motore com'è. È la proposta con
maggior *gap emotivo* rispetto al resto del gioco — e il suo fallimento
sarebbe informativo per tutte le future quest negoziabili.

### Verdetto sulla quest goblin

La struttura attuale **può** produrre le emozioni prioritarie ma non lo
fa ancora: manca il bust (avidità senza denti), manca il copritore scelto
(sacrificio senza autore), manca una decisione di info-a-costo veramente
consequenziale. Non è "sbagliata": è *incompleta*. Ma le alternative
mostrano che push-your-luck non è l'unica strada — e che il motore può
ospitare emozioni molto diverse senza cambiare i kind.

---

## 6. Deliverables

### Feeling → gameplay pattern map (sintesi)

| Emozione | Pattern | Decisione chiave | Posta | Esperienza attesa | Failure mode |
|---|---|---|---|---|---|
| avidità | P-A PYL | continua/fermati | mucchio visibile | "un altro giro, lo sento" | bust troppo caldo/freddo |
| rimpianto | P-A + controfattuale | la stessa | quello che *avresti* potuto | "se mi fossi fermato" | controfattuale nascosto = rabbia, non rimpianto |
| attaccamento | P-C sacrificio | chi copre | una persona con nome | "Kran ha preso il colpo per Milo" | sacrificio auto-assegnato |
| suspense | P-I commit | il conferma | F%/M% precisi | "ho guardato le odds e ho premuto" | auto-risoluzione (S1 audit) |
| sollievo | P-B/P-H estrazione/parziale | route/ritirata | obiettivo non sicuro | "ce l'abbiamo fatta" | estrazione gratuita |
| sorpresa equa | P-D info-a-costo | scorta o no | l'agguato evitabile | "me l'aveva detto" | segnale senza decisione |
| prudenza | P-E allarme | ogni azione | lo stato pubblico | "il campo si sveglia" | meter decorativo |
| peso/storia | P-F differita | — | le ferite restano | "Milo zoppica da allora" | ferite senza rilettura |
| rammarico | P-G trade-off | cosa lasci | l'abbandonato visibile | "il prezzo dell'oro è il prigioniero" | opzioni squilibrate |
| sfida/bluff | P-J ultimatum | accetta/rifiuta | l'affare che peggiora | "l'ho fregato" | affare dominante |

### Comparative shortlist (3-5 pattern per RpgBalancer)

1. **P-A push-your-luck calibrato** — validato meccanicamente (BE@6%,
   dispersione e regret-proxy misurati). La miglior emozione per riga di
   codice. *Limite dichiarato*: la MC ha provato la struttura decisionale,
   non l'emozione.
2. **P-C sacrificio attribuito** — estensione minima del bodyguard,
   risponde direttamente alla priorità "attaccamento". Il meccanismo che
   rende la morte *personale* invece che statistica.
3. **P-B estrazione vissuta** — il goal-gradient è il climax più naturale;
   il TAKEN≠SECURED esiste ma il ritorno è ancora sottile. Costo medio,
   payoff narrativo alto.
4. **P-D info-a-costo** — infrastruttura della fairness; senza di essa le
   sorprese restano arbitrarie. Abilita le altre, non compete con loro.
5. **P-J ultimatum** — il wildcard: emozione diversa (bluff, sfida), zero
   nuove primitive, utile per quest non-combattive. Il test più economico
   per verificare che la libreria emotiva non sia monocorde.

Esclusi con ragione: RPS (vincoli Director), timer-risorsa (utile ma non
prioritario), meter d'allarme (decisione chiusa).

### Goblin quest alternatives

Vedi §5 — G-ALT-1 (ritorno lungo / estrazione-centrica) e G-ALT-2
(offerta dello Sciamano / ultimatum). Entrambe senza push-your-luck come
motore centrale, entrambe authored sui kind esistenti.

### Recommended next experiment

Il test più piccolo che discrimina tra le ipotesi principali è **umano, non
MC**: la MC ha già provato che la struttura decisionale esiste; ciò che non
sa è se il giocatore *sente* avidità/rimpianto/attaccamento.

Proposta: implementare il slice F6 già autorizzato (BE@6% + frugatore +
copritore — modifiche authored, zero nuovi kind) e fare **un playtest con
protocollo controfattuale**:

1. Giocatore gioca la quest con le varianti; al momento del bust si chiede
   *in voce*: "cosa hai perso, e per quale scelta?" (gate di attribuzione —
   la domanda del playtest S1, mai risposta).
2. Dopo: mostrare il controfattuale a seed pari ("se ti fossi fermato al
   turno prima: +24g, Kran vivo") e misurare se il rimpianto verbalizzato
   cambia la decisione nella run successiva.
3. Metriche soggettive brevi (suspense, agency, fairness, regret — la
   survey di Grok §G già suggerisce le scale), più telemetria: % stop/
   continue per turno, tempo di decisione, uso del copritore.
4. Criterio di falsificazione: se i giocatori trattano il bust come tassa
   RNG ("il gioco me l'ha tolto") invece che come conseguenza ("l'ho
   rischiata"), la meccanica fallisce la sua ragione d'essere — e va
   rivista la *comunicazione* della causa, non la probabilità.

Se non si può fare playtest umano subito: il test MC residuo più informativo
è **la varietà delle policy umane-plausibili** (agenti che smettono in base
a euristica emotiva, non EV) — ma dichiaro che questo approssima il
comportamento, non l'emozione.

### Questioni irrisolte che richiedono il Director

- **F6 bust su vincita?** La trappola indipendente dal verdetto può
  scattare anche quando il frugatore vince il check — "avevo il mucchio
  in mano". Più drammatico, più leggibile come causa separata; ma un
  giocatore potrebbe leggerlo come ingiusto ("ho vinto il tiro!"). Il
  report Round 3 lo lascia aperto.
- **La pila si perde in fuga?** Se sì, la ritirata da F6 diventa la
  decisione più ricca del gioco; se no, fuggire dal bust è sempre
  dominante. Tenderei a sì (TAKEN≠SECURED), ma è una scelta di cattiveria.
- **Il frugatore subisce anche il bust?** Se il bust colpisce fisicamente
  chi fruga (danno extra oltre alla perdita), il sacrificio diventa
  personale; se la pila è astratta, il bust è solo economico.

---

## Nota metodologica

Questo documento usa le ricerche Round 1-3 come corpus, non come verità.
Dove le AI esterne hanno detto cose verificabili sul repo (es. "il duello
RPS è la primitiva migliore"), ho confrontato la proposta con i vincoli
verificati — e la maggior parte non regge. Dove hanno citato psicologia,
ho ri-citato la bibliografia del progetto che ha le fonti verificate. Ciò
che resta di genuinamente nuovo e non coperto dal corpus: P-J (ultimatum),
la riformulazione dell'ultimo miglio come *fase* e non come *epilogo*, e
la lista dei pattern *non* adatti con le ragioni del fallimento.
