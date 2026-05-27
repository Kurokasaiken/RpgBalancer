# GDD — Primo Loop: dal Boot alla Prima Quest

> Documento di design del flusso completo dalla schermata iniziale al completamento della prima quest.
> Versione: 0.1 — Work in Progress

---

## Struttura Psicologica del Loop

Il giocatore attraversa 8 stati emotivi in sequenza. Tutto il design serve a creare questi stati, non a insegnare regole.

| Stato | Sensazione | Trigger |
|---|---|---|
| 1. Vulnerabilità | "sono rotto" | Stato iniziale PG (HP parziali, debuff) |
| 2. Minaccia silenziosa | "ho un debito" | Upkeep visibile ma non spiegato |
| 3. Sollievo minimo | "oggi sopravvivo" | Primo job completato |
| 4. Stabilità fragile | "respiro appena" | Giorno 2 senza debuff |
| 5. Ambizione | "forse posso crescere" | Training POI disponibile |
| 6. Pressione temporale | "quella quest scade" | Quest con countdown |
| 7. Preparazione strategica | "se ottimizzo ce la faccio" | Calcolo risorse/stat vs requisiti |
| 8. Rinascita | "ce l'ho fatta" | Quest completata, inn possibile |

---

## Beat-by-Beat: Minuto 0 → Prima Quest

### APERTURA — Giorno 0, Notte (Minuti 0-3)

**Stato del mondo:**
- Mappa silenziosa. Notte. Luci fioche.
- Un solo medaglione nel roster: l'eroe.
- HP: ~60% max. Stamina: ~40% max.
- Status attivi: *Ferito*, *Esausto*.
- Oro: 0. Legna: 0.
- **Tempo fermo.**

**Cosa fa il giocatore:**
Il pannello dettaglio PG si apre automaticamente (o il giocatore ci clicca). Vede:
- Nome, stats, barre HP/Stamina parziali
- Status icons con colori (giallo/arancione = attenzione)
- Upkeep: `⚙ 5 oro / giorno` — sempre visibile, non commentato
- Nessun tutorial. Nessun popup.

**Cosa impara senza che nessuno glielo dica:**
- Il personaggio è in cattive condizioni
- Qualcosa "costa" ogni giorno

**Log entry:**
> 🌙 Notte, Giorno 0 — *"Sono arrivato tardi, stanco e con le ossa rotte. Il villaggio dorme."*

---

### PRIMA NOTTE → MATTINA — Giorno 1 (Minuto 3-6)

**Il giocatore fa scorrere il tempo** (barra spazio / click POI ciclo giorno-notte).

**Transizione notte→giorno:**
- Animazione breve (1-2 sec): cielo che schiarisce, suoni del villaggio
- Prima volta: non skippabile

**Momento upkeep (silenzioso):**
- HUD oro: piccolo tremolio, tenta di scalare 5. Va a 0. Resta 0.
- Il medaglione acquisisce un **halo rosso sottile**
- Compare icona 🍲 (scodella vuota) sul medaglione
- Nessun popup. Nessun modal.

**Log entry:**
> ☀️ Mattina, Giorno 1 — *"Nessuna moneta per il vitto. Stomaco vuoto."*

**Effetto gameplay (DEBUFF: Affamato):**
- Efficienza lavoro: -40%
- Stamina recovery: -50%
- Tutte le stat: -0.5 (visualizzato nella barra come trattino rosso)

---

### PRIMO JOB — Giorno 1 (Minuto 6-10)

**Il giocatore vede i POI:**
- Setaccio dell'Oro (🪙) — income puro
- Taglialegna (🪵) — income misto oro/legna

**Con debuff attivo:**
- Setaccio: 5 oro/giorno (pareggio esatto — nessun progresso)
- Taglialegna: 3 oro + 4 legna/giorno (deficit di 2 oro)

**Il giocatore intuitivamente sceglie Setaccio.**
Assegna il PG → halo ambra sul medaglione → timer di lavoro.

**Atmosfera:** animazione lenta, calma. Niente dopamine spam. Il personaggio lavora. Il tempo scorre.

**Notte automatica:**
- PG estratto automaticamente dal job
- Oro ricevuto: 5
- Upkeep pagato: -5 → Oro: 0
- HP e Stamina parzialmente recuperate
- Debuff rimosso

**Log entry:**
> ⚒️ Pomeriggio, Giorno 1 — *"Ho lavorato più lentamente del solito. Le ferite si fanno sentire."*
> 🌙 Notte, Giorno 1 — *"Cena tiepida. Stamattina sembrava impossibile."*

---

### STABILITÀ — Giorno 2 (Minuto 10-15)

**Nessun debuff. Il giocatore respira.**

**Lavoro normale:**
- Setaccio: 9 oro/giorno
- Upkeep: -5 → **+4 surplus**

**Giorno 2, compare nuovo POI:**
- Training POI (💪) — piccola animazione/glow per attirare l'attenzione
- Overlay narrativo minimale: *"Un vecchio soldato osserva il tuo stato."*

