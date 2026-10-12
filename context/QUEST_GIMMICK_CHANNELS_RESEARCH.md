---
title: "Research — Canali di check alternativi sulla core gimmick"
type: research-report
status: active
created: 2026-10-10
revised: 2026-10-11 (P-01 adottata per delega Director R-134 → vigente;
  prototipo PLAN-028; OPEN-017 risolta, OPEN-018 aperta)
author: Devin (su richiesta Director)
related: [R-127, R-128, R-134, OPEN-017, OPEN-018, PLAN-028, QUEST_GENERATION_ARCHITECTURE.md §16, QUEST_GENERATION_CONTRACTS.md, QUEST_GENERATION_SPEC.md, QUEST_RULES.md §7]
run_dir: .mw/runs/20261010-gimmick-channels-research/
---

# Canali di check alternativi sulla core gimmick — rapporto consolidato

Ricerca strutturata sulla proposta R-127/OPEN-017: una core gimmick (es. allarme
infiltrazione) può ammettere **canali di check alternativi** su stat/skill diversi
(DEX furtività / INT invisibilità / CHA travestimento) — solo sui check che muovono
la variabile core, non sui check di scena ordinari.

**Questo documento è ricerca, non decisione.** Ogni raccomandazione è classificata
PROPOSAL finché il Director non ratifica. Le divergenze con regole frozen sono
esplicitamente marcate, non risolte.

## Metodo e copertura

- 6 sotto-argomenti, ciascuno con prompt potenziato (persona + contesto progetto +
  domande mirate) broadcast su provider web via `mw-broadcast.py`.
- Run dir: `.mw/runs/20261010-gimmick-channels-research/` — prompt, risposte raw
  (`*/BROADCAST.md`) e report per-argomento (`report-t*.md`).
- **Fallimenti registrati**: chatgpt 6/6 ("response did not stabilize"), claude
  5/6 ("login or challenge page"), grok 5/6 stub vuoti, gemini 2/6 stub.
  Contributi sostanziali: deepseek 6/6, gemini 4/6, claude 1/6, grok 1/6.
  Nota: la risposta deepseek T6 è arrivata in cinese (contenuto integro).
- Complemento web proprio: Blades SRD, The Alexandrian (skill challenge 4e),
  DE:HR/Dishonored postmortem, forum Larian/Steam (BG3, WotR, Solasta),
  Failbetter dev diaries + Emily Short, letteratura choice-overload.

### Matrice argomenti

| # | Argomento | Hat | Corpus utile |
|---|---|---|---|
| T1 | Precedenti "stesso problema, più soluzioni" | system designer | claude + deepseek + ricerca propria |
| T2 | Modelli di binding (OPEN-017) | system designer | deepseek + gemini + grok |
| T3 | Bilanciamento e validazione MC | balance designer | deepseek + gemini |
| T4 | UI e preview | UX designer | deepseek + ricerca propria |
| T5 | Psicologia del giocatore | PX researcher | deepseek + gemini + ricerca propria |
| T6 | Narrativa e pipeline testo | narrative designer | deepseek + gemini |

---

## 1. Cosa ha trovato la ricerca (findings robusti cross-fonte)

Le seguenti conclusioni convergono da ≥2 fonti indipendenti o hanno evidenza
da giochi shipped:

### F1 — I canali devono differire su ≥2 assi, mai solo sull'etichetta di stat
Costo, rischio, conseguenza sul fallimento, fiction, disponibilità.
"Same check, different label" = reskin collapse → il giocatore tira sempre la
stat più alta. [T1 claude+deepseek, T3, T5] **[finding robusto]**

### F2 — Il fallimento è il differenziatore chiave
I profili di fallimento devono divergere per canale: DEX fail = allarme+1;
INT fail = allarme+1 + caster rivelato; CHA fail = allarme+1 + lockout sociale.
Se i fallimenti sono identici contano solo le odds. Vale anche per il testo:
la divergenza narrativa sul fallimento deve essere ≥ quella sul successo.
[T3, T6] **[finding robusto]**

### F3 — Il binding model vincitore per v0: lock run-level capability-gated
Consenso sui provider sostanziali (deepseek STRONG, grok STRONG, gemini
STRONG su gating / VIABLE→STRONG su lock):
- **Scelta dell'approccio all'avvio della quest** (piano furtivo / arcano /
  sociale) lega tutti i check core della run. Precedente: heist genre +
  ME2 Suicide Mission — "la soddisfazione viene da commitment e conseguenza,
  non da flessibilità".
