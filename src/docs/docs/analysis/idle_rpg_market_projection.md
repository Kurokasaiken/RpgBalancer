# Proiezioni economiche e analisi di mercato

## 1. Executive Summary e Mandato Analitico

Il presente rapporto fornisce una proiezione finanziaria "brutale" per il lancio di un Idle RPG sviluppato da un solodev su stack JavaScript/React/Electron. Il periodo di riferimento è il biennio 2024‑2025, fase in cui Steam supera i 18.000 nuovi rilasci/anno e la visibilità algoritmica è estremamente competitiva.

Ipotesi di partenza:

- **Wishlist iniziali:** 3.000
- **Prezzo di listino:** €7.99 (sconto di lancio opzionale ≤20% → €6.39)
- **Regime fiscale:** Italia (IVA 22%, contributi INPS + imposta sostitutiva)

La brutalità dell’analisi deriva dalla scomposizione dei margini: tra commissioni Steam, tassazione, rimborsi e costi di marketing, il netto effettivo per copia può scendere sotto i €3. Le proiezioni mostrano tre scenari (Flooring, Mediana, Breakout) con outcomes che spaziano dal disastro tecnico (refund >30%) alla nicchia sostenibile, fino al successo virale raro (<5% probabilità). La capsule art professionale emerge come leva finanziaria, incidendo sul CTR e sulle conversioni.

### 1.1 Mandato analitico e metodologia
Per elaborare queste stime sono state consultate fonti 2024‑2025 (Game Oracle, GameDiscoverCo, HowToMarketAGame, Reddit post-mortem, SensorTower, Medium, Trapplan) focalizzate su:
- **Conversione wishlist→vendite**: range mediano 12‑20% nelle prime 2 settimane, con contrazione per titoli “mid tier”.
- **Refund rate**: 10‑12% fisiologico, fino al 30‑40% per giochi con problemi tecnici/Electron.
- **Impatto Capsule Art**: casi studio Trapplan/HowToMarketAGame mostrano +2‑3× CTR con asset professionali.
- **Benchmark di prezzo**: comparazione con Rusty’s Retirement, Factory Town Idle, Moose Miners, Dead Unending, Widget Inc.
Le assunzioni sono state stressate con scenari pessimista/mediano/ottimistico e verificate con esperienze riportate da solodev (es. Gnorp Apologue 2024, Moose Miners 2023).

## 2. Analisi del contesto macroeconomico: ecosistema Steam 2024‑2025

### 2.1 Saturazione “Indiepocalypse” continua
- 2024: ~18.000 nuovi titoli, ~50 lanci al giorno.
- La Discovery Queue premia solo titoli con trazione immediata (wishlist fresche + buone recensioni). Chi non converte viene “sepolto” nel cosiddetto Steam Limbo entro una settimana.

### 2.2 Idle RPG: nicchia particolare
- **Vantaggi:** long tail, community analitica, predisposizione a DLC.
- **Svantaggi:** aspettative di prezzo basse (molti utenti si aspettano F2P o <€5). Anche a €7.99 servono polish elevato e zero “sapore web” per evitare review negative.

### 2.3 Impatto delle 3.000 wishlist
- Regola storica 10x (10‑20% nella prima settimana) oggi si contrae per i titoli medi.
- Wishlist recenti (Next Fest) → conversione 20‑25%; wishlist “fredde” → <10%. La freschezza è cruciale.
- Dati Game Oracle 2025 mostrano conversione mediana ≈12% per giochi con 1‑5k wishlist e prezzi >€8, con outlier fino a 25% solo per titoli con recensioni “Overwhelmingly Positive”.
- GameDiscoverCo segnala che la “regola dell’anno = wishlist” non vale più: i titoli medi non superano 1‑2× le vendite week-one senza eventi/festival aggiuntivi.

## 3. Rischio infrastrutturale: stack JS/React/Electron

### 3.1 Peso e percezione
- Electron = Chromium + Node → 150‑300 MB di RAM solo per avviarsi. In caso di cattiva ottimizzazione (CPU >10% o memory leak) i giocatori “multitasking” abbandonano/rimborsano.
- UI “da web app” viene penalizzata se non gestisce interazioni native (tasto destro, DPI, controller, focus). Review “Mixed” citano spesso “lazy browser port”.

### 3.2 Compatibilità e falsi positivi
- Binari Electron non firmati → possibili blocchi di Windows Defender/AV. Se il gioco non parte → rimborso certo.
- Tasso medio di refund Steam 10‑12%; con problemi tecnici “web-tech” sale a 30‑40%.
- Discussioni r/electronjs e r/gamedev riportano casi reali di refund rate 30‑35% per giochi React/Electron con lag UI, mentre titoli nativi simili restano sotto il 12%.

### 3.3 Vantaggi
- Iterazione UI rapidissima, hotfix veloci. Ma contano solo se le prime 2 ore sono stabili su hardware entry level.

## 4. Unit economics

### 4.1 Prezzo effettivo
- Listino €7.99, eventuale sconto lancio 20% → €6.39 (opzionale).

### 4.2 Scomposizione per copia

