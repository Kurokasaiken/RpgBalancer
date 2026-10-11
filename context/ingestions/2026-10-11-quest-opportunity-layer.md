---
title: "Ingestion — layer sopra le quest: grafo delle opportunità, famiglie, requisiti, ricompense-porta"
type: ingestion
date: 2026-10-11
source: "sintesi scritta dal Director di una discussione con ChatGPT (due riepiloghi incollati in sessione, 11 sezioni): meccaniche delle quest multi-approccio e del layer meta-quest — opportunità, famiglie, requisiti, ricompense, esploratore, tempo, capacità del villaggio, risorse, memoria"
related: R-153, QUEST_OPPORTUNITY_LAYER.md, QUEST_ECONOMY_NOTES.md,
         QUEST_GENERATION_SPEC.md, QUEST_GENERATION_ARCHITECTURE.md,
         QUEST_RULES.md, OPEN-010, OPEN-012, OPEN-013, OPEN-015, OPEN-016,
         PLAN-026, PLAN-028
status: archived — nuovo materiale in context/QUEST_OPPORTUNITY_LAYER.md
        (PROPOSAL); deepening in QUEST_GENERATION_SPEC §3.1/§8;
        questioni in OPEN-019/020/021; regola candidata in QUEST_RULES §9
---

# Knowledge Ingestion Report — «Grafo delle opportunità e layer meta-quest»

## 1. Source Overview

Il Director ha incollato in sessione la sintesi (due messaggi) di una
discussione avuta con ChatGPT sulle meccaniche di RPG Balancer. Il
contenuto copre due layer distinti:

- **dentro la quest**: risoluzione multi-approccio e skill che cambiano
  le prove — già in gran parte coperto dai canali alternativi (QUEST_RULES
  §7 `vigente`, OPEN-017 risolta);
- **sopra le quest**: grafo delle opportunità, famiglie di quest,
  tassonomie di requisiti e ricompense, orientamento dell'esploratore,
  modello del tempo, crescita del villaggio, architettura delle risorse,
  memoria delle conseguenze, perimetro del primo test.

