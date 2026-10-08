---
title: Quest Imprints — scheletri narrativi e istanziazioni (probe S5)
type: design-probe
status: DRAFT — artefatti del lab-probe; nessuna ratifica; non implementato
created: 2026-10-07
related: NARRATIVE.md §5 (M-07, M-13); R-098; run .mw/runs/20261008-story-archetype-imprints/
---

# QUEST_IMPRINTS — scheletri autoriali e istanziazioni

Materiale del lab-probe «generazione che dà risultati interessanti». Ogni
imprint = scheletro causale + **function spec per beat** (il contratto di
lavoro del testo, non il testo). Le istanziazioni mostrano lo stesso
scheletro rivestito da tag e cast diversi: sono il smoke test di varietà
percepita (M-09).

---

## IMPR-001 — «Il contratto col cuore»

*Estratto da «La strige» (Witcher). Mostro che è vittima; il contratto dichiara
un obiettivo, la soluzione migliore è un'altra; qualcuno guadagna dallo status
quo.*

### Scheletro causale

```
B0 PREMISE      comunità C soffre la minaccia X a cicli; contratto: elimina X
B1 REVELATION   X è la persona P trasformata — l'orrore ha origine dentro C
B2 STAKEHOLDER  qualcuno in C guadagna dal mostro o dal segreto sepolto:
                tentativo di corruzione/sabotaggio del party
B3 HIDDEN PATH  esiste una risoluzione alternativa (salvare P), più rischiosa
B4 ORDEAL       la via dura = sopravvivere al pericolo di X proteggendola
B5 LAST TEETH   anche a successo, P resta pericolosa nella transizione
B6 FORK         conseguenze divergenti: uccidi / salva / abbandona
```

### Function specs per beat

```yaml
B0-PREMISE:
  function: |
    Presentare un contratto leggittimo e pagabile. Il problema deve essere
    reale (perdite tangibili), la reward credibile, e la formulazione deve
    contenere un'unica incongruenza lievissima — un dettaglio stonato che il
    giocatore può ignorare ma che B1 ripagherà.
  must: posta in gioco concreta (vite/beni/routine di C); reward dichiarata
  must_not: accennare a P, alla vera natura di X, o allo stakeholder
  effetto: il giocatore accetta pensando "caccia al mostro standard"

B1-REVELATION:
  function: |
    Produrre indizi fisici che INVERTONo un'assunzione formata in B0.
    Assunzione tipica da invertire: "la minaccia arriva da fuori verso il
    luogo". L'indizio deve lasciare al giocatore la riformulazione.
  must: dettaglio sensoriale verificabile in scena
  must_not: nominare la vera natura; affermare — solo suggerire
  effetto: il giocatore dice "la cosa esce da qui" prima che il testo confermi

B2-STAKEHOLDER:
  function: |
    Far apparire la generosità dello stakeholder PRIMA della scoperta
    completa. Un'offerta che supera la reward del contratto, o un consiglio
    "prudente" a non scavare — il giocatore deve poter notare che conviene
    troppo a qualcun altro.
  must: l'offerta è razionale se la leggi come interesse privato
  must_not: rivelare il movente; rendere lo stakeholder inequivocabilmente
    ostile (deve restare "solo sospetto")
  effetto: sospetto attivo, non certezza

B3-HIDDEN-PATH:
  function: |
    Consegnare la via alternativa come SCOPERTA, non come opzione di menu.
    La condizione di salvataggio deve essere (a) più costosa della via
    standard e (b) giustificata narrativamente — il giocatore deve capire
    perché funziona, non solo che esiste.
  must: il costo extra è leggibile prima di impegnarsi
  must_not: presentarsi come opzione equiprobabile; richiedere oggetti
    che il giocatore non può avere (condizione inclusiva, P59)
  effetto: "rischioso ma giusto" — la via dura è una scelta di valori

B4-ORDEAL:
  function: |
    Convertire la protezione in tensione meccanica: il party deve reggere
    contro X senza eliminare X. Push-your-luck con uscita sempre disponibile
    a costo ridotto — la tentazione di mollare è parte del design.
  must: doppio vincolo (P viva AND party vivo); pressione crescente nel tempo
  must_not: punire l'uscita come fallimento morale — uscire è legittimo
  effetto: la via dura paga in sangue (R-094: varia la valuta del costo)

B5-LAST-TEETH:
  function: |
    Dopo il momento di sollievo, un ultimo pericolo concentrato. La vittoria
    apparente non è la fine — ma il morso finale deve essere più corto e più
    stretto dell'ordalia, non una seconda ordalia.
  must: arriva DOPO un segnale di risoluzione; singolo burst
  must_not: rovinare il salvataggio (P sopravvive al suo stesso morso)
  effetto: chiusura con residuo di adrenalina, non anticlimax

B6-FORK:
  function: |
    Scrivere conseguenze divergenti per TUTTI gli esiti (R-092). Nessuna
    risoluzione deve essere "quella giusta": ogni esito paga in una valuta
    diversa e lascia un'entità diversa nel registro.
  must: almeno un esito scrive un'entità persistente (NPC, nemico, regione);
    l'abbandono è un esito con conseguenze, non un non-evento
  must_not: segnalare quale fork era "canon"; punire il giocatore per
    aver scelto la via sicura
  effetto: il giocatore può raccontare "io ho scelto X e quindi Y"
```

