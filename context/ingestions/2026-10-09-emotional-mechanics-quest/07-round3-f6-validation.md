# Round 3 — Validate Before Designing: F6 Push-Your-Luck

**Status**: completato (misurazioni eseguite, report finale)
**Data**: 2026-10-10
**Decisione Director (R-109, 2026-10-10)**: BE@6% approvato come **baseline
sperimentale** (non bilanciamento finale); gate pre-implementazione = sweep
ramp 4–8% × party diversi → **eseguita, esito in §5.6**; vincolo fairness:
bust comprensibile in cause e conseguenze, non prevedibile nel momento esatto.
**Vincolo rispettato**: nessuna modifica a codice produzione, spec canoniche o plan.
L'esperimento è interamente contenuto in `f6-pushluck-experiment.ts` (artefatto di
ricerca, non produzione) e negli output grezzi `results-f6-*.txt` in questa cartella.

> Nota ambientale: il working tree del Director ha un refactor S2.1 in corso;
> `src/balancing/config/idleVillage/quests/scenarios/rovine.ts` definisce
> `ROVINE_SCENARIO_AUTHORED` senza il campo `nodes` e `parseQuestScenario` fallisce
> all'import (ZodError). Anche lo script MC esistente `scripts/quest-goblin-mc.ts`
> fallisce con lo stesso errore: il problema è pre-esistente, non introdotto
> dall'esperimento. Tutte le misure qui sotto girano su un worktree a HEAD
> (`40b37e59`), dove `questRun.ts` è **identico** al working tree (diff verificato:
> zero modifiche). Le conclusioni sul motore sono quindi valide per entrambi.

---

## 1. Audit mirato di F6 — FACT verificati nel codice

File: `src/ui/idleVillage/questS1Lab/questRun.ts` (HEAD `40b37e59`, identico al WT).

| # | FACT | Dove |
|---|------|------|
| F1 | Il loop F6 è il nodo `choice` `gob-esplora-extra`; l'azione `gob-fruga` risolve il check `gob-cerca`, `gob-fermati` esce dal loop. | `applyNodeOutcome`, `case 'gob-cerca'` ~L1580 |
| F2 | Ogni `gob-cerca` incrementa `state.exploreTurn`; il danno è `TUNE.exploreBaseDamage * exploreTurn` = **5,10,15,20… HP**, applicato **prima** del verdetto via `positionalDamage`. | L1581-1583; TUNE L264 |
| F3 | Loot F6: `win`/`bigwin` → `+8 gold` a `state.gold` + item `'bottino del campo'`; `almost` → `+4`; `fail`/`epicfail` → niente. **L'oro F6 entra subito nel saldo: non esiste alcuna "pila" — è già secured.** | L1587-1592; TUNE L265 |
| F4 | Il danno F6 usa `positionalDamage` → `pickPositionalTarget` con `positionalWeights(4)=0/0/20/80` (rear-weighted, senza escalation turn — `turn` non passato: sempre profilo base). | L386-389, L297-312 |
| F5 | Il bodyguard intercetta solo i **harm dei check** (`interceptable` flag, L528-549). Il danno posizionale F6 **non passa** per quel path: estendere la copertura richiede modifica engine. | L528-549 vs L386-389 |
| F6 | `flee()` è sempre disponibile: esito `fled`, conserva `state.gold` e il loot non-obiettivo, **l'obiettivo viene droppato** se `objectiveDone`. | L783-796, `dropObjective` L766+ |
| F7 | Trofeo: `gob-combattimento` pone `objectiveDone=true` e push `'trofeo dei goblin'` in `loot` ("in mano, non ancora al sicuro"). Conversione a `+50 gold` solo al nodo `end` **se il leader è vivo**; altrimenti la run può chiudere `survived` senza reward. | L2000-2004, L1798-1801, L1814-1824; TUNE L266 |
| F8 | Se tutta la squadra muore (qualunque fonte, incl. danno F6) → `wipe`. F6 **non ha cap di turni**: la policy "continua sempre" produce wipe ~100% (misurato). | `endRun` L734+; §4 |
| F9 | Il check F6 usa `groupScore` = competenza aggregata del party vivo; non esiste una scelta "chi fruga". | `groupScore` L467+ |
| F10 | `scripts/quest-goblin-mc.ts` guida il motore reale (`createRun`/`applyChoice`/`flee`/`useHealing`/`nodesFor`) → **rappresenta fedelmente il comportamento authored**; non copre varianti (pila, frugatore scelto, copritore, controfattuali, CI, sensitivity). | `scripts/quest-goblin-mc.ts` |
| F11 | RNG deterministico: `roll(state)` consuma `state.seed`/`state.rngCalls` → run identiche per stesso seed ⇒ i seed accoppiati confrontano le policy a parità di estrazioni. | `createRun` L638+, `roll` |

