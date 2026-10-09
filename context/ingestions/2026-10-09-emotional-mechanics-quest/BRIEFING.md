# Briefing aggregato — «Emotional Mechanics for RpgBalancer Quests»

*Round 2 della conversazione multi-AI. Raccolte 4 risposte su 5 (manca DeepSeek).
Questo briefing riporta: (A) le convergenze tra le vostre risposte, (B) l'audit
reale del repository — che nessuna di voi poteva fare —, (C) le decisioni del
Director, (D) la classifica rivista delle primitive, (E) le questioni aperte
su cui serve il vostro contributo nel prossimo round.*

---

## A. Convergenze trovate (4/4 risposte)

**Diagnosi identica.** Le quest attuali producono *esito senza decisione*:
check → conseguenza → fase successiva. Non servono più fasi né più flavour:
serve che ogni risoluzione cambi lo stato e le opzioni successive.

**Set di primitive quasi identico** (~80% sovrapposto): duello a round,
push-your-luck, check nascosto/info a costo, allarme a soglie, targeting
per slot, impegno irrevocabile, intent display, timer-risorsa.

**Benchmark RPS chiarito.** Tutti concordi: RPS vs RNG puro = «generatore
casuale con pulsanti» (equilibrio di Nash → randomizzare è dominante). Il
benchmark funziona solo con avversario dal comportamento *inferibile ma
non deterministico*.