### Invariante del pattern

Qualunque sia il flavor: **il contratto mente** (dichiara kill, la via buona
è altrove), **qualcuno guadagna dal mostro**, **salvare costa di più**,
**l'esito scrive nel mondo**.

---

## Istanza A — tag `palude` + `gilda`: «Il mostro del Molino»

Cast: Maesa (figlia del mugnaio, morta-data-per-morta), Aldo il mugnaio,
Vedovo Sarthe (mercante, destinatario della lettera col corvo — seme S1),
le Gorze. Render completo in conversazione 2026-10-07: indagine sociale,
artigli sul davanzale interno, lettera col sigillo del corvo, ordalia della
notte al mulino, ultimo morso all'alba, Sarthe smascherato→antagonista
ricorrente / mulino comprato se uccisa / notti di luna che mietono se
abbandonata.

## Istanza B — tag `mare` + `recuperi`: «La moglie del mare» (v2)

v1 bocciata dal Director 2026-10-07: impronte sulla battigia incoerenti con
vittime in mare; «padrone del porto» anacronistico; faro e ondata interna
stretchati. v2 riscritta coerente col dominio.

- **B0:** i pescatori da riva e i raccoglitori notturni spariscono; i corpi
  tornano a riva annegati. Contratto: la cosa nell'acqua. *Incongruenza:*
  non tocca mai le barche della corporazione dei recuperi.
- **B1:** sui corpi riportati a riva non ci sono segni di denti né artigli —
  ci sono **lividi di dita, come di mani umane** che trattengono sott'acqua.
  E i rari testimoni giurano di averla vista nuotare *verso* il porto
  all'alba: torna a terra, non viene dal profondo.
- **B2:** il maestro dei recuperi (corporazione dei diritti sui relitti)
  offre il doppio perché il tratto sia dichiarato «maledetto» e presidiato —
  un tratto maledetto è suo esclusivo. È lui che ha la pelle di foca,
  trovata in un relitto e mai registrata.
- **B3:** la pelle nella stiva del suo magazzino, tra il recuperato. La via
  dura: restituirgliela reggendo il suo richiamo.
- **B4:** la notte sulla battigia: il party forma letteralmente la linea
  tra lei e l'acqua fino all'alba — chi cede passo rischia di finire in
  mare con lei. Uscire si può sempre (contratto dimezzato).
- **B5:** quando la pelle la tocca diventa mare per un istante — chi è
  troppo vicino rischia di essere trascinato giù nell'ultima risacca.
