---
title: Quest «Sterminio dei goblin» — spec authored completa
type: spec
status: vigente — documento unico della quest (meccanica + manoscritto);
  assorbito `context/QUEST_GOBLIN_FLAVOR.md` il 2026-10-08
date: 2026-10-06
updated: 2026-10-19
source: proposta del Director (correzione alla bozza «Torre nel Bosco», 2026-10-06);
  modello di targeting posizionale a cascata definito dal Director;
  layer narrativo R-099; manoscritto r008 (IT+EN) — dibattito
  multi-AI convergente 20261018-narration-v3, artifact-r008 accettato
  2026-10-19 (R-219)
---

# Sterminio dei goblin — spec completa

Quest di **combattimento**, basata su **Forza**. Vincoli di presentazione
(Director, evoluti 2026-10-08): ~~pochissimo testo~~ → **layer narrativo
cinematografico** (R-099) — immagine, nomi d'azione, transit tra le fasi,
flavour per scelta ed esito; il manoscritto completo (v3, IT + EN) è in
fondo al doc.
Il giocatore in ogni fase può ritirarsi o usare un consumabile.

> **Questo documento è la fonte unica della quest.** Tutto ciò che il
> lab (`/quest-s1-lab`) mostra o esegue nasce qui; `questScenarioGoblin.ts`
> è la traduzione eseguibile, non una fonte parallela.

---

## Sistema di targeting per slot (DEFINITO DAL DIRECTOR — vigente in questa spec)

Gli esiti pericolosi (morte secca, ferita) e i danni extra di un check o di un
turno di combattimento si assegnano con **un tiro sugli slot occupati**. Il
profilo è **posizionale**: il rischio sta sempre in coda; chi sta davanti è
protetto finché qualcuno dietro vive.

| PG assegnati | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| 1 | 100% | — | — | — |
| 2 | 20% | 80% | — | — |
| 3 | 0% | 20% | 80% | — |
| 4 | 0% | 0% | 20% | 80% |

- Quando un PG muore, **i posti scalano e le % si spostano**: i superstiti
  risalgono di posizione e il profilo si ricalcola sul numero di occupati
  (es. 4→3 occupati: da 0/0/20/80 a 0/20/80).
- Lo stesso tiro vale per morte secca, ferita e danni extra — **un solo
  concetto** (nessuna probabilità separata per «sudden death dell'eroe»: l'eroe
  non muore finché qualcuno è dietro perché il suo slot vale 0; da solo = 100%).
- **Escalation in combattimento (solo fase F4, solo danni — NESSUNA morte
  secca nel combattimento):** dopo il turno 1 → S4 −10%, S2 +5%, S3 +5%;
  dopo il turno 2 → S4 −10%, S1 +5%, S2 +5%. (Profilo danni F4:
  T1 `0/0/20/80` → T2 `0/5/25/70` → T3+ `5/10/25/60`, **stabile oltre T3**.)
  Valori **fittizi/placeholder**: la calibrazione vera è ancora da fare.
  L'escalation su S1 produce solo **danno extra**, mai morte: in F4 non si
  muore, ci si ferisce/si perdono HP.
- Obiettivo di calibrazione Director: mediamente il bodyguard muore, S2
  prende ~20–30% del danno, S3 ~50–70%.

---

## Parametri globali

| Voce | Valore | Note |
|---|---|---|
| Competenze chiave | Forza (base), Percezione (rivelabile), Destrezza, Costituzione, Intelligenza | |
| Oggetti/consumabili portabili | Bonus Forza ×1 fase · Bonus Percezione ×1 fase · Healing +20 HP | assegnati in partenza |
| Difficoltà check combattimento | **−20 allo score** → miglior FOR del party = ~50% riuscita a turno (es. FOR 70 → bound 50, vantage assalto +10 → 60, stealth +15 → 65) | Director, calibrazione 2026-10-06 |
| Durata | ~4–6 turni di combattimento | Director |
| Checkpoint | continua / ritirati / consumabile prima di ogni check rischioso | vigente |
| Consumabili | usabili **solo prima di uno skill check o di una scelta** | Director 2026-10-06 |
| Wipe | si perde tutto | vigente |
| Ferita | X giorni di indisponibilità | vigente |
| Reward | **XP sempre**; il trofeo dei goblin si converte al ritorno in città nel reward vero — per ora **Gold** | Director 2026-10-06 |
| Vincoli party | nessun vincolo sul numero di PG (mock: 4 slot noti) | Director 2026-10-06 |
| HP | i PG **hanno HP**: mock eroe = **100 HP**, gli altri = **60 HP** — valori ereditati dalle stat reali del PG quando assegnato | Director 2026-10-06 |
| Lifecycle POI | **`repeatable`** (`poi-goblin`): il marker non viene mai consumato — chiuso il rapporto di una run ended+settled la run si sgancia e l'offerta torna `available` finché la finestra è aperta (rilanciabile); ignora anche record consumati stantii | R-200 (D-1) + D-S4-6, `questPois.ts` |

---

## Fasi

### F0 — ASSEGNAZIONE (planning)

- **Info visibili:** quest di combattimento, basata su Forza.
- **Info rivelabile:** Percezione (la riveli portando esplorazione/preview).
- **Oggetti assegnabili:** Bonus Forza ×1 fase · Bonus Percezione ×1 fase ·
  Healing +20 HP.
- **Nessuno skill check in questa fase.**

### F1 — ESPLORAZIONE (cercare tracce)

Testo minimo. Due check alternativi (nomi v3, Director 2026-10-18 —
sostituiscono «Cercare tracce»/«Arrampicarsi sull'albero» del 2026-10-08;
le opzioni NON dichiarano scopo né esito):

| Check | Successo | Fallimento |
|---|---|---|
| `PERCEZIONE` — **«Esaminare il terreno»** | **bonus all'approccio Stealth di F3** (→ vantaggio in F4) | nulla* |
| `FORZA + PERCEZIONE` — **«Esaminare dall'alto»** | **apre F2** (dall'alto si avvista il nascondiglio di tela) | −10 HP (caduta) |

- Ratificato (Director 2026-10-06): `PERCEZIONE` semplice non apre nulla —
  il suo successo alimenta la via stealth dell'accampamento.
