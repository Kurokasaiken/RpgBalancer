---
title: Quest «Sterminio dei goblin» — spec authored completa
type: spec
status: draft
date: 2026-10-06
source: proposta del Director (correzione alla bozza «Torre nel Bosco», 2026-10-06);
  modello di targeting posizionale a cascata definito dal Director
---

# Sterminio dei goblin — spec completa

Quest di **combattimento**, basata su **Forza**. Vincoli di presentazione
(Director): pochissimo testo — immagine, titolo, opzioni brevi. Il giocatore
in ogni fase può ritirarsi o usare un consumabile.

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

I goblin superstiti fuggono. **Lasciarli fuggire non evita il rischio:**
produce un agguato mite garantito. Incalzare espone il party a un ultimo
colpo — è ciò che rende la scelta non dominante.

| Opzione | Esito |
|---|---|
| **Lasciarli fuggire** | agguato **mite** garantito al ritorno (F7) |
| **Incalzare** | check `FORZA` a bande di esito ↓ |

Bande del check `FORZA` (il juice dei tiri: almost e critici contano):

| Esito | Effetto |
|---|---|
| `bigwin` | **Sterminio**, ritorno pulito, nessun costo |
| `win` | **Sterminio**, ritorno pulito |
| `almost` | **è un fallimento** (Director): i goblin fuggono → agguato F7 **mite** |
| `fail` | i goblin fuggono → agguato F7 **peggiorato** |
| `epicfail` | i goblin reagiscono prima di fuggire: **danni al party** + agguato F7 **peggiorato** |

- Stat: **Forza** (coerente con la quest Forza-based).
- La decisione reale non è «successo sì/no» ma: *nelle condizioni in cui sono
  arrivato qui, voglio esporre ancora il party?*

### F6 — CONTINUA L'ESPLORAZIONE (opzionale, post-obiettivo)

- X turni di esplorazione; a ogni turno:
  - danni **5 → 10 → 15 → …** (crescenti) distribuiti col profilo slot;
  - skill check su `INTELLIGENZA` o `PERCEZIONE`.
- Push-your-luck puro: ogni turno in più costa di più.

### F7 — RITORNO / AGGUATO

- **Se F5 riuscita (sterminio):** ritorno pulito.
- **Se F5 fallita:** i goblin superstiti fanno un **agguato sulla strada**:
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

## Testi per esito (una riga per esito, per fase)

Le bande di esito sono quelle del lab: `epicfail` · `fail` · `almost` ·
`win` · `bigwin`. Testo minimo per vincolo di presentazione (Director).

### F0 — Assegnazione

- (nessun check) «I goblin razziano i confini. Sterminateli.»

### F1 — Esplorazione

**Check `PERCEZIONE`**

- `bigwin` — «Tracce ovunque. Sapete esattamente dove guardare.»
- `win` — «Orme fresche verso nord. Il campo non è lontano.»
- `almost` — «Qualche segno confuso. Meglio di niente.»
- `fail` — «Il bosco tace.»
- `epicfail` — «Perdete ore a seguire tracce di cervo.»

**Check `PERCEZIONE + FORZA`**

- `bigwin` — «Spostate il masso: sotto, un bottino nascosto.»
- `win` — «Una traccia che gli altri avrebbero perso. Qualcosa è nascosto qui.»
- `almost` — «Un graffio nella roccia vi svela il nascondiglio — a costo di un ematoma.»
- `fail` — «Faticate invano. (−10 HP)»
- `epicfail` — «Il masso vi ricade addosso. (−10 HP)»

### F2 — Evento opzionale (bottino)

**Check `DESTREZZA`**

- `bigwin` — «Mani veloci e silenzio assoluto: il bottino è vostro.»
- `win` — «Preso, senza svegliare nessuno.»
- `almost` — «Ce l'avete — ma qualcosa si è mosso nel campo.»
- `fail` — «Un rumore di troppo. I goblin drizzano le orecchie.»
- `epicfail` — «Una trappola scatta sotto le dita. Il campo è all'erta.»

### F3 — Accampamento goblin

**Stealth (`DESTREZZA`)**

- `bigwin` — «Vi piazzate alle loro spalle senza un sospiro. Colpirete per primi.»
- `win` — «Nell'ombra fino all'ultimo passo.»
- `almost` — «Quasi — un ramo spezzato vi costa il vantaggio perfetto.»
- `fail` — «Pietre rotolano sotto i piedi. Il campo vi ha visti.»
- `epicfail` — «Inciampate in un filo di latta. Ogni goblin è sveglio.»

**Assalto (`FORZA`)**

- `bigwin` — «La carica li travolge prima ancora che urlino.»
- `win` — «Sfondando la linea, il primo colpo è vostro.»
- `almost` — «Il campo si accorge di voi un battito prima dell'impatto.»
- `fail` — «La carica si smorza nel fango. Nessun vantaggio.»
- `epicfail` — «Vi schiantate contro le palizzate. Nessun vantaggio — e male alle ossa.»