- **B6:** *salvata* → torna al mare come entità viva altrove; il racket dei
  recuperi è esposto → il maestro fugge (pool antagonisti); *uccisa* →
  reward piena ma il mare smette di dare pesce e i relitti continuano a
  pagare lui; *abbandonata* → le notti senza luna continuano a prendere
  qualcuno.

## Istanza C — tag `miniera` + `compagnia`: «La vena che morde»

Sostituisce la v1 (`santuario`+`reliquia`) bocciata perché troppo vicina al
flavor originale («innocente trasformato in luogo sacro»). Dominio diverso:
industriale, compagnia mineraria, nessun sacro.

- **B0:** i minatori della galleria bassa tornano sfigurati o non tornano;
  la compagnia ha sigillato il livello. Contratto: la cosa nella vena.
  *Incongruenza:* la compagnia paga il presidio del sigillo più di quanto
  perderebbe a riaprire.
- **B1:** i morti non hanno ferite da bestia — hanno ustioni e segni di
  unghie *umane*; e le ruberie di viveri avvengono **sopra** il sigillo,
  nel dormitorio. La cosa non risale dalla galleria: vive nel campo.
- **B2:** il fattore della compagnia paga profumatamente perché il livello
  resti chiuso «per sempre»: sotto sta estraendo in proprio qualcosa che
  non deve vedere nessuno — e il mostro è il suo alibi perfetto.
- **B3:** P è il figlio del caposquadra, entrato nella vena mesi fa e
  «tornato diverso»; il fattore lo tiene nutrito e nascosto perché un
  mostro vivo vale più di una miniera aperta. La via dura: riportarlo alla
  luce tenendolo fino al tocco della campana del mattino.
- **B4:** la notte nella galleria di scarico: tenerlo dentro E tenerlo
  intero mentre l'istinto lo riporta giù — doppio contenimento.
- **B5:** alla campana torna sé stesso — e nel riprendersi dilania chi ha
  più vicino: ultimo pericolo concentrato.
- **B6:** *salvato* → il ragazzo torna, il traffico del fattore si apre al
  villaggio (esposto → nemico fuggiasco); *ucciso* → reward piena, la vena
  resta chiusa, il fattore continua; *abbandonata* → la galleria continua a
  «dare» morti e lui continua a incassare.

---

## Nota metodologica (appresa nel render + critica Director)

1. Lo scheletro nudo risulta scarno: **il pacing delle rivelazioni vive
   nelle function spec e nel flavor, non nella struttura**.
2. «Salvare P» si generalizza: non sempre «P torna nel villaggio» — nella
   Istanza B torna al mare come entità viva altrove. B6 parla di *scrittura
   nel mondo*, non di esito fisso.
3. **Le function spec non bastano da sole**: validano la *funzione
   narrativa*, non la *coerenza diegetica* (impronte sulla battigia per
   vittime in mare, ondata dentro un faro, «padrone del porto»
   anacronistico). Serve un secondo layer di validazione sul dominio.
4. **Insight Director (verbatim): «ci vuole un set di mostri da collegare
   ai tag»** → il tag non è un aggettivo, è un **domain kit**: creature
   ammissibili, ruoli sociali esistenti nel dominio (capitaneria, corporazione
   dei recuperi, fattore di compagnia), luoghi, oggetti, regole di coerenza.
   L'imprint riempie ruoli astratti; il kit fornisce il vocabolario legale.
5. **La distanza tra tag va misurata su fisica e struttura sociale del
   dominio, non sui nomi**: `santuario` era «troppo simile» perché
   «innocente trasformato in luogo sacro» è la stessa famiglia causale del
   flavor d'origine.

---

## Domain kit — schema

Il kit risponde ai bisogni dei beat, non è un lore dump (P49: entra solo ciò
che un beat consuma). Sezioni:

