---
title: Quest Goblin — brief emotivo, playtest critico e proposta di rework (narrativa, suspense, emozione)
type: design-proposal
status: proposta — nulla qui è applicato al lab; ogni modifica richiede approvazione del Director
created: 2026-10-08
related: src/docs/docs/idle_village/quest_sterminio_goblin_spec.md (documento unico della quest);
  RICHIESTE.md R-103; scripts/quest-goblin-playthrough.ts (player testuale + metriche baseline)
---

# «Sterminio dei goblin» — rework narrativo, suspense, emozione

Brief ricevuto: migliorare la quest **dentro** la struttura attuale (F0–F7, slot-targeting,
F5 v2, bande a 5 esiti), puntando a *più informazione narrativa ed emotiva per parola*, non
a più testo. Questo documento ha quattro parti: **A** cosa vogliamo che la quest faccia
(con ricerca), **B** la quest giocata davvero, **C** critica spietata (della quest *e* del
brief), **D** la proposta.

Convenzione: «[osservato]» = visto nelle run giocate col motore reale; «[ipotesi]» =
mia inferenza non verificata.

---

# A. Cosa vogliamo che la quest faccia

## A1. Obiettivo di esperienza

Una run da ~10 decisioni che lasci **una storia raccontabile**, non un esito. Il test finale
(del brief, e lo faccio mio): dopo dieci run il giocatore ricorda *«abbiamo quasi perso il
terzo, ma li abbiamo spezzati; li ho inseguiti con la guardia a pezzi; e sulla strada di
casa erano loro»* — non *«ho passato F4, F5, F7»*.

Quattro proprietà misurabili, in ordine di priorità:

1. **Leggibilità del rischio** — il giocatore capisce *chi* sta pagando e *quanto è vicino* al
   punto di rottura, prima di scegliere.
2. **Contrasto** — picchi e valli alternati; mai «un po' più pericoloso a ogni fase».
3. **Specificità** — ogni esito meccanico produce una *scena* che si può visualizzare e
   attribuire a una persona.
4. **Memoria** — i primi eventi tornano (un goblin, una sentinella, un nome) e la fine
   chiude ciò che l'inizio ha aperto.

## A2. Ricerca: cosa dice il campo (fonti consultate 2026-10-08)

| Principio | Fonte | Implicazione per la goblin |
|---|---|---|
| **Il contrasto fa il picco.** Una curva perfettamente ascendente è «indesiderabile perché manca di contrasto»; il picco esiste solo contro una valle. Il passaggio alto→basso può essere veloce (risolvi lo scontro), basso→alto richiede una rampa. | *Harnessed Pacing & Intensity* (Game Developer); *Swell and Lull* (Campaign Mastery) | Serve almeno **una valle vera** tra F4 e F7; oggi non c'è (vedi B). |
| **Intensità = funzione del giocatore, non del nodo.** Il Director di *Left 4 Dead* misura l'intensità vissuta (danno subito, nemici vicini) e inserisce *periodi di rilassamento* dopo i picchi. | *Using Intensity to Drive Player Engagement* (Game Developer) | La quest ha già lo stato (HP per slot): **il testo deve leggerlo**, non solo il motore. Un «relax» è un beat di una riga, non una meccanica. |
| **Mai ripetere un setup; gli esiti vanno variati per archetipo.** Setup a intensità variabile, con rumore, non monotona. | *When I'm designing a level…* (On Game Design) | 4–5 turni di F4 con la stessa frase = setup ripetuto. |
| **Near-miss: motiva a continuare ed è fisiologicamente eccitante, ma è percepito come frustrazione/quasi-vittoria — conta la *fenomenologia* dell'evento, non gli effetti sonori.** I *losses disguised as wins* fanno sovrastimare quanto si sta vincendo. | Near-miss systematic review (PMC 5663799); Clark et al. | `almost` è la banda più preziosa: va scritta come **«quasi»**, non come mezza vittoria. E attenzione: le righe «vinci ma paghi» sono LDW — vanno dette onestamente. |
| **Loss-chasing / win-chasing**: dopo una vittoria si tende a rilanciare; dopo una perdita si accelera. | Winning and losing in online gambling (PLOS ONE) | F6 (push-your-luck) è esattamente il punto dove la vittoria di F5 invita a rilanciare: è lì che la tentazione va *vista*. |
| **Morale leggibile e contagioso**: gli stati sono descritti (saldo → vacillante → in fuga), reagiscono ad eventi intuitivi (compagno che cade, nemico ucciso), e il *giocatore deve poter leggere lo stato in tempo*. La rotta è tattica, non un contatore di HP. | Battle Brothers dev blogs #4, #20 | Il morale dei goblin può essere un **readout narrativo** di variabili già esistenti (goblin rimasti, turno, ultimo esito) prima di essere una meccanica. |
| **Greed vs caution + ritirata con penale = il motore delle storie.** In *Darkest Dungeon* il «torno indietro?» è il cuore; la ritirata costa (ricompensa persa/stress) e la discussione della community è su *quando* diventa disponibile. | Darkest Dungeon (Game Informer; Steam) | La scelta «mollare il trofeo» di F7 è già un abandon con penale: va resa *sentire*, non solo disponibile. |
| **Peak-end rule**: il ricordo di un'esperienza è dominato dal picco e dalla fine; anche in giochi casual l'effetto sul *ricordo di difficoltà* è robusto, sul divertimento è più sfumato; in esperienze complesse l'intensità media pesa più del solo picco. | Peak-End Effects on Player Experience (CHI 2016); Frontiers 2019 | **La fine vale di più di ogni altro beat per parola.** Oggi è la riga più debole della quest. Ma attenzione: non basta il picco — serve intensità media non piatta. |