| Voce | Calcolo | Importo (€) | % sul transato | Note |
| --- | --- | --- | --- | --- |
| Prezzo pagato | €7.99 (prezzo pieno) | **€7.99** | 100% | Transazione utente |
| IVA 22% | €7.99 / 1.22 | **−€1.44** | 18% | Scorporo IVA → base €6.55 |
| Steam cut | €6.55 × 30% | **−€1.96** | 24.5% | Commissione Valve |
| Netto operativo | €6.55 − €1.96 | **€4.59** | 57.5% | Prima dei rimborsi |
| Accantonamento refund | 15% · €4.59 | **−€0.69** | 8.6% | Rischio stack web |
| Netto versato | €4.59 − €0.69 | **€3.90** | 48.8% | Pre-tasse personali |

### 4.3 Tassazione italiana
- Regime forfettario: coefficiente 67‑78% + imposta sostitutiva 5% + INPS ~26%. Stimiamo trattenuta complessiva ~30%.
- **Netto reale:** €3.90 − 30% ≈ **€2.73** per copia.
- **Break-even personale:** per uno stipendio netto €1.500/mese servono ~550 copie nette/mese → difficile con 3.000 wishlist senza breakout.

### 4.4 Withholding tax
- Obbligatorio compilare W‑8BEN. Se errato → 30% trattenuto negli USA. Assumiamo compilato correttamente (0%).

## 5. Strategia di prezzo

### 5.1 Benchmark
- **Factory Town Idle (€4.99)** – Very Positive (91%).
- **Rusty’s Retirement (€6.99)** – Overwhelmingly Positive (97%).
- **Sixty Four (€5.99)** – Mostly Positive (73%).
- **Moose Miners (€9.99)** – Mixed (67%), critica principale “prezzo alto per contenuti offerti”.

### 5.2 Rischio percezione
- A €7.99 gli utenti si aspettano comunque un loop profondo e assenza di problemi tecnici: qualsiasi lag o UI “web” può innescare review negative legate al prezzo.

### 5.3 Regional pricing
- Necessario applicare prezzi localizzati aggressivi (Brasile/Russia/SEA). Anche €7.99 diretti in BR/PT-BR può risultare premium, quindi serve calibrazione Steamworks.

## 6. Capsule art vs AI art

- **CTR medio Discovery Queue:** 2‑3%.
- **CTR con arte professionale:** 5‑8% (case study). Su 100k impressions → 2000 vs 5000 visite → differenza 300 vendite (≈€1.200 netti). Investimento €500 ripagato in una settimana.
- **AI art:** penalità reputazionale (review “dev pigro”), incoerenza estetica, bounce rate alto → algoritmo riduce visibilità.

## 7. Scenari proiezioni (mese 1)

| Scenario | Wishlist → vendite | Vendite organiche | Refund | Copie nette | Netto pre-tasse |
| --- | --- | --- | --- | --- | --- |
| **A. Flooring** | 10% = 300 | ≈0 | 30% | 210 | €819 |
| **B. Mediana** | 25% = 750 | +750 (2×) | 12% | 1.320 | €5.148 |
| **C. Breakout** | 40% = 1.200 | +6.000 (5×) | 8% | 6.624 | €25.833 |

## 8. Benchmark competitor (lesson learned)

| Titolo | Prezzo | Performance | Lezione |
| --- | --- | --- | --- |
| Rusty’s Retirement | €6.99 | Hit virale | UX unica (overlay), ottimizzazione impeccabile |
| Factory Town Idle | €4.99 | Successo solido | Prezzo onesto + profondità |
| Moose Miners | €9.99 | Mixed | Prezzo alto + contenuti insufficienti |
| Dead Unending | €9.99 | Flop | Problemi tecnici e sviluppo lento |
| Widget Inc | €4.99 | Very Positive | Aspettative calibrate |

## 9. Dati mancanti (known unknowns)
- **Età wishlist:** quanti opt-in <3 mesi?
- **Distribuzione geografica:** percentuale da regioni low-PPP?
- **Localizzazione:** lingue disponibili al lancio (ZH‑CN, DE, ES)?

## 10. Roadmap tattica anti-disastro
1. **Capsule art pro** (€500): requisito base per CTR.
2. **Playtest tecnico** su hardware datato (8GB RAM, GPU integrate). Target: <300 MB RAM idle, <10% CPU.
3. **Repricing se necessario:** se i contenuti non reggono 20+ ore, considerare €5.99‑€6.99 per massimizzare volume.
4. **Localizzazione strategica:** UI + tutorial in Cinese Semplificato, Tedesco, Spagnolo.
5. **Monitoraggio rimborsi:** chiudere bug “lag/launch” entro i primi 10 resi.

## Fonti e riferimenti
- SensorTower / SteamDB per performance Rusty’s Retirement, Factory Town Idle, Sixty Four, Moose Miners.
- Post mortem e discussioni: HowToMarketAGame, r/gamedev, r/electronjs, Automaton West, XDA Developers, Game Oracle (wishlist→sales 2025).
- Case study CTR: thread Reddit “I more than doubled my steam click-through rate…”, “Everyone says ‘I hired an artist…’”.
