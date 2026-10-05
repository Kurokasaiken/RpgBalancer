---
title: Quest scenario spec — «Le Rovine sotto il Fiume»
type: spec
status: implementato nel lab S1 (`src/ui/idleVillage/questS1Lab/questScenarioRovine.ts`) — spec conservata per verifica/regressione (R-083)
updated: 2026-10-05
provenance: copia tracciata di `.mw/runs/20261004-rovine-preview-chatgpt/rovine-mockup.md` (gitignored) — mockup da conversazione ChatGPT 2026-10-04, implementato in codice
---

# Mockup quest — «Le Rovine sotto il Fiume»

> Da conversazione ChatGPT 2026-10-04 (condivisa dal Director).
> Status: PROPOSAL. Intento Director: *"la voglio implementare come mockup"*.
> Struttura deterministica nella forma; outcome e durata simulati dai dadi.

## 0. Contesto

- **Tipo:** esplorazione / recupero
- **Durata base:** 5 giorni — **Durata effettiva:** 4–9 giorni
- **Valore:** medio-alto — **Rischio:** alto
- **Requisito principale:** Forza
- **Requisiti secondari:** Percezione, Costituzione, Destrezza

**Party di riferimento**

| Persona | Ruolo | Stato iniziale |
|---|---|---|
| Eroe | Leader | Sano, Riposato |
| Villager A | membro | Sano |
| Villager B | membro | Sano |
| Villager C | membro | Sano |

L'eroe ha +25% sulla stat principale della quest.

## 1. Partenza — schermata

```
LE ROVINE SOTTO IL FIUME

Un mercante sostiene di aver trovato un'antica entrata sotto il fiume.
Dice che dentro c'è ancora qualcosa di valore.
Non è riuscito a entrare.

Durata stimata: 5 giorni
Ricompensa stimata: 100–180 oro + possibile bottino
Rischio: Alto

PARTY: Eroe — Leader / Villager A / Villager B / Villager C
```

**Perché esiste questa quest:** non «vai lì, tira dadi, prendi oro». Mette il
giocatore nella situazione: *«Ho una buona occasione davanti. Quanto sono
disposto a rischiare uomini e tempo per sfruttarla?»*

## 2. Fase I — Il Mercante

Il party incontra il mercante prima di entrare. Prima scelta risk/reward —
non due «abilità equivalenti» ma sicurezza vs rischio:

- **OSSERVA** (Percezione) — rischio quasi nullo, informazioni sulla zona,
  ricompensa normale.
- **INCALZA IL MERCANTE** (Forza + Percezione) — maggiori informazioni,
  possibile ricompensa extra, piccolo rischio.

Risultato esempio: `12 + 3 = 15` vs DC 12 → SUCCESSO. Il mercante rivela:
*«Le guardie non stanno proteggendo l'ingresso. Stanno proteggendo qualcosa
più avanti.»* — informazione utile più avanti (le guardie non sono un
ostacolo casuale).

## 3. Fase II — Il Fiume Sotterraneo

Passaggio obbligatorio. **Check FORZA + COSTITUZIONE** — non una scelta: una
prova di capacità.

- **Successo:** passano, +0 giorni.
- **Quasi:** passano, ma +1 giorno oppure piccola conseguenza su un membro.
- **Fallimento:** la corrente trascina il gruppo → +1–2 giorni + tiro per le
  conseguenze fisiche.

Perché: la quest deve consumare realmente il party; non tutte le conseguenze
sono «hai perso il combattimento».

## 4. Fase III — Le Guardie

Grande galleria, due guardie davanti al passaggio. Vera decisione:

- **OPZIONE A — PASSARE DI SOPPIATTO (Destrezza):** rischio relativamente
  basso. successo → nessun danno; almost → piccolo danno; fail →
  danno/ferita; epicfail → possibile morte. Ricompensa normale.
- **OPZIONE B — AFFRONTARLE (Forza):** rischio elevato. successo → bottino
  delle guardie; bigwin → bottino maggiore; almost → feriti; fail → danni
  importanti; epicfail → rischio di morte.

La vera scelta: *«Quanto sono disposto a pagare per ottenere più valore?»* —
non «quale pulsante dà +10%».

## 5. Conseguenze del check (modello)

1. **Verdict del party:** EPICFAIL / FAIL / ALMOST / WIN / BIGWIN.
2. **Roll individuale** per ogni membro esposto: nessuna conseguenza /
   ferita / morte.

Il **delta fra skill richiesta e skill del party** modifica la distribuzione:
party molto sopra il requisito → stessa quest, molto meno letale; appena
sufficiente → quest costosa; sotto → realmente pericolosa.

## 6. Fase IV — La Sala del Tesoro

Il tesoro è visibile, ma qualcosa non torna. **Check PERCEZIONE:**