**Correzione al briefing Round 2** (il codice prevale): il danno posizionale F6
non usa l'escalation per-turn di `positionalWeights` (il parametro `turn` non è
passato da `positionalDamage` → profilo base 0/0/20/80). L'escalation T1→T3 esiste
solo nel combat check, non in F6.

---

## 2. Varianti testate

| Variante | Regola | Stato toccato | Costo impl. | Nota |
|---|---|---|---|---|
| **A** baseline | F6 attuale: nessuna pila, nessun bust | — | — | FACT |
| **B** | bust = verdetto `fail`/`epicfail` sul fruga → perdi la **pila F6** (delta gold accumulato in F6) e gli item `bottino del campo` | `f6Pile` | basso | bust ~53%/turno (P[fail∪epicfail] col bound del party) |
| **B5** | bust solo su `epicfail` (~5%/turno) | `f6Pile` | basso | coda rara dello stesso verdetto |
| **BE** | bust = **trappola indipendente dal check**, P = `exploreTurn × ramp`; testata a ramp 6/8/12%/turno | `f6Pile` + 1 roll extra | basso | disaccoppia "trovato" da "colto"; ramp cresce con l'avidità |
| **C** | frugatore scelto: sua competenza decide il check **e** si espone allo slot posteriore (80%) | `f6Pile` + pick UI | medio | accoppia competenza↔esposizione |
| **C-cover** | come C + copritore scelto che assorbe i colpi destinati al frugatore | + pick UI | medio-alto | richiede hook su `positionalDamage` (F5) |

In tutte le varianti: loot pre-F6 e trofeo seguono le regole attuali (F7); la pila
è solo oro F6 non messo in sicurezza; `gob-fermati` converte la pila in `state.gold`.

---

## 3. Metodo