- Il «nuovo evento» aperto da `FORZA+PERCEZIONE` **è F2**.
- Re-mapping nomi↔stat (Director 2026-10-08): la Percezione pura legge il
  suolo; Forza+Percezione è la salita (sforzo fisico + lettura dall'alto).
- **v3 (Director 2026-10-18): il masso esce dalla fiction** — la nicchia di
  F2 è un fagotto sotto tela cerata/fronde troppo regolari, avvistato
  dall'alto come dettaglio nascosto e inaspettato.
- **v3 — deciso (Director 2026-10-18): il danno è cablato.** L'epicfail di
  «Esaminare il terreno» applica −10 HP (lama nascosta nel terreno) — il
  flavor è reale, niente `unsupported-cost`.
- **Solo questi 2 check** — nessuna altra combinazione in questo esempio
  (Director 2026-10-06).
- Checkpoint: ritirati / consumabile sempre disponibili.

### F2 — EVENTO OPZIONALE (bottino) — agganciato a F1

- **Disponibile solo se `FORZA+PERCEZIONE` di F1 è riuscita** (è l'evento che
  quel check apre).
- **v3 (Director 2026-10-18): nessuna prova e nessuna scelta** — nodo
  `info`/reward con un'unica azione («Recupera il bottino»): il giocatore
  raccoglie e prosegue. Sostituisce il check `DESTREZZA` (silenzio vs
  allerta) della versione precedente.
- **v3 — implementato 2026-10-18:** nessun `kind: 'reward'` né campo
  `action` nuovo — il nodo è un `choice` a **una sola opzione**
  («Recupera il bottino» → `next` diretto su `gob-accampamento`).

### F3 — ACCAMPAMENTO GOBLIN (scelta di approccio)

Titolo v3 (Director 2026-10-18): **«Regole d'ingaggio» / «Rules of
engagement»**; le opzioni non dichiarano scopo né esito.

Lettura immediata voluta dal Director (quest Forza-based: il party avrà
mediamente più Forza che Destrezza):

| Approccio | Check | Successo | Fallimento |
|---|---|---|---|
| **Stealth** | `DESTREZZA` | **+Danno** a F4 (bonus migliore) | **Allerta** → malus a F4 |
| **Assalto** | `FORZA` | **+Danno** a F4 (bonus moderato) | nessun bonus (nessun malus) |

- Stessa leva (+Danno), rischio diverso: Assalto è l'opzione affidabile,
  Stealth quella rischiosa dal payoff migliore. Nessuna spiegazione di
  matematica necessaria.

### F4 — COMBATTIMENTO

- **X turni (≈4–6)** di danni a ogni turno, sia ai goblin sia al party.
- **Colpi al party per turno:** 1 colpo a T1 e T2; **2 colpi da T3 in poi**,
  sempre a bersagli diversi (regola Director: un singolo turno non può
  colpire due volte lo stesso PG — distribuisce l'attrito invece di
  concentrarlo).
- Il danno al party si distribuisce col **profilo slot posizionale** e con
  **escalation** (vedi sopra: T1 `0/0/20/80` → T3+ `5/10/25/60`).
- **Attesa Director:** mediamente il bodyguard (S4) muore; S2 ~20–30% del
  danno; S3 ~50–70%.
- **Difficoltà skill check = −20 allo score** (miglior FOR del party → ~50%
  riuscita a turno; es. FOR 70 → bound 50). Calibrazione Director 2026-10-06.
- I bonus/malus di F3 (stealth → danno, assalto → moderato) si applicano qui.

### F5 — INCALZARE (scelta) — punto di non ritorno psicologico

I goblin superstiti fuggono. La scelta è **dolore ora vs dolore dopo**
(Director, spec v2 2026-10-08):

- **Lasciarli fuggire** = zero danno immediato, ma si riorganizzano →
  agguato F7 **pesante** (mischia a 30).
- **Incalzare** = danno deterministico **sempre** (il prezzo della caccia) +
  check `FORZA`; se scappano comunque tornano *a pezzi* → agguato F7
  **mite** (mischia a 20). Se li chiudi → sterminio, ritorno pulito.

| Opzione | Esito |
|---|---|
| **Lasciarli fuggire** | nessun danno ora → agguato F7 **peggiorato** |
| **Incalzare** | **−10 HP posizionali sempre** (pedaggio) + check `FORZA` ↓ |

Bande del check `FORZA` (il juice dei tiri: almost e critici contano):

| Esito | Effetto |
|---|---|
| `bigwin` | toll + **Sterminio**, ritorno pulito |
| `win` | toll + **Sterminio**, ritorno pulito |
| `almost` | toll + fuggono feriti → agguato F7 **mite** |
| `fail` | toll + fuggono a pezzi → agguato F7 **mite** |
| `epicfail` | toll **−20** + fuggono → agguato F7 **mite** |

- Stat: **Forza** (coerente con la quest Forza-based).
- Flee resta razionale quando il pedaggio ucciderebbe subito il membro in
  coda (toll posizionale concentrato vs flat ambush spalmato) o quando il
  FOR residuo è debole e si prevede comunque di mollare il trofeo.
- La mischia F7 resta una scelta di valuta su entrambe le vie (bailout
  sempre disponibile).

**Calibrazione R-097 (MC 10k×2 bracci):** v1 (flee=mite, fail=peggiore+
bailout negato) è stata sostituita dalla struttura v2 sopra — la spec del
Director inverte il gradiente: flee = agguato pesante rinviato, pursue-fail
= agguato mite. Sweep: `scripts/quest-goblin-f5-sweep.ts` (N1 scelto).

### F6 — CONTINUA L'ESPLORAZIONE (opzionale, post-obiettivo)

- X turni di esplorazione; a ogni turno:
  - danni **5 → 10 → 15 → …** (crescenti) distribuiti col profilo slot;
  - skill check su `INTELLIGENZA` o `PERCEZIONE`.
- Push-your-luck puro: ogni turno in più costa di più.

### F7 — RITORNO / AGGUATO

- **Se F5 riuscita (sterminio):** ritorno pulito.
- **Altrimenti:** i goblin superstiti fanno un **agguato nel bosco** —
  pesante se lasciati fuggire, mite se inseguiti (spec v2). **v3
  (Director 2026-10-18):** ti stavano *aspettando* — attaccano per
  rabbia e vendetta, non per una motivazione «organizzata»; nessun
  riferimento a strada o guado nella fiction.
  **all'ingresso tutto il party prende 5 danni secchi** (bilanciabile dopo),
  poi scelta:
  1. **Lasciare il trofeo dei goblin** → si perde la quest (niente reward:
     il trofeo è ciò che si converte in Gold al ritorno), si scappa;
  2. **Affrontare il combattimento** → **un turno secco** come in F4
     (Director 2026-10-06). Attesa Director: **mediamente rischiano
     di morire tutti tranne l'eroe** (il profilo posizionale con pochi
     superstiti concentra il rischio in coda: chi resta a coprire muore, l'eroe
     resiste).

---

## Layer narrativo — manoscritto (r008, R-219 — dibattito 20261018-narration-v3)

Il vincolo «pochissimo testo» delle origini è **superato**: il Director ha
chiesto pathos, contesto, nomi d'azione per i check, flavour per scelta ed
esito, e narrazione durante il movimento tra le fasi. Questa sezione è il
**testo completo che il lab deve mostrare**, in ordine d'incontro — ogni
stringa annotata col campo dati che la porta.

La versione corrente è la **r008**: manoscritto del dibattito multi-AI
convergente (`.mw/runs/20261018-narration-v3/artifact-r008.md`, sha256
`eb25ec30…`, accettato 2026-10-19), che codifica le 11 correzioni
Director del 2026-10-18 (R-219) in forma validabile — italiano + inglese.
Sostituisce la v3 (2026-10-18 — in git history) ed è **sincronizzata
con `scenarios/goblin.ts`** dal 2026-10-19 — i residui sono elencati in
«Delta rimasti».

### Campi authored consumati dal lab