Classificazione concordata col Director in sessione: **tutto PROPOSAL** —
materiale da documentare come candidato, non da ratificare. Steam page e
proiezioni commerciali escluse dal perimetro per richiesta esplicita.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | SOURCE | RELATIONSHIPS |
|----|------|-----------|----------|---------|--------|---------------|
| E-01 | PROPOSAL | Una quest ammette più modalità di risoluzione: lo stesso problema affrontabile con approcci diversi gated dalle capacità del party. | CURRENT | INTEGRATE (deepening) | msg §1 | coerente §7 canali — già `vigente` |
| E-02 | PROPOSAL | Una skill può cambiare *la prova*, le regole applicate o le alternative disponibili — non solo il valore della stat (es. disattivare l'allarme anziché superarlo). | CURRENT | INTEGRATE (deepening) | msg §1 | raffina il concetto di canale: canale ≠ solo stat diversa |
| E-03 | CONFIRM | Non tutte le prove ammettono sostituzione: una skill compatibile con la gimmick non vale su ogni check (allarme→INT sì, ponte traballante→INT no). | CURRENT | CONFIRM | msg §1 | = regola vigente §7 «solo check che muovono la var core» |
| E-04 | PROPOSAL | La preview deve reagire alla selezione dell'approccio: confronto fra alternative su stat effettiva e regole modificate **prima** del commit — non solo «bonus +10%». | CURRENT | INTEGRATE (deepening) | msg §1 | già in CONTRACTS §11.9 / PLAN-028; ribadito |
| E-05 | PROPOSAL | **Grafo delle opportunità**: le quest sono nodi di un'economia di opportunità — più percorsi convergono sulla stessa opportunità e una quest apre porte diverse; il grafo rappresenta relazioni di sblocco, non solo successione temporale. | CURRENT | INTEGRATE | msg §2 | estende chain quest (ARCHITECTURE §15): arco lineare → grafo; OPEN-019 |
| E-06 | PROPOSAL | **Famiglie di quest** (stealth/infiltrazione, combattimento/sopravvivenza, esplorazione/scoperta, diplomazia/interazione, preparazione/risorse): insieme condiviso di meccaniche e soluzioni compatibili; la famiglia non determina una soluzione unica. | CURRENT | INTEGRATE | msg §2.1 | distinta da core gimmick e domain kit — OPEN-019 |
| E-07 | PROPOSAL | Due livelli: **meccanica della famiglia** (ciò che rende il tipo riconoscibile) vs **soluzioni compatibili** (skill, stat, oggetti, preparazioni che permettono di affrontarla diversamente); stessa meccanica riusabile su molte quest. | CURRENT | INTEGRATE | msg §2.1 | struttura del nuovo doc §3 |
| E-08 | PROPOSAL | **Tassonomia requisiti**: accesso assoluto / capacità / costo-o-rischio / ottimizzazione. Gate assoluti riservati alle impossibilità effettive; un equip mancante può essere costruito, noleggiato, ottenuto via quest o token se il mondo offre l'alternativa. | CURRENT | INTEGRATE | msg §2.2 | regola candidata QUEST_RULES §9; OPEN-020 |
| E-09 | PROPOSAL | **Tassonomia ricompense-porta**: accesso, informazione, mitigazione, eccezione, conversione, sinergia, investimento permanente, consumabile/contromisura. Le ricompense modificano ciò che è possibile fare dopo, non solo numeri. | CURRENT | INTEGRATE | msg §2.3 | collega reward a grafo opportunità; estende §6 RULES |
| E-10 | PROPOSAL | **Esploratore orientabile**: il giocatore privilegia famiglie/tag; la preferenza influenza la distribuzione delle quest proposte senza garantirla. | CURRENT | INTEGRATE | msg §2.4 | estende regola vigente §2 (esploratore rivela info); OPEN-021 |
| E-11 | PROPOSAL | Il sistema opportunità considera: quest disponibili contemporanee, obiettivi a lungo termine, requisiti soddisfatti/mancanti, ricompense necessarie per missioni successive, scadenze e finestre, opportunità che competono per le stesse risorse. | CURRENT | INTEGRATE | msg §2.4 | requisiti del generatore/grafico; OPEN-019 |
| E-12 | PROPOSAL | Tempo = tre concetti: **durata** (occupa), **scadenza** (entro quando), **finestra di opportunità** (intervallo in cui è vantaggiosa/possibile). | CURRENT | INTEGRATE | msg §3 | allinea SPEC §8 «avanzamento/disponibilità/scadenza»; aggiunge «finestra» |
| E-13 | PROPOSAL | Palette di meccaniche riutilizzabili: countdown, livello di allerta, prove contrapposte ripetute, instabilità, push-your-luck, risorse esauribili. | CURRENT | INTEGRATE | msg §3 | candidati al roster gimmick (race/flood/meld/mimic esistenti); non matrice definitiva |
| E-14 | PROPOSAL | Skill/spell/oggetti che **cambiano le regole**: catalogo effetti — aprire approccio, ridurre/azzerrare una conseguenza, trasformare una prova in altra compatibile, rivelare info nascoste, aggirare un requisito, modificare una meccanica (es. accumulo allarme), sbloccare quest/ricompense. Distinzione: capacità generiche vs effetti validi su certe meccaniche vs effetti specifici di quest. | CURRENT | INTEGRATE | msg §4 | livello sopra i canali: non «stat alternativa al check» ma «capacità che cambia il sistema»; OPEN-019/020 |
| E-15 | PROPOSAL | **Primo test senza combattimento**: validare struttura opportunità — requisiti→accesso/rischio/efficienza; modi leggibili multipli di soddisfare un requisito; skill/ricompense aprono possibilità effettivamente diverse; esploratore orientabile; quest generano opportunità future senza sequenza rigida; scadenze/attività concorrenti → decisioni strategiche. | CURRENT | INTEGRATE | msg §5 | candidato piano successivo a PLAN-028; OPEN-019 |
| E-16 | PROPOSAL | Ricompense iniziali fisse e configurabili; niente incrementi diretti alle statistiche nella prima prova. | CURRENT | INTEGRATE | msg §5 | coerente «balancer non si tocca» (§7 vigente) |
| E-17 | PROPOSAL | Crescita della base = tre dimensioni: **visibilità** (quante opportunità conosci, quanto sai), **capacità** (quali affrontabili via skill/preparazione), **capacità operativa** (quante attività in parallelo). Edificio/sistema esploratore: rivela più info, opportunità più difficili con ricompense maggiori, più quest simultanee, più eroi in missione parallela. | CURRENT | INTEGRATE | msg §7 | estende §2 explorer; tocca leader-capacity (OPEN-010) |
| E-18 | PROPOSAL | La crescita non deve rendere tutto più facile: più spedizioni = più XP/oro ma più logoramento e pressione gestionale. | CURRENT | INTEGRATE | msg §7 | coerente human-days/logoramento (ECONOMY_NOTES, OPEN-010) |
| E-19 | PROPOSAL | Architettura risorse: risorse comuni multi-attività + specializzazioni permanenti dei personaggi + **risorsa trasversale limitata** legata a informazione/preparazione operativa — evitare valute dedicate per famiglia. | CURRENT | INTEGRATE | msg §8 | aperta la forma economica; OPEN-021 |
| E-20 | EXISTING | Conseguenze persistenti e memoria narrativa su livelli (personaggi, relazioni, fazioni, mondo). | CURRENT | CONFIRM — puntatore | msg §9 | già OPEN-015/016, R-092/R-093, SPEC §8 — non duplicare |
| E-21 | PROPOSAL | Preparazione insufficiente = tre casi: capacità indispensabile mancante → accesso impossibile; compensabile con risorse/preparazione → costo aggiuntivo; partenza impreparata → quest accessibile con rischi peggiori (allarme, ferite, tempo perso, bottino compromesso). | CURRENT | INTEGRATE | msg §10 | confluisce in E-08 (tassonomia requisiti) |
| E-22 | PROPOSAL | Perimetro prototipo: 3 famiglie (stealth, combattimento, esplorazione) × 3 livelli difficoltà, stat esistenti, requisiti configurabili, reward fisse, preferenza esploratore, casualità pesata. | CURRENT | INTEGRATE | msg §11 | candidato plan; OPEN-019 |

## 3. New Knowledge

- **Layer meta-quest come oggetto di design**: la discussione introduce un
  livello sopra la singola quest — un grafo in cui opportunità, requisiti,
  ricompense e capacità si collegano. Prima i documenti coprivano la
  *struttura interna* della quest (gimmick/scene/twist) e gli *archi
  narrativi* (chain quest): il grafo delle opportunità generalizza — più
  percorsi convergono, una quest apre porte diverse.
- **Tassonomie nuove**: requisiti (4 tipi), ricompense-porta (8 tipi),
  casi di preparazione insufficiente (3), dimensioni di crescita del
  villaggio (3).
- **Esploratore come attore strategico doppio**: non solo rivela
  informazioni (regola vigente §2) ma **orienta la generazione** — novità.
- **Risorsa trasversale informazione**: candidato anti-moltiplicazione
  delle valute per famiglia.
- **Finestra di opportunità**: terzo concetto temporale oltre durata e
  scadenza già presenti in SPEC §8.

## 4. Confirmed Knowledge

- E-03: scope dei canali limitato ai check core — conferma la regola
  vigente §7 formulata il 2026-10-10/11.
- E-04: preview reattiva all'approccio — già requisito del contratto
  canali (CONTRACTS §11.9, PLAN-028).
- E-20: memoria/conseguenze persistenti — già tracciato (OPEN-015/016).
- E-16: niente spirali stat — coerente con «il balancer non si tocca».

## 5. Refinements

- Il canale alternativo (§7) non è solo «stat diversa»: il materiale GPT
  propone che la skill possa cambiare la *natura* della prova (disattivare
  l'allarme) o le regole applicate — i profili di fallimento divergenti
  obbligatori del binding adottato coprono parzialmente l'idea; la forma
  completa è candidata nel contratto canali.
- SPEC §8 «Tempo e omissioni» ha avanzamento/disponibilità/scadenza: il
  modello a tre tempi (durata/scadenza/finestra) è compatibile e aggiunge
  la finestra — integrato in QUEST_OPPORTUNITY_LAYER §8.
- La regola vigente §2 sull'esploratore copre la *rivelazione*; E-10/E-17
  aggiungono *orientamento generazione* e *dimensioni di crescita* — la
  regola esistente non viene modificata.

## 6. Corrections

- Il riepilogo del Director descriveva il «grafo di famiglie» come sistema
  per famiglie di quest: verificato che i documenti lo trattano già come
  chain/archi (R-113). Il nuovo doc separa i due concetti — arco narrativo
  (fiction) vs grafo delle opportunità (sblocco meccanico) — e li collega.

## 7. Decisions

- Classificazione **tutto PROPOSAL** — concordata col Director in
  sessione prima dell'ingestion.
- Collocazione: **doc nuovo dedicato** `context/QUEST_OPPORTUNITY_LAYER.md`
  — concordata col Director.
- Nessuna decisione di design ratificata: il materiale resta candidato.

## 8. Research

Nessuna (materiale da conversazione esterna, non da ricerca).

## 9. Rejected Approaches

Nessuna esplicita; il materiale scarta implicitamente: albero lineare
«completa A → sblocca B» (sostituito dal grafo), valute per-famiglia
(sostituite da risorse trasversali), ricompense = solo incrementi stat
(sostituite dalle 8 categorie porta).

## 10. Unresolved Questions

- **OPEN-019** — modello del grafo delle opportunità: struttura dati,
  tipi di arco (sblocco/informazione/preparazione), persistenza degli
  archi, generazione pesata, relazione con gli archi narrativi.
- **OPEN-020** — tassonomia requisiti e preparazione insufficiente:
  quali requisiti sono generici/di famiglia/specifici; regole dei gate.
- **OPEN-021** — orientamento esploratore + risorsa trasversale
  informazione: meccanismo di pesatura e forma economica.

## 11. Conflicts

Nessuna divergenza da fonti FROZEN. **Tensione da nominare**: «più party
in missione parallela» (E-17) vs regola leader-capacity (OPEN-010 — la
capacità è limitata da leader e pool di umani). Le due idee coesistono se
la capacità operativa resta vincolata a umani/leader disponibili; da
conciliare in sede di ratifica economia-villaggio.

## 12. Changes of Direction

Nessuna.

## 13. Documentation Changes

- `context/ingestions/2026-10-11-quest-opportunity-layer.md` — questo report.
- `context/QUEST_OPPORTUNITY_LAYER.md` — doc nuovo PROPOSAL (materiale E-05..E-22).
- `QUEST_RULES.md` §9 — riga `proposta` per tassonomia requisiti/preparazione.
- `context/QUEST_GENERATION_SPEC.md` — `related` + nota §3.1 (canale ≠
  solo stat) + voce §8 (finestra) + puntatore al layer opportunità.
- `context/OPEN.md` — OPEN-019/020/021.
- `RICHIESTE.md` — R-153 (richiesta di ingestion).
- `context/INDEX.md` — righe di registro.

## 14. Implementation Impact

Nessuna ora. Se ratificato toccherà: generatore offerte (pesatura per
famiglia/tag), modello requisiti (4 tipi), catalogo effetti ricompensa/
capacità, stato degli archi persistenti nel save, tuning esploratore,
economia risorse, planner/preview (canali già in PLAN-028).

## 15. Argomenti trattati

- Approcci multipli e skill che cambiano le prove (deepening su §7).
- Grafo delle opportunità e famiglie di quest.
- Tassonomie: requisiti, ricompense-porta, preparazione insufficiente.
- Esploratore: rivelazione (vigente) + orientamento (nuovo).
- Tempo: durata/scadenza/finestra; meccaniche riutilizzabili.
- Villaggio: visibilità/capacità/capacità operativa; risorse trasversali.
- Perimetro del primo test senza combattimento.

## 16. Problemi risolti

- **Separazione dei due layer**: le idee «scelte dentro la quest» sono
  quasi tutte già coperte dai canali §7; il materiale davvero nuovo vive
  sopra le quest — separato in un doc dedicato per non gonfiare i
  documenti di generazione interna.

## 17. Ripresa della conversazione

Per riprendere il filo: il contratto aperto più grande è il **modello del
grafo delle opportunità** (OPEN-019) — struttura dati, tipi di arco,
persistenza, generazione pesata. Il perimetro di test suggerito (E-15/E-22)
è il candidato naturale per un piano successivo a PLAN-028.
