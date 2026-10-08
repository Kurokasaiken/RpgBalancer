---
title: Quest «Sterminio dei goblin» — spec authored completa
type: spec
status: vigente — documento unico della quest (meccanica + manoscritto);
  assorbito `context/QUEST_GOBLIN_FLAVOR.md` il 2026-10-08
date: 2026-10-06
updated: 2026-10-08
source: proposta del Director (correzione alla bozza «Torre nel Bosco», 2026-10-06);
  modello di targeting posizionale a cascata definito dal Director;
  layer narrativo R-099
---

# Sterminio dei goblin — spec completa

Quest di **combattimento**, basata su **Forza**. Vincoli di presentazione
(Director, evoluti 2026-10-08): ~~pochissimo testo~~ → **layer narrativo
cinematografico** (R-099) — immagine, nomi d'azione, transit tra le fasi,
flavour per scelta ed esito; il manoscritto completo è in fondo al doc.
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

---

## Fasi

### F0 — ASSEGNAZIONE (planning)

- **Info visibili:** quest di combattimento, basata su Forza.
- **Info rivelabile:** Percezione (la riveli portando esplorazione/preview).
- **Oggetti assegnabili:** Bonus Forza ×1 fase · Bonus Percezione ×1 fase ·
  Healing +20 HP.
- **Nessuno skill check in questa fase.**

### F1 — ESPLORAZIONE (cercare tracce)

Testo minimo. Due check alternativi:

| Check | Successo | Fallimento |
|---|---|---|
| `PERCEZIONE` | **bonus all'approccio Stealth di F3** (→ vantaggio in F4) | nulla |
| `PERCEZIONE + FORZA` | **apre F2** (l'evento opzionale bottino) | −10 HP |

- Ratificato (Director 2026-10-06): `PERCEZIONE` semplice non apre nulla —
  il suo successo alimenta la via stealth dell'accampamento.
- Il «nuovo evento» aperto da `PERCEZIONE+FORZA` **è F2**.
- **Solo questi 2 check** — nessuna altra combinazione in questo esempio
  (Director 2026-10-06).
- Checkpoint: ritirati / consumabile sempre disponibili.

### F2 — EVENTO OPZIONALE (bottino) — agganciato a F1

- **Disponibile solo se `PERCEZIONE+FORZA` di F1 è riuscita** (è l'evento che
  quel check apre).
- Check su `DESTREZZA` per prelevare **senza svegliare il campo**:
  - **Successo:** oggetto + nessun malus.
  - **Fallimento:** ottieni comunque l'oggetto, ma 10 danni (profilo slot)
    **e i goblin sono allertati** → malus alla fase F4.
- Voluto (Director): il tentativo è sempre conveniente come struttura —
  l'allerta è il costo che rende il fallimento significativo.

### F3 — ACCAMPAMENTO GOBLIN (scelta di approccio)

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
- **Altrimenti:** i goblin superstiti fanno un **agguato sulla strada** —
  pesante se lasciati fuggire, mite se inseguiti (spec v2):
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

## Layer narrativo — manoscritto (v2, R-099 2026-10-08)

Il vincolo «pochissimo testo» delle origini è **superato**: il Director ha
chiesto pathos, contesto, nomi d'azione per i check, flavour per scelta ed
esito, e narrazione durante il movimento tra le fasi. Questa sezione è il
**testo completo che il lab deve mostrare**, in ordine d'incontro — ogni
stringa annotata col campo dati che la porta.

### Campi authored consumati dal lab

| Campo | Su quale nodo | Cosa fa |
|---|---|---|
| `transit` | choice, combat, end | narrazione durante la transizione cinematografica verso il nodo (~2.6 s, `questLabPacing`) — *cosa vedi, cosa incontri* |
| `title` | tutti | per i check è il **nome d'azione**, entra nel titolo dell'astrolabio |
| `body` | tutti | riga di contesto (sotto il check overlay / corpo della card) |
| `options[].label` | choice | prosa authored — il gesto che il giocatore firma |
| `options[].detail` | choice | previsione meccanica (stat, costo, rischio) |
| `verdictFlavor` | check | una riga per banda `bigwin/win/almost/fail/epicfail` |
| `failHint` | check | testo pre-check che dichiara la posta |
| `upfrontDamage` | check | pedaggio deterministico narrato nell'esito |
| attack lines | combat | flavor per banda su ogni turno — canale separato (`GOBLIN_ATTACK_LINES` nel motore) |
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
   plurale se è del gruppo («Forzate il masso…»), sostantivo se il gesto
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
  F1-B: ferita lieve (masso)
  F4:   danni di scambio, escalation da T3
  F5:   pedaggio authored (10–20 HP) + intensità agguato
  F7:   unico nodo dove la morte è attesa come possibilità reale
regola: un testo che promette morte dove il modello non può uccidere
        è un bug narrativo.
```

---

## Manoscritto — testo per nodo, in ordine d'incontro

Questo è il testo **corrente** del lab (sincronizzato con
`questScenarioGoblin.ts` dopo il rework P0 di R-103, 2026-10-08).
`{nome}`/`{bodyguard}` = interpolazione dal party assegnato (nel motore).

### F0 — Assegnazione `gob-inizio` (choice)

> **body:** «Terza razzia in un mese. I carri dei mercanti non passano
> più dal guado: gli ultimi due sono tornati con le casse vuote e le
> stanghe rotte. Il consiglio non discute più: paga. Sterminateli.»
>
> **Opzione:** *Partire* — «Bonus Forza, Bonus Percezione e una cura
> nella sacca. Si marcia.»

Il guado è il seme della chiusura (decisione Director 2026-10-08: la
minaccia è sulla strada — dove avviene F7 — non sul mugnaio).

### F1 — Esplorazione `gob-esplora` (choice)

> **transit:** «La strada muore dove il bosco comincia. Il profumo di
> resina cede alla terra umida e a un fumo basso che non sa di cucina.
> Davanti marcia chi guida; dietro, gli altri contano i carichi e le
> uscite.»
>
> **body:** «Il bosco tace in un modo che ai boschi non viene naturale.
> Sul sentiero, un masso sbarra il passo — e da sotto spunta un lembo di
> straccio, schiacciato come da chi aveva fretta.»
>
> **Opzioni:**
> - *Arrampicarsi sull'albero* — «Percezione. Dall'alto il bosco si
>   lascia leggere.»
> - *Spostare il masso* — «Percezione + Forza. Lo straccio là sotto può
>   valere — o costare schiena.»

L'indizio visivo (straccio) precede la scelta: il masso è scoperto, non
inserito — come richiede il brief R-103.

#### Check «Ti arrampichi sull'albero» `gob-tracce-per` (PER)

> **transit:** «L'albero giusto sta tre passi fuori dal sentiero. La
> corteccia è il vostro appiglio, la cima il vostro occhio.»
>
> **body:** «Dal basso il bosco è un muro. Da sopra, qualcosa dice dove
> si apre.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Dall'alto: fumo basso a est, una fila di pali appuntiti, una sentinella su un ceppo. E un varco dove nessuno guarda.» |
| win | «Fumo basso a est e, su un ceppo, una sagoma che non dorme. Il campo è vicino.» |
| almost | «Qualcosa si muove tra i rami — una volta sola. Scendi con un sospetto, non con una via.» |
| fail | «L'albero si lascia arrampicare, il bosco no.» |
| epicfail | «Un ramo marcio: giù di schiena. Ora anche il bosco sa che ci siete.» |

La rivelazione è a scalini: bigwin mostra tutto (fumo, pali, sentinella,
varco), win la metà essenziale, almost un sospetto.

#### Check «Spostare il masso» `gob-tracce-perfor` (PER+STR)

> **transit:** «Spalle contro il masso: cede un centimetro per volta.»
>
> **body:** «Lo straccio sotto il masso non è caduto lì da solo.
> Qualcuno ha nascosto qualcosa, in fretta.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Il masso si sposta in silenzio — sotto, una nicchia di stracci che qualcuno ha chiuso in fretta.» |
| win | «Spalle contro il masso. Sotto: stracci, e qualcosa di avvolto.» |
| almost | «Si sposta, ma il bosco ha sentito qualcosa cadere.» |
| fail | «Il masso cade dalla parte sbagliata. Il sentiero resta chiuso.» |
| epicfail | «La roccia prende una caviglia. Si cammina zoppicando, e non era il piano.» |

### F2 — Bottino `gob-bottino-scelta` → `gob-bottino` (opzionale)

> **transit:** «Dietro il masso, una nicchia di stracci: qualcuno ha
> nascosto qualcosa in fretta e non è più tornato.»
>
> **body (scelta):** «Sotto il masso, un bottino avvolto in stracci.
> Prenderlo in silenzio costa mano ferma.»
>
> **Opzioni:**
> - *Prendere il bottino* — «Destrezza. Il rumore può svegliare il campo.»
> - *Lasciare stare* — «Nessun rumore, nessun rischio — nessun bottino.»

#### Check «Le mani sul bottino» `gob-bottino` (AGI)

> **body:** «Catene, campanelli, un nodo da sciogliere senza un suono.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Nemmeno i campanelli se ne accorgono. In tasca, senza un suono.» |
| win | «Un nodo alla volta. Il bottino è vostro.» |
| almost | «Qualcosa tintinna. Fiato trattenuto — niente si muove. Preso a metà.» |
| fail | «Un campanello tradisce la mano: il suono corre nella valle.» |
| epicfail | «Il filo resta in mano: i campanelli chiamano, e qualcosa risponde.» |

### F3 — Accampamento `gob-accampamento` (choice)

> **transit:** «Tra le fronde il fumo si fa spesso: l'accampamento è
> sotto. Da qui si colpisce in un modo solo — e va scelto bene.»
>
> **body:** «Fumi tra le tende. Da qui si colpisce in un modo solo —
> il vostro.»
>
> **Opzioni:**
> - *Passare il filo dei campanelli* — «Destrezza. Bonus maggiore — ma
>   se vi vedono, il campo è all'erta.»
> - *Assalto* — «Forza. Bonus moderato — il fallimento non costa nulla.»

#### Check «Il filo dei campanelli» `gob-stealth` (AGI)

> **body:** «Un filo teso a mezza gamba porta a campanelli appesi come
> trappole. Ogni passo è un suono possibile.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Passate come il fumo tra i paletti. Il campo dorme; la sorpresa è vostra.» |
| win | «Un passo, un respiro, un passo. Siete dentro.» |
| almost | «Uno starnuto strozzato. Due teste si alzano dal fuoco, poi tornano giù. Dentro — ma non invisibili.» |
| fail | «Un filo vibra sotto il palmo. Un campanello decide di vivere.» |
| epicfail | «Il filo resta in mano: i campanelli chiamano, e qualcosa risponde.» |

#### Check «La carica» `gob-assalto` (STR)

> **body:** «La palizzata è fatta di rifiuti e fango. Sfondarla prima
> che si organizzino — o subirla.»

| esito | verdictFlavor |
|---|---|
| bigwin | «Il primo palo cade prima che qualcuno capisca. Una tenda si accartoccia sul fuoco; due goblin rotolano via ciechi di fumo.» |
| win | «Sfondate dove la palizzata è più bassa. Una lancia si alza — troppo tardi.» |
| almost | «La palizzata tiene un respiro di troppo. Qualcuno urla; il campo ha il tempo di afferrare le armi.» |
| fail | «La carica si pianta nel fango. Vi aspettano già, lance puntate.» |
| epicfail | «Inciampate nella vostra stessa carica: in mezzo al campo, in disordine.» |

Le due vie si leggono diverse già nel testo: stealth = «quasi scoperti»,
assalto = «li abbiamo colti prima che si organizzassero».

### F4 — Combattimento `gob-combattimento` (combat)

> **transit:** «Il momento è scelto. Il bosco trattiene il fiato — poi il
> campo esplode.»
>
> **body:** «Li avete. O loro.»

**Attack lines per turno** (canale combat del motore):

| esito | riga |
|---|---|
| bigwin | «Il colpo li spacca a metà: due goblin crollano insieme.» |
| win | «Il colpo arriva. La linea cede di un passo.» |
| almost | «Il colpo morde, non uccide: arretrano e restano in piedi.» |
| fail | «Scudi serrati. Il colpo muore su legno e cuoio.» |
| epicfail | «La linea si richiude: per un istante lungo siete circondati.» |

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

### F5 — Incalzare `gob-incalzare` (choice, solo se superstiti)

> **transit:** «Polvere e sangue. I goblin che restano spezzano il fronte
> e corrono verso il bosco, portandosi dietro la vostra faccia.»
>
> **body:** «I superstiti corrono verso il bosco. Chiuderli qui — o
> lasciarli andare.»
>
> **Opzioni:**
> - *Lasciarli fuggire* — «Torneranno. Li rivedrete sulla strada di
>   casa.» (flag `agguatoPeggiore`)
> - *Incalzare* — «Forza. Chiudete la quest qui — o peggiorate il conto.»

#### Check «La caccia tra le rocce» `gob-incalza-check` (STR)

> **failHint (pre-check):** «La caccia costa sangue comunque. Se
> scappano, tornano feriti: l'agguato sarà più debole.»
>
> **upfrontDamage:** 10 HP (20 su epicfail) — narrato nell'esito.

| esito | verdictFlavor |
|---|---|
| bigwin | «Li chiudete dove il sentiero stringe. Nessuno tornerà a raccontare cosa è successo.» |
| win | «Li chiudete contro le rocce, uno alla volta. Il sentiero torna silenzioso.» |
| almost | «Correte fino al fiatone: qualcuno gli taglia la fuga, qualcuno no. Torneranno feriti — e avvisati.» |
| fail | «Le rocce vi tradiscono. Li vedete svanire, e sapete che li rivedrete.» |
| epicfail | «La caccia costa sangue e non chiude nulla. Tornano tutti — e torneranno organizzati.» |

Nota: `win`/`bigwin` = sterminio → F7 pulito; `almost`/`fail`/`epicfail`
= fuga → agguato mite.

### F6 — Razzia `gob-esplora-extra` (choice, push-your-luck)

> **transit:** «Il campo conquistato è un campo aperto: cenere, tende
> rovesciate, e il bottino che nessuno reclama più.»
>
> **body:** «Cenere e tende rovesciate. Sotto il telo della tenda più
> bassa, un angolo di cuoio con un fermaglio d'ottone.»
>
> **Opzioni:**
> - *Frugare ancora* — «Il telo cede piano. Ogni altro giro costa di più
>   — in oro e in pelle.»
> - *Fermarsi* — «Lasciate il cuoio dov'è: si torna a casa.»

La tentazione è un oggetto visibile e incompleto (la cassa semibruciata):
il danno crescente del check È la struttura che cede.

#### Check «Razzia tra le tende» `gob-cerca` (INT/PER)

| esito | verdictFlavor |
|---|---|
| bigwin | «Il fermaglio cede: dentro, il meglio di ciò che restava.» |
| win | «Un fondo di tenda, un pugno di stracci — qualcosa che valeva la pena.» |
| almost | «Poca roba, e la trave vi presenta il conto.» |
| fail | «Solo cenere, spine — e la trappola che chiude il giro.» |
| epicfail | «Il campo si fa pagare l'ultimo debito: cenere, spine e sangue.» |

**Righe per turno** (motore, `GOBLIN_F6_CREAK_LINES` — la struttura che
cede, una per `exploreTurn`):

1. «Il palo che regge il telo scricchiola.»
2. «Il telo brucia ancora, in basso. Il caldo arriva al viso.»
3+. «Una trave cede. Chi frugava arretra — e vede il cuoio più vicino.»

### F7 — Ritorno / Agguato

> **`gob-ritorno` (info):** «La strada scende verso casa. Qualcuno ha
> cominciato a fischiettare. Poi smette, senza che nessuno dica perché.»
>
> **`gob-agguato` (harm):** «Il fischiettio si interrompe a metà. Una
> freccia nel palo accanto a voi. Poi tutte le altre.»

Il sollievo PRIMA (valle esplicita), lo shock come interruzione —
struttura «no, non ora» richiesta dal brief R-103.

#### `gob-agguato-scelta` (choice) — trofeo o sangue

> **transit:** «Attorno, il bosco si stringe di nuovo. Resta una scelta
> sola: lasciare il trofeo, o lasciare qualcuno.»
>
> **Opzioni:**
> - *Lasciare il trofeo* — «Il trofeo rotola nel fosso. La strada si
>   libera — a mani vuote.»
> - *Affrontare* — «Un turno di combattimento. Chi resta a coprire paga.»

#### `gob-ultimo-scontro` (combat, 1 turno)

> **transit:** «L'ultima mischia non è una battaglia: è un conto da
> chiudere. Chi resta a coprire paga per tutti.»
>
> **body:** «Uno scontro secco come un osso che si spezza. Il profilo
> decide chi paga.»

#### Chiusura `gob-fine` (end)

> **transit:** «La strada si apre sul villaggio. Chi torna conta i nomi
> di chi non torna — e chi ha visto sa cosa è costato.»
>
> **body:** «La spedizione è finita.»

**Epilogo composto dal motore** (`composeEndingText` — la riga più letta
della run, per il principio peak-end):

- *reward:* «Con il trofeo sulla bilancia: da domani, i carri ripassano
  dal guado.»
- *survived (trofeo perso):* «A mani vuote: il trofeo è rimasto sulla
  strada. Il guado resta deserto.»
- *survived (senza sterminio):* «Tornate senza completare lo sterminio.
  Il guado resta deserto.»
- Registro: «{morti} non sono tornati.» + «Tornate in {vivi}.»
- Bilancio: loot portato a casa + «Esperienza: +{xp} XP.»

Il guado chiude ciò che F0 ha aperto (callback, decisione Director).

---

## Delta rimasti (dopo il rework P0 di R-103)

Applicati 2026-10-08 (P0, solo testo — zero RNG, zero calibrazione):
campanelli, albero/masso con indizio visibile, assalto fisico, attack
lines, righe di danno per gravità, fix F5-win (contraddiceva lo
sterminio), cassa semibruciata + righe-per-turno in F6, sollievo→shock
in F7, epilogo con registro e callback al guado, transit hold ∝ parole
(`questLabPacing`).

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
- ~~Testi per esito~~ → **sostituiti dal manoscritto v3** (R-099 + rework
  P0 di R-103, sincronizzato col lab 2026-10-08): transit, action names,
  verdictFlavor a 5 bande, attack lines, righe di danno per gravità,
  epilogo composto. Restano i delta di schema (`options[].consequence`,
  interpolazione `{slot}` nei transit).
- Budget di rischio: proposta con cifre placeholder, da calibrare via MC.