| Campo | Su quale nodo | Cosa fa |
|---|---|---|
| `transit` | choice, combat, end | narrazione durante la transizione cinematografica verso il nodo (~2.6 s, `questLabPacing`) — *cosa vedi, cosa incontri* |
| `title` | tutti | per i check è il **nome d'azione**, entra nel titolo dell'astrolabio |
| `body` | tutti | riga di contesto (sotto il check overlay / corpo della card) |
| `options[].label` | choice | prosa authored — il gesto che il giocatore firma |
| `options[].detail` | choice | stat + gesto, **mai** scopo né esito (convenzione Director 2026-10-18: detail non-spoiler — «Percezione. Vi abbassate tra le radici.») |
| `verdictFlavor` | check | una riga per banda `bigwin/win/almost/fail/epicfail` |
| `failHint` | check | testo pre-check che dichiara la posta |
| `upfrontDamage` | check | pedaggio deterministico narrato nell'esito |
| `previewHint` | check/combat/harm | hint di pericolo visibile al planning |
| `revealHint` | harm | hint sbloccato da scouting/rivelazione |
| gesto unico | choice a opzione unica | **v3 (confermata r008):** un nodo senza check né scelta si rappresenta come choice a **una sola opzione** (`gob-bottino` → «Recupera il bottino» → `next` diretto) — nessun campo `action`/`kind: 'reward'` nello schema |
| attack lines | combat | flavor per banda su ogni turno — authored in config (`combat.attackLines` sul nodo; `GOBLIN_ATTACK_LINES` nel motore resta il fallback) |
| `body` di `harm`/`end` | harm, end | il colpo subito / la chiusura |

Presentazione (`ResolvedCheck`, aggiornata 2026-10-08): la cinematica
separa `flavor` (verdict authored), `harmLines` (ferite e pedaggi),
`authoredText` (esito authored) e gli **harms ambient** (agguato,
attrito) senza check proprietario, presentati come beat a sé.

### Regole di scrittura

1. **Transit** — mostra ciò che i personaggi *vedono/fanno* in movimento,
   mai l'esito futuro. Copre l'animazione reale di spostamento.
2. **Action name** — il check si chiama per il gesto, non per la stat.
   Registro: seconda persona se il gesto è di uno («Ti arrampichi…»),
   plurale se è del gruppo («Saltate il filo…»), sostantivo se il gesto
   è già un'immagine («La carica»).
3. **VerdictFlavor** — riporta ciò che il *mondo* fa in risposta. I costi
   si possono nominare («costa sangue», «−10 HP») ma le cifre sono
   **provvisorie finché il budget di rischio non è calibrato**; la riga
   deve reggere anche senza numero.
4. **Nomi dei PG — mai hardcoded.** Il testo referenzia *slot*:
   `{leader}`, `{bodyguard}`, `{nome}` vengono interpolati dal party
   assegnato (il motore già lo fa nelle righe di danno). Accessorio
   italiano: costruzioni che **evitano l'accordo di genere** sul
   placeholder (`{leader} marcia davanti` è sicuro, `{leader} è ferita/o`
   no).
5. **Le uscite di un nodo vivono nel transit del nodo successivo** — non
   esiste «testo di uscita»: l'aftermath dello sterminio è il transit
   del campo conquistato.
6. **Le scelte senza check meritano flavor proprio** — oggi compresso in
   `detail`; campo candidato `options[].consequence` (proposto, non
   implementato).
7. **Attack lines = canale separato** — stesse regole del verdictFlavor
   ma stringate: si leggono 5 volte di fila, nessuna ridondanza.