- **SUCCESSO:** vede la trappola → scelta: **PRENDI IL TESORO** (ricompensa
  normale) oppure **CERCA UN MODO SICURO** (più tempo; possibilità di
  ricompensa maggiore; riduzione del rischio; eventuale informazione
  aggiuntiva). Scelta tempo vs sicurezza vs valore.
- **FALLIMENTO:** la trappola scatta → check automatico **TRAPPOLA
  (Destrezza + Costituzione)**: fail → feriti, possibile morte, +1 giorno;
  successo → si esce dalla trappola ma il tesoro è parzialmente danneggiato.

Nota: un successo dopo un fallimento **non** resetta lo stato.

## 7. Checkpoint — il momento centrale

Il party ha il tesoro; il gioco si ferma e mostra:

```
ROVINE SOTTO IL FIUME — Avete trovato il tesoro.
Bottino attuale: 143 oro · Tempo trascorso: 5 giorni
Party: Eroe sano · A sano · B ferito · C sano
Rischio attuale: Alto
Davanti a voi c'è un altro passaggio.

[TORNA AL VILLAGGIO] — Conserva tutto ciò che hai trovato.
[CONTINUA A ESPLORARE] — Potrebbe esserci qualcosa di molto più prezioso.
```

Il cuore della quest: il giocatore non rischia «potrei guadagnare altri
50 oro» — rischia «potrei perdere i 143 che ho già». (TAKEN ≠ SECURED.)

## 8. Fase V — Oltre il tesoro (attrition non evitabile)

Se continua: seconda camera, zona instabile. **Non c'è un check da vincere**:
si paga il prezzo inevitabile dell'esplorazione — +1 giorno, piccolo danno al
party (un ferito diventa più grave / nuovo ferito / nessuna ferita).

Principio: impedisce l'idea «se sono abbastanza bravo elimino il costo del
push-your-luck». Continuare **deve** costare qualcosa.

## 9. Fase VI — La camera profonda (ricompensa opzionale)

Non un altro dungeon: una singola scoperta — un antico deposito.
+60–120 oro + possibilità di oggetto raro; ma +1–2 giorni e nuovo rischio.
Secondo push-your-luck: «ho già guadagnato abbastanza» vs «sono arrivato fin
qui».

## 10. Fase VII — Ritorno (evento, non «quest complete»)

Evento generato sul ritorno. Esempio — *un uomo ferito vi chiede aiuto:*

- **AIUTALO** — consuma un consumabile/healing → possibile +50 oro.
- **LASCIATELO** — nessun costo.
- **PRENDETELO CON VOI** — tempo aggiuntivo, possibile ricompensa futura.

## 11. Fine quest — vero resoconto

```
ROVINE SOTTO IL FIUME — COMPLETATA
Durata: 7 giorni
Ricompensa: +203 oro · 1 oggetto · informazioni sulla zona
Costo: 1 villager ferito · 0 morti
Human-days utilizzati: 4 × 7 = 28 human-days
Villager B: FERITO — indisponibile per 3 giorni
```

Il costo reale continua **dopo** la fine della quest.

## 12. Regola del leader (direttiva Director)

Il leader non è semplicemente un membro del party: è **il limite operativo
della spedizione**. Finché Leader = sano + non stanco, il villaggio può
continuare a mandare party in quest se esistono altri umani disponibili.

Esempio: G1 Leader+A+B+C → quest 1; G5 A torna ferito ma il leader è
operativo → quest 2 con Leader+C+D; G9 il leader torna STANCO → capacità di
quest bloccata fino al riposo.

Risultato: gli umani sono un **pool**; ogni quest prende `uomini × tempo` e
produce `valore + informazioni + progressione`, creando `feriti + stanchezza
+ morti + indisponibilità futura`. Il leader è il collo di bottiglia
strategico.

## Juice checklist (momenti da produrre)

1. **Curiosità** — «cosa c'è sotto il fiume?»
2. **Primo rischio** — «provo a spremere informazioni dal mercante?»
3. **Competenza** — «questo party è davvero capace?»
4. **Paura** — «abbiamo già un ferito»
5. **Ricompensa** — «abbiamo trovato il tesoro»
6. **Avversione alla perdita** — «se continuiamo possiamo perdere tutto»
7. **Tentazione** — «là dietro c'è sicuramente qualcos'altro»
8. **Conseguenza** — «200 oro, ma B sarà fuori tre giorni»
9. **Memoria** — «quella è stata la quest in cui B si è fatto male»

Anti-obiettivo: il giocatore non deve finire pensando «ho fatto 6 check» ma
«siamo entrati, abbiamo rischiato, B si è fatto male, potevamo continuare ma
abbiamo deciso di tornare». Differenza fra skill-check system e spedizione.