### F4 — Combattimento (per turno)

**Check `FORZA` del turno (attacco ai goblin)**

- `bigwin` — «Un'ondata perfetta: i goblin crollano a grappoli.»
- `win` — «Il party colpisce. Un goblin in meno.»
- `almost` — «Sfiorano la rotta — il colpo arriva, ma i goblin reggono.»
- `fail` — «I goblin schivano e riempiono il vuoto.»
- `epicfail` — «L'assalto si spezza sui loro scudi. Rispondono al contrattacco.»

**Colpi subiti (profilo slot)**

- Danno — «{nome} incassa il colpo.»
- Ferita — «{nome} resta a terra, ferito.»
- Morte — «{nome} non si rialza.»
- Bodyguard che assorbe — «{bodyguard} si frappone e prende il colpo per {nome}.»

**Fine fase**

- Vittoria — «Il campo è conquistato. I superstiti scappano.»
- Wipe — «L'ultimo respiro si spegne nel fango. La quest finisce qui.»

### F5 — Incalzare

- Scelta «lasciarli fuggire» — «Li guardate disperdersi nel bosco. Torneranno.»
- `bigwin` — «Li raggiungete sul crinale. Non ne resta nessuno.»
- `win` — «La caccia è breve. L'ultimo goblin cade.»
- `almost` — «Vi sfuggono per un soffio, feriti e sparsi. Saranno un'ombra sulla via del ritorno.»
- `fail` — «Scappano tra le rocce, ridendo. Vi aspetteranno sulla via del ritorno.»
- `epicfail` — «Vi trascinano in un contrattacco. Scappano — e sanno dove siete.»

### F6 — Continua l'esplorazione (per turno)

**Check `INTELLIGENZA` o `PERCEZIONE`**

- `bigwin` — «Un nascondiglio intatto: il bottino migliore del campo.»
- `win` — «Tra le tende bruciate, qualcosa di valore.»
- `almost` — «Un bottino misero — e una ferita in più.»
- `fail` — «Solo cenere e spine. Il campo non offre altro.»
- `epicfail` — «Il terreno cede sotto il peso della ricerca.»

- Scelta «fermarsi» — «Avete preso abbastanza. Si torna a casa.»

### F7 — Ritorno

- Ritorno pulito (F5 riuscita) — «Il villaggio vi vede arrivare col trofeo. Eroe.»
- Agguato mite — «Una freccia isolata dal ciglio della strada. Erano pochi, e stanchi.»
- Agguato peggiorato — «Frecce da ogni lato. Vi aspettavano da ore.»
- Lasciare il trofeo — «Gettate la testa nel fosso e correte. La quest è persa.»
- Affrontare (vittoria piena) — «L'ultima mischia. Quando è finita, il trofeo è ancora vostro.»
- Affrontare (perdite) — «Ne esce solo chi era davanti. Gli altri sono rimasti sulla strada.»
- Wipe — «La strada non vede più nessuno tornare.»

**Combattimento dell'agguato (per turno — stessa struttura di F4, struttura esatta aperta)**

- `bigwin` — «Li avevate già piegati una volta. Non cambia nulla.»
- `win` — «La mischia gira a vostro favore.»
- `almost` — «Tenete la strada, ma il sangue scorre.»
- `fail` — «Sono più organizzati di quanto sembrassero.»
- `epicfail` — «La trappola si chiude intorno a voi.»

**Reward al ritorno**

- Trofeo consegnato — «Le teste sul banco del giudice. Il premio è oro sonante.»
- XP — «La strada insegna. (+XP)»

### Linee comuni (qualsiasi fase)

- Checkpoint «ritirati» — «La quest resta a metà. Meglio vivi che eroi.»
- Checkpoint «continua» — «Avanti.»
- Consumabile Bonus Forza — «I muscoli si tendono. La Forza risponde.»
- Consumabile Bonus Percezione — «Gli occhi si acuiscono. Nulla sfugge.»
- Consumabile Healing — «La ferita si chiude. +20 HP.»
- Ferita di un PG — «{nome} si rialza a fatica. Per giorni non combatterà.»
- Morte di un PG (fuori F4) — «{nome} non si rialza. Il posto dietro resta vuoto.»

---

## Note aperte (da chiudere col Director)

**Chiusi 2026-10-06:** XP sempre · trofeo → reward reale al ritorno (Gold per
ora) · nessun vincolo min/max party (mock: 4 slot) · escalation piatta dopo
T3 con valori placeholder · consumabili solo prima di check/scelta · F4 =
1 colpo a T1–T2, 2 colpi da T3 a bersagli diversi · F1-PERCEZIONE → bonus
Stealth F3 · F3 semplificato (stesso bonus, rischio diverso) · F5 a bande:
`almost` = fallimento (agguato mite), `fail` = agguato peggiorato,
`epicfail` = danni + agguato peggiorato · F6/F7 = greed trap voluta ·
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
- Testi per esito: prima bozza completa, da rifinire durante il playtest.