8. **Le opzioni non anticipano scopo né esito** (Director 2026-10-18) —
   la label nomina il gesto («Esaminare il terreno»), mai cosa troverà né
   a cosa serve («dall'alto: dove nascondono ciò che rubano» = spoiler).
9. **Ciò che un check serve a scoprire non si mostra prima del check**
   (Director 2026-10-18) — se impronte e trappole sono già nel body del
   nodo-scelta, l'esplorazione non ha più oggetto.
10. **Gli esiti descrivono il mondo, non i risultati meccanici che l'UI
    mostra** (Director 2026-10-18) — niente conteggi di morti, bonus o
    HP nella prosa; «show don't tell»: le immagini di scena portano ciò
    che è ovvio, il testo porta ciò che le immagini non dicono.

### Budget di rischio (proposta — cifre placeholder da calibrare MC)

La quest dichiara *quanto deve costare*: il flavor promette sangue solo
dove il sangue è reale, e il tuning MC ha un target.

```yaml
quest: sterminio-dei-goblin          # party di riferimento: preset gob-band
danno_atteso_totale: 25–45 HP        # concentrato in coda di formazione
morte_pg:
  playthrough_normale: < 5%          # morte solo su chain di sfortuna
  f7_ultimo_scontro:   ~15–25%       # il prezzo del trofeo, se combatti
concentrazione_rischio:
  F1-B: ferita lieve (caduta dalla quercia)
  F4:   danni di scambio, escalation da T3
  F5:   pedaggio authored (10–20 HP) + intensità agguato
  F7:   unico nodo dove la morte è attesa come possibilità reale
regola: un testo che promette morte dove il modello non può uccidere
        è un bug narrativo.
```

---

## Manoscritto — testo per nodo, in ordine d'incontro

**Versione corrente: r008 (dibattito multi-AI convergente
20261018-narration-v3, artifact-r008 sha256 `eb25ec30…`, accettato
2026-10-19).** Sostituisce la v3 (R-219, 2026-10-18 — in git history).
Il manoscritto IT è quello del fixture accettato
`tests/fixtures/goblin-accepted-r008.ts` (0 hard issue sotto
`validateNodeCopyR8` + contratto epistemico `contract-v1.json`); il
render EN è il peer authored consumato dal runtime —
**sincronizzato con `scenarios/goblin.ts` il 2026-10-19** — i residui
sono in «Delta rimasti». `{nome}`/`{bodyguard}` = interpolazione dal
party assegnato (nel motore).

### Manoscritto IT — r008

#### Offerta

- **flavour:** «Il bosco si è fatto silenzioso. I goblin, no.»
- **objective:** «Sterminare l'accampamento goblin.»
- **dispatch:** «Seguite le tracce fino al loro accampamento. Nessuno deve tornare a minacciare il villaggio.»
- **beats:** Esplorazione · Bottino · Regole d'ingaggio · Combattimento · Incalzare · Razzia · Ritorno

#### F1 — Esplorazione `gob-esplora` (choice)

> **title:** «Esplorazione»
>
> **transit:** «Gli alberi chiudono la luce alle vostre spalle. Tra le
> felci umide l'aria è ferma e sa di muschio bagnato e legna marcia.»
>
> **body:** «Il sottobosco stringe il passo in una parete di tronchi
> caduti. Il folto tace da ogni lato, e non dice nulla di chi lo
> abita.»
>
> **Opzioni:**
> - *Esamina il terreno*
> - *Esamina dall'alto*

#### Check `gob-tracce-per` (PER)

> **title:** «Esamina il terreno»
>
> **transit:** «Vi abbassate tra le radici. Sotto lo strato di foglie, la
> terra conserva segni che il bosco non ha ancora avuto il tempo di
> cancellare.»
>
> **body:** «Vi piegate dove il muschio cede alla terra scura, cercando
> tra le foglie bagnate un segno.»
>
> **failHint:** «Le foglie tornano al loro posto, ma le vostre impronte
> restano impresse nella terra umida.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Sotto le foglie marce affiorano impronte leggere e, più avanti nell'erba alta, il riflesso sottile di un filo di campanelli teso a mezza gamba.» |
| win | «Talloni nudi nella terra umida e rami spezzati bassi disegnano una traccia obliqua che punta verso l'interno del bosco.» |
| almost | «Impronte sovrapposte e confuse nella terra molle: qualcuno è passato, ma il verso si perde tra le radici.» |
| fail | «Solo radici scoperte e terra smossa dalla pioggia. Il suolo non vi concede nulla.» |
| epicfail | «Il piede cede sul muschio fradicio e uno schianto di rami secchi rimbalza nel silenzio del bosco.» |

Nota meccanica: l'epicfail paga −10 HP cablati (ruling v3) — la ferita
è la caduta tra i rami secchi; il motore la nomina nel log («The dead
branches tear you on the way down.»), non nel verdict text.

#### Check `gob-tracce-perfor` (STR+PER)

> **title:** «Esamina dall'alto»
>
> **transit:** «Una vecchia quercia emerge sopra il sottobosco. I rami
> più bassi sono raggiungibili, ma la corteccia è ruvida e screpolata.»
>
> **body:** «Il tronco della quercia è umido e ruvido sotto i palmi;
> più in alto la cupola di foglie chiude la vista su tutto ciò che sta
> oltre.»
>
> **failHint:** «Il legno scricchiola sotto il vostro peso. Un ramo
> sottile si piega e torna al suo posto con un colpo secco.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Dall'alto il bosco cambia volto: un filo di fumo sale dritto sopra la radura dell'accampamento, il calpestio gira a spirale attorno ai fuochi e, lontano dalle tende, un lembo di sottobosco appare rimesso a posto con troppa cura, come una ferita ricucita.» |
| win | «Tra i rami alti scorgete il fumo grigio dell'accampamento e, lontano dai fuochi, un lembo di sottobosco rimesso a posto con troppa cura, come una ferita ricucita.» |
| almost | «Il vento apre le fronde per un istante: scorgete un filo di fumo grigio tra le cime, prima che le foglie richiudano la vista.» |
| fail | «La chioma è un muro verde e le braccia bruciano per la salita: scendete con la corteccia sotto le unghie senza aver visto oltre gli alberi.» |
| epicfail | «Il ramo marcio cede di schianto sotto il peso: precipitate tra i rami bassi e battete duro la spalla a terra.» |

Nota meccanica: ogni esito non-successo paga −10 HP — su `fail` è il
costo della salita («The climb costs you.»), su `epicfail` la caduta
(«The fall costs you.»).

#### F2 — Bottino `gob-bottino` (nodo nascosto, recupero diretto)

Condizione: il nodo compare se l'esplorazione dall'alto permette di
individuare il nascondiglio.

> **title:** «Ciò che era nascosto»
>
> **transit:** «Il lembo di sottobosco rimesso a posto con troppa cura
> è ancora là, in disparte dai fuochi.»
>
> **body:** «Le foglie vengono via in una sola manata. Sotto, in una
> buca foderata di pelli, giace ciò che i goblin avevano sepolto di
> nascosto: allungate le mani e lo tirate fuori.»
>
> **action:** «Recupera il bottino»

Nessuna prova e nessuna scelta: il giocatore raccoglie il bottino e
prosegue (Director 2026-10-18; runtime = choice a opzione unica,
`grantsGold` sul `next` diretto — nessun kind nuovo).

#### F3 — Regole d'ingaggio `gob-accampamento` (choice)

> **title:** «Regole d'ingaggio»
>
> **transit:** «Oltre l'ultima cortina di felci l'odore acre di grasso
> rancido vi investe nella penombra.»
>
> **body:** «Le braci basse ardono al centro della radura. Tra le tende
> storte si muovono sagome corte: resta solo da scegliere come
> entrare.»
>
> **Opzioni:**
> - *Muoviti nell'ombra*
> - *Carica a ferro scoperto*

#### Check `gob-stealth` (AGI)

> **title:** «Muoviti nell'ombra»
>
> **body:** «Avanzate piegati dove la penombra del sottobosco tocca il
> margine della radura, misurando ogni appoggio.»
>
> **failHint:** «Il filo si tende sotto il vostro peso. Un campanello
> vibra appena.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Scivolate oltre un filo di campanelli senza muovere un soffio: siete già alle loro spalle mentre fissano ancora il fuoco.» |
| win | «Un passo, una pausa, un altro passo nell'ombra. Superate il perimetro esterno senza che una sola foglia parli.» |
| almost | «Sfiorate un campanello che oscilla piano: vicino al fuoco una testa si volta, poi esita.» |
| fail | «Un filo vi morde lo stivale e un campanello stride nella notte: le sagome attorno al fuoco scattano in piedi.» |
| epicfail | «Inciampate in pieno in un filo teso e i campanelli si scatenano in un unico suono: il campo intero si rovescia contro di voi.» |

#### Check `gob-assalto` (STR)

> **title:** «Carica a ferro scoperto»
>
> **body:** «Stringete le impugnature e vi lanciate fuori dalla
> macchia, puntando dritto verso il cerchio del fuoco.»
>
> **failHint:** «Il legno geme sotto la spinta. Dall'altra parte,
> qualcosa urta contro la barriera.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Travolgete la barricata all'ingresso di puro slancio: siete già sopra i fuochi prima ancora che il primo grido prenda forma.» |
| win | «Sfondate il margine del campo a spallate, portando le lame dentro il cerchio di luce.» |
| almost | «La terra molle frena gli stivali all'ultimo passo: entrate nella radura mentre le prime guardie già si alzano.» |
| fail | «Il fango sotto i piedi spezza lo slancio della corsa; davanti ai fuochi il muro di punte è già serrato.» |
| epicfail | «Il piede scivola nella melma in piena corsa: cadete in avanti contro la barricata con la guardia aperta.» |

#### F4 — Combattimento `gob-combattimento` (combat)

> **title:** «Ferro e cenere»
>
> **transit:** «Il respiro si chiude in gola. Poi resta solo il rumore
> del ferro.»
>
> **body:** «Tizzoni calpestati, urla rauche che rimbalzano tra i
> tronchi e il sapore caldo del rame sulla lingua. Ogni sagoma intorno
> alle braci ha denti e lama.»
>
> **previewHint:** «Tra fumo e fiamme, persino le ombre sembrano avere
> denti.»

Attack lines per turno — in config dal sync r008
(`combat.attackLines` sul nodo, `GOBLIN_ATTACK_LINES` resta fallback
motore per le quest senza righe authored):

| esito | riga |
|---|---|
| bigwin | «Tutto il peso del corpo scende nel fendente e sfonda la guardia davanti a voi.» |
| win | «L'urto secco dell'acciaio spezza il legno degli scudi, e il rumore resta nelle orecchie.» |
| almost | «Il fuoco fa di ogni lama un lampo storto: il taglio morde, ma di striscio.» |
| fail | «Il colpo muore sul cuoio unto e sul legno storto, lasciando il polso vibrare a vuoto.» |
| epicfail | «La cenere scivolosa tradisce il tallone e un urto da un fianco vi riversa il fiato in gola.» |

**Righe del motore (condivise da tutte le quest — `questRun.ts`, nomi
interpolati). Il danno legge lo stato: la frase dipende dagli HP residui
del bersaglio, non dal numero subito:**

- Danno, >70% HP — «{nome} serra i denti e resta in piedi (−X HP).»
- Danno, 35–70% — «{nome} si piega, poi si rimette dritto (−X HP).»
- Danno, 20–35% — «{nome} barcolla: c'è sangue sul fianco (−X HP).»
- Danno, <20% — «{nome} regge solo perché non c'è altro da fare (−X HP).»
- Morte — «{nome} cade, e non si rialza più — su «{fonte}».»
- Death save — «{nome} è a terra… e si rialza.»
- Bodyguard — «{bodyguard} si frappone e subisce il colpo destinato a {nome}.»

#### F5 — Incalzare `gob-incalzare` (choice, solo se superstiti)

> **title:** «Inseguimento»
>
> **transit:** «Le ultime braci fumano sulla terra calpestata. Verso
> l'interno del bosco si sente il fruscio convulso di chi scappa nella
> notte.»
>
> **body:** «Chi è rimasto in piedi si butta tra gli alberi senza
> voltarsi, inghiottito a pezzi dall'oscurità: una schiena, un ansimo,
> un ramo che oscilla.»
>
> **Opzioni:**
> - *Lasciarli fuggire*
> - *Incalza i fuggiaschi*

#### Check `gob-incalza-check` (STR)

> **title:** «Incalza i fuggiaschi»
>
> **body:** «Vi lanciate sotto le fronde basse dietro il rumore dei
> passi in fuga, dove il terreno scende ripido tra pietre umide e
> radici.»
>
> **failHint:** «Una lastra si muove sotto il peso degli scarponi. La
> pietraia non concede un passo sicuro.»
>
> **previewHint:** «Tra le rocce, ogni svolta cancella per un istante ciò
> che vi aspetta oltre.»
>
> **upfrontDamage:** 10 HP; 20 HP su epicfail, secondo la regola
> prevista. Il danno viene narrato negli esiti.

| esito | verdictFlavor |
|---|---|
| bigwin | «Li raggiungete dove la forra stringe il passo, e il bosco si fa muto di colpo.» |
| win | «Il vostro passo è più lungo del loro sulla salita di pietra: il fruscio davanti a voi si spegne sotto i colpi.» |
| almost | «La gola brucia ad ogni respiro; li urtate laggiù in fondo alla forra, ma la macchia si richiude sulle schiene più rapide.» |
| fail | «Le pietre bagnate vi tradiscono il passo e la macchia se li riprende prima che le lame arrivino.» |
| epicfail | «Scivolate lungo la scarpata battendo duro contro la roccia viva, mentre i passi in fuga si perdono.» |

Nota: `win`/`bigwin` = sterminio → F7 pulito; `almost`/`fail`/`epicfail`
= fuga → agguato mite.

#### F6 — Razzia `gob-esplora-extra` (choice, push-your-luck)

> **title:** «Tra le ceneri»
>
> **transit:** «Il silenzio ricade sulla radura devastata, rotto solo
> dallo scricchiolio dei legni anneriti dal fuoco.»
>
> **body:** «Attorno ai tizzoni spenti restano teli squarciati e cumuli
> di strame fumante che la fiamma non ha ancora consumato del tutto.»
>
> **Opzioni:**
> - *Fruga tra le braci*
> - *Fermarsi*

#### Check `gob-cerca` (INT/PER)

> **title:** «Fruga tra le braci»
>
> **body:** «Sollevate i teli anneriti col piatto della lama, cercando
> a tentoni nel tepore acre che sale dai resti del campo.»
>
> **failHint:** «Una trave scricchiola sopra di voi. Una pioggia di
> cenere cade sul terreno.»
>
> **previewHint:** «Il fumo torna a velare il campo; il legno bruciato
> cede al minimo urto.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Sotto lo strato più fondo le dita incontrano il cuoio pesante di una cassa risparmiata dalle fiamme.» |
| win | «Tra i resti anneriti tirate fuori ciò che il fuoco non è riuscito a divorare.» |
| almost | «Una presa corta nel fumo, mentre un sostegno bruciato cede a un soffio dalla spalla.» |
| fail | «Solo cenere calda che vi si attacca ai palmi attraverso i guanti.» |
| epicfail | «La trave annerita della tenda cede di schianto, rovesciandovi addosso una pioggia di braci ardenti e legno spaccato.» |

**Righe per turno** (motore, `GOBLIN_F6_CREAK_LINES` — la struttura che
cede, una per `exploreTurn`):

1. «Il palo che regge il telo scricchiola.»
2. «La brace cova ancora sotto la tela annerita; il calore lambisce il
   viso.»
3+. «Una trave si stacca con uno schianto e ricade dove, un istante
   prima, frugavate.»

#### F7 — Ritorno / Agguato

`gob-ritorno` (info):

> **title:** «Il ritorno»
>
> **body:** «L'aria si fa più fredda sotto le chiome alte. Qualcuno
> allenta la presa sull'elsa — poi un ramo schiocca dove il vento non
> soffia.»

`gob-agguato` (harm):

> **title:** «Quelli che erano rimasti»
>
> **body:** «I goblin superstiti vi stavano aspettando. Portano ancora
> addosso il fumo del loro campo: vi hanno seguito fin qui, e ora
> escono dalle fronde senza un grido, con i denti già scoperti.»
>
> **previewHint:** «Tra gli alberi, le ombre si muovono prima che
> riusciate a distinguere i corpi.»
>
> **revealHint:** «Le tracce dei fuggitivi si incrociano attorno al
> sentiero. Non sono finiti qui per caso.»

`gob-agguato-scelta` (choice):

> **title:** «Accerchiati»
>
> **transit:** «Le frecce vibrano ancora nei tronchi attorno a voi.»
>
> **body:** «Lame basse chiudono il passo tra gli alberi, e il ringhio
> sale da ogni lato.»
>
> **Opzioni:**
> - *Lasciare il trofeo*
> - *Affrontare*

`gob-ultimo-scontro` (combat, 1 turno):

> **title:** «L'ultimo assalto»
>
> **transit:** «Le spalle si toccano. L'urto arriva da ogni lato.»
>
> **body:** «Si gettano sugli scudi senza badare al ferro; dalle loro
> gole non esce più nessuna parola, solo un respiro lungo e basso, a
> denti stretti.»

Attack lines per turno — in config dal sync r008
(`combat.attackLines` sul nodo):

| esito | riga |
|---|---|
| bigwin | «Tutta la furia della mischia si rovescia in un solo fendente, e il cerchio si apre.» |
| win | «L'acciaio risponde all'acciaio con un suono corto che taglia il ringhio.» |
| almost | «Le lame si cercano nella penombra e si trovano solo a metà.» |
| fail | «I denti stridono sullo scudo mentre la linea tiene per un soffio.» |
| epicfail | «Un contraccolpo dal buio vi toglie il terreno da sotto i piedi per un istante lunghissimo.» |

`gob-fine` (end):

> **title:** «Cenere fredda»
>
> **transit:** «Gli alberi si diradano nel grigio dell'alba; l'odore di
> fumo e ferro vi resta cucito addosso.»
>
> **body:** «Sulle mani resta il segno della notte, mentre l'ombra
> degli alberi si richiude alle vostre spalle.»
>
> **closingLine:** «Nel folto il fumo sale ancora dritto, ma ormai non
> chiama più nessuno.»

Nel runtime la closingLine è fusa in coda al `body` (il kind `end` non
ha un campo dedicato — il bilancio meccanico resta compito di
`composeEndingText`, non della prosa).

**Epilogo composto dal motore** (`composeEndingText`): vittoria «The
trophy is on the scales. The village breathes again.»; sconfitta «…The
goblins keep the wood.»

### Manuscript EN — r008

Peer render of the IT r008 — same facts, same beats, English voice (per
the pipeline convention: a re-voicing, not a literal translation). This
is the authored text consumed by `scenarios/goblin.ts` (R-135).

#### Offer

- **flavour:** "The wood has gone quiet. The goblins have not."
- **objective:** "Exterminate the goblin camp."
- **dispatch:** "Follow their tracks to the camp. None of them must
  come back to threaten the village."
- **beats:** Exploration · Loot · Rules of Engagement · Combat ·
  Pursuit · Raid · Return

#### F1 — Exploration `gob-esplora` (choice)

> **title:** "Exploration"
>
> **transit:** "The trees close out the light behind you. Among the
> damp ferns the air lies still, smelling of wet moss and rotting
> wood."
>
> **body:** "The undergrowth narrows the path into a wall of fallen
> trunks. The thicket is silent on every side, and tells you nothing
> of who lives in it."
>
> **Options:**
> - *Examine the ground*
> - *Examine from above*

#### Check `gob-tracce-per` (PER)

> **title:** "Examine the ground"
>
> **transit:** "You crouch among the roots. Beneath the leaf litter,
> the earth still holds marks the wood has not had time to erase."
>
> **body:** "You crouch where the moss gives way to dark earth,
> searching the wet leaves for a sign."
>
> **failHint:** "The leaves settle back into place, but your own prints
> stay pressed in the damp earth."

| verdict | verdictFlavor |
|---|---|
| bigwin | "Beneath the rotting leaves, light prints surface — and further on, in the tall grass, the thin glint of a bell wire strung at shin height." |
| win | "Bare heels in the damp earth and low snapped branches draw a slanting trail that points deeper into the wood." |
| almost | "Overlapping, muddled prints in the soft ground: someone passed, but the direction dies among the roots." |
| fail | "Only bare roots and rain-turned soil. The ground yields you nothing." |
| epicfail | "Your foot gives on the sodden moss and you go down through the dry branches with a crash that bounces through the silence of the wood." |

#### Check `gob-tracce-perfor` (STR+PER)

> **title:** "Examine from above"
>
> **transit:** "An old oak rises above the undergrowth. The lowest
> branches are within reach, but the bark is rough and cracked."
>
> **body:** "The oak's trunk is damp and rough under your palms; higher
> up, the dome of leaves closes off everything beyond."
>
> **failHint:** "The wood creaks under your weight. A thin branch bends
> and snaps back with a sharp crack."

| verdict | verdictFlavor |
|---|---|
| bigwin | "From above the wood changes face: a thread of smoke rises straight over the camp's clearing, the trampling spirals around the fires and, far from the tents, a patch of undergrowth looks put back with too much care, like a stitched wound." |
| win | "Through the high branches you spot the camp's grey smoke and, far from the fires, a patch of undergrowth put back with too much care, like a stitched wound." |
| almost | "The wind opens the fronds for an instant: you glimpse a thread of grey smoke among the treetops before the leaves close over the sight." |
| fail | "The crown is a green wall and your arms burn from the climb: you come down with bark under your nails, having seen nothing past the trees." |
| epicfail | "The rotten branch gives with a crack under your weight: you drop through the lower boughs and slam your shoulder into the ground." |

#### F2 — Loot `gob-bottino` (hidden node, direct recovery)

> **title:** "What was hidden"
>
> **transit:** "The patch of undergrowth set back with too much care is
> still there, apart from the fires."
>
> **body:** "The leaves come away in a single handful. Beneath, in a
> hide-lined hollow, lies what the goblins buried in secret: you reach
> in and pull it out."
>
> **action:** "Recover the loot"

#### F3 — Rules of engagement `gob-accampamento` (choice)

> **title:** "Rules of engagement"
>
> **transit:** "Past the last curtain of ferns, the sharp smell of
> rancid fat hits you in the half-light."
>
> **body:** "Low embers burn at the clearing's heart. Short shapes move
> between the crooked tents: all that remains is to choose how to get
> in."
>
> **Options:**
> - *Move through the shadows*
> - *Charge with bare steel*

#### Check `gob-stealth` (AGI)

> **title:** "Move through the shadows"
>
> **body:** "You advance bent low where the undergrowth's shadow
> touches the clearing's edge, measuring every foothold."
>
> **failHint:** "The wire tightens under your weight. A bell quivers,
> barely."

| verdict | verdictFlavor |
|---|---|
| bigwin | "You slip past a bell wire without stirring a breath: you are already behind them while they still stare at the fire." |
| win | "A step, a pause, another step in the dark. You cross the outer perimeter without a single leaf speaking." |
| almost | "You brush a bell that sways faintly: near the fire a head turns, then hesitates." |
| fail | "A wire bites your boot and a bell rasps in the night: the shapes around the fire spring up." |
| epicfail | "You trip full into a taut wire and the bells erupt in a single sound: the whole camp pours out at you." |

#### Check `gob-assalto` (STR)

> **title:** "Charge with bare steel"
>
> **body:** "You tighten your grip on the hilts and burst out of the
> scrub, charging straight for the ring of fire."
>
> **failHint:** "The wood groans under the push. On the other side,
> something thuds against the barrier."

| verdict | verdictFlavor |
|---|---|
| bigwin | "You smash through the entrance barricade on sheer momentum: you are already on top of the fires before the first scream takes shape." |
| win | "You break the camp's edge shoulder-first, carrying your blades inside the circle of light." |
| almost | "The soft ground brakes your boots on the last step: you enter the clearing as the first guards are already rising." |
| fail | "The mud under your feet snaps the run's momentum; before the fires the wall of points is already tight." |
| epicfail | "Your foot slides in the mire at full run: you fall forward against the barricade, guard wide open." |

#### F4 — Combat `gob-combattimento` (combat)

> **title:** "Iron and ash"
>
> **transit:** "Your breath closes in your throat. Then there is only
> the sound of iron."
>
> **body:** "Trampled embers, hoarse screams bouncing between the
> trunks, and the warm taste of copper on your tongue. Every shape
> around the coals has teeth and a blade."
>
> **previewHint:** "Amid smoke and flame, even the shadows seem to have
> teeth."

Attack lines — in config as of the r008 sync (`combat.attackLines` on
the node; `GOBLIN_ATTACK_LINES` stays the engine fallback):

| verdict | line |
|---|---|
| bigwin | "The full weight of your body falls into the cleave and breaks through the guard in front of you." |
| win | "The dry clash of steel splits the shield-wood, and the noise stays in your ears." |
| almost | "The fire turns every blade into a crooked flash: the cut bites, but only in passing." |
| fail | "The blow dies on greased leather and warped wood, leaving your wrist humming on empty air." |
| epicfail | "The slick ash betrays your heel and a hit from the flank pours the breath back into your throat." |

#### F5 — Pursuit `gob-incalzare` (choice, survivors only)

> **title:** "Pursuit"
>
> **transit:** "The last embers smoke on the trampled earth. Deeper in
> the wood you hear the frantic rustle of those fleeing into the
> night."
>
> **body:** "Those still standing throw themselves among the trees
> without looking back, swallowed piecemeal by the dark: a back, a
> gasp, a swaying branch."
>
> **Options:**
> - *Let them flee*
> - *Run them down*

#### Check `gob-incalza-check` (STR)

> **title:** "Run them down"
>
> **body:** "You dash under the low fronds after the sound of fleeing
> steps, where the ground drops steep between wet stones and roots."
>
> **failHint:** "A slab shifts under the weight of your boots. The
> scree grants no safe step."
>
> **previewHint:** "Among the rocks, every turn erases for an instant
> what waits beyond."
>
> **upfrontDamage:** 10 HP; 20 HP on epicfail.

| verdict | verdictFlavor |
|---|---|
| bigwin | "You reach them where the gorge narrows, and the wood goes suddenly mute." |
| win | "Your stride outruns theirs on the stone rise: the rustling ahead dies beneath your blows." |
| almost | "Your throat burns at every breath; you catch them down at the gorge's end, but the thicket closes over the faster backs." |
| fail | "The wet stones betray your step and the thicket takes them back before the blades arrive." |
| epicfail | "You slide down the escarpment, striking hard against living rock, while the fleeing steps are lost." |

#### F6 — Raid `gob-esplora-extra` (choice, push-your-luck)

> **title:** "Among the ashes"
>
> **transit:** "Silence falls again over the ruined clearing, broken
> only by the creak of fire-blackened wood."
>
> **body:** "Around the dead embers lie torn tarps and heaps of
> smouldering straw the flame has not yet fully consumed."
>
> **Options:**
> - *Rummage through the embers*
> - *Stop here*

#### Check `gob-cerca` (INT/PER)

> **title:** "Rummage through the embers"
>
> **body:** "You lift the blackened tarps with the flat of your blade,
> groping through the acrid warmth rising from the camp's remains."
>
> **failHint:** "A beam creaks above you. A rain of ash falls to the
> ground."
>
> **previewHint:** "The smoke veils the camp again; the burnt wood
> gives at the slightest knock."

| verdict | verdictFlavor |
|---|---|
| bigwin | "Under the deepest layer your fingers meet the heavy leather of a chest spared by the flames." |
| win | "From the blackened remains you pull out what the fire failed to devour." |
| almost | "A short grab in the smoke, while a burnt support gives way a breath from your shoulder." |
| fail | "Only warm ash clinging to your palms through the gloves." |
| epicfail | "The tent's blackened beam gives with a crash, pouring a rain of burning embers and split wood over you." |

#### F7 — Return / Ambush

`gob-ritorno` (info):

> **title:** "The return"
>
> **body:** "The air turns colder beneath the high crowns. Someone
> loosens their grip on the hilt — then a branch snaps where the wind
> does not blow."

`gob-agguato` (harm):

> **title:** "Those who were left"
>
> **body:** "The surviving goblins were waiting for you. They still
> carry the smoke of their camp on them: they tracked you all the way
> here, and now they step out of the fronds without a cry, teeth
> already bared."
>
> **previewHint:** "Among the trees, the shadows move before you can
> make out the bodies."
>
> **revealHint:** "The fugitives' tracks criss-cross around the trail.
> They did not end up here by chance."

`gob-agguato-scelta` (choice):

> **title:** "Encircled"
>
> **transit:** "The arrows still quiver in the trunks around you."
>
> **body:** "Low blades close off the path between the trees, and the
> snarling rises on every side."
>
> **Options:**
> - *Leave the trophy*
> - *Stand and fight*

`gob-ultimo-scontro` (combat, 1 turn):

> **title:** "The last assault"
>
> **transit:** "Shoulder to shoulder. The impact comes from every
> side."
>
> **body:** "They throw themselves on your shields heedless of the
> steel; from their throats comes no word any more, only a long low
> breath, teeth clenched."

Attack lines — in config as of the r008 sync (`combat.attackLines` on
the node):

| verdict | line |
|---|---|
| bigwin | "All the melee's fury pours into a single cleave, and the circle opens." |
| win | "Steel answers steel with a short sound that cuts the snarl." |
| almost | "The blades seek each other in the dim light and meet only halfway." |
| fail | "Teeth grate on the shield while the line holds by a breath." |
| epicfail | "A counterblow out of the dark takes the ground from under your feet for one endless instant." |

`gob-fine` (end):

> **title:** "Cold ash"
>
> **transit:** "The trees thin into the grey of dawn; the smell of
> smoke and iron stays stitched to you."
>
> **body:** "Your hands still bear the mark of the night, while the
> trees' shadow closes behind you. Deep in the thicket the smoke still
> rises straight — but it calls no one any more."

---

## Delta rimasti (dopo il manoscritto r008 e il sync del 2026-10-19)

**Sync r008 → runtime/contratto — applicato 2026-10-19 (R-219):**

- `scenarios/goblin.ts` riscritto al render EN r008: F1 «Exploration»
  (le opzioni restano «Examine the ground» / «Examine from above»),
  check titles = gesto («Move through the shadows», «Charge with bare
  steel», «Run them down», «Rummage through the embers»), F2 «What was
  hidden» (choice a opzione unica, invariata la convenzione), F3
  «Rules of engagement», F4 «Iron and ash» con `combat.attackLines` in
  config, F5 «Run them down», F6 «Among the ashes», F7 «Those who were
  left» / «Encircled» / «The last assault» con attackLines authored,
  `gob-fine` «Cold ash» con la closingLine fusa nel body.
- `questRun.ts`: log engine riallineati alla nuova fiction —
  `gob-tracce-per` epicfail −10 HP ora è «The dead branches tear you on
  the way down.» (la «lama nascosta» non esiste più: il danno cablato
  v3 resta, la causa narrata è la caduta tra i rami); `gob-tracce-perfor`
  distingue «The climb costs you.» (fail) da «The fall costs you.»
  (epicfail).
- `GOBLIN_ATTACK_LINES` (motore) invariate: ora irraggiungibili per la
  quest goblin (entrambi i combat hanno `attackLines` authored) —
  restano fallback per eventuali quest future senza righe in config.
- Fixture/test: `goblin.oracle/coverage/checks` rigenerate via
  `generate-quest-scenario-fixture.mts` + `UPDATE_QUEST_FIXTURES=1`
  (re-baseline intenzionale, come per R-135).
- Riferimenti indiretti aggiornati: `quest-goblin-fun-audit.ts` (mappa
  label), strategie auto-play di `_tmp-play-quest-window.ts` e
  `quest-theatre-playtest.ts` (regex `Rummage`).

**Residui aperti dopo il sync r008:**

- Arte F1/F2 stale rispetto alla r008: `sentiero-tracce.jpg` mostra
  solchi di ruota, `carro-nascosto.jpg` mostra un carro mercantile —
  fiction revocata (niente carri/strada). La rigenerazione richiede
  ruling Director (v. `CATALOG.md` «Mancanti/pending» e prompt F1/F2
  marcati STALE in `.mw/specs/quest-goblin-scenes/`).
- `PHASE_ICONS` ha indici 0..7: i beat goblin ora occupano 0..6 —
  l'icona dell'indice 7 non è più raggiungibile in questa quest.
- `composeEndingText` invariato: il bilancio meccanico (morti, bottino,
  XP) resta nel report/log, non nella prosa — coerente con la regola
  r008 «la UI conta, la prosa descrive».

**Sync v3 → runtime/contratto — applicato 2026-10-18 (R-219):**

- `scenarios/goblin.ts` riscritto alla v3 EN: label F1 («Examine the
  ground» / «Examine from above»), F2 = choice a opzione unica
  («Recover the loot» → `next` diretto, nessun check né schema nuovo),
  F3 «Rules of engagement», offer/beats/epilogue senza guado, `beats`
  rinumerati 0..6 (convenzione engine — il filler «Assignment» è uscito).
- `options[].detail` → **decisione ratificata: detail non-spoiler**
  (stat + gesto, mai scopo né esito — es. «Perception. You crouch among
  the roots.»). Schema invariato.
- `gob-tracce-per` epicfail → **decisione ratificata: danno cablato**
  (−10 HP su epicfail, lama nascosta nel terreno) — il flavor è reale.
- `composeEndingText`: callback al guado rimosso («the village breathes
  again» / «the goblins keep the wood»); `GOBLIN_ATTACK_LINES` e
  `GOBLIN_F6_CREAK_LINES` → righe v3.
- `contract-v1.json` riscritto ai fatti v3 (bosco, nascondiglio come
  sorpresa, F2 senza prova, F7 superstiti in agguato per
  rabbia/vendetta); `GUADO_VOCAB` → `BOSCO_GOBLIN_VOCAB` (id
  `bosco-goblin`) con `guado/strada/carro/mercante/masso` in `vietati`
  — il gate li blocca meccanicamente.
- `narrationPrompt.ts`: VOICE_ANCHORS v3, convenzione detail
  non-spoiler, nuova classe critic `outcome-spoiler`.
- `QUEST_RULES.md` §7b: nota source corretta (guado revocato).
- Fixture/test: `goblin.oracle/coverage/checks` rigenerate; strategie
  sweep/playthrough e `questCertainty`/`questFrontier` allineate a F2.

**Residui aperti dopo il sync:**

- Arte F1/F2 stale rispetto alla v3: `sentiero-tracce.jpg` mostra solchi
  di ruota, `carro-nascosto.jpg` mostra un carro mercantile — fiction
  revocata (niente carri/strada). La rigenerazione richiede ruling
  Director (v. `CATALOG.md` «Mancanti/pending» e prompt F1/F2 marcati
  STALE in `.mw/specs/quest-goblin-scenes/`).
- `PHASE_ICONS` ha indici 0..7: i beat goblin ora occupano 0..6 — l'icona
  dell'indice 7 non è più raggiungibile in questa quest.

Applicati 2026-10-08 (P0, solo testo — zero RNG, zero calibrazione):
campanelli, indizio visibile del masso, assalto fisico, attack
lines, righe di danno per gravità, fix F5-win (contraddiceva lo
sterminio), cassa semibruciata + righe-per-turno in F6, sollievo→shock
in F7, epilogo con registro, transit hold ∝ parole (`questLabPacing`).
Inoltre (2026-10-08, Director): re-mapping nomi↔stat in F1 — «Cercare
tracce» = PER pura (bonus stealth), «Arrampicarsi sull'albero» = STR+PER
(dall'alto rivela la nicchia → F2; il fallimento è la caduta, −10 HP —
e l'epicfail «ramo marcio» ora descrive il meccanismo giusto).

Ancora aperti:

1. Interpolazione slot nei transit (`{leader}`…): richiede supporto nel
   motore — finché non esiste, i transit restano name-agnostic.
2. `options[].consequence`: campo nuovo candidato — frase d'esito delle
   scelte senza check (F5 lasciar fuggire, F7 mollare il trofeo).
3. P1 rimandati (doc R-103): griglia F4 fase×banda, transit F4→F5 sullo
   stato del party, testo condizionato a flag (sentinella F1→F3, goblin
   riconoscibile F5→F7), metriche emotive M2/M6/M7/M8 nello script MC.
4. Morale dei goblin: **deciso dal Director 2026-10-08 — no** (né
   meccanica né readout; la rotta resta implicita nel contatore turni).
5. Budget di rischio: calibrare via MC prima di scrivere cifre nei flavor.

---

## Note aperte (da chiudere col Director)

**Chiusi 2026-10-06:** XP sempre · trofeo → reward reale al ritorno (Gold per
ora) · nessun vincolo min/max party (mock: 4 slot) · escalation piatta dopo
T3 con valori placeholder · consumabili solo prima di check/scelta · F4 =
1 colpo a T1–T2, 2 colpi da T3 a bersagli diversi · F1-PERCEZIONE → bonus
Stealth F3 · F3 semplificato (stesso bonus, rischio diverso) · F5 a bande
(**v2 2026-10-08**: pedaggio deterministico sempre, fuga → agguato mite;
lasciar fuggire → agguato peggiorato) · F6/F7 = greed trap voluta ·
HP: eroe 100 / altri 60 (mock, ereditati dalle stat reali) · F7 = turno
secco F4-like + 5 danni secchi a tutti · F1 = solo 2 check.

**Ancora aperti:**
- Valori esatti: danni per turno di F4, entità dell'agguato F7 (X danni
  secchi, mite vs peggiorato), durata/limite di F6, +Danno/Allerta di F3 —
  calibrazione da fare (placeholder, via Monte Carlo).
- ~~Struttura del combattimento F7~~ → **ratificato**: un turno secco come
  F4 + 5 danni secchi a tutti all'ingresso (Director 2026-10-06).
- ~~Modello HP~~ → **ratificato**: i PG hanno HP (mock eroe 100 / altri 60,
  ereditati dalle stat reali del PG in produzione).
- Soglia morte per HP: quando un PG arriva a 0 HP → morte? ferita? Da
  confermare (interpretazione probabile: 0 HP = morte, ferita = meccanica
  separata già vigente).
- ~~Testi per esito~~ → **manoscritto v3 (Director 2026-10-18, R-219)**
  in IT + EN: transit, action names, verdictFlavor a 5 bande, attack
  lines, previewHint/revealHint, gesto unico sui nodi reward.
  Sincronizzato col config il 2026-10-18 — vedi «Delta rimasti».
- Budget di rischio: proposta con cifre placeholder, da calibrare via MC.