```yaml
domain_kit:
  tag: <nome>
  vocabolario:
    creature_ammissibili: []   # il «set di mostri» del Director
    ruoli:
      autorita_contratto: []   # chi può emettere un contratto qui
      stakeholder_economico: []# chi può guadagnare dal disastro (riempie B2)
      testimone_comune: []     # gente normale che vede cose (riempie B1)
    luoghi: []                 # luoghi nativi, inclusi «luoghi di veglia» (B4)
    props: []                  # oggetti veri del dominio (indizi, armi, offerte)
  fisica:
    cicli: []                  # cosa scandisce il tempo: luna, fiume in piena,
                             # campana del turno, giorno di mercato
    pericoli_ambientali: []    # la pressione dell'ordalia (B4)
    tracce_ammissibili: []     # quali indizi fisici questo mondo produce (B1)
  coerenza:
    - regola → violazione tipica che blocca
```

Mapping ai beat: B0 consuma `autorita_contratto`+`cicli`; B1 consuma
`tracce_ammissibili`+`fisica`; B2 consuma `stakeholder_economico`+`props`;
B4 consuma `luoghi di veglia`+`pericoli_ambientali`; B6 consuma
`ruoli`/`creature` per le entità da scrivere nel mondo.

## Domain kit compilato — `palude`

```yaml
tag: palude
vocabolario:
  creature_ammissibili:
    - fuoco fatuo / luce-guida
    - annegato rianimato
    - bestia da fango (lupo di palude, anguilla madre)
    - persona trasformata (maledizione, pelle rubata)
    # VIETATO: creature di mare profondo, desertiche, montane, celestiali
  ruoli:
    autorita_contratto: [capo delle chiuse, concistoro dei torbei, curato
      itinerante]
    stakeholder_economico: [guardiano delle chiuse (= controlla il livello
      dell'acqua = controlla chi ha terra asciutta), sensale della torba,
      mugnaio (monopolio della macina), compagnia dei dissodamenti]
    testimone_comune: [pescatore di anguille, raccoglitrice di erbe,
      traghettatore, guardiano notturno del pontile]
  luoghi: [mulino su canale, pontile, torbaia, cappella del poggio asciutto,
    passarelle, chiuse, camminamento dei giochi d'acqua]
  props: [reti da anguille, falce, ceste di torba, lanterna da nebbia,
    registro dei livelli dell'acqua, barca da canale]
fisica:
  cicli: [nebbia dell'alba, apertura stagionale delle chiuse, corsa delle
    anguille, luna (cielo, non maree — non ce ne sono)]
  pericoli_ambientali: [acqua bassa e stagnante, fango che affonda, nebbia
    che toglie suono e vista, passerelle che cedono]
  tracce_ammissibili: [orme nel fango che PARTONO da un luogo, reti aperte
    dall'interno, lanterna ritrovata spenta in un piede d'acqua, barca
    legata e vuota, impronte che affondano meno del peso atteso]
coerenza:
  - niente onde/maree/profondità → viola «acqua bassa e stagnante»
  - i corpi spariscono nel limo, non riemergono → viola «corpo riportato a
    riva» (a meno che non sia trovato da chi lo cercava)
  - di notte la nebbia isola: niente testimoni oculari a distanza
  - ogni spostamento è barca o passerella: niente «inseguimento a cavallo»
  - chi possiede le chiuse possiede la terra: il potere qui è *livello
    dell'acqua*, non denaro diretto
```

### Controllo retroattivo — il kit avrebbe preso gli errori?

| Errore (istanza B v1) | Cosa lo avrebbe bloccato |
|---|---|
| impronte sulla battigia per vittime in mare | `tracce_ammissibili` + regola «l'indizio deve venire dal dominio della vittima» (kit `mare`: corpi, reti, testimoni) |
| «padrone del porto» | `ruoli.stakeholder_economico` del kit `mare`: maestro dei recuperi / capitaneria — il ruolo astratto si riempie solo da lì |
| ondata dentro il faro | `fisica` del kit `mare`: l'ordalia è tra lei e l'acqua; il faro non è «luogo di veglia» dichiarato |
| istanza C «santuario» troppo simile | non è un errore di kit ma di **distanza tag** — serve la metrica ontologica (punto 5 sopra), non il kit |