**Allenamento:**
- Costo: 2 oro/sessione
- Gain: +0.3 Might/sessione
- Max 2 sessioni/giorno

**Decisione del giocatore:** lavorare tutto il giorno (9 oro, +4 surplus) o investire in allenamento (9 - 2 = 7, upkeep coperto, +0.3 Might).

**Log entries possibili:**
> ☀️ Mattina, Giorno 2 — *"Ho contato le monete tre volte. Bastano."*
> 💪 Pomeriggio, Giorno 2 — *"Ho ripreso ad allenarmi. Lentamente, ma ci sono."*

---

### QUEST — Giorno 3

**Compare sul calendario e sulla mappa:**

```
📜 BATTUTA DEL CINGHIALE NERO
"Un cinghiale di dimensioni innaturali devasta i boschi del nord.
 Il consorzio dei cacciatori offre una ricompensa."

Requisiti:
  💪 Might 2.5
  🪵 15 legna
  ⏳ Scade: Giorno 8

Ricompensa:
  🪙 40 oro
  ⭐ 250 XP
  🪵 30 legna
```

**Il countdown è visibile sulla mappa** sul POI della quest. Colore verde → giallo → rosso al diminuire.

**Le barre stat nel pannello PG mostrano una tacca** al livello 2.5 — il giocatore vede visivamente quanto manca senza fare calcoli espliciti.

**Log entry:**
> 🧭 Mattina, Giorno 3 — *"In giro si parla di un cinghiale nero che devasta i boschi del nord. C'è chi paga. E non ho molto tempo."*

---

### PREPARAZIONE — Giorni 3-6

**Il giocatore deve:**
1. Accumulare 15 legna (Taglialegna: ~8 legna/giorno normale)
2. Raggiungere Might 2.5 (parte da 1.0, serve +1.5 = 5 sessioni)
3. Pagare l'upkeep ogni giorno (5 oro)

**Percorso ottimale (non ovvio, scoperto dal giocatore):**

| Giorno | Azione | Risultato |
|---|---|---|
| 3 | Taglialegna (niente allenamento) | +8 legna, oro ok |
| 4 | Setaccio + 1 sessione allenamento | +4 surplus, Might +0.3 |
| 5 | Taglialegna + 2 sessioni allenamento | 7 legna totali, Might +0.6 |
| 6 | Taglialegna + 2 sessioni | 15 legna ✓, Might 2.5 ✓ |

**L'opportunity cost è reale:** ogni giorno di solo allenamento è un giorno senza legna (e viceversa). Il giocatore sente il peso delle decisioni.

---

### VENDOR — Giorno 7 (nel calendario dal Giorno 0)

Visibile nel calendario eventi come icona 🧳 da subito. Non spiegato.

**Cosa porta:**
- 🏹 Licenza di Caccia (30 oro) — sblocca categoria quest di caccia
- 🪤 Schema: Trappola (15 oro) — abilita quest di cattura/ricognizione
- 💎 Ingrediente raro (25 oro) — necessario per craft equipaggiamento

**Rimane 2 giorni.** Poi sparisce. Ritorna dopo 10-15 giorni (semi-random).

La Licenza di Caccia diventa l'obiettivo di medio termine — "risparmia 30 oro per quando arriva il vendor". Crea risparmio intenzionale senza dirlo.

---

### QUEST — Giorno 6 o 7

**Il giocatore ha i requisiti. Assegna il PG alla quest.**

La quest è un job speciale — il PG esce dal villaggio, il suo medaglione appare "in missione" (posizione diversa sulla mappa, animazione diversa).

**Completion:**
- Riceve 40 oro + 250 XP + 30 legna
- HP scende parzialmente (combattimento)
- Status: *"Esausto"* (non *Ferito*)

**Log entry:**
> ⚔️ Sera, Giorno 7 — *"Era più grande di quanto mi aspettassi. Ma è caduto. Ho contato l'oro tre volte, questa volta per un motivo diverso."*

---

## Sistema Narrativo: Regole di Generazione

### Principio base
Ogni evento di sistema genera **una riga nel log**. Mai gameplay speak. Sempre diegetico.

### Struttura visiva
```
[icona]  [Periodo, Giorno X] — "testo narrativo breve"
```

### Categorie e icone
- 🌙 Notte / riposo
- ☀️ Mattina / upkeep
- ⚒️ Lavoro (job)
- 💪 Allenamento
- 📜 Quest / rumor
- 🧭 Vendor / eventi futuri
- ⚔️ Combattimento / missione
- 🏗️ Costruzione
- ⭐ Milestone (stat raggiunta, edificio costruito)

### Varianti per evitare ripetizione
Ogni evento ha 4-5 varianti di testo. La scelta dipende da:
- Giorno progressivo (tono più speranzoso man mano che si stabilizza)
- Stato HP (se ferito, tono più cupo)
- Stato economico (se in surplus, tono più rilassato)

