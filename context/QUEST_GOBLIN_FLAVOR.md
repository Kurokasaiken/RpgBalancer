---
title: Quest Goblin — flavor layer spec (probe sullo scenario S1 reale)
type: design-probe
status: IMPLEMENTED 2026-10-08 (R-099) — transit/verdictFlavor applicati a
  `questScenarioGoblin.ts`, `QuestNode`, `questRun.ts`, `QuestS1LabPage.tsx`;
  pacing in `balancing/config/idleVillage/quests/questLabPacing.ts`
created: 2026-10-07
related: src/ui/idleVillage/questS1Lab/questScenarioGoblin.ts; PLAN-022;
  context/QUEST_IMPRINTS.md (function spec, domain kit)
---

# Flavor layer — «Sterminio dei goblin» (S1 lab)

Il Director in playtest: *«manca pathos, narrativa, feelings, juice. Serve
testo che contestualizza; lo skill check deve avere un nome d'azione; a
scelta ed esito deve seguire una frase di flavour adeguata; tra una fase e
l'altra, durante l'animazione di movimento, testo che racconta cosa succede
(cosa vedi, cosa incontri).»*

## Tag e dominio

- **Dominante:** `bosco-confine` — margini di bosco, contrafforte, sentieri
  che muoiono.
- **Adiacente licenziato:** `saccheggio` (campo goblin = economia di razzia),
  `villaggio` (solo per F0/F7 — la cornice).

## Delta di schema minimo proposto

```ts
interface QuestNode {
  // ...esistente...
  transit?: string;          // testo durante l'animazione di movimento
                             // verso questo nodo (lab: info-node o overlay)
}

interface CheckNode {         // estende i nodi kind:'check'
  actionName?: string;        // il check si chiama per cosa FA il personaggio
  verdictFlavor?: Partial<Record<Verdict, string>>; // riga per banda d'esito
}
```

Regole di scrittura usate (dal probe imprints): il `transit` mostra ciò che
i personaggi *vedono/fanno* in movimento, mai l'esito futuro; il
`verdictFlavor` riporta *ciò che il mondo fa in risposta* all'esito, non il
numero; i nomi dei check sono verbi d'azione, non stat.

---

## F0 — Assegnazione

**Card (esistente + contesto):** «I goblin razziano i confini. Sterminateli.»
→ *«Terza razzia in un mese. Il mugnaio ha smesso di macinare di notte e i
campi si sono ritirati dietro i pali. Il consiglio non discute più: paga.»*

**transit → F1:** *«La strada muore dove il bosco comincia. Il profumo di
resina cede alla terra umida e a un fumo basso che non sa di cucina. Edda
cammina davanti; dietro, Milo conta i carichi e Kran conta le uscite.»*

## F1 — Esplorazione

**Contesto:** *«Il bosco tace in un modo che ai boschi non viene naturale.»*

**Opzione A — check «Ti arrampichi sul masso per leggere il bosco»** (`perc`)
- bigwin: *«Dall'alto il bosco si apre come una mappa: il fumo delle tende,
  i paletti, e la via per arrivarci senza essere visti.»*
- win: *«Rami spezzati, gocce scure, una direzione. Il campo non è lontano.»*
- almost: *«Qualcosa si muove, ma il bosco non si lascia leggere. Scendete
  con un sospetto, non con una via.»*
- fail: *«Il bosco resta muto. Scendete dal masso sapendo meno di prima.»*
- epicfail: *«Il masso è marcio: giù di schiena. Ora anche il bosco sa che
  ci siete.»*

**Opzione B — check «Forzare il sentiero sbarrato»** (`perc`+`str`)
- bigwin: *«La roccia si sposta in silenzio — e sotto, l'occasione: una
  nicchia di stracci.»* (apre F2)
- win: *«Spalle contro il masso. Il passaggio cede.»*
- almost: *«Si sposta, ma il bosco ha sentito qualcosa cadere.»*
- fail: *«Il masso cade dalla parte sbagliata: −10 HP e il sentiero resta
  chiuso.»*
- epicfail: *«La roccia prende una caviglia. Si cammina zoppicando, e non
  era il piano.»*

**transit → F2:** *«Dietro il masso, una nicchia di stracci: qualcuno ha
nascosto qualcosa in fretta e non è più tornato.»*

## F2 — Bottino (opzionale)

**Contesto:** *«Catene, campanelli, un nodo da sciogliere. Nel campo sotto,
qualcuno ride.»*

**check «Le mani sul bottino»** (`agi`)
- bigwin: *«Nemmeno i campanelli se ne accorgono. In tasca, senza un suono.»*
- win: *«Un nodo alla volta. Il bottino è vostro.»*
- almost: *«Qualcosa tintinna. Fiato trattenuto — niente si muove. Preso a
  metà.»*
- fail: *«Il filo di latta canta. Da qualche parte una testa si gira.»*
  (+10 danni, campo allertato)
