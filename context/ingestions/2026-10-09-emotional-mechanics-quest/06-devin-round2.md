# Round 2 — Risposta di Devin (unico partecipante con accesso al repository)

*Fonti primarie: risposte di Claude (01), Gemini (03), Grok (04), ChatGPT (05).
DeepSeek (02) non disponibile — era un file upload non esposto nella share;
dichiaro la lacuna e non ne invento il contenuto. FACT = verificato su
`questRun.ts`/`questScenarioGoblin.ts` in questa sessione.*

---

## 0. Matrice delle ricerche

| | Claude | Gemini | Grok | ChatGPT | DeepSeek |
|---|---|---|---|---|---|
| Duello a pattern | P1 | P1 | #1 | #1 | — |
| Push-your-luck | P2 | P2 | #2 | #2 | — |
| Check nascosto / info | P3 | P3 (spec più dettagliata) | #3 | #4 | — |
| Allarme a soglie | P4 | P4 | #4 | #3 | — |
| Targeting per slot | P5 | P6 | #5 | #5 | — |
| Impegno irrevocabile | P6 | — | #6 | — | — |
| Stato riscrive opzioni | P7 (contributo unico) | — | — | — | — |
| Timer-risorsa | — | P5 | — | implicito | — |
| Intent display | — | sì (Slay the Spire, contributo unico) | — | — | — |
| Metrica falsificazione | «varianza spiegata dalle decisioni» (contributo unico) | telemetria con soglie | — | A/B generico | — |

**Convergenze:** diagnosi «esito senza decisione»; set di primitive ~80%
sovrapposto; RPS sensato solo con avversario inferibile; near-miss come
strumento e non feature (Clark et al. 2009); loss aversion (λ≈2); stesso
protocollo di validazione A/B+telemetria+survey.

**Contraddizioni / divergenze reali:**
- *Ordine di priorità*: tutte mettono il duello primo, ma per ragioni
  diverse — Claude/Grok per il benchmark RPS, Gemini per costo, ChatGPT
  per riuso. Il briefing del Director lo ribalta (v. §D del briefing):
  legittimo, perché il primato del duello poggiava su due presupposti
  (decisioni frequenti + pattern-reading) che le decisioni vincolanti
  escludono. **Nessuna ricerca difende il duello contro quel vincolo —
  la retrogradazione a Tier 3 è coerente con le fonti.**
- *Forma dell'allarme*: tutte propongono track numerici; il Director usa
  stati nominati (FACT: `escalateCamp`, quieto→allertato→sveglio, meter
  rimosso deliberatamente). Gli stati nominati *sono* le soglie
  qualitative che le ricerche chiedono — la differenza è di
  presentazione, non di funzione.
- *Trasparenza*: Gemini pone «% esatte vs bande» come aperto; il Director
  ha chiuso per numeri precisi. Tensione con P39 (info perfetta uccide
  suspense) accettata consapevolmente — e mitigata dal fatto che
  l'incertezza si sposta dal «riuscirò il check?» al «cosa mi costa
  continuare?».

**Qualità delle evidenze:** EVIDENCE pubblicata: Clark 2009 (near-miss),
prospect theory/loss aversion (Kahneman-Tversky), Ortony-Clore-Collins e
Lehne & Koelsch 2015 (Grok — modello formale della suspense),
Fendt/Cardona-Rivera (agency percepita > branch count), PENS (ChatGPT —
generico). Le sezioni «evidenze scientifiche» delle 4 risposte sono per
l'80% già coperte da `QUEST_GAMEPLAY_SCIENCE.md` con bibliografia
verificata più rigorosa; il valore aggiunto è nelle primitive e nei
prototipi, non nella letteratura. INFERENCE frequente: che il duello sia
«il più economico» — vero per un motore generico, meno vero nel nostro
(v. §3).

---

## Q1 — Check nascosto: sorpresa equa senza spoiler