- **Driver**: il motore reale (`createRun`, `applyChoice`, `useHealing`,
  `nodesFor`); le varianti sono applicate come mutazioni post-risoluzione
  (pila = delta gold dall'ingresso in F6; trap = roll deterministico esterno).
- **Seed accoppiati**: seed 1..N identici per ogni cella ⇒ differenze = causali.
- **N = 2000/cella** (griglia principale), N = 1000 (sensitivity). CI 95% = ±1.96·SE.
- **Party**: `default` (4 PG completi) e `weak` (−10 stats, −15 maxHp — proxy di
  "party debole/leader mancante").
- **Policy**: `stop2`, `stop4` (giri fissi), `hp40` (soglia salute), `ev`
  (continua se EV marginale > 0, con HP pesato 0.35g/hp), `always`.
- **Frugatore**: `best` (max int+perc), `worst`, `tank` (max hp). **Copritore**:
  `tank` / `weak` (min hp).
- **Regret probe**: all'ultima decisione "continua" di ogni run, clone dello
  stato → controfattuale *stop-ora* vs *continua-una-volta*, stesso seed.

---

## 4. Risultati (party default, N=2000, seed accoppiati)

### 4.1 La curva della temperatura del bust — il risultato centrale

| variante | meccanismo bust | stop2 E[g] | stop4 E[g] | stop4 bust% | stop4 lostμ | ev E[g] | ev fruga μ |
|---|---|---|---|---|---|---|---|
| A | nessuno | 56.4±0.3 | **62.6±0.5** | 0% | 0 | 55.7 | 1.8 |
| B5 | epicfail 5%/t | 56.2 | 61.8±0.5 | 8% | 0.8g | 54.5 | 1.4 |
| **BE@6** | **trap 6%/t** | 55.5 | **57.4±0.5** | **39%** | **5.2g** | 54.2 | 1.4 |
| BE@8 | trap 8%/t | 55.2 | 55.8±0.5 | 50% | 6.8g | 54.1 | 1.4 |
| B | fail+epic ~53%/t | 54.5 | 55.0±0.5 | 67% | 7.6g | 54.5 | 1.4 |
| BE@12 | trap 12%/t | 54.6 | 53.5±0.4 | 66% | 9.1g | 53.9 | 1.4 |
| A always | — | — | 29.7 | — | — | wipe 100% | 8.9 |

**Dispersione gold tra policy di spinta** (stop4 − ev): A +6.9g · B5 +7.3g ·
**BE@6 +3.2g** · BE@8 +1.7g · B +0.5g · BE@12 −0.4g.

EVIDENCE → INFERENCE:
- **A**: F6 oggi è una **tassa HP pura** — l'oro cresce coi turni, l'unico freno è
  la sopravvivenza. La scelta esiste già (frontiera oro↔vite: hp40 50.1g/0.28d →
  stop4 62.6g/1.64d) ma è unidimensionale.
- **B (verdetto-accoppiato) è troppo caldo**: ~53%/turno ⇒ fermarsi diventa
  quasi dominante in oro (dispersione collassa a 0.5g); il push-your-luck muore
  perché continuare non è quasi mai razionale oltre il turno 1-2.
- **B5 è troppo freddo**: bust 8%, impatto economico decorativo (~0.8g medi) —
  diventa una "sorpresa rara", non un driver decisionale.
- **La zona vivibile è ~6%/turno indipendente**: BE@6 mantiene la tentazione
  (stop4 +1.9g su stop2) mentre il 39% delle spinte profonde perde la pila
  (media 5.2g). È l'unico punto misurato dove *entrambi* i lati della decisione
  sono vivi: continuare paga **e** brucia.

### 4.2 Frugatore scelto (C, bust B su pila)

| pick | stop4 E[g] | stop4 dead μ | danno F6 concentrato |
|---|---|---|---|
| nessuno (B) | 55.0 | 1.64 | Bruna 23.8hp (rear naturale) |
| best (Milo) | **55.2** | **1.37** | Milo 37.5hp |
| worst | 52.7 | 1.66 | Bruna 24.3hp |
| tank (Edda) | 53.2 | **1.04** | Edda 39.9hp |

EVIDENCE: la scelta del frugatore sposta ~+2.0g (best vs worst) e ~−0.6 morti
medi (tank vs worst) — **trade-off reale, nessuna dominanza**: mandare il più
competente massimizza il bottino ma concentra il sangue su di lui; mandare il
tank risparmia vite ma fattura meno. Esattamente il "chi paga" voluto.

Attenzione al party debole: **C scav=best stop4 → wipe 9.0%** (vs 5.9% baseline):
la competenza scarsa è spesso anche la più fragile, concentrare l'esposizione
sul frugatore debole uccide di più.

### 4.3 Copritore (dimensione separata)

| cella (stop4) | default E[g] / dead | weak E[g] / wipe |
|---|---|---|
| C scav=best, no cover | 55.2 / 1.37 | 44.4 / **9.0%** |
| + cov=tank | 54.4 / **1.02** | **47.6 / 5.9%** |
| + cov=weak | 54.9 / 1.63 | 47.3 / 5.9% |

EVIDENCE: il copritore **non è dominante**: nel party sano costa ~0.8g per
salvare ~0.35 vite; nel party debole **vale** (+3.2g, wipe −3.1pp) perché
protegge il frugatore fragile. Coprire col più debole (`weak`) trasferisce il
danno senza beneficio — il sacrificio del copritore è una scelta, non un
automatismo. È il primo meccanismo che rende il sacrificio **attribuibile a una
decisione del giocatore** ("Edda ha preso i colpi per Milo").

### 4.4 Rimpianto controfattuale (seed accoppiati)

All'ultima decisione *continua* di ogni run, confronto controfattuale
stop-vs-continua (score = gold − 25g×morti):

| sonda | continua meglio | stop meglio ("occasione di rimpianto") | pareggi |
|---|---|---|---|
| B, policy stop4 | 28.4% | **66.3%** | 5% |
| B5, stop4 | 28.4% | 43.4% | 27% |
| BE, stop4 | 14.6% | 65.3% | 20% |
| B, policy ev | **53.3%** | 23.1% | 24% |

Casi reali (stesso seed, stesso stato, due mondi):
- `seed 9, turn 4, pila 24g` → continua: **50g/1 morto** (bust + colpo) | stop:
  **74g/0 morti** — perdita di pila *e* uomo nella stessa spinta.
- `seed 12, turn 4` → continua: 66g/1d | stop: 58g/1d — la spinta paga.
- `seed 6, turn 4` → identiche morti (3d), continua +8g — la varianza estrattiva
  domina, non la scelta.

INFERENCE: sotto bust caldo la decisione profonda è *quasi sempre*
controfattualmente sbagliata (66%) — coerente con B "troppo caldo". Sotto la
policy `ev` il rapporto si rovescia (53%/23%) → il proxy distingue scelta
ragionevole da esito sfortunato. **È un proxy meccanico, non una misura
psicologica del rimpianto** (§7).

### 4.5 Sensibilità ±20% (loot 6/8/10g, danno 4/5/6hp; N=1000)

- Ranking A > B5 > BE > B stabile ovunque; **loot×1.25** allarga l'upside della
  spinta (B stop4 57.0g, +2.0g vs base) senza invertire nulla.
- **danno×1.2**: la policy `ev` si accorcia a ~1.0 giri (il costo HP domina) —
  il freno principale resta il danno, mai il bust.
- Conclusione di robustezza: **nessun punto della griglia ribalta l'ordine delle
  varianti**; la "temperatura" del bust è il parametro dominante, molto più di
  loot o danno ±20%.

### 5.6 Gate Director (R-109): sweep ramp 4–8% × 4 party (N=2000, seed accoppiati)

Party testati: `default` (4 completi), `weak` (−10 stat, −15 maxHp), `three`
(Milo morto all'avvio — il frugatore ottimale assente), `solo` (Edda da sola).

**Party default — E[gold] per policy vs ramp:**

| ramp | hp40 | ev | stop2 | stop4 | stop4−stop2 | stop4 bust% |
|---|---|---|---|---|---|---|
| 4% | 50.1 | 54.3 | 55.8 | 59.2 | +3.4g | 26% |
| 5% | 50.1 | 54.3 | 55.7 | 58.2 | +2.5g | 34% |
| **6%** | 50.1 | 54.2 | 55.5 | **57.4** | **+1.9g** | **39%** |
| 7% | 50.0 | 54.2 | 55.4 | 56.7 | +1.3g | 44% |
| 8% | 50.0 | 54.1 | 55.2 | 55.8 | +0.6g | 50% |

`always` = wipe ~100% e oro crollato a ogni ramp (2-11g). La frontiera
oro↔vite (hp40 0.28 morti → stop4 1.64) non collassa mai in questa banda.

**Party diversi — la stessa ramp decide diversamente (segnale positivo):**

| party | stop4 vs stop2 (Δg) | wipe stop4 | lettura |
|---|---|---|---|
| default | +1.9g @6% | 0.4% | spingere paga — tentazione viva |
| weak | −1.4g @6% | 5.9% | fermarsi è la risposta giusta — leggibile |
| three | −3.4g @6% | 9.7% | con 3 PG la spinta profonda è un errore chiaro |
| solo | −41.5g @6% | **99.9%** | F6 con un solo eroe: 2 giri = wipe 15.3%, 4 giri = suicidio quasi certo |

**Esito del gate — SUPERATO:**
- In nessuna cella della sweep una policy domina in oro+vite: la frontiera
  resta (hp40 minimizza morti, stop4 massimizza oro, ev bilancia).
- La scelta stop/continue resta significativa **perché la risposta giusta
  dipende dal party**: default può spingere, weak/three no, solo quasi mai.
  Questa è esattamente la sensibilità al contesto che il design vuole.
- Il bust è *comprensibile* (ramp pubblica, pila esplicita) ma imprevedibile
  nel momento esatto (è un tiro, non un timer) — soddisfa il vincolo Director.
- **Banda di sicurezza misurata**: 5–7%/turno. Sotto 4% il bust diventa
  decorativo per il party default (26% bust ma +3.4g di upside = quasi gratis);
  sopra 8% il margine stop4−stop2 tende a zero → converge verso il collasso
  osservato a 12%. **6% resta il centro consigliato.**
- `solo` conferma il requisito Director «potenzialmente letale con 1 eroe»:
  anche 1-2 fruga su Edda sola → wipe 15.3% (vs 4.2% senza frugare).

---

## 5. Cosa la simulazione può e non può dire

**Può** (e qui ha risposto): valori attesi, mortalità/wipe per cella, dominanza
*tra le policy modellate*, sensibilità parametrica, differenze controfattuali
causali a seed pari.

**Non può**: se il giocatore *sente* avidità/rimpianto/attaccamento; se il
preview a numeri precisi comunica il rischio; se il bust sembra "giusto". Le
policy `ev`/`hp40` sono surrogate del giocatore — la dominanza è dimostrata solo
rispetto a esse.

**Limiti onesti dell'esperimento**: (a) `HP_GOLD_WEIGHT=0.35` è una tariffa
scelta a mano → i valori assoluti della policy `ev` dipendono da essa (i
*ranking* no); (b) la variante C muta stats/slot a runtime — approssima un
rework authored, non lo replica; (c) bust% conteggiato solo con pila > 0 ⇒ nel
party debole i bust "a vuoto" non si vedono; (d) nessun modello di valore delle
vite oltre la tariffa lineare.

---

## 6. Decisione (da dati, non da gusto)

### Variante preferita: **BE — trappola indipendente, ramp ~6%/turno, su pila F6**

Motivazione misurata:
1. È l'unico punto dove spingere **e** fermarsi sono entrambi razionali:
   dispersione policy +3.2g, bust 39% profondo, E[gold] mai dominante.
2. Disaccoppia "trovato" (check) da "colto" (trappola): il bust può colpire
   *dopo una vincita* — la storia "avevo in mano il mucchio e la trappola è
   scattata" è più memorabile del fail che annulla sé stesso.
3. La ramp legata a `exploreTurn` rende il rischio **leggibile in preview con
   numeri precisi** (decisione Director): "prossimo giro: trappola 24%, pila a
   rischio 16g" — sorpresa forte ma retrospettivamente equa.

### Scartate/rinviate
- **B (bust su fail/epicfail)**: scartata — troppo calda, uccide la tentazione.
- **B5**: scartata come driver decisionale (decorativa); resta disponibile come
  temperatura minima se 6%/turno risultasse troppo punitivo in playtest.
- **Copritore**: supportato come *opzione*, non come default — i dati dicono che
  il suo valore emerge solo quando serve (party debole/frugatore fragile).
- **Rework basato su verdetto**: qualsiasi cosa leghi il bust al check eredita
  la temperatura del bound del party → fragile al tuning; preferire il roll
  indipendente.

### Modifiche minime richieste (authored, zero nuovi kind)
1. `state.f6Pile: number` (+ item pila opzionale); `gob-cerca` accredita alla
   pila invece che a `state.gold`; `gob-fermati` la riversa; bust la azzera.
2. Un `roll(state)` extra in `gob-cerca`: bust se `roll < exploreTurn ×
   TUNE.exploreTrapChance` (nuovo tunable, ~0.06).
3. Opzione `gob-fruga`: scelta del frugatore (1 flag `scavenger` su
   `RuntimeMember` o pick UI) → slot posteriore + competenza del check.
4. Copritore opzionale: hook in `positionalDamage` (o variante F6) che redirige
   i colpi destinati al frugatore — estende il path del bodyguard (F5).
5. Preview F6: pila a rischio, P(trappola) prossimo turno, esposto — numeri
   precisi.

### Test di regressione automatici (pre-implementazione)
- Seed fissi → esiti gold/pila/bust deterministici (invarianza RNG).
- Il bust perde **solo** la pila F6 (oro pre-F6 e trofeo intatti — F7).
- `gob-fermati` converte la pila; `flee` da F6: comportamento deciso (§8 Q2).
- Wipe via danno F6 invariato; frugatore morto → riassegnazione coerente.
- Copritore: redirezioni contate e attribuite nel log.

### Criteri di promozione
Passare a implementazione se il Director approva BE@6% (± tuning 4-8%) + frugatore
scelto + copritore opzionale. In playtest: il segnale cercato è che i giocatori
*parlino* del bust ("ho perso la pila al terzo giro") e scelgano frugatori
diversi per motivi diversi — non misurabile in MC.

### Test aggiuntivo più economico (se i dati non bastassero)
Una sweep ramp 4-8% × {default, weak, 3-PG} a N=1000 (~3 min di CPU) per fissare
il punto esatto dove la dispersione policy resta ≥ +2g e il bust profondo sta
tra 30-50% — il corridoio già individuato da questo esperimento.

---

## 7. Questioni aperte per il Director

1. **Semantica della trappola**: il bust indipendente può colpire su vincita —
   va bene narrativamente ("la trappola scatta mentre carichi") o preferisci
   bust solo su non-vincita (fail/almost) a temperatura equivalente?
2. **La pila sopravvive a `flee`?** Per TAKEN≠SECURED suggerisco: pila persa
   nella fuga (coerente col drop dell'obiettivo), `gob-fermati` = unico modo di
   metterla in sicurezza. Decisione tua.
3. **Frugatore = anche chi subisce il bust?** Nei dati l'esposizione è lo slot
   posteriore; il bust potrebbe *anche* ferire direttamente il frugatore
   ("sei tu con le mani nel sacco"). Più evocativo, più punitivo su chi fruga.

---

## Appendice — artefatti

- `f6-pushluck-experiment.ts` — driver/parametri (riproducibile:
  `tsx <script> [N] [--regret|--sens]`, env `F6_BUST`, `F6_CELLS`, `F6_PARTIES`).
- `results-f6-main-n2000.txt` — griglia completa 8 celle × 5 policy × 2 party.
- `results-f6-regret-n2000.txt` — sonde controfattuali B/B5/BE × stop4/ev.
- `results-f6-sensitivity-n1000.txt` — sweep loot 6/8/10 × danno 4/5/6.
- `results-f6-be-ramp-n2000.txt` — sweep ramp trappola 6%/8%.
- `results-f6-sweep-ramp4-8-n2000.txt` — **gate R-109**: ramp 4/5/6/7/8% ×
  party {default, weak, three, solo} × 5 policy.
