---
trigger: always_on
---

RPG Balancer – Filosofia & Regole AI:

Contesto e obiettivo

Dominio: sistema di bilanciamento RPG basato su simulazioni Monte Carlo e “weight‑based creator pattern”.
Obiettivo dell’AI: proporre/modificare codice e strutture che restino coerenti con la filosofia del progetto, privilegiando configurabilità, riuso e leggibilità a lungo termine.
Principi fondamentali

Weight‑Based Creator Pattern
Tratta ogni nuova entità (stat, skill, carta, archetipo, ecc.) come un insieme di ticks {value, weight} con un calcolo di bilanciamento esplicito.
Non introdurre mai logiche “magiche” locali che sfuggono a questo schema.
ZERO Hardcoding / Single Source of Truth
Non hardcodare stats, pesi, formule, layout, preset dentro componenti o funzioni ad‑hoc.
Usa sempre i moduli di config esistenti (src/balancing/config/*, baseline, statWeights, ecc.).
Se qualcosa sembra un “numero magico” o una definizione di dominio, deve vivere in config/documentazione, non in una singola funzione.
Config‑First Architecture
I valori di dominio (stats, tipi di danno, scaling, carte, preset, ecc.) devono provenire da:
file di config (src/balancing/config/*),
tipi/shared modules (types, constants),
preset/documenti JSON dove previsto.
La logica applicativa deve leggere questi valori, non ridefinirli.
Regole di architettura e codice

Centralizzazione delle definizioni di dominio
Se serve una nuova stat / proprietà / flag, aggiungerla nei moduli di config appropriati (e relativi tipi), non inline in un componente.
Per modificare un valore di bilanciamento, preferire cambiare:
config centralizzate,
pesi/stat tables,
formule documentate.
Purezza e riuso
Estrarre la logica di bilanciamento e simulazione in funzioni pure/servizi TypeScript sotto src/balancing/*.
I componenti React devono essere il più possibile “thin”: leggono config e risultati, non ricreano formule/weights da zero.
Tipi e safety
Tipizzare sempre in modo esplicito le strutture di dominio (stats, archetypes, risultati di simulatori, metriche).
Usare tipi e helper esistenti prima di introdurre nuovi tipi duplicati.*
Regole UI/UX (Gilded Observatory)

UI Config‑Driven
La UI deve leggere sempre da:
useBalancerConfig o store equivalenti,
preset/config in src/balancing/config/*.
Niente liste di stats scritte a mano dentro componenti: usare enumerazioni/config centralizzate.
Tema e coerenza
Rispettare il tema “Gilded Observatory”: interfacce compatte, chiare, adatte a tool di analisi/bilanciamento.
Evitare UI “flashy” non coerenti; privilegiare tabelle, heatmap, grafici e controlli che supportino il lavoro di designer/balancer.
Separazione presentazione / logica
La UI non deve contenere logica di simulazione o regole di bilanciamento.
Qualsiasi cambiamento di formula, stat weight, ecc. deve essere fatto in moduli di dominio e solo visualizzato dalla UI.*
Flusso di lavoro e qualità

Quando aggiungi una feature di bilanciamento
Verifica se esiste già un piano/doc (es. MASTER_PLAN, piani di fase) che la descrive.
Allinea l’implementazione alla sezione rilevante del piano.
Aggiorna la documentazione se la nuova feature modifica il comportamento atteso.
Testing
Ogni modifica sostanziale a:
formule di combattimento,
stat weights,
archetypes generator,
pipeline di simulazione/bilanciamento
deve essere coperta da test (Vitest) o integrata in test esistenti.
Preferire test config‑driven (basati su preset/config) invece di test con valori magici hardcodati.
Manutenzione e leggibilità
Preferire nomi espliciti e coerenti con la terminologia dei docs.
Evitare duplicazione di logica tra moduli: se un concetto esiste già in un doc o in balancing/*, cercare prima di riusarlo.*