### Tono target
Stoico. Stanco. Determinato. Mai eroico, mai drammatico. Come un diario di campo, non come un romanzo.

---

## Economia: Tabella Riassuntiva

| Parametro | Valore | Note |
|---|---|---|
| Upkeep giornaliero | 5 oro | Fisso, round, sempre visibile |
| Setaccio dell'Oro (normale) | 9 oro/giorno | +4 surplus dopo upkeep |
| Setaccio dell'Oro (con debuff) | 5 oro/giorno | Pareggio esatto |
| Taglialegna (normale) | 5 oro + 8 legna/giorno | -0 surplus, ma accumula legna |
| Taglialegna (con debuff) | 3 oro + 4 legna/giorno | Deficit -2, usare solo se necessario |
| Allenamento (per sessione) | 2 oro / +0.3 Might | Max 2 sessioni/giorno |
| Might iniziale | 1.0 | Combattente, non novizio |
| Might richiesto (prima quest) | 2.5 | 5 sessioni da Might 1.0 |
| Reward prima quest | 40 oro + 250 XP + 30 legna | Respiro, non risoluzione |
| Inn: legna necessaria | 50 legna | Quest ne dà 30 → mancano ancora 20 |
| Vendor: Licenza Caccia | 30 oro | Obiettivo medio termine |

---

## Elementi Visivi: Checklist Vertical Slice

### Già definiti nel design
- [x] Mappa con POI (job, training, quest, vendor)
- [x] Medaglione PG con HP bar e Stamina bar
- [x] Pannello dettaglio PG (stat, status, upkeep)
- [x] HUD risorse (oro, legna)
- [x] Status icons sul medaglione (colori semantici)
- [x] Icona ciclo giorno/notte cliccabile (o barra spazio)
- [x] Chronicle log panel (scorrevole, storico permanente)

### Da aggiungere / dettagliare

- [ ] **Indicatore upkeep sempre visibile** nell'HUD (es. `🔥 5/g` vicino al contatore oro). Non solo nel pannello PG.
- [ ] **Countdown quest sulla mappa** (barra o numero giorni sul POI, verde→rosso).
- [ ] **Calendario eventi futuri** — striscia orizzontale 10 giorni. Vendor, quest in scadenza, eventi. Giorno corrente evidenziato.
- [ ] **Animazione transizione notte→giorno** — breve (1-2 sec), non skippabile alla prima. Dà ritmo psicologico.
- [ ] **Momento upkeep visivo** — tremolio dell'HUD oro + halo rosso sul medaglione. Silenzioso, no popup.
- [ ] **Target line nelle stat bar** — tacca visiva nella barra stat che indica il requisito della quest attiva.
- [ ] **Stato "notte" sul job** — quando arriva la notte e il PG viene estratto, piccola animazione (luna / lucchetto che si chiude) sul POI.
- [ ] **Tally snapshot giornaliero** nel log — riga neutra a fine giornata: `Giorno 3: 💰 12 oro · 🪵 8 legna · 💪 Might 1.6`
- [ ] **Halo stati sul medaglione** — colori semantici chiari: rosso = critico (affamato), giallo = attenzione (ferito), ambra = in lavoro, blu = in allenamento, bianco = ok.
- [ ] **"In missione" state** — quando il PG è in una quest, il medaglione ha posizione/aspetto diverso rispetto al job normale.

---

## Quest: Sistema Semi-Random

### Early game (Giorni 1-10)
Quest **curate** — sempre le stesse per ogni run. Permettono di calibrare il pacing e garantire la curva emotiva corretta.

### Mid/late game (Giorni 11+)
Quest estratte da **pool tematici** con pesi. Regole:
- Non 2 quest della stessa categoria consecutive
- Sempre almeno 1 quest a scadenza lunga (respiro)
- Sempre almeno 1 quest a scadenza breve (pressione)
- Pesi basati su risorse disponibili (se il player ha molta legna, aumenta prob. di quest che la usano)

### Struttura di una quest
```
NOME EVOCATIVO (non "Quest 01")
Descrizione breve — narrativa, non sistemica
Requisiti: stat + risorsa + eventuale equip
Ricompensa: oro + XP + risorsa speciale
Countdown: X giorni
Rischio: basso / medio / alto
```

---

## Note Aperte

- [ ] Definire come appare visivamente la "Quest disponibile" sulla mappa (glow? animazione?) senza essere un popup invasivo
- [ ] Decidere se la prima quest è sempre "Cinghiale Nero" o se il nome è random con struttura fissa
- [ ] Definire XP system — come si usa? Livelli? Stat unlock?
- [ ] Inn: cosa sblocca esattamente? Cosa cambia il gameplay quando è costruita?
- [ ] Vendor: frequenza esatta della rotazione (ogni 10-15 giorni — decidere se fisso o variabile)
- [ ] Possibile secondo PG: quando appare? Cosa cambia nell'economia?