Il kit `palude` compone col kit `gilda` per l'istanza A (Sarthe viene dal
kit `gilda`, le Gorze dal kit `palude`): dominante + adiacente = kit che si
sommano, esattamente come le adiacenze di tag già proposte.

## Domain kit compilato — `mare`

```yaml
tag: mare
vocabolario:
  creature_ammissibili:
    - persona-di-mare (selkie, figlia della tempesta)
    - annegato rianimato / equipaggio che torna
    - bestia di profondità (serpe, madre delle secche)
    - strega del mare (entità che chiama)
    # VIETATO: creature di fango/acque basse, desertiche, celestiali
  ruoli:
    autorita_contratto: [capitaneria del porto, consiglio dei padroni di
      barca, parroco marinaro]
    stakeholder_economico: [maestro dei recuperi (diritti sui relitti),
      armatore-assicuratore, sensale del pescato, contrabbandiere delle
      secche]
    testimone_comune: [pescatore da riva, guardiano del faro, vedova dei
      naufragati, oste del porto]
  luoghi: [molo, cantiere di riparazione, magazzino dei recuperi, secca che
    affiora a bassa marea, locanda del porto, faro, battigia]
  props: [reti strappate, relitto in vendita, registro dei recuperi, pece e
    sigilli, lampada a olio, lenze, campana del porto]
fisica:
  cicli: [maree, luna nuova (= buio vero), stagione delle tempeste, rientro
    delle flotte]
  pericoli_ambientali: [risacca che trascina fuori, buio completo sull'acqua,
    scogli affioranti, freddo che uccide prima del mostro]
  tracce_ammissibili: [corpi che la marea restituisce (con segni addosso),
    barca trovata intatta senza equipaggio, reti tagliate dal basso,
    oggetti del naufragio già rivenduti, testimone sopravvissuto che ha
    visto la cosa nuotare VERSO terra]
coerenza:
  - le vittime in mare lasciano prove nel mare: corpi, reti, relitti,
    testimoni — mai impronte su terreno asciutto
  - il potere qui è sui diritti (recuperi, dazi, approdo), non sul denaro
    diretto
  - di notte sull'acqua non ci sono testimoni oculari a distanza
  - la direzione dell'inversione nativa: «viene dal profondo» vs «torna a
    riva»
```

## Domain kit compilato — `miniera`

```yaml
tag: miniera
vocabolario:
  creature_ammissibili:
    - persona trasformata dal contatto con la vena
    - scavatore impazzito nel buio
    - la vena stessa (entità-ambiente che «respira»)
    - bestia di galleria (cieca, del sottosuolo)
    # VIETATO: creature aeree, marine, celestiali, di superficie aperta
  ruoli:
    autorita_contratto: [fattore della compagnia, caposquadra anziano,
      sindaco del campo]
    stakeholder_economico: [fattore (estrazione parallela nascosta),
      proprietario del campo, venditore di viveri a prezzi di monopolio]
    testimone_comune: [minatore di turno, ragazzo delle gabbie, medico del
      campo, vedova del campo]
  luoghi: [galleria bassa sigillata, bocca del pozzo, dormitorio, magazzino
    viveri, galleria di scarico, ufficio del fattore, catasta del puntellame]
  props: [registro dei turni, sigilli e legname d'assegnazione, contatore
    viveri, campana del turno, lampade a olio, canarino in gabbia]
fisica:
  cicli: [campana del turno, paga quindicinale, spedizione del carico,
    chiusura stagionale]
  pericoli_ambientali: [buio totale, aria cattiva, puntellamento che cede,
    dislivelli, galleria che si restringe]
  tracce_ammissibili: [ferite «umane» sui corpi risaliti, ruberie di viveri
    nel dormitorio (la cosa mangia SOPRA), turni firmati da chi era morto,
    attrezzi morsicati, voci nel buio che chiamano per nome]
coerenza:
  - il buio non ammette testimoni oculari: le prove sono fisiche o sonore
  - la cosa non può «venire da fuori»: o è sotto, o era già nel campo
  - il potere è la licenza di estrazione e le scorte, non il denaro diretto
  - chi controlla il registro dei turni controlla chi era dove
```