- **Il gate è la capability del party**: si offrono solo approcci che il
  party può sostenere (mago con invisibilità → canale arcano disponibile).
- **Estensione ibrida**: item/risorse a consumo sbloccano eccezioni puntuali
  (uno scroll = un check fuori-piano), con "exception budget" stretto.
- **Per-check free choice = WEAK** in un sistema a preview esatti: diventa
  shopping di percentuali (4e skill challenge revival).
- **Party-attached (best-of-party) = WEAK**: party ottimo = uno specialista
  per stat → problema risolto e identità dissolta (lezione WotR skill-share).
[T2] **[finding robusto]** → risponde parzialmente a OPEN-017 come PROPOSAL.

### F4 — Roll per membro nominato, non best-of-party
Il canale dovrebbe determinare CHI agisce (e chi è esposto al wound/death
roll), non solo la stat. Il rischio per-membro legato al canale è il leverage
meno esplorato e più prezioso. WotR party-skill-share è l'anti-pattern:
dissolve l'identità ("il gioco reagisce come se tu avessi notato ciò che ha
notato un altro"). [T1, T2] **[finding robusto]**

### F5 — Il giocatore sceglie l'approccio nella fiction, non la stat
Presentare "Intrufolati / Lancia invisibilità / Travestiti" non "DEX/INT/CHA".
La stat è la risoluzione meccanica; la fiction è la decisione. [T1, T5]
**[finding robusto]**

### F6 — Dominanza situazionale via counter-design, non dominanza universale
Nessun canale strettamente migliore su tutti gli assi. Ogni canale ha un
"posto dove splende" (ward anti-magia, checkpoint con controllo identità,
cortile aperto). Availability caps per nodo > penalità di stat. Parità di EV
è una trappola: EV diverso compensato da varianza/disponibilità/ceiling.
[T3, T1] **[finding robusto]**

### F7 — Preview: mostrare canali bloccati greyed con requisito
BG3/F:NV precedent forte: `[Speech 45]` visibile anche se non raggiungibile →
"il giocatore vede la forma dell'opportunità". Framing corretto: "Requires:
Rogue" = possibilità futura (motiva replay); "You lack a wizard" = taunting.
Cap ~3 canali visibili per check; riga = canale + stat + odds + costo + risk
tag semantico. Nessun shipped game mostra una party-coverage matrix → UI
nuova ma coerente col planning dei management game. [T4, T5] **[finding robusto]**

### F8 — Scelta espressiva vs strumentale: il rischio dei numeri esatti
Se i numeri rendono un canale ovviamente migliore, la scelta diventa
ottimizzazione, non espressione di identità. Mitigazioni compatibili con la
nostra regola frozen: (a) differenziazione su assi non-EV (rischio, costo,
fiction) così nessun canale è "ovviamente" migliore; (b) menu multi-canale
solo sui pivot checks (~20-30% dei check core); (c) stakes narrative accanto
alle odds ("65% — il fallimento alza l'allarme") → stakes-mindset, non
calculator-mindset. [T5, T3] **[finding robusto con caveat]**

### F9 — Narrativa: Minimal Viable Acknowledgment + world-rules validator
- La soglia percettiva è bassissima: un channel-verb nel verdict basta per
  "il sistema ha visto la mia scelta". Tier T1 (~1.1× costo) = default.
- **Storylet-gating > node-splitting**: un check node con varianti di canale
  a livello di testo/opzione, zero crescita del grafo. Coerente con il nostro
  vincolo no-runtime-mutation.
- Il canale è un **asse di validazione parallelo al domain-kit**: mustConvey /
  mustNotImply / channelVerb / failureTells per canale nel brief.
- Regola addizionale: i canali di un nodo = quanti punti di vista narrativi
  il nodo supporta naturalmente (un check "scasso" non ha un canale CHA
  sensato). [T6] **[finding robusto]**

### F10 — Monte Carlo: policy matrix per channel health
Policy: Always-X per canale, Party-Locked, Adaptive-Pick-Best (degeneracy:
>70-80% usage = rotto), Adaptive-Conserve. Metriche: win rate, morti/run,
spesa risorse, usage%, marginal influence per nodo, lockout frequency.
1000+ run per policy. Dead channel = mai scelto da adaptive su roster
realistici. [T3] **[finding robusto]**