Cautela onesta sulla ricerca: la letteratura peak-end sui giochi è mista (forte sul ricordo
della *sfida*, variabile su fun/preferenza). Non la prendo come legge, la prendo come
motivo per **non sprecare l'ultima riga**.

## A3. Timing e pacing

Dato reale [osservato]: `transitMs = 2600` (config) per tutti i transit; i transit shippati
hanno **14–38 parole**. A ~3,3–4 parole/secondo di lettura in italiano, 14–38 parole
richiedono **~4–11 s**. Il hold è cioè **sotto il tempo di lettura per ogni singolo transit**.

Regole proposte (config-first, `questLabPacing.ts`):

| Elemento | Regola |
|---|---|
| Transit | hold = `clamp(parole / 3.5, 2.0 s, 7.0 s)`; tetto **≤ 24 parole**; sempre skippabile (già c'è skip nel cockpit) |
| Verdict flavor | **≤ 16 parole**, una immagine, nessuna cifra |
| Beat di relax | 1 riga, hold fisso 1.8 s, *nessuna scelta* |
| Beat di shock (agguato) | **zero preavviso**: la prima riga è corta (≤ 8 parole) e arriva *senza fade lungo* (l'interruzione del relax è il punto) |
| Fine run | hold libero, chiusura solo con click: è la riga più letta |

## A4. Psicologia: cosa deve provare il giocatore, e quale meccanismo lo produce

| Emozione | Meccanismo (esistente, non nuovo) |
|---|---|
| «Questo può andare male» | HP per slot + esposizione posizionale **già visibile** nell'HUD; il testo nomina chi è *in coda* |
| «Ancora un tiro e qualcuno cade» | F4 T3+ (2 colpi) + escalation; serve che il testo **abbassi la voce** quando qualcuno è <35% |
| «Ce l'abbiamo fatta» (sollievo) | uscita da F4/F5: oggi inesistente, va **scritto** |
| «Voglio ancora un po'» (avidità) | F6: richiede un **oggetto visibile e incompleto** |
| «No. Non ora.» (shock) | F7: richiede che il sollievo *venga prima* |
| «Mi ricorderò di questa run» | callback (F0→fine; F5→F7), e un **registro finale di chi è tornato** |

---

# B. La quest giocata davvero

Metodo: `scripts/quest-goblin-playthrough.ts` guida il **motore reale** (`createRun`,
`applyChoice`, preset `gob-band`) con una policy deterministica e stampa ciò che il
giocatore leggerebbe (transit, body, scelta, check con verdetto + flavor + danni + esito,
HP). 4 run commentate (seed 7 *optimal*, 41 *greedy*, 1983 *optimal*, 2024 *cautious*) +
4.000 run *optimal* per le metriche. **Nota di metodo:** lo script stampa il `transit` di
ogni nodo a ogni iterazione, quindi la ripetizione «Il momento è scelto» ×5 nel log è un
artefatto dello script (nella UI il transit di combat è solo a T1, `questRun.ts` ~`turn === 1`).

## B1. Cosa ho letto, in ordine (seed 41 — la più ricca)

> Banda 100/60/60/60. Assegnazione (il mugnaio). Transit nel bosco. **Forzo il sentiero**:
> *«Una traccia che gli altri avrebbero perso: qualcosa è nascosto qui.»* → il testo mi dice
> che c'è loot. **Bottino**: FAIL → *«Il filo di latta canta»* + *«Kran è ferito. Kran incassa
> il colpo (−10 HP)»* + *«Bottino di guerra +12 gold»*. **Assalto**: WIN *«Il muro cede
> esattamente dove lo colpite.»* **F4 · cinque turni:** *«Il party colpisce. Un goblin in meno.»*
> ×4, *«I goblin schivano…»* ×1, e 10 volte *«{nome} incassa il colpo (−12 HP)»* — Kran scende
> 47→35→23, cura, →31→19→7. **F5 Incalzare**: FAIL *«Le rocce vi tradiscono»* + *«Kran è ferito. Kran non si
> rialza»*. Kran è morto: **la scena più forte della run è una riga di log**. **F6**: ×3
> *«Razzia tra le tende»*, Bruna a 16/60. **F7**: scelgo *Affrontare* con Bruna a 11/60 → WIN
> *«Il party colpisce. Un goblin in meno.»* — a testo; in realtà 3 goblin abbattuti **e Bruna
> morta**. Fine: nessuna riga di chiusura.

## B2. Difetti verificati nel testo/meccanica

| # | Osservazione | Dove | Gravità |
|---|---|---|---|
| D1 | **Il flavor di F5 `win` contraddice l'esito.** Flavor: *«I pochi che scappano non basteranno per un agguato vero»*; esito (e spec): *«Non ne resta nessuno»* = sterminio, ritorno pulito. **L'ho scritto io in R-099** leggendo male la spec. | `gob-incalza-check` win | **bug narrativo** |
| D2 | F6 `bigwin`: *«il campo paga due volte»* ma l'esito dice **+8 gold**, identico a `win`. Il testo promette ciò che il motore non dà. | `gob-cerca` bigwin | bug narrativo |
| D3 | Ultimo scontro `win` con 3 goblin uccisi **e un PG morto** → riga *«Il party colpisce. Un goblin in meno.»* Il picco della run ha la riga più piatta. | `GOBLIN_ATTACK_LINES` | **alta** |
| D4 | F5 `win` con **morte del bodyguard** (seed 7: *«Kran è morto»* su un WIN): vittoria narrata, morte solo nel log. Il testo non si accorge. | harm presentation | **alta** (è il miglior potenziale di storia) |
| D5 | Stealth `win` con *«Kran è ferito»* (seed 1983, 57/60 HP): ferita su un passaggio «perfetto». Causa non verificata [ipotesi: ferita da roll di rischio nodo]. | `gob-stealth` | media — verificare |
| D6 | F2 `fail` lascia comunque **+12 gold** e il PG ferito: la spec lo vuole (*«il tentativo è sempre conveniente»*) — non è un bug, ma il testo *«Bottino di guerra»* sopra un fallimento stride. | `gob-bottino` | bassa |
| D7 | F1-B: *«qualcosa è nascosto qui»* **annuncia** il loot invece di lasciarlo scoprire. E il masso non ha alcun indizio visibile *prima* della scelta. | `gob-tracce-perfor` | media (brief) |
| D8 | F6 `fail`: il flavor dice *«La trappola»*, l'esito dice *«Solo cenere e spine»* — **due frasi in disaccordo** sotto la stessa carta. Stesso problema su più bande. | `gob-cerca` | media |
| D9 | F4 si chiude **sempre dopo 5 turni** con 1–2 goblin: il transit *«spezzano il fronte e corrono»* è la fine del contatore turni, non una rotta. | F4→F5 | strutturale |
| D10 | `goblin 2` resta mostrato dopo uno sterminio in F5 (`goblinLeft` non azzerato). | stato | minore |
| D11 | **Nessuna chiusura.** Il bilancio finale è: nessuna riga (cautious) o *«Il party colpisce…»* (greedy). | `gob-fine` | **alta** (peak-end) |
| D12 | Transit 14–38 parole con hold 2,6 s: **non leggibili** (vedi A3). | pacing | media |

## B3. Metriche baseline (4.000 run, policy *optimal*, preset `gob-band`)

| Metrica | Valore | Lettura |
|---|---|---|
| F4: finisce con ≥1 PG grave (<35% HP) | **53,8%** | la «disperazione» esiste già meccanicamente: **manca solo il testo** |
| F4: finisce con 1–2 goblin e ≥1 PG grave («quasi spezzati») | **22,8%** | lo stato-obiettivo del brief si verifica ~1 run su 4–5 |
| F5 raggiunto | 95,5% | F4 quasi mai stermina da solo |
| **F7 (scelta trofeo/sangue) raggiunto** | **21,6%** | **il «No, non ora» è assente nel ~78% delle run ottimali** (F5 riuscita ⇒ ritorno pulito) |
| F6 con HP minimo 30–75% (tentante ma pericoloso) | 45,0% | buona base per la tentazione |
| Morti medie/run · wipe | 0,40 · 0,0% | il rischio è basso: la tensione è soprattutto *percepita* |

Due metriche sono **saturate/mal definite** e non le uso come prova: «F5 dilemma credibile»
(100%) e «F7 oh-no» (96,5% *condizionata* a F7). Le ridefinisco in D7.

---

# C. Critica spietata

## C1. Alla quest com'è

1. **La curva è una rampa**, esattamente come diagnostica il brief: *curiosità → tensione
   lieve → azione → conseguenza*. La causa vera non è la scrittura: è che **il testo ignora
   lo stato**. Le frasi sono *per banda*, mai *per situazione*. Con Kran a 7/60 la riga è
   identica a quando è a 60/60.
2. **Il picco emotivo non è dove il motore lo mette.** Le scene più forti (la morte di Kran
   nell'inseguimento; Bruna che copre l'ultima mischia) escono come **righe di log**. Il
   testo premia i successi con flavor e relega le perdite a un `harmLines`.
3. **Non c'è sollievo.** F4→F5→F6 sono tre decisioni consecutive «sotto pressione». Senza
   valle, F7 non può essere shock.
4. **L'agguato è una tassa piatta.** All'ingresso F7 tutto il party prende 5 dry-damage
   *non posizionali* (spec): è l'opposto di «la persona in fondo paga». Il payoff posizionale
   arriva solo nell'ultima mischia, narrato con la riga generica D3.
5. **F7 è facoltativo per chi gioca bene.** Il momento in cui la quest dovrebbe lasciare il
   segno è, nel 78% delle run ottimali, **saltato**. Chi vince bene non vive mai l'agguato:
   quindi la chiusura deve funzionare *senza* l'agguato.
6. **Il combattimento è un contatore.** 5 turni fissi, −12 HP piatti, stessa frase ×4. Non
   comunica *chi sta vincendo*.
7. **Il lab promette ciò che il motore non dà** (D1, D2, D8): è il difetto peggiore per la
   fiducia: se il testo mente una volta, il giocatore smette di leggerlo.

## C2. Al brief ricevuto (dove non sono d'accordo)

| Idea del brief | Giudizio | Perché |
|---|---|---|
| **Morale come meccanica** (F4 si chiude per rotta) | **Rifiuto per ora** (P2). Accetto il *readout narrativo*. | F4 è calibrata MC (R-097) su 5 turni; una rotta anticipata cambia durata, danni attesi e distribuzione di F5. Il 95,5% di F4→F5 già finisce con 1–2 goblin: la «rotta» è già lo stato reale. Basta **dirlo** leggendo `goblinLeft`+turno+ultimo verdetto (Battle Brothers insegna che il valore sta nella *leggibilità* dello stato). |
| **Libreria di beat di combattimento** | **Sì, ma griglia, non libreria.** | Una libreria random produce eventi slegati dalla meccanica. Meglio una griglia `fase × banda` (3×5) + varianti di *gravità del colpo*: ~24 righe totali, ognuna agganciata a uno stato. |
| **Curva target con F7 = shock** | **Correggo.** | Con F7 raggiunto nel 21,6% (optimal), il picco non può essere *garantito* in F7. Il picco di una run deve poter stare in F5, F6 o F7 — dove la decisione è costata di più. La fine (registro) deve essere garantita *sempre*. |
| **Continuità goblin F5→F7** | **Sì, ma solo come testo condizionato a flag esistenti** (`agguatoPeggiore`/`agguatoMite`). | Costo ~2 stringhe. Nessuna entità persistente. Alto valore di memoria. |
| **F6 più concreta** | **Sì — e la meccanica fa già metà del lavoro.** | Il danno crescente 5→10→15 *è* una struttura che cede: va **mostrata** (tenda, trave), non aggiunta come regola. |
| **Metriche emotive MC** | **Sì, ma ridefinite** (D7). | Le due più naturali sono saturate; vanno condizionate a stato, non a nodo. |
| *«Non aggiungere stati/risorse»* | **Concordo** e lo applico a me stesso: nessuna delle mie P0 tocca RNG né calibrazione. | |

---

# D. Proposta

## D1. Diagnosi per fase

| Fase | Forza | Debolezza | Ruolo emotivo | Intervento |
|---|---|---|---|---|
| **F0** | Il mugnaio: conseguenza concreta, nessuna esposizione | — | scopo / responsabilità | **Non toccare.** Diventa il *seme* della chiusura (callback). |
| **F1** | Silenzio innaturale | Il masso non ha motivo visibile (D7); F1-A rivela *tutto* al bigwin | curiosità / disagio | Indizio visibile *prima* della scelta; rivelazione a **scalini** per banda |
| **F2** | Tentazione + campanelli | La spec la rende sempre conveniente (voluto) | tentazione | Solo testo: far *sentire* il rischio fisico (D6); non cambiare i numeri |
| **F3** | `almost` dello stealth = near-miss riuscito | Assalto generico | tensione | Assalto fisico; continuità con F1 (la sentinella) |
| **F4** | Meccanica ricca (slot, escalation) | Contatore: 5 frasi uguali, −12 piatti (D3, D9) | azione → pericolo → disperazione | Griglia fase×banda; gravità del colpo; readout morale; transit F4→F5 *sullo stato* |
| **F5** | La tensione dolore-ora / dolore-dopo | Testo bugato (D1); morte nel log (D4) | decisione dolorosa | Correggere D1; **la morte è la scena**, non il log |
| **F6** | Push-your-luck pulito | Tentazione astratta; flavor e esito in disaccordo (D8) | sollievo → avidità | Oggetto visibile e incompleto; la struttura cede a ogni giro |
| **F7** | Il bosco che guarda | Agguato piatto; ultima mischia con riga generica (D3) | sollievo → shock | Relax *esplicito* prima; prima riga secca; righe posizionali |
| **Fine** | — | Assente (D11) | conseguenza / rilascio | **Registro finale + callback al mugnaio** |

## D2. Curva emotiva: target e come la quest ci arriva

```
 intensità
   5 |                                  ▲F5            ▲F7*(shock)
   4 |                       ▲F4-late         ·
   3 |            ▲F3   ▲F4-mid         ▲F6(avidità)
   2 |  ▲F1  ▲F2        ·       ───valle───
   1 |▲F0                       (relax)                    ▲ Fine (rilascio)
```

| Fase | Stato emotivo target | Come lo produce il testo (non la meccanica) |
|---|---|---|
| F0 | scopo | il mugnaio |
| F1 | curiosità / disagio | silenzio + indizio visibile + sentinella a metà |
| F2 | tentazione | il campanello è *sulla mano* |
| F3 | tensione | stealth = quasi scoperti · assalto = ordine che si spezza |
| F4 apertura | fiducia | colpi puliti, linee che cedono |
| F4 mischia | pericolo | colpi pesanti, voce che si abbassa su chi è <35% |
| F4 rotta | disperazione / speranza | goblin che indietreggiano; *noi* a pezzi |
| F5 | decisione dolorosa | un nome vicino al limite + goblin che zoppica |
| **valle** | **sollievo** | 1 riga di quiete **(nuova)** |
| F6 | avidità → rimpianto | cuoio sotto la tenda; la tenda cede |
| F7 ingresso | sollievo | qualcuno fischietta |
| F7 agguato | shock | il fischio si interrompe |
| Fine | conseguenza / rilascio | registro + mulino |

**Picchi:** F4-rotta, F5, (F7 se avviene). **Valli:** dopo F5/F6-stop (relax), dopo F2.
**Punti di decisione:** F1, F2, F3, F5, F6 (×N), F7. **Punti di tragedia possibili:** F4, F5 (toll),
F6 (se si insiste), F7 (ultima mischia).

## D3. Interventi narrativi — testo proposto (solo dove cambia materialmente)

Convenzione: `{nome}` = interpolazione dal party (slot, non nome fisso); righe ≤ 16 parole;
nessuna cifra nel flavor (gli HP stanno nell'HUD). *Italiano soltanto, traduzioni rimandate.*

### F1 — il masso ha un motivo

- **body**: «Il bosco tace in un modo che ai boschi non viene naturale. Sul sentiero un masso
  sbarra il passo; da sotto spunta un lembo di straccio, schiacciato come da chi aveva fretta.»
- **label A**: *Salire sul masso per leggere il bosco* · **label B**: *Spostare il masso: sotto
  c'è dello straccio* (stesso masso, due gesti — coerenza gratis).
- **Rivelazione a scalini (check A):**
  - `bigwin`: «Dall'alto: fumo basso a est, una fila di pali appuntiti, una sentinella su un ceppo. E un varco dove nessuno guarda.»
  - `win`: «Fumo basso a est e, su un ceppo, una sagoma che non dorme. Il campo è vicino.»
  - `almost`: «Qualcosa si muove tra i rami — una volta sola. Scendete con un sospetto, non con una via.»
  - `fail` / `epicfail`: invariati.
- **Check B `win`**: «Spalle contro il masso. Sotto: stracci, e qualcosa di avvolto.» (non
  «qualcosa è nascosto qui»).
- **Continuità:** se `bonusStealth` (già impostato dal win di A), il body di F3-stealth apre con
  «La sentinella sul ceppo guarda dall'altra parte — per ora.» *(richiede testo condizionato a
  flag, vedi P1)*.

### F3 — assalto fisico, stesso peso dello stealth

| Banda | Riga |
|---|---|
| `bigwin` | «Il primo palo cade prima che qualcuno capisca. Una tenda si accartoccia sul fuoco; due goblin rotolano via ciechi di fumo.» |
| `win` | «Sfondate dove la palizzata è più bassa. Una lancia si alza — troppo tardi.» |
| `almost` | «La palizzata tiene un respiro di troppo. Qualcuno urla; il campo ha il tempo di afferrare le armi.» |
| `fail` | «La carica si pianta nel fango. Vi aspettano già, lance puntate.» |
| `epicfail` | invariato |

Effetto cercato: **stealth = «quasi scoperti»**, **assalto = «li abbiamo colti prima che si organizzassero»**.

### F4 — la griglia (fase × banda) e la gravità del colpo

Fase (derivata, nessuno stato nuovo): **apertura** = T1–T2 · **mischia** = T3–T4 · **rotta** = T5
oppure `goblinLeft ≤ 2`.

| | `bigwin` | `win` | `almost` | `fail` | `epicfail` |
|---|---|---|---|---|---|
| **Apertura** | «Un goblin vola contro il compagno; la linea si apre come una porta.» | «Il colpo apre un varco: un goblin a terra, e non si rialza.» | «Il colpo morde la spalla, non il cuore: barcolla e resta in piedi.» | «Scivola sotto il colpo e risponde nello spazio che avete lasciato.» | «Vi sbilanciate: due lame trovano il fianco scoperto.» |
| **Mischia** | «Una tenda crolla sulla loro retroguardia. Tre pensano ad altro che a voi.» | «Lo spazio si stringe, il colpo è pulito. Uno scudo cade nel fango.» | «Colpito, non abbattuto: arretra tenendosi il braccio e il varco si richiude.» | «Scudi serrati. Il colpo muore su legno e cuoio.» | «La linea si richiude: per un istante lungo siete circondati.» |
| **Rotta** | «Il più grosso cade; con lui la voce del campo. Le lance cominciano a cadere.» | «Un altro cade. Gli altri guardano il bosco, non voi.» | «Non cadono — ma non attaccano più. Indietreggiano un passo alla volta.» | «Ringhiano e si stringono: i disperati colpiscono più forte.» | «Uno che non ha più nulla da perdere si getta su chi è ferito.» |

**Gravità del colpo** (sostituisce *«{nome} incassa il colpo (−12 HP)»* nel testo; le cifre
restano nell'HUD). Soglia su `hpDopo/maxHp`:

| Banda | Riga |
|---|---|
| graffio (>70%) | «{nome} serra i denti. Resta in piedi.» |
| solido (35–70%) | «{nome} si piega, poi si rimette dritto.» |
| grave (20–35%) | «{nome} barcolla: c'è sangue sul fianco.» |
| al limite (<20%) | «{nome} regge solo perché non c'è altro da fare.» |

**Selezione senza toccare l'RNG:** variante scelta con un hash deterministico di
`(seed, checkSeq)` e senza ripetere la riga precedente. **Mai `roll(state)`**: consumare RNG
sposterebbe tutte le sequenze e invaliderebbe la calibrazione MC (R-097). Va coperto da un
test «stesso seed ⇒ stesse righe, stessi esiti».

**Readout del morale nemico** (una riga accanto al contatore goblin; testo derivato):
`≥4 rimasti`: «Tengono la linea.» · `3`: «Si guardano tra loro.» · `≤2 e ultimo win`: «Cedono
terreno.» · `1`: «Stanno per spezzarsi.»

**Transit F4→F5 sullo stato** (sostituisce la riga unica):
- base: «Polvere e sangue. I goblin che restano spezzano il fronte e corrono verso il bosco.»
- se qualcuno <35%: + «Dietro di voi, {nome} si regge a un palo.»

È il setup del brief — *«stiamo vincendo, ma se spingo qualcuno può morire»* — prodotto da
dati che esistono già.

### F5 — la morte è la scena

- `win` **corretto (D1)**: «Li chiudete contro le rocce, uno alla volta. Il sentiero torna silenzioso.»
- Riga di morte durante l'inseguimento (al posto di *«{nome} è morto — su «La caccia tra le rocce»»*):
  «{nome} resta indietro, tra le rocce, e non si alza più.»
- *Lasciarli fuggire* — consequence: «Li guardate svanire. Uno zoppica e si volta una volta sola, per ricordarsi le vostre facce.» → **setta il marcatore** (flag già esistente `agguatoPeggiore`).
- `almost`/`fail` — consequence: «Uno scappa con un braccio avvolto negli stracci. Vi guarda più con odio che con paura.» → marcatore per `agguatoMite`.

### F6 — la tentazione

Opzioni valutate come oggetto visivo:

| Candidato | Pro | Contro | Verdetto |
|---|---|---|---|
| Sacco di monete | chiarissimo | rivela la ricompensa: niente incertezza | scartato |
| Idolo strano | atmosfera | fuori dal kit `bosco`+`saccheggio`; invita lore | scartato |
| Botola / cantina | tentazione forte | è un nuovo spazio = una fase in più (vietato) | scartato |
| Arma ornata sotto la cenere | desiderabile | implica un oggetto-stat | scartato |
| **Cassa semibruciata sotto la tenda crollata** | visibile e *incompleta*; la struttura che cede **è** il danno crescente | — | **scelta** |

- **body**: «Sotto la tenda crollata, un angolo di cuoio con un fermaglio d'ottone. La cenere è ancora calda.»
- **Per turno** (`exploreTurn`): T1 «Il palo che regge il telo scricchiola.» · T2 «Il telo brucia ancora, in basso. Sentite il caldo sul viso.» · T3 «Una trave cede. Chi frugava arretra — e vede il cuoio più vicino.»
- **Fermarsi**: «Lasciate l'angolo di cuoio dov'è. Nessuno lo dice; tutti lo guardano finché non scompare.»
- **Fix D2/D8**: `bigwin` = «Sotto il telo, il cuoio cede: dentro, più di quanto sperassi.» — **oppure** +gold reale in config. Decisione al Director (D5). `fail` = una sola frase (il flavor *o* l'esito, non due che litigano).

### F7 — relax → shock → chi paga

1. **Relax** (`gob-ritorno`, transit/body): «La strada scende verso casa. Qualcuno ha cominciato a fischiettare. Poi smette, senza che nessuno dica perché.» *(il sollievo **prima**, l'inquietudine come ultima clausola — non il contrario)*.
2. **Shock** (`gob-agguato`): «Il fischiettio si interrompe a metà. Una freccia nel palo accanto a voi. Poi tutte le altre.» Prima frase ≤ 8 parole.
3. **Marcatore** (se `agguatoPeggiore`/`agguatoMite`): «Tra i cespugli, quella sagoma che zoppicava.» / «…quello con il braccio fasciato.»
4. **Chi paga** (testo agganciato a rango, non nuova meccanica): per il membro in fondo alla fila: «{nome} copre la ritirata e non la segue.» · per chi intercetta: «{nome} si frappone.» · per un ferito che regge: «{nome} resta in piedi, e questo basta a tutti.»
5. **Trofeo lasciato** — consequence: «Il trofeo rotola nel fosso e nessuno si volta a guardarlo. La strada, davanti, è solo strada.»
6. **Ultima mischia**: righe **della griglia «rotta» + gravità del colpo**, mai *«Il party colpisce. Un goblin in meno.»* quando i kill sono >1 o c'è una morte (D3).

### Fine — il registro e il mulino (massimo effetto per parola)

Chiusura **composta da stato**, non scritta per ogni combinazione:

- **Esito** (una riga, callback a F0):
  - `reward`: «Quella notte, dal mulino, torna il rumore della ruota.»
  - `survived` (trofeo lasciato): «Tornate a mani vuote. Il mulino resta fermo.»
  - `fled`: «Tornate prima del tempo. Il bosco resta dov'è.»
  - `wipe`: «Il consiglio aspetta fino all'alba. Poi manda qualcuno a cercarvi.»
- **Registro** (da `party`): «Tornano in {n}.» + «{nomi dei morti} non tornano.» + se ferito: «{nome} porta il trofeo, e non lo molla.»

Costo: 4 stringhe + 2 template. Ancora la fine al mugnaio di F0 — l'unica cosa che il giocatore
ha *visto* soffrire. È l'intervento col miglior rapporto emozione/parola della proposta.

## D4. Metriche emotive MC (definizioni da implementare nello script)

| Id | Metrica | Definizione | Baseline | Target |
|---|---|---|---|---|
| M1 | Disperazione F4 | P(fine F4 ∧ ≥1 PG <35% ∧ goblin 1–2 ∧ ≥2 PG vivi) | **22,8%** (stima) | 20–35% |
| M2 | Qualità dilemma F5 | per ogni stato F5, rollout *fork* di entrambe le opzioni: dilemma ⇔ ∆P(morte≥1) < 12pp **e** entrambe >5% | *non misurata* (la mia stima 100% è saturata) | 40–70% |
| M3 | Tentazione F6 | P(HP min 30–75%) · e *rimpianto* = P(danno F6 ≥ guadagno atteso) | 45,0% | 40–60% |
| M4 | Presenza del picco F7 | P(F7 raggiunto) condizionata alla policy | **21,6%** | descrittiva; ≥ 1 picco per run su altra fase |
| M5 | «Oh no» F7 | P(oh-no ∣ F7) con soglia *relativa* (danno ≥ 40% del totale) | 96,5% (saturata) | 50–80% |
| M6 | Significatività morte | P(la morte cambia la scelta successiva: slot compattato, bodyguard perso, intercettazione che sparisce) · P(morte su verdetto `win`) | *non misurata* | >70% · tracciata come anomalia |
| M7 | Distribuzione del picco | fase in cui cade il massimo `dangerLevel` per run | *non misurata* | distribuita, non su un nodo |
| M8 | Rapporto sollievo | P(∃ calo di `dangerLevel` ≥1 tra due fasi consecutive) | *non misurata* | >70% |
| M9 | Ripetizione testuale | max ripetizioni della stessa riga in F4 | **3–4** | ≤1 |

Nota onesta: M2, M6, M7, M8 non sono ancora implementate nello script; M1/M3/M4/M5 sì ma con
definizioni grezze (da affinare).

## D5. Piano di implementazione

### P0 — necessario per un alpha credibile (solo testo/dati; **zero RNG, zero calibrazione**)

1. **Fix delle contraddizioni** D1 (F5 win), D2/D8 (F6), D3 (riga dell'ultima mischia), D10 (`goblinLeft`).
2. **Chiusura**: registro + callback mulino (D11) — logica di testo, nessun cambio di esito.
3. **F1**: indizio visibile del masso + rivelazione a scalini.
4. **F3**: assalto fisico.
5. **F6**: cassa semibruciata + 3 righe per turno + riga di stop.
6. **F7**: relax→shock; righe «chi paga» agganciate a rango.
7. **Pacing**: hold transit ∝ parole (config), tetto 24 parole.
8. **Verifica D5** (ferita su stealth win) prima di scriverci sopra.

### P1 — alto valore, richiede piccoli hook

1. **Griglia F4** fase×banda + gravità del colpo, con selezione hash-deterministica e test di determinismo.
2. **Readout morale** dei goblin (derivato).
3. **Transit F4→F5 sullo stato** e **testo condizionato a flag** (`bodyIf`/`textIf`), che abilita anche la continuità F1→F3 e F5→F7.
4. **`options[].consequence`** (la frase di esito di una scelta senza check).
5. **M1–M9 nello script MC**.

### P2 — rimandato

1. **Morale come meccanica** (rotta anticipata di F4) — rompe la calibrazione R-097; si valuta *dopo* aver visto se il readout basta.
2. **Ingresso agguato posizionale** (un colpo al fondo invece di 5 flat a tutti): è la modifica più efficace per «il fondo paga», ma cambia numeri e spec → **decisione del Director**.
3. **Goblin persistente con identità**; **director dinamico** (intensità adattiva stile L4D); **beat di relax come nodo**.

## D6. Decisioni da prendere (Director)

| # | Decisione | Mia raccomandazione |
|---|---|---|
| 1 | Applicare **P0** subito (solo testo; test di non-regressione) | **Sì** |
| 2 | F6 `bigwin`: correggere solo il **testo** o dare un **+gold** reale? | testo ora; +gold valutato in MC |
| 3 | Ingresso agguato: restare **flat 5 a tutti** o passare a **un colpo posizionale**? | restare flat in P0; riaprire dopo il playtest del nuovo testo |
| 4 | Morale: **readout narrativo** (P1) o aspettare di giocare P0? | readout in P1; meccanica solo se serve |
| 5 | La fine con callback al mugnaio: va bene come direzione? | sì |

## D7. Cosa non ho fatto

- Nessuna modifica a `questScenarioGoblin.ts`, `questRun.ts`, né alla spec.
- Il file `scripts/quest-goblin-playthrough.ts` è nuovo (player testuale + metriche
  baseline); non è parte del lab e si può rimuovere.
- Le righe sono **bozze**: ogni «[R]» della spec resta valido finché non approvato.
- La ricerca è web a 5 fonti per tema: sufficiente per orientare, non per citare come legge.

## Fonti

- Game Developer — *Gameplay Fundamentals Revisited: Harnessed Pacing & Intensity*; *Using Intensity to Drive Player Engagement*; *Back to Basics: Intensity/Time graphs*.
- Campaign Mastery — *Swell and Lull: Emotional Pacing in RPGs*.
- On Game Design — *When I'm designing a level…*
- Battle Brothers Developer Blog — #4 *Tactical combat mechanics*, #20 *Bravery and Morale*.
- PMC 5663799 — *The Effect of Losses Disguised as Wins and Near Misses in EGMs*; Springer *Near-Misses and Stop Buttons in Slot Machine Play*; PLOS ONE *Winning and losing in online gambling: within-session chasing*.
- Game Informer — *Elder Gods in the Machine: Darkest Dungeon*; Steam Community — *Darkest Dungeon: Abandon Quest mechanic*.
- CHI 2016 — *Peak-End Effects on Player Experience in Casual Games*; Frontiers in Psychology 2019 — *Robustness of the Peak-and-End-Rule for Complex Experiences*.