---

## IMPR-002 — «Il compagno che ride»

*Estratto da «L'Isola del Tesoro». L'antagonista non è la minaccia esterna:
è dentro la logistica della spedizione stessa — chi ti ha aiutato a partire
è chi ti porta a morire. Spina causale diversa da IMPR-001 (non c'è
vittima-da-salvare; c'è un alleato-da-smascherare).*

### Scheletro causale

```
B0 PREMISE      obiettivo X con mappa/chiave; serve organizzare una
                spedizione → serve aiuto che il party non ha
B1 THE HELP     alleato A offre esattamente ciò che manca (competenze,
                uomini, mezzi); competente, generoso, simpatico
B2 CRACKS       piccole incongruenze: gli uomini di A sono fedeli ad A, non
                alla missione; A sa cose che non dovrebbe; qualcuno tenta
                di avvisare troppo tardi
B3 THE TURN     a metà quest: la prova che A non era mai dei tuoi — non ha
                tradito il piano, il piano era suo
B4 INSIDE OUT   il party è dentro la disposizione del nemico: combattere,
                fuggire, o recitare la parte; le risorse (mappa, mezzi,
                numeri) sono in parte nelle sue mani
B5 IRONY        la posta risulta già spostata — qualcuno ha svuotato la
                posta in gioco prima; il conflitto si combatte su un
                fantasma
B6 FORK         esiti divergenti su TUTTI i fronti: destino di A (catturato
                / fuggito / caduto), stato della posta, cosa sa il villaggio
```

### Function specs per beat

```yaml
B0-PREMISE:
  function: |
    L'obiettivo deve essere impossibile con le sole forze del party:
    manca qualcosa di concreto (mezzi, uomini, accesso). Il bisogno è
    la porta d'ingresso di B1 — senza bisogno, l'alleato è decorativo.
  must: la carenza è nominata esplicitamente ("non abbiamo barca/uomini/")
  must_not: suggerire che l'aiuto arriverà da qualcuno di specifico
  effetto: il giocatore CERCA aiuto — l'antagonista gli viene incontro

B1-THE-HELP:
  function: |
    L'alleato deve essere LA risposta migliore disponibile, non una
    trappola ovvia. La sua utilità deve essere reale e dimostrata —
    la simpatia è gratuita, la competenza no.
  must: A risolve davvero un problema (dimostra, non promette)
  must_not: nessun segnale di minaccia; nessun costo occulto visibile
  effetto: il giocatore è contento di averlo — il tradimento sarà una
    perdita, non un "lo sapevo"

B2-CRACKS:
  function: |
    Indizi sociali, non fisici: la lealtà degli uomini di A corre verso A.
    Ogni indizio deve avere una spiegazione innocente plausibile — il
    giocatore può archiviarli tutti, e molti lo faranno.
  must: ogni crepa ha una lettura innocente; nessuna prova singola
    è decisiva; un avvisatore arriva troppo tardi o poco credibile
  must_not: mai una prova che FORZA la diffidenza prima di B3
  effetto: retroactive dread — a B3 il giocatore ripesca tutte le crepe

B3-THE-TURN:
  function: |
    La rivelazione deve essere strutturale, non morale: A non ha tradito
    il piano — il piano era suo, la spedizione era il suo veicolo.
    Il giocatore scopre di essere sempre stato il mezzo, non il capo.
  must: scoperta fattuale (intercettazione, prova, confessione sentita);
    avviene quando uscire è già costoso
  must_not: reveal via monologo del villain; avvenire in fase iniziale
  effetto: il giocatore rivaluta retroattivamente ogni gentilezza di A

B4-INSIDE-OUT:
  function: |
    Il party è dentro l'infrastruttura di A: scegliere tra forza (persa),
    fuga (parziale) o la recita (chi gioca da chi?). Le opzioni devono
    essere tutte giocabili e tutte costose.
  must: almeno due vie reali; le risorse di A sono le risorse del party
  must_not: rendere la forza bruta la via "giusta"
  effetto: la quest cambia natura a metà — da obiettivo a sopravvivenza
    sociale

B5-IRONY:
  function: |
    La posta era già stata mossa prima che il conflitto maturasse.
    Il senso: sia il party che A combattevano su un fantasma — la
    ricompensa dipende da chi ha mosso la posta E QUANDO, non da chi
    vince lo scontro.
  must: chi ha mosso la posta è un'entità esistente, non un deus ex;
    il momento dello spostamento è retrodatato a prima del turn
  must_not: annullare il valore delle scelte di B4 — cambiano il prezzo
    pagato, non l'esito della posta
  effetto: la vittoria non è chi ha vinto lo scontro

B6-FORK:
  function: |
    Come IMPR-001: ogni esito scrive nel mondo. La differenza: qui la
    conseguenza principale è sulle RELAZIONI — A rientra come nemico
    ricorrente, socio imbarazzante, o ricordo amaro. Chi ha mosso la
    posta (B5) diventa un'entità da scoprire nella prossima quest.
  must: A sopravvive almeno in un ramo (entità ricorrente più fertile
    di A morto); il villaggio apprende una versione parziale
  must_not: chiudere tutti i fili — questo imprint deve lasciare entità
    calde per il casting pool
```

### Invariante del pattern

Qualunque sia il flavor: **l'aiuto è la trappola**, **la prova arriva dopo
il punto in cui uscire era economico**, **la posta si muove indipendente
dal conflitto**, **l'antagonista deve poter sopravvivere**.

### Differenza strutturale da IMPR-001 (per la varietà percepita)

IMPR-001: la minaccia è esterna e contiene una vittima. IMPR-002: la
minaccia è interna e contiene un benefattore. I due scheletri non si
«sentono» uguali nemmeno nudi — buon segno: la distanza ontologica non è
solo tra tag, è tra imprint.

### Istanza IMPR-002-A — tag `palude`: «Il traghetto della cassa»

- **B0:** una cassa di matrimonio/documenti è affondata nei canali interni;
  recuperarla serve a chiudere un affare del villaggio. Manca: barche e
  conoscenza delle acque *(il bisogno = il mezzo mancante)*.
- **B1:** il **guardiano delle chiuse** offre i suoi barcaioli e la via
  d'acqua — competente, conosce ogni canale, «per il bene del villaggio».
- **B2:** i suoi uomini prendono ordini dai suoi gesti, non dalla missione;
  sa dove sono i fondali bassi troppo bene; la raccoglitrice avvisa tardi:
  «i suoi lumi non segnano la via, segnano la preda».
- **B3:** alla meta i suoi uomini sono già piazzati — la spedizione era il
  suo recupero privato; il party era copertura per un tratto che non poteva
  fare da solo *(chi controlla l'acqua controlla tutto — regola del kit)*.
- **B4:** sulle sue barche, nei suoi canali: forza (fuori numero, sull'acqua),
  fuga (torbaia — cedono le passerelle), recita (spartire il recupero).
- **B5:** la cassa era già stata svuotata — anni prima, da chi l'aveva
  affondata. Chi ha mosso la posta = entità calda per la prossima quest.
- **B6:** *A catturato* → il villaggio scopre chi controllava l'acqua;
  *A fuggito* → antagonista ricorrente che conosce i canali meglio di
  chiunque; *posta persa* → il depositario sconosciuto resta da scoprire.

### Istanza IMPR-002-B — tag `mare`: «La secca che affiora»

- **B0:** un relitto affiora a bassa marea su una secca lontana; il carico
  (registro di bordo/merce) serve al villaggio. Manca: una barca e
  uomini di mare.
- **B1:** l'**armatore-assicuratore** offre la sua caracca e l'equipaggio —
  «la zona la conosco, vi porto io».
- **B2:** l'equipaggio guarda lui prima di ogni ordine; conosce la posizione
  della secca «per sentito dire»; la vedova dei naufragati tenta di avvisare
  — arriva dopo la partenza *(tracce sociali, mai prove fisiche — regola del
  kit: di notte in mare niente testimoni)*.
- **B3:** alla secca la sua gente ha già il piano di recupero pronto — la
  spedizione era la sua copertura legale per razziare un relitto su cui non
  aveva diritti.
- **B4:** a mare sulla sua barca: forza persa, fuga = scialuppa/rumiglia in
  piena corrente, recita = fingersi soci.
- **B5:** la stiva del relitto era già stata alleggerita — dal **maestro dei
  recuperi** in una spedizione registrata a metà (cross-cast: due ruoli del
  kit, due persone diverse). Il party e l'armatore si contendono un fantasma.
- **B6:** *A fuggito* → pirata/ricorrente che conosce le secche; *posta
  parziale* → il maestro dei recuperi entra come entità-ombra del dominio
  mare; *se lo sgamano* → due stakeholder dello stesso kit si accusano a
  vicenda.

### Istanza IMPR-002-C — tag `miniera`: «La squadra del caposquadra»

- **B0:** un carico è bloccato nella galleria bassa dopo il crollo —
  recuperarlo paga il trimestre del villaggio. Manca: una squadra che conosce
  la roccia.
- **B1:** il **caposquadra anziano** offre i suoi minatori — «loro sanno dove
  camminare, io so dove».
- **B2:** i minatori prendono gli ordini da lui; il suo registro dei turni
  conosce la vena meglio delle mappe ufficiali; il ragazzo delle gabbie
  avvisa a metà discesa *(prop del kit: il registro dei turni decide chi era
  dove)*.
- **B3:** nella galleria — la sua squadra stava già estraendo un filone
  laterale non dichiarato; la spedizione era la copertura per l'ultimo
  carico prima che la compagnia notasse.
- **B4:** sottoterra, nelle sue gallerie: forza (loro conoscono il buio), fuga
  (risalita lunga, campana del turno contro), recita (diventare soci del
  filone).
- **B5:** il filone era già stato «morso» — svuotato prima ancora che la
  squadra arrivasse, da qualcosa che viveva giù *(ponte naturale con
  l'entità dell'istanza C di IMPR-001: il minatore trasformato — i domini
  ricordano)*.
- **B6:** *A catturato* → la compagnia scopre l'estrazione parallela;
  *A fuggito* → sa la roccia meglio di chiunque, antagonista tecnico;
  *posta già presa* → la cosa sotto resta in sospeso come pressione del
  dominio.

### Cosa insegna il secondo render

- **Chi è A dipende dal dominio:** in `palude` chi controlla l'acqua, in
  `mare` chi controlla il trasporto, in `miniera` chi controlla il registro
  dei turni. Regola emersa: *A = chi controlla il mezzo mancante di B0* — la
  coerenza non è decorazione, decide il casting.
- **B5 crea ponti tra istanze:** il «chi ha mosso la posta» può essere
  un'entità già viva in un'altra quest dello stesso dominio (istanza C di
  IMPR-001 appare in IMPR-002-C) — la memoria si intreccia senza costruirla.
- **Le function spec hanno tenuto** su tre domini diversi; gli errori della
  volta scorsa non si ripetono perché ogni dettaglio viene dal kit.