### F11 — Il vincolo di scope è VALIDATO
Canali solo sui check che muovono la variabile core: nessun precedente che lo
invalidi; evidenza indiretta a favore (check sul critical path più rewarding;
DE:HR multi-path-everything = lusso da big team). Raffinamento emerso: anche
tra i core-check, non tutti meritano 3 canali — pivot vs routine. [T1, T5]
**[validazione della proposta R-127]**

### F12 — Warning strutturale: il nostro allarme è un "Y-failures counter"
Le skill challenge 4e fallirono perché il contatore di fallimenti era
dissociativo — contava *quanto* fallivi, non *cosa* fallivi. Il nostro
allarme (fail → escalation) ha la stessa forma. I canali devono cambiare
*quali transizioni di stato* produce il fallimento, non solo alimentare lo
stesso contatore. [T1, propria] **[finding robusto — rischio progetto]**

---

## 2. Divergenze registrate (non risolte)

| # | Divergenza | Posizioni | Gestione |
|---|---|---|---|
| D1 | Lock vs capability-gated come "modello più forte" | deepseek/grok → lock; gemini → gating | Risolta concettualmente: sono ortogonali (gate decide l'offerta, lock l'impegno) → PROPOSAL lock+gating |
| D2 | Per-check free choice | deepseek VIABLE-condizionale vs gemini WEAK | Incliniamo a WEAK per preview esatti; resta opzione per futuri pivot check |
| D3 | **Numeri esatti vs scelta espressiva** | research: EV-shopping sopprime roleplay vs nostra regola **frozen** R-108 | **DIVERGENZA-NOTA**: non proponiamo di cambiare la regola; mitigazione via F8. Da sottoporre al Director |
| D4 | Hybrid utility | gemini STRONG vs grok WEAK | Dipende da tolleranza grafo a eccezioni; testare dopo v0 |
| D5 | Canali bloccati mostrati/nascosti | BG3-model (mostra) vs immersive-sim (nascondi) | Mostriamo: node-graph non ha spazio esplorabile |

---

## 3. Cosa ci serve / cosa possiamo usare (contestualizzato al progetto)

### PROPOSAL P-01 — Modello di binding (risposta a OPEN-017)
**Run-level approach lock, capability-gated, con eccezioni a consumo.**
- All'avvio quest si sceglie l'approccio tra quelli che il party può
  sostenere. Il lock lega i check che muovono la var core.
- Item/skill a consumo aprono eccezioni puntuali (budget stretto, ~1 per run).
- Roll per membro nominato; il canale determina l'esposizione al risk roll.
- *Classificazione: PROPOSAL — attesa ratifica Director.*

### PROPOSAL P-02 — Definizione canale
Un canale = approccio fiction named + stat + profilo:
```
channel: { id, label(i18n), stat, eligibility (capability/item gate),
           cost {type: free|consumable|cooldown, ...},
           oddsProfile, failureProfile {coreVarOp, memberExposure, sideEffect},
           availabilityCap?, failureTells[] }
```
- Eleggibilità dichiarata a compile-time; nessuna mutazione runtime del grafo.
- *Classificazione: PROPOSAL — candidato per QUEST_GENERATION_CONTRACTS.*

### PROPOSAL P-03 — Tabella di transizione per canale
Per ogni check core: per ogni canale, cosa fa successo/fail/almost sulla var
core e sui side-effect. Una tabella per nodo core = mossa a più alto leverage.
Risponde a F12 (allarme non-dissociativo). *PROPOSAL.*

### PROPOSAL P-04 — Party coverage panel + greyed channels
Pre-quest: matrice membri×canali (chi può aprire cosa). Al check: canali
bloccati greyed con "Requires: …". Risk tag semantico accanto alle odds.
*PROPOSAL — implica UI nuova, valutare costo.*

### PROPOSAL P-05 — Brief narrativo channel-aware
Estendere NarrativeBrief con `channelOverrides` (mustConvey / mustNotImply /
channelVerb / failureTells) + validator dedicato. Tier testo T0-T3.5,
default T1, fallimento sempre un tier sopra il successo. *PROPOSAL —
contract-ready come estensione opzionale.*