- epicfail: *«L'intero intrico viene giù. Il campo si sveglia di colpo.»*

**transit → F3:** *«Tra le fronde il fumo si fa spesso: l'accampamento è
sotto. Da qui si colpisce in un modo solo — e va scelto bene.»*

## F3 — Accampamento

**Opzione A — check «Il filo di latta»** (`agi`, stealth)
- bigwin: *«Passate come il fumo tra i paletti. Il campo dorme; la sorpresa
  è vostra.»*
- win: *«Un passo, un respiro, un passo. Siete dentro.»*
- almost: *«Uno starnuto strozzato. Due teste si alzano dal fuoco, poi
  tornano giù. Dentro — ma non invisibili.»*
- fail: *«Un paletto cede, il filo canta. Il campo si sveglia in piedi.»*
  (allerta)
- epicfail: *«Il filo vi porta al centro del campo — e loro erano già
  svegli.»*

**Opzione B — check «La carica»** (`str`)
- bigwin: *«Sfondare la linea prima che esista: i primi due non capiscono
  cosa li ha colpiti.»*
- win: *«Il muro cede esattamente dove lo colpite.»*
- almost: *«Tiene un secondo di troppo — qualcuno trova il tempo di urlare.»*
- fail: *«La carica muore sul primo paletto. Il campo è pronto.»*
- epicfail: *«Inciampate nella vostra stessa carica: in mezzo al campo,
  in disordine.»*

**transit → F4:** *«Il momento è scelto. Il bosco trattiene il fiato.»*

## F4 — Combattimento

**Intro:** *«Li avete. O loro.»*

**Uscita — sterminio:** *«Il campo tace. Resta solo il fumo, e quello che i
goblin hanno lasciato.»*
**Uscita — superstiti:** *«I goblin che restano spezzano il fronte e corrono
verso il bosco, portandosi dietro la vostra faccia.»*

## F5 — Incalzare

**Contesto:** *«Polvere e sangue. I superstiti corrono — la strada di casa
passa per dove stanno scappando loro.»*

**check «La caccia tra le rocce»** (`str`)
- bigwin: *«Li chiudete dove il sentiero stringe. Nessuno tornerà a raccontare
  cosa è successo.»* (agguato disarmato)
- win: *«Ne prendete la maggior parte. I pochi che scappano non basteranno
  per un agguato vero.»*
- almost: *«Correte fino al fiatone: qualcuno gli taglia la fuga, qualcuno
  no. Torneranno feriti — e avvisati.»*
- fail: *«Le rocce vi tradiscono. Li vedete svanire, e sapete che li
  rivedrete.»*
- epicfail: *«La caccia costa sangue e non chiude nulla. Tornano tutti — e
  torneranno organizzati.»*

**Lasciar fuggire (senza check):** *«Li guardate svanire tra le fronde. Non
è finita: le cose che fuggono tornano sempre, e ricordano.»* (`agguatoPeggiore`)

**transit → F6:** *«Il campo conquistato è un campo aperto: cenere, tende
rovesciate, e il bottino che nessuno reclama più.»*

## F6 — Razzia (push-your-luck)

**Contesto:** *«Ogni turno in più costa di più — i goblin hanno lasciato
trappole anche per chi li ha uccisi.»*

**check «Razzia tra le tende»** (`int`/`perc`)
- win: *«Sotto la tenda bruciata, qualcosa che valeva ancora.»*
- fail: *«La trappola che non avevate visto. Il campo si fa pagare anche da
  morto.»*

**Fermarsi:** *«Avete preso abbastanza. La strada chiama.»*

## F7 — Ritorno / Agguato

**transit → ritorno:** *«Il trofeo pesa e la strada è lunga. Il bosco vi
guarda andare via — troppo attento per essere solo vento.»*

**Agguato (harm):** *«Frecce dal ciglio. Non avevano dimenticato: erano
rimasti ad aspettare.»*

**La scelta — trofeo o sangue:**
- *Mollare:* *«Il trofeo rotola nel fosso. Il bosco smette di seguirvi —
  aveva già preso il suo prezzo.»*
- *Affrontare:* *«L'ultima mischia è secca come un osso che si spezza. Chi
  resta a coprire paga per tutti.»*

**Fine:** *«La strada si apre sul villaggio. Chi torna conta i nomi di chi
non torna — e chi ha visto sa cosa è costato.»*

---

## Copertura delle regole usate

- **Transit** = funzione «movimento con contenuto»: cosa si vede, cosa si
  incontra, mai l'esito futuro. Copre l'animazione X tra fasi.
- **Action name** = il check racconta il gesto, la stat è il mezzo.
- **VerdictFlavor** = una riga per banda; l'esito *si sente*, non solo si
  calcola (coerente con «le conseguenze devono essere notate» — P60).
- **Named characters** (P50): i flavor citano Edda/Milo/Kran dove lo slot
  conta — il costo cade su una persona, non su «il party».
