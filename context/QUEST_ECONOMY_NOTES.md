---
title: Quest Economy & Village Strategy — design notes
type: design-knowledge
status: PROPOSAL — candidati non ratificati (tracking in `context/OPEN.md` OPEN-010)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261004-rovine-preview-chatgpt/economy-notes.md` (gitignored) — conversazione ChatGPT «Progettare quest strategiche» 2026-10-04; ledger di estrazione in `context/ingestions/2026-10-05-progettare-quest-strategiche.md`
---

> **Status:** PROPOSAL. I concetti qui sotto (human-days, quest come
> opportunità, regola leader-capacity, juice) sono **candidati di design** —
> non regole vigenti. Ratifica pendente in OPEN-010. I risultati della
> simulazione MC 200k sono evidence di esplorazione, non parametri canonici.


> Da conversazione ChatGPT 2026-10-04. Status: PROPOSAL (simulazione di
> design, non numeri canonici del Balancer). Regole derivate da direttive del
> Director = candidate, non decisioni.

## Modello di check usato nella simulazione

- d20: successo se `d20 + bonus ≥ DC`.
- Il fallimento **non** è «morte automatica»: apre un **tiro di conseguenza**.
- Il delta fra skill del party e requisito riduce sia la probabilità di
  fallire sia la gravità della conseguenza.
- Party simulato: 1 Eroe (+25% stat principale → +5 sul d20) + 3 Villagers
  (+1 ciascuno) → stat principale +8, secondaria +3.

| Check | Bonus | DC | Successo |
|---|---|---|---|
| Mercante high-risk | +8 | 14 | 75% |
| Fiume | +8 | 13 | 80% |
| Stealth | +3 | 12 | 60% |
| Combattimento | +8 | 14 | 75% |
| Percezione tesoro | +3 | 12 | 60% |
| Trappola (Dex+Con) | +3 | 14 | 50% |

Il party è forte sulla caratteristica principale ma debole sulle secondarie →
non è una spedizione «facile».

## Risultato di 200.000 simulazioni (regole provvisorie)

- Quest completata ~83% · fallita ~17%
- Morti medie ~0,49/quest · almeno un morto ~36%
- Feriti medi ~1,5/quest · almeno un ferito ~67%
- Durata media ~6,7 giorni

**Lettura di bilanciamento:** col party +25% si sta a ~mezzo morto per quest.
Senza specialista sulla stat principale si sale verso ~1 morto + ~2 feriti,
ma la probabilità di fallimento della spedizione diventa molto alta.
**Avviso:** se il target è ~1 morto medio, attenzione a non trasformare ogni
quest in una roulette russa.

## Economia degli umani (human-days)

La quest non costa «6 giorni»: costa `4 persone × ~7 giorni = ~28
human-days`. Un ferito non è «−10 HP» ma *«quest'uomo non è disponibile per
X giorni»*.

Costo reale di una quest:

- ~28 human-days
- rischio di morte
- giorni di indisponibilità dei feriti
- tempo della quest
- consumabili
- rischio di arrivare più deboli alla prossima occasione

contro: oro / loot / informazioni / progressione.

## Quest come opportunità, non obbligo

Un party da solo può teoricamente fare ~4–5 spedizioni/mese, ma il gioco non
deve dire «ogni 7 giorni devi fare una quest». In 30 giorni:

- 8–10 quest possono comparire
- il giocatore ne affronta realisticamente 4–5
- alcune rifiutate perché il party non è pronto
- alcune scadono
- alcune diventano interessanti solo dopo aver sviluppato certe persone/equip
- una quest lunga può occupare gran parte del mese ma produrre molto valore

Le domande strategiche che emergono: *«questa quest vale davvero 25–30
human-days?»* e soprattutto *«li impegno adesso o tengo liberi questi uomini
perché potrebbe comparire qualcosa di molto migliore?»*

## Regola del leader (direttiva Director, verbatim)

*«fino a quando il leader nn è stanco o ferito (o morto) puoi continuare a
fare quest fino a quando hai altri umani»* — la capacità di fare quest non è
«1 quest per X giorni» ma è limitata dalla disponibilità degli umani e dallo
stato del leader. Leader stanco/ferito/morto → capacità interrotta.

**Esempio mese (8 quest offerte, 5 affrontate):** 1 ignorata (party debole),
1 scaduta mentre il leader era stanco, 1 richiedeva uomini impegnati. Output:
+650 oro, 2 feriti, 1 ferito grave, 1 morte, 9–12 giorni cumulativi di
indisponibilità, ~100 human-days impegnati.

La domanda diventa *«qual è il prossimo miglior uso dei miei umani?»* — non
«qual è il prossimo bottone da premere».

## Le 5 fonti di juice

1. **Near miss** — `9 + 3 = 12` vs `12`: successo per un pelo. (→ P32)
2. **Deterioramento visibile** — sani → feriti → manca qualcuno.
3. **Loot già acquisito** — più vai avanti, più hai qualcosa da perdere.
   (→ P4 endowment, P18)
4. **Push-your-luck reale** — dopo il checkpoint non scegli «+30 oro» ma se
   mettere a rischio ciò che hai già ottenuto. (→ P4, P19)
5. **Storia emergente** — basta che il gioco ricordi «Tomas è rimasto ferito
   nella spedizione alle rovine» e tre quest dopo «Tomas è ancora in
   infermeria». Una percentuale diventa una piccola storia del villaggio.
   (→ P15/P45 attachment)

## Cosa testare (proposta)

Non altre meccaniche: un test `30 giorni → X quest generate → 1–2 party →
4 villagers + eroi → 4–5 spedizioni possibili → human-days → feriti → morti
→ nuove opportunità`. Per vedere se emerge il gioco cercato:

> «Voglio fare questa quest, ma se mando loro perdo 7 giorni di lavoro. Se
> aspetto, magari arriva una quest migliore. Però se arriva mentre loro sono
> feriti, non posso farla. E quella che ho davanti adesso potrebbe non
> ricomparire.»