**Validazione: stessa proposta.** A/B «check lineari» vs «decisioni
interattive» + telemetria (cambi di strategia post-info, % decisioni che
cambiano l'esito, distribuzione rimonte) + survey breve. Criterio di
falsificazione: *varianza dell'esito spiegata dalle decisioni* — se ≈0,
il problema è il design dell'avversario/delle opzioni, non la forma.

**Near-miss: caveat unanime** (Clark et al. 2009): motiva a continuare ma
non aumenta il piacere — strumento, non feature. **Loss aversion** (λ≈2):
la posta deve essere *già posseduta* per generare tensione.

---

## B. Audit del repository — FACT verificati (vantaggio: accesso al codice)

Il motore quest è un grafo di nodi authored per quest («deliberately NOT a
general engine»). Kind: `choice`, `check`, `combat`, `info`, `harm`, `end`.
Esiti a 5 bande: bigwin/win/almost/fail/epicfail con effetti meccanici
distinti. Harms strutturati per slot con intercettazione bodyguard e
death save 5%.

**Già implementato (voi non potevate saperlo):**

| Primitiva proposta | Stato reale |
|---|---|
| Targeting per slot | ✅ matrice posizionale reale — rischio in coda (0/0/20/80) **con escalation sui turni** (T1→T3) — ma decide il *profilo*, non il giocatore |
| Push-your-luck | ✅ fase F6 esiste: danno crescente per giro di fruga, stop/continue |
| Allarme | ⚠️ **3 stati nominati** (quieto→allertato→sveglio, conseguenze qualitative) — il meter numerico è stato *rimosso deliberatamente* dal Director |
| Ritirata con costo | ✅ flee() tiene il loot, molla l'obiettivo (dottrina TAKEN≠SECURED già in motore); agguato al ritorno con scelta «trofeo o sangue» |
| Intent display | ⚠️ primitivo: esistono `nextCombatHits` (colpi prossimo turno) e `currentExposure` (chi è esposto al prossimo colpo) |
| Preview | ✅ ricca: success%, wound%/death% *per slot*, contributor migliore, bonus consumabile/intel, `failHint` («cosa cambia se fallisco») |
| Info → payoff | ⚠️ `intelBonusFor`: intel raccolta dà +5/+10 su check specifici; un check superato *sblocca un nodo opzionale* |
| Consumabili | ✅ loadout pre-partenza, arma/disarma in preview, cura usabile ai nodi decisione |

**Assente — la vera lacuna:**

- **Nessun modello di avversario**: i nemici sono un contatore; il
  combattimento è un check ripetuto per turno con contrattacco posizionale.
  Nessuna mossa per round, nessun pattern da leggere.
- **Nessun check nascosto**: ogni check produce una cinematica esplicita.
  Il flag «sai/non sai di aver fallito» non esiste.
- **Nessun timer-risorsa**: il tempo esiste come gating narrativo (tick =
  pacing delle fasi), non come budget spendibile dal giocatore.
- **Nessuna decisione per-round in combat**: oggi l'unica scelta è «turno
  successivo» + consumabile.

---

## C. Decisioni del Director (vincolano tutto il round 2)

| Domanda del brief | Risposta |
|---|---|
| Controllo durante la quest | **Poche decisioni cruciali** (3-4 scelte grandi per run) |
| Skill del giocatore | **Gestire probabilità e rischio** — NO lettura pattern avversari |
| Prevedibilità del rischio | **Sorprese forti ma eque** — inattese, retrospettivamente logiche |
| Morte dei PG | **Feeling Darkest Dungeon/XCOM** — morte presente, wipe raro, sopravvivere puliti è fortuna |
| Emozioni prioritarie | **Attaccamento/sacrificio + Avidità/rimpianto** |
| Preview | **Numeri precisi** (la tensione teoria-info-perfetta è accettata) |
| Allarme | Stati nominati confermati — nessun track numerico |

---

## D. Classifica rivista delle primitive

Le vostre risposte mettevano il **duello a pattern** primo — ma quel
primato presuppone decisioni frequenti + pattern-reading, **entrambi
esclusi dal Director**. La classifica che serve le sue risposte:

**Tier 1 — fit diretto:**

1. **Push-your-luck approfondito** — è *esattamente* avidità/rimpianto:
   poche decisioni con peso (continua/fermati), probabilità note. F6
   esiste già → serve: rischio visibile per giro, semantica «bust» chiara,
   decisione *chi espone/chi fruga*.
2. **Esposizione come scelta del giocatore** — attaccamento/sacrificio:
   la matrice posizionale esiste, ma oggi è il profilo a decidere chi
   paga. 1-2 decisioni di allocazione del rischio (chi copre, chi è in
   coda, chi tiene l'obiettivo) = sacrificio *attribuibile* a costo quasi
   zero.
3. **Sorprese eque via info a costo** — l'agguato al ritorno esiste ed è
   quasi-equo (la gravità dipende da una scelta precedente). Per la
   fairness: segnali acquisibili tramite check nascosto — chi non guarda
   subisce la sorpresa *perché non ha guardato* (attribuibilità).

**Tier 2 — infrastrutture delle Tier 1:** check nascosto (flag senza
cinematica — meccanicamente banale, il costo è di design), intent display
leggero (estendere nextCombatHits/exposure esistenti).

**Tier 3 — deprioritizzato:** duello a pattern (resta opzione per una
*singola* quest tematica, non primitiva di sistema), timer-risorsa.

**Nota architetturale:** col duello deprioritizzato, anche la questione
«motore authored-per-quest vs framework di primitive» si riduce — Tier 1
sono potenziamenti dei kind esistenti, non nuovi kind.

---

## E. Questioni aperte per il round 2

1. **Notifica del check fallito nascosto** — silenzio totale vs «non noti
   nulla» vs indizi osservabili ma ambigui? La risposta Q3 («sorprese
   eque») suggerisce segnali *disponibili ma non imposti*: cosa rende una
   sorpresa retrospettivamente logica senza spoiler?
2. **Semantica del «bust» nel push-your-luck** — perdita totale vs
   parziale? La dottrina TAKEN≠SECURED suggerisce: ciò che hai in mano si
   può perdere, ma come si calibra perché la decisione «continuo?» resti
   reale e non dominata?
3. **Come si «sceglie chi paga» senza diventare un puzzle deterministico?**
   — se il giocatore alloca l'esposizione, come si mantiene incertezza
   (chi *esattamente* viene colpito) senza vanificare la scelta?
4. **Emozioni prioritarie = 2 su 5.** Sospensione/rimonta e strategia/
   mastery sono *deprioritizzate*, non eliminate: quali meccaniche del
   vostro catalogo servono avidità+attaccamento *senza* produrre suspense
   residua non voluta? O la suspense è un sottoprodotto accettabile?
5. **Esperimento 0 proposto**: simulazione Monte Carlo delle varianti di
   F6 push-your-luck (rischio visibile vs no, bust totale/parziale,
   scelta-di-chi-fruga) — misurabile in codice senza UI. Quali metriche
   discriminanti aggiungereste? Cosa vi aspettereste di osservare per
   dichiarare fallita una variante?

---

*Fonti: sintesi completa con citazioni per-primitiva, audit riga-per-riga
e mappa convergenze in SYNTHESIS.md (stessa cartella). Ricerca di progetto
preesistente con bibliografia verificata: QUEST_GAMEPLAY_SCIENCE.md (63
principi P1–P63).*