### PROPOSAL P-06 — Policy MC channel-health
Estendere la sezione Monte Carlo dei contracts con le policy F10 e soglie
(degenerate >70-80%, dead = mai scelta, win-gap >45pt). *PROPOSAL.*

### PROPOSAL P-07 — Pivot vs routine
Tra i check core, il menu multi-canale va sui pivot check (~20-30%), i
routine check restano a canale singolo (quello del lock). Anti decision-fatigue.
*PROPOSAL.*

## 4. Cosa rifiutiamo (REJECTED, con motivazione)

- **REJ-1: best-of-party aggregation** — dissolve identità party (WotR lesson).
- **REJ-2: canali su OGNI check della quest** — distrugge grammatica stat;
  scope constraint già corretto.
- **REJ-3: opzioni identiche ri-skin** — reskin collapse garantito.
- **REJ-4: >3 canali per check** — option bloat; anche i pivot check restano ≤3.
- **REJ-5: nascondere canali bloccati** — perdita equity + flip attribuzione
  a "il gioco ha nascosto un'opzione" (post-hoc FOMO).
- **REJ-6: node-splitting per canale** — rejoin cost esponenziale; varianti a
  livello testo/opzione bastano.
- **REJ-7: parità di EV come target di tuning** — rende la scelta indifferente;
  differenziare EV + compensare su altri assi.
- **REJ-8: canale che bypassa la gimmick** — il canale manipola la var core,
  non la elude (altrimenti il giocatore non ingaggia il problema strategico).

## 5. Cosa resta aperto (aggiornamento OPEN-017)

- **OPEN**: regret vs ownership del lock va verificato in playtest — il
  v0 test è disegnato apposta (spec: 3 approcci × 4 check core, 1 item-
  eccezione in secondo passo). Metrica: "sai spiegare perché hai perso X?".
- **OPEN**: D3 — tensione numeri-esatti vs espressività. La regola è frozen;
  serve decisione Director se monitorare in playtest.
- **OPEN**: quanto del "capability gate" mappa su skill v12 vs item vs classe
  — dipende dalla skill-taxonomy non ancora finalizzata.
- **OPEN**: esposizione risk per canale = modello di wound/death per membro
  da dettagliare quando si implementa.
- **OPEN**: il "Karma Police coverage" (ogni stat ha almeno un canale nel
  quest set) va verificato sul quest set reale una volta autorato.

## 6. Impatto su architettura/schema (futuro, non autorizzato)

Se ratificato, servirebbero: (a) campo `channels[]` sui check node core (o su
CoreGimmick con riferimento per check); (b) approach tag a run-level sul
quest-run state; (c) transition table per canale nel nodo; (d) extension
NarrativeBrief + validator; (e) policy MC aggiuntive; (f) UI: channel selector
inline + coverage panel + greyed-requirement. **Nessuno di questi è
implementato né autorizzato da questo documento.**

Compatibilità: la proposta è coerente con authored-graph-no-runtime-mutation
(le varianti vivono nel nodo a compile-time), preview esatti (richiede solo
un campo risk tag in più), `vars: Record<string,number>` (transizioni
diverse sulla stessa var), e con traits/equip futuri (gate = stessa
macchina di eligibility).

## 7. Fonti principali

Provider outputs: `.mw/runs/20261010-gimmick-channels-research/t*/BROADCAST.md`.
Report per-argomento: stessa dir, `report-t1..t6.md`.
Fonti citate nei report: Blades in the Dark SRD (action rating, position/effect,
planning/engagement); The Alexandrian + Brandes Stoddard (skill challenge 4e
autopsia); DE:HR PlayStation.blog + Dishonored postmortem (multi-path
multi-solution); Warren Spector "problems not puzzles"; Disco Elysium (skill
voices); Fallout:NV (skill gates, Sawyer "Karma Police" coverage); BG3 +
F:NV (tagged/greyed options); WotR + Solasta (party-skill-share anti-pattern);
Shadow Tactics/Desperados (capability kit); ME2 Suicide Mission + Den of
Wolves + Invisible Inc. (approach lock); Failbetter QBN + Emily Short
(storylet gating, narrative physics); Iyengar/Schwartz + Wiener + regret
theory (psicologia); Reeves & Nass (salience threshold).