**FACT che cambia il problema.** Nel nostro motore il routing post-check è
uno switch authored per nodo (`applyNodeOutcome`): lo stesso `check`
instrada a nodi/flag diversi per verdetto, e il pattern «check visibile,
contenuto gated» esiste già — `avvistamento` (cassa) e `gob-tracce-per`
consegnano intel diversa per banda, con flavor onestamente ambiguo sui
verdetto bassi («Segni confusi, orme doppie. Un sospetto, non una via»).
L'intel paga sia come bonus (`intelBonusFor`) sia come *sblocco di nodo*
(F2 esiste solo se il check STR+PER riesce). Quindi la distinzione cruciale
non è «check visibile vs nascosto» ma **«il giocatore sapeva che
un'informazione esisteva e ha scelto/è riuscito a prenderla»**.

Valutazione delle alternative:

| Alternativa | Chi sa cosa | Equità | Costo impl. | Verdetto |
|---|---|---|---|---|
| Silenzio totale | PG tira, giocatore ignora tutto | **Bassa** — viola attribuibilità (P6/P36): la sorpresa non ha controfattuale esperito | basso ma serve flag `hidden` sul nodo | ❌ come default |
| Feedback neutro («non noti nulla») | giocatore sa di aver cercato, non distingue vuoto da mancato | media-alta | nullo (è solo flavor) | ⚠️ utile come sottocaso |
| Segnali osservabili ambigui | tutti vedono il segno, interpretazione incerta | alta («i segni c'erano») | medio (contenuto authored) | ⚠️ costoso in scrittura |
| **Info a costo (scelta)** | il giocatore decide *se* spendere | **alta** — la rinuncia è una decisione registrata | nullo (choice+check esistenti) | ✅ |
| **Info che cambia opzioni** | successo apre scelte nuove | alta | nullo-medio | ✅ |

**PROPOSAL (raccomandata):** ibrido **costo + opzioni + feedback neutro** —
*check visibile a scelta, contenuto gated per verdetto, verdetto bassi →
segnale ambiguo, successo → nuova opzione (non bonus)*. Il check resta
visibile perché la sua esistenza è ciò che rende la sorpresa equa; ciò che
resta incerto è *cosa* ha trovato. La rinuncia («non ho mandato nessuno a
guardare») e il fallimento noto («abbiamo guardato e non abbiamo visto»)
sono entrambi retrospettivamente logici. Il check veramente nascosto
(nessuna cinematica) serve solo per percezione *passiva* (il PG nota senza
che il giocatore scelga) — un caso che la goblin non richiede; se servisse,
è un flag `hidden` sul nodo check (salta `checkQueue`, risolve e setta
flag), non un nuovo kind.

**Esempio completo (goblin, nessun kind nuovo):** a F5 (dopo il combattimento)
si aggiunge l'opzione «Mandare Milo a esplorare la via del ritorno» —
costo: chi esplora è lo slot esposto se l'agguato scatta. `check` perc →
win+: flag `sentieroLetto` → a F7 il nodo choice guadagna l'opzione
«Aggirare il sentiero» (evita l'agguato, costa il trofeo del 30%) oppure
rivela `agguatoPeggiore` prima della scelta; almost/fail → «La strada
sembra libera» (ambiguo, non «non hai visto niente»); skip → stato quo.
Cosa sa il giocatore: che poteva sapere. Cosa cambia: un'*opzione* a F7,
non un +10. Costo dell'informazione: esposizione di un PG. Questo è anche
il meccanismo che rende l'agguato — sorpresa forte — *equa*: era
letteralmente una decisione saltabile.

---

## Q2 — Bust nel push-your-luck

**FACT:** F6 esiste (danno crescente sul giro, oro per turno, stop/continue);
il costo attuale è solo HP e il loot accumulato non è a rischio → il «bust»
non esiste davvero: continuare costa solo pelle, e la scelta degenera in
«fruga finché hai HP». Dottrina TAKEN≠SECURED già in motore (`dropLoot`,
`dropObjective`, flee molla l'obiettivo).

| Variante | A rischio | Stop dominante? | Continua dominante? | Nota |
|---|---|---|---|---|
| Perdita totale loot non-secured | tutto il raccolto | **sì** — con λ≈2 la perdita totale vale ~2× il guadagno marginale; razionale fermarsi presto | no | troppo dura, uccide la decisione |
| Perdita parziale fissa | quota del raccolto | tendenza stop | no | simile ma più piatta |
| Loot+ferite+ritorno peggiore | multi-risorsa | no | no | buona, ma rischio disperso |
| **Bust mirato: si perde il mucchio accumulato in F6** | solo ciò che F6 ha prodotto | no | no | ✅ tensione che scala col mucchio |

**PROPOSAL:** **bust mirato + accoppiamento**: il bust porta via *il
mucchio di F6* (ciò che questa fase ha accumulato — «in mano, non in
sacca»), più danno concentrato sul frugatore, più un flag che peggiora il
ritorno (il rumore del crollo → `agguatoPeggiore`-like). Il loot delle fasi
precedenti resta «in sacca» (ma comunque a rischio a F7 — posta a due
livelli). Perché è la forma giusta: il rischio marginale *cresce col
mucchio* (ogni giro mette a repentaglio più valore assoluto) → la tensione
scala da sola senza timer né meter; continuare è razionale all'inizio
(mucchio piccolo) e fermarsi è razionale a mucchio grande → **nessuna
strategia domina**, e la posizione del punto di svolta dipende da HP e
composizione → la stessa meccanica produce risposte diverse per party
diversi.

**Modello numerico illustrativo (IPOTESI, da calibrare MC — non
bilanciamento validato):** mucchio +8g/giro; P(bust) 12%/25%/45%;
bust = −mucchio + 15 danno al frugatore. EV marginale: giro1 ≈ +6.1g;
giro2 ≈ +2g; giro3 ≈ −6.4g + danno → razionale: continua, continua,
*decidi davvero*. La curva non va calibrata a mano: va esplorata in MC
(Q5) cercando la regione dove il punto di svolta cade dentro i 3-4 giri
disponibili.

**Perché le altre sono inferiori qui:** perdita totale = stop dominante
(loss aversion la schiaccia); parziale fissa = stessa forma smorzata;
multi-risorsa senza mucchio a rischio = il costo non scala col guadagno e
la decisione resta un confronto HP-vs-oro statico.

---

## Q3 — Allocazione del rischio senza puzzle deterministico

**FACT:** `positionalWeights` assegna probabilità di colpo per slot
(0/0/20/80) con escalation; il bodyguard **intercetta automaticamente**
gli harm dei *check-risk* (`applyHarm(interceptable)`) — ma **non** il
danno posizionale del combat (`applyHpDamage` non passa per
`applyHarm`). Il giocatore oggi non assegna niente: i ruoli sono da
preset.

La trappola «manda sempre il meno utile» si disinnesca alla radice con
l'**accoppiamento competenza↔esposizione**: chi fruga *fa* il check —
mandare il PG peggiore significa fallire più spesso (meno giri di loot,
più bust). Il sacrificio torna ad essere una scelta tra valori veri, non
un ottovolante di carne.

| Soluzione | Cosa decide il PG | Cosa resta casuale | Anti-dominanza | Integrazione |
|---|---|---|---|---|
| Chi fruga (accoppiato) | esposizione+competenza | esito check, colpi residui | il «meno utile» fallisce il check | riusa `check`+targeting |
| Chi copre (intercetto assegnato) | chi paga per gli altri | quale hit viene intercettato | coprire costa HP del copritore | estende intercept a `applyHpDamage` (piccolo) |
| Formazione/ruoli | distribuzione pesi | target dentro i pesi | trade-off statico | riusa `positionalWeights` |
| Assegnazione per equip/storia | niente di vivo | quasi tutto | n/a | più bookkeeping che scelta |

**PROPOSAL:** **due decisioni accoppiate** (fit «poche decisioni cruciali»):
(a) *chi fruga* — esposizione accoppiata alla competenza (65% del
targeting sullo slot, non 100%: esposto ≠ condannato); (b) *chi copre* —
un copritore designato intercetta gli harm diretti al frugatore
(semantica del bodyguard esistente estesa al danno posizionale: modifica
piccola, non un sistema nuovo). L'incertezza si conserva perché il peso
resta probabilistico; l'attaccamento perché il log nomina chi paga — e
*tu* l'hai scelto.

**Esempio numerico (IPOTESI):** Milo (PER 45, 60hp — il migliore a
frugare), Bruna (PER 35, 60hp), Kran (copritore, PER 30, 70hp). Allocazione
A — Milo fruga, Kran copre: check-fail ~25%/giro, Milo assorbe il residuo
non intercettato, Kran concentra gli harm (~70%). Allocazione B — Kran
fruga da solo: check-fail ~40%, Kran prende sia l'esposizione sia gli
harm. B non è «sacrificio efficiente»: produce meno loot-EV *e* più bust —
la strategia dominante non esiste perché competenza e carne non stanno
nello stesso corpo.

---

## Q4 — Avidità + attaccamento senza suspense artificiosa

Mappatura meccanica→emozione (P = produce l'emozione target, S = solo
suspense/mastery):

| Meccanica | Stato→decisione | Conseguenza | Emozione | Effetto collaterale | Segnale che funziona |
|---|---|---|---|---|---|
| Mucchio non-bancato | hai 16g in mano → continui? | bust perde il mucchio | **avidità, rimpianto** | frustrazione se bust non telegrafo | dispersione stop/continue tra policy (MC) |
| Copritore assegnato | chi paga per chi | copritore ferito/morto | **attaccamento, sacrificio** | colpa mal calibrata se l'esito era inevitabile | % run dove il copritore scelto *ha cambiato* chi è caduto |
| Decisione irreversibile (molla trofeo) | loot vs obiettivo | esito 'survived' degradato | **rimpianto** | se sempre dominante è una non-scelta | distribuzione delle scelte ≠ degenere |
| Conseguenza differita (F5→F7) | incalzare o no | agguato mite/pesante | rimpianto, fairness | opacità del link causa-effetto | % giocatori che attribuiscono l'agguato alla scelta (survey) |
| Info a costo | spendi esposizione per sapere | opzione di evitamento | avidità vs prudenza | se la info è sempre ottima diventa tassa | % run dove la info ha *cambiato* la scelta |
| Ritirata con costo | loot sì, obiettivo no | 'fled' con loot | **rimpianto** | se rara, mai provata | tasso di fuga post-ingaggio |
| Sopravvivenza ferita | esito distinto | PG segnato, non perso | **attaccamento** | se la ferita non costa, è cosmetica | feriti riassegnati vs parcheggiati |

**Le tre combinazioni più promettenti (interazione > somma):**

1. **Mucchio a rischio × frugatore scelto × copritore** — separatamente:
   «quanto rischio l'oro?» e «chi paga?». Fusi: «quanto sangue di Milo
   vale un altro giro?» — avidità, rimpianto e sacrificio *nella stessa
   decisione*, che è ciò che il brief chiede e nessuna primitiva singola
   dà.
2. **Info a costo × sorpresa equa × rinuncia registrata** — la info da
   sola è bookkeeping; agganciata a un'agguato evitabile, ogni rinuncia a
   guardare *fabbrica il controfattuale* che serve al rimpianto («potevi
   saperlo» è un fatto di gioco, non un rimpianto ipotetico).
3. **TAKEN≠SECURED × ritirata con costo × ferito-non-morto** — il nucleo
   DD: si esce col bottino ma senza obiettivo, o con l'obiettivo ma senza
   qualcuno. 'survived' come esito distinto (già in motore) mantiene
   l'attaccamento vivo *tra* le quest, non solo dentro.

**Evitate consapevolmente:** timer-risorsa e duello — il loro prodotto
primario è suspense/mastery, non le emozioni target. La suspense che
emergerà comunque (l'attesa al check, il mucchio che cresce) è
sottoprodotto legittimo, non obiettivo.

---

## Q5 — Esperimento 0 (Monte Carlo su F6)

**FACT:** `questSimulation.ts` + script MC (`quest-goblin-mc.ts`,
`quest-goblin-playthrough.ts`) esistono già — l'esperimento è economico.

**Setup.** Baseline: F6 attuale (costo solo HP, nessun bust, frugatore
automatico). Variabili indipendenti: {bust: *damage-only | lose-pile |
lose-pile+ritorno-peggiore*} × {frugatore: *auto | best-PER |
scelto+copritore*}. (La dimensione «rischio mostrato» è una questione di
UI/policies: in MC si modella come policy *informata* vs *non informata*.)
Variabili controllate: **seed accoppiati** (stesso seed, policy diverse →
controfattuale causale), preset party, bound dei check, tabella loot.
N = 5000 per cella (CI binomiale ≈ ±1.4pp a p=0.5).

**Policy simulate:** stop-at-k (k=1..4), stop-se-HP<h, EV-greedy,
always-continue — *la diversità delle policy è il test*: se tutte
convergono, la decisione non esiste (criterio «varianza spiegata dalle
decisioni», Claude).

**Metriche:**

| Metrica | Definizione | Ipotesi verificata | Fallimento se |
|---|---|---|---|
| Dispersione policy | max−min E[loot home] tra policy | le decisioni cambiano l'esito | <10-15pp → la scelta è cosmetica |
| Dominanza | una policy batte tutte in ogni scenario | nessuna strategia dominante | una policy domina ovunque |
| P(perso mucchio) | share run con bust | il bust è sentito ma non punitivo | <10% (mai visto) o >60% (sempre punito) |
| P(morte)/P(wipe) | distribuzione esiti | banda R-105 (wipe ~0.5-2% party rif.) | fuori banda |
| **Regret-proxy** | E[esito\|A,seed s]−E[esito\|B,seed s] su seed accoppiati | il controfattuale *esiste meccanicamente* | proxy≈0 → nessun «se avessi…» legittimo |
| Concentrazione danno | Gini/entropia harms tra membri | il sacrificio ricade su chi è stato scelto | danno uniforme → scelta irrilevante |
| Sensibilità | gradiente metriche vs party/loot/hazard | robustezza fuori dal punto calibrato | cliff su variazioni ±20% |

**Cosa MC prova e non prova:** prova che le decisioni *contano* meccanicamente,
l'equilibrio, le distribuzioni. **Non** prova avidità/rimpianto/attaccamento
sentiti — quello richiede playtest umano (survey breve, la stessa proposta
delle 4 ricerche). MC è il gate *necessario*, non sufficiente.

**Regole decisionali:** promuovi la variante con dispersione ≥15pp, zero
dominanza, wipe in banda, regret-proxy positivo e significativo; scarta se
decisioni cosmetiche o dominanza; ricalibra i parametri se la struttura
regge ma le bande no.

---

## Decisioni proposte al Director (per impatto × confidenza)

1. **Rework F6 authored**: mucchio-a-rischio (perdi ciò che F6 accumula) +
   scelta *chi fruga* + scelta *chi copre* — nessun kind nuovo, riusa
   check/choice/targeting/intercept. La singola modifica con più emozione
   per riga di codice.
2. **Scouting a costo per l'agguato F7**: opzione check visibile,
   contenuto gated, successo → opzione di evitamento a F7. Rende la
   sorpresa forte *equa* per costruzione.
3. **Esperimento MC prima di toccare UI**: varianti × policy × seed
   accoppiati; soglia di promozione esplicita (Q5).
4. **Estendere l'intercetto al danno posizionale** (copritore): piccola
   modifica engine — unica modifica al motore proposta, tutto il resto è
   authored.
5. **Check veramente nascosto: differire** — la variante
   visibile+contenuto-ambiguo copre il bisogno a costo zero; riaprire solo
   se emerge un caso di percezione passiva.

## Questioni irrisolte (solo quelle che richiedono il Director)

- Scope dell'esposizione scelta: solo F6 o anche F4 combat? (consiglio:
  prima F6 — combat è già denso).
- Il copritore si designa *a inizio quest* o *per fase*? (impatta
  frequenza decisioni — «poche decisioni» suggerisce per-fase solo dove
  authored lo richiede).
- Calibrazione bust: numeri finali solo dopo MC — non deciderli a
  priori.
