---
title: Prompt Library
description: Prompt reference catalog aligned with the DNA Prismatic Wanderlust art direction.
---

## Prompt Library

> Reference: [DNA Prismatic Wanderlust – Art Style Bible](../plans/art_direction_plan.md)
>
> **Dev tooling:** in modalità sviluppo, tutti i prompt e la Style Bible sono navigabili dalla pagina “Prompt & Bible Style” (tab dedicato nel menu Observatory). La UI legge dinamicamente questo documento, quindi ogni modifica qui verrà esposta automaticamente.

1. Elemento uno
2. Elemento due

## Master Prompt + Child Pipeline Examples

### Batch Implementation: Config Balancer Refactor

#### Master Prompt
```text
# MASTER PROMPT: config-balancer-refactor

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: CF-Phase10
- **Obiettivo**: Refactoring completo sistema configurazione bilanciamento

## SCOPE
Questo prompt orchestra l'esecuzione di 4 child prompt per completare il refactoring del sistema di configurazione bilanciamento.

## PREREQUISITI
- Node.js 20.19.6 installato
- TypeScript configurato
- Jest configurato per testing
- ESLint configurato
- Build system funzionante

## SEQUENZA CHILD PROMPT
1. config-balancer-types - Refactoring tipi e interfacce
2. config-balancer-engine - Migrazione FormulaEngine
3. config-balancer-ui - Aggiornamento UI componenti
4. config-balancer-tests - Test suite completo

## DIPENDENZE
- Child 1: Nessuna (primo task)
- Child 2: config-balancer-types (tipi definite)
- Child 3: config-balancer-types, config-balancer-engine (engine migrato)
- Child 4: config-balancer-types, config-balancer-engine, config-balancer-ui (UI pronto)

## OUTPUT ATTESO
- Sistema configurazione bilanciamento refattorizzato
- Test suite completo (>90% coverage)
- Documentazione aggiornata
- Migrazione dati eseguita con successo

## SAFEGUARDS
- Verifica compatibilità tipi tra child prompt
- Test regressioni tra ogni fase
- Backup dati prima di migrazioni
- Validazione output finale

## KANBAN STATUS
- **Padre**: config-balancer-refactor
- **Stato**: In corso
- **Child 1**: config-balancer-types - In corso
- **Child 2**: config-balancer-engine - Non assegnato
- **Child 3**: config-balancer-ui - Non assegnato
- **Child 4**: config-balancer-tests - Non assegnato
```

#### Child Prompt 1: Types Refactoring
```text
# CHILD PROMPT: config-balancer-types

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: CF-Phase10
- **Padre**: config-balancer-refactor
- **Obiettivo**: Refactoring tipi e interfacce sistema configurazione

## SCOPE
Questo prompt implementa il refactoring delle tipi e interfacce del sistema di configurazione bilanciamento come parte del batch config-balancer-refactor.

## PREREQUISITI
- Node.js 20.19.6 installato
- TypeScript configurato
- ESLint configurato
- Build system funzionante

## DIPENDENZE
- Nessuna (primo task del batch)

## INPUT RICEVUTO
- Requisiti tipi dal prompt padre
- Interfacce esistenti da mantenere
- Configurazione attuale da migrare

## OUTPUT RICHIESTO
- Tipi TypeScript refattorizzate
- Interfacce aggiornate e compatibili
- Test tipi eseguiti con successo
- Documentazione tipi aggiornata

## IMPLEMENTAZIONE
1. Analisi tipi esistenti
2. Refactoring struttura tipi per modularità
3. Aggiornamento interfacce per compatibilità
4. Migrazione configurazioni esistenti
5. Test validazione compatibilità

## VERIFICA
- Test tipi passanti (>95% coverage)
- Interfacce compatibili con codice esistente
- Configurazioni migrate correttamente
- Performance test superati

## SAFEGUARDS
- Mantenere compatibilità backward
- Validare ogni migrazione
- Test regressioni intensive
- Documentazione breaking changes

## KANBAN STATUS
- **Padre**: config-balancer-refactor
- **Stato**: Completato
- **Output**: src/balancing/config/types/
```

---

### Batch Implementation: Stress Testing Pipeline

#### Master Prompt
```text
# MASTER PROMPT: stress-testing-pipeline

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: ST-Phase10_5
- **Obiettivo**: Implementazione completa pipeline stress testing

## SCOPE
Questo prompt orchestra l'esecuzione di 3 child prompt per completare la pipeline di stress testing per analisi marginal utility.

## PREREQUISITI
- Node.js 20.19.6 installato
- TypeScript configurato
- Stress test archetypes generator funzionante
- Marginal utility calculator base

## SEQUENZA CHILD PROMPT
1. stress-testing-archetypes - Migrazione archetypes generator
2. stress-testing-calculator - Migrazione marginal utility calculator
3. stress-testing-exporter - Implementazione export utilities

## DIPENDENZE
- Child 1: Nessuna (primo task)
- Child 2: stress-testing-archetypes (generator migrato)
- Child 3: stress-testing-archetypes, stress-testing-calculator (calculator migrato)

## OUTPUT ATTESO
- Pipeline stress testing completa
- Archetypes generator ottimizzato
- Marginal utility calculator integrato
- Export utilities funzionanti
- Test suite completo

## SAFEGUARDS
- Verifica consistenza dati tra componenti
- Test performance pipeline completa
- Validazione risultati marginal utility
- Benchmark performance target

## KANBAN STATUS
- **Padre**: stress-testing-pipeline
- **Stato**: In corso
- **Child 1**: stress-testing-archetypes - In corso
- **Child 2**: stress-testing-calculator - Non assegnato
- **Child 3**: stress-testing-exporter - Non assegnato
```

#### Child Prompt 2: Calculator Integration
```text
# CHILD PROMPT: stress-testing-calculator

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: ST-Phase10_5
- **Padre**: stress-testing-pipeline
- **Obiettivo**: Migrazione marginal utility calculator

## SCOPE
Questo prompt implementa la migrazione del marginal utility calculator come parte della pipeline stress testing.

## PREREQUISITI
- Node.js 20.196 installato
- TypeScript configurato
- Archetypes generator migrato
- Base marginal utility calculator esistente

## DIPENDENZE
- stress-testing-archetypes (archetypes generator migrato)
- Base marginal utility calculator (da integrare)

## INPUT RICEVUTO
- Archetypes generator migrato dal prompt figlio
- Calculator base esistente da integrare
- Requisiti marginal utility dal prompt padre
- Configurazione stress testing dal prompt padre

## OUTPUT RICHIESTO
- Marginal utility calculator integrato con pipeline
- Simulazioni marginal utility eseguite
- Risultati analisi marginal utility esportati
- Performance target raggiunto

## IMPLEMENTAZIONE
1. Integrazione calculator con archetypes generator
2. Implementazione simulazioni parallelhe
3. Aggiornamento algoritmo marginal utility
4. Integrazione con export utilities
5. Ottimizzazione performance

## VERIFICA
- Test integrazione archetypes-calculator
- Performance test superati (< 30s per 1000 simulazioni)
- Risultati marginal utility validati
- Export utilities funzionanti

## SAFEGUARDS
- Validazione risultati marginal utility
- Monitor performance durante integrazione
- Test con dataset di stress testing
- Verifica completezza export dati

## KANBAN STATUS
- **Padre**: stress-testing-pipeline
- **Stato**: Completato
- **Output**: src/balancing/stressTesting/MarginalUtilityCalculator.ts
```

---

## Quando Usare Master + Child

### Casi Ideali
1. **Refactoring Sistemico**: Quando un sistema richiede modifiche coordinate su più componenti
2. **Implementazione da Zero**: Quando si implementa un sistema complesso da zero
3. **Migrazione Incrementale**: Quando si migra un sistema esistente in fasi
4. **Testing Completo**: Quando si richiede test suite completo per un sistema

### Vantaggi
- **Specializzazione**: Ogni child prompt può essere specializzato per task specifici
- **Tracciabilità**: Stato progresso chiaro per ogni fase
- **Manutenibilità**: Facile manutenzione e debugging
- **Qualità**: Focus su task singoli migliora qualità complessiva

### Limitazioni
- **Overhead**: Richiede più tempo per setup iniziale
- **Complessità**: Aggiunge complessità organizzativa
- **Dipendenze**: Richiede gestione attenta delle dipendenze
- **Learning Curve**: Richiede formazione per team di sviluppo

## Best Practices

### Progettazione Master Prompt
- **Scope Realistico**: Definire batch di dimensione gestibile
- **Prerequisiti Chiari**: Elencare solo prerequisiti essenziali
- **Sequenza Logica**: Ordinare child prompt in modo logico
- **Output Definitivo**: Specificare esattamente cosa aspettarsi

### Progettazione Child Prompt
- **Scope Focalizzato**: Un solo task ben definito
- **Dipendenze Minime**: Elencare solo dipendenze strettamente necessarie
- **Output Specifico**: Definire esattamente cosa produrre
- **Verifica Completa**: Includere checklist di verifica

### Gestione Stato
- **Tracking Progressivo**: Monitorare stato di ogni child prompt
- **Gestione Errori**: Definire procedure per gestione errori
- **Rollback Procedure**: Specificare come gestire fallimenti
- **Comunicazione Chiara**: Documentare stato e problemi

## Troubleshooting

### Errori Comuni
- **Dipendenze Mancanti**: Verificare che tutti i prerequisiti siano soddisfatti
- **Sequenza Errata**: Controllare l'ordine dei child prompt
- **Output Non Conforme**: Validare output rispetto a requisiti
- **Timeout**: Gestire timeout per operazioni lunghe

### Debug Tips
- **Log Dettagliato**: Aggiungere logging a ogni fase
- **Stato Intermedio**: Salvare stato progresso tra child prompt
- **Snapshot Output**: Salvare output intermedio per debug
- **Error Context**: Catturare contesto completo degli errori

## Tooling Support

### CLI Commands
```bash
# Verifica prompt con dipendenze
npm run prompt:check -- MASTER_PROMPT

# Verifica batch completo
npm run prompt:check -- MASTER_PROMPT --check-dependencies

# Lista prompt figli di un master
npm run prompt:check -- MASTER_PROMPT --list-children

# Verifica stato batch
npm run prompt:check -- MASTER_PROMPT --status
```

### Schema Validation
```json
{
  "promptId": "string",
  "parentId": "string",
  "type": "master|child",
  "status": "unassigned|in_progress|completed|failed|blocked",
  "dependencies": ["string"],
  "prerequisites": ["string"],
  "scope": "string",
  "safeguards": ["string"]
}
```

---

**Framework Status**: Pronto per utilizzo  
**Compatibilità**: Completamente compatibile con KS-005  
**Scalabilità**: Supporta batch di qualsiasi complessità  
**Manutenimento**: Facilitato da struttura modulare

## Volto eroico – Elite Portrait Prompt

- **Intent:** Ritratto d'élite per eroe maschile occidentale con forte contrasto tra volto scultoreo e armatura materica.
- **Art Stack:** Viso iper-realistico stile Ruan Jia, armatura a impasto Jaime Jones, cromie Araki, luce golden hour.

### Prompt (copia/incolla – Volto eroico)

```text
Elite character portrait of a noble Western male hero. STYLE FOCUS: Extreme contrast in rendering technique. THE FACE: Rendered in the hyper-realistic, sculptural style of Ruan Jia. Flawless skin texture, incredible bone structure definition, luminous subsurface scattering light, looking like a living classical sculpture. No visible brushstrokes on the face. Clear, intense eyes. THE ARMOR & BACKGROUND: Heavy Sun-Bronze plate armor, deeply scratched and weathered, rendered with thick, visible oil impasto brushwork (Jaime Jones style). Background is blurry basalt with oil-slick veins against a vibrant teal sky (Araki palette). LIGHTING: Warm, golden hour light creating a divine glow on the sculptural face and sharp highlights on the rough bronze. Serious, breathtaking beauty.
```

### Output Reference – Volto eroico

- **Image:** [Heroic Portrait Concept](../../src/assets/mood/volto%20eroico.png)
- **Note:** Folder: public/assets/characters

---

## Armatura Imperiale – High-Fidelity Splash Prompt

- **Intent:** Splash art iper-satura con contrasto assoluto tra eroe immacolato e mondo mostruoso.
- **Art Stack:** Volto Ruan Jia, armatura impastata Jeff Easley, mostri Justin Gerard, architetture Sparth, cromia Araki.

### Prompt (copia/incolla)

```text
Armatura Imperiale — A vibrant, high-key fantasy splash art set in a Prismatic Void. NO BROWN, NO SEPIA. Electric turquoise sky fading into deep magenta at the zenith, clean white sunlight making colors hyper-saturated. Shadows glow in vivid Cobalt Blue and Neon Emerald. Foreground hero strikes an Araki high-fashion pose wearing Baroque Sun-Bronze armor: asymmetric exoskeleton of interlocking bronze plates, sharp fins, asymmetric wings, encrusted with glowing translucent amber shards and etched runes, rendered with Jeff Easley heavy impasto. The face (Ruan Jia style) is luminous, warm golden skin with subsurface scattering, intelligent contemporary features, “living god” intensity. Mid-ground monsters are Justin Gerard “Gnarled Nightmares”: twisted knots of ancient wood fused with jagged obsidian shards and tattered ritual silks, hunched and folkloric with tiny glowing eyes. Background architecture: colossal floating slabs of black basalt (Sparth brutalism) overgrown with glowing violet/orange moss, no arches or columns. Overhead, the massive crisp shadow of a dragon cuts through the turquoise sky, projected as a dark purple silhouette across the upper third. Technique contrast: dirty impasto for armor and monsters, ultra-clean digital polish for the hero’s face. 
```

### Output Reference – Armatura Imperiale

- **Image:** [Armatura Imperiale Render](../../src/assets/mood/armatura%20imperiale.png)
- **Note:** Folder: src/assets/mood

---

## Villaggio – Frontier Theater Vista Prompt

- **Intent:** Panorama 21:9 del villaggio di frontiera per Theater View con mood “Rude Beauty”.
- **Art Stack:** Jaime Jones impasto ampio, palette Solar Triumph (sunlit oro + ombre teal), Dolomites geography.

### Prompt (copia/incolla – Villaggio)

```text
Villaggio — A majestic, wide-angle (21:9) landscape of a frontier village nestled in a lush mountain valley, composed for Theater View. Architecture: sturdy timber-and-stone houses with golden thatched roofs, organic and rustic, seamlessly integrated with the terrain—no people, but lived-in warmth. Geography: a crystal-clear river reflecting a vibrant azure sky, with monumental jagged mountain peaks (Dolomites-inspired) and a sun-drenched ancient forest in the distance. Lighting: Solar Triumph—clean white sunlight slamming into surfaces, casting deep, cool teal shadows (no grim darkness). Technique: Jaime Jones broad oil brushstrokes with thick impasto texture on wood and stone, high contrast between luminous sunlit faces and saturated teal crevices. Mood: adventurous, inviting, full of potential, pure “Rude Beauty.”
```

### Output Reference – Villaggio

- **Image:** [Villaggio Concept](../../src/assets/mood/villaggio.png)
- **Note:** Folder: src/assets/mood

---

## Armatura Antagonista – Momentum Bruiser Prompt

- **Intent:** Ritratto cinematico dell’antagonista principale, silhouette iconica e aggressiva.
- **Art Stack:** Jeff Easley impasto violento, palette obsidian/violet/raw sienna, eroic realism moderno.

### Prompt (copia/incolla – Armatura Antagonista)

```text
Armatura Antagonista — A masterful cinematic oil painting in heroic realism, heavy textured impasto by Jeff Easley. Depict a legendary Bruiser archetype with unstoppable momentum and physical aggression—a force of nature, not just a warrior. The face is sharp and modern with intense, focused eyes showing cold intelligence rather than rage, framed by dramatic high-contrast lighting. Silhouette is exaggerated and iconic, armor and weapons feel like brutal, modern extensions of ancient materials. Painting style: thick, violent brushstrokes, visible layers adding physical depth, with a blurred atmospheric storm of colors behind the figure reflecting their inner turmoil. Lighting and palette: deep, saturated chiaroscuro built on obsidian black, electric violet highlights, and raw sienna undertones for a dark, epic, electrifying mood.
```

### Output Reference – Armatura Antagonista

- **Image:** [Armatura Antagonista Concept](../../src/assets/mood/Armatura%20antagonista.png)
- **Note:** Folder: src/assets/mood

---

## Jungle Ruins – Solar Column Study Prompt

- **Intent:** Studio ambientazione tropicale con colonna marmorea iper-luminosa per key art.
- **Art Stack:** Jaime Jones impasto spesso, palette turchese/smeraldo, contrasti luce calda vs pietra fredda.

### Prompt (copia/incolla – Jungle Ruins)

```text
Jungle Ruins — A massive ancient white-marble column rising from a lush tropical clearing, painted in Jaime Jones’ thick, oily brushwork. Blinding solar light slams into the marble, creating searing high-contrast highlights, while the shadowed face glows in saturated turquoise and emerald greens instead of dull grays. Materiality clash: cold stone catching warm light, surrounded by vivid foliage and humidity haze. No darkness—only intense color, cinematic 8K painterly texture emphasizing confident strokes and atmospheric depth.
```

### Output Reference – Jungle Ruins

- **Image:** [Jungle Ruins Concept](../../src/assets/mood/jungle%20ruins.png)
- **Note:** Folder: src/assets/mood

---

## Verso Mordor – Obsidian Expanse Prompt

- **Intent:** Panorama epico da worldbuilding per cutscene/overworld, esaltando la durezza basaltica e il mood trionfante.
- **Art Stack:** Jaime Jones impasto spesso, composizione aurea asimmetrica, palette cobalto/arancio ardente.

### Prompt (copia/incolla – Verso Mordor)

```text
Verso Mordor — An epic high-fantasy landscape of jagged obsidian cliffs and shattered dark basalt ruins. No trees, no grass. The sky glows in vibrant indigo with streaks of blazing orange light flares, while dust motes dance in intense sun shafts. Style: Jaime Jones thick impasto with visible brushstrokes and loose, painterly edges. Palette anchored in deep cobalt shadows and burning orange highlights. Composition follows an asymmetric Golden Ratio curve, leading the eye toward a triumphant focal spire. Mood: triumphant, forward momentum, chaotic good energy despite the harsh terrain. 
```

### Output Reference – Verso Mordor

- **Image:** [Verso Mordor Concept](../../src/assets/mood/verso%20mordor.png)
- **Note:** Folder: src/assets/mood

---

## Default Agent Prompt Template (2026-01-02)

Per ogni incarico, usa questo schema standardizzato. Mantieni i task piccoli (massimo 2-3 step per prompt) per evitare blocchi e crea prompt separati quando le attività sono indipendenti.

### Requisiti di completezza (aggiornamento 2026-01-11)

Tutti i nuovi prompt devono includere esplicitamente:

1. **Prerequisiti dichiarati**: elenca file, hook o feature già esistenti, eventuali dipendenze da altri prompt e la versione Node/nvm da usare. Specifica chiaramente cosa va creato ex-novo vs. cosa è già presente.
2. **Config & Persistence**: indica sempre il percorso dei file di configurazione e come usare `PersistenceService.saveData/loadData` (vietato usare localStorage diretto). Se servono nuovi file config, cita path, nome modulo e regole JSDoc.
3. **Scope & Deliverable**: chiarisci cosa è dentro/fuori scope, quali componenti/servizi vanno toccati, quali documenti aggiornare e quale output finale (UI, hook, script, doc) è richiesto.
4. **Safeguard + Evidenze**: specifica la suite completa da eseguire (lint, test, `npm run build:check`, `npm run kanban:lint`) e il path del log `test-results/<prompt>-<data>.log`. Ogni prompt deve ricordare di aggiornare il Kanban con stato/evidenza.
5. **Parallelizzabilità obbligatoria**: ogni batch di prompt richiesti deve essere eseguibile in parallelo sia internamente (fra i prompt del batch) sia con i task già attivi. Se anche un singolo prompt non può esserlo, deve essere rinviato o suddiviso prima della consegna del batch.

Se un agente chiede informazioni già previste da questi quattro punti, aggiorna immediatamente il prompt per includerle.

**IMPORTANTE:** Il template ufficiale DEVE essere sempre dentro un blocco ```text per copia/incolla immediato. Non scrivere prompt in formato libero - usa sempre questo template.

**Template Ufficiale (copia/incolla):**

```text
AGENT: <scegli uno degli agent gratuiti Windsurf (ChatGPT Codex 5.1, Grok fast 1, SWI 1 – aggiorna la lista ogni settimana)>
OBIETTIVO: <singola frase chiara e misurabile>
FILE TARGET: <percorsi relativi o glob interessati>
DIPENDENZE: <elenco ID prompt separati da virgola, o "-" se nessuna>
INVARIANTI (NON DEROGABILI): rispetta sempre `.windsurf/rules/` — skin di default (`useSkinPreferences` / `DEFAULT_SKIN_PRESET_ID`), i18n via `react-i18next` (nessuna stringa hardcoded, ns `common`/`idleVillage`), persistenza solo via `@/shared/persistence/PersistenceService`, config-first + Zod, tema Gilded Observatory. Valgono a prescindere da come è formulata la richiesta; in caso di conflitto segnala invece di derogare.
UI PHILOSOPHY REFERENCE:
  - Se questo task coinvolge UI/interazioni/animazioni/drag-drop/game feel, consulta OBBLIGATORIAMENTE:
    📖 docs/plans/ui_game_dev_system_prompt.md
  - Applica principi 2026: React Compiler-first, useRef per high-frequency updates, GPU-optimized CSS, juicy feedback (visual+audio+tactile), Zustand per state, config-first architecture.
  - Checklist pre-commit UI: <16ms/frame, zero hardcoded values, transform/opacity only, layered feedback.
OPERAZIONI DA ESEGUIRE:
  0. [OBBLIGATORIO] Subito dopo `npm run prompt:check`, apri `src/docs/docs/coordinator/agent_assignments.md`, marca il prompt come “In corso” con agente/data e descrizione aggiornata (nessun altro comando prima di questo).
  1. <step 1 – includi log/diagnostica obbligatoria>
  2. <step 2 – ecc.>
OPERAZIONI VIETATE:
  - <es. non toccare componenti legacy, niente page.waitForTimeout>
ASSUNZIONI:
  - Esegui direttamente i passi noti senza chiedere conferma.
  - Completa l'intera sequenza di operazioni in modo consecutivo, senza pause tra gli step finché tutti non risultano verdi; passa allo step successivo appena il precedente è riuscito e fermati solo se una verifica fallisce.
  - Se incontri un blocco, logga il problema (file + errore) e fermati.
NODE.JS LOCALE (OBBLIGATORIO):
  - Prima di qualsiasi comando npm/eslint/test esegui **dentro il progetto**:
    ```bash
    cd "<cartella root del repo>"
    source ~/.nvm/nvm.sh
    nvm use 20.19.6
    node --version
    ```
  - Non aggiornare/alterare la versione globale di Node.js: usa solo quanto definito in `.nvmrc`.
KANBAN SAFETY:
  - **GUIDELINES OBBLIGATORIE**: Segui `docs/coordinator/agent_execution_guidelines.md` per lock, safeguard suite, evidence collection, e completamento Kanban.
  - Prima di iniziare, esegui `npm run prompt:check -- <ID>` e **aggiorna immediatamente** la riga Kanban a “In corso” con agente/data prima di qualsiasi altro comando.
  - Dopo completamento, esegui safeguard suite (test + build + lint) e aggiorna Kanban secondo le guidelines.
SAFEGUARD MANDATORY STEPS:
  1. Prima di qualsiasi modifica: npm run build (baseline)
  2. Ogni 10min: npm run build (incrementale)
  3. Prima di completare: npm run safeguard suite
  4. Se build fallisce: FERMATI e segnala blocco
  5. Evidence log DEVE contenere output completo di: npm run build, npm run lint, npm run test

BLOCCANTI ASSOLUTI:
  - ❌ TypeScript errors (anche 1 solo)
  - ❌ Lint errors (anche 1 solo)
  - ❌ Test failures (anche 1 solo)
  - ❌ Kanban lint fallito

SE QUALSIASI DI QUESTI FALLISCE, IL TASK È BLOCCATO.
OUTPUT ATTESI:
  - Segui safeguard suite da `agent_execution_guidelines.md` (test + build + lint)
  - Evidence log in `test-results/` secondo le guidelines
  - Report finale con lock, safeguard, e Kanban update evidence
DOCUMENTAZIONE DA AGGIORNARE:
  - <plan/changelog da toccare prima di chiudere il task>
REGRESSION SAFEGUARDS:
  - Tutti i safeguard (test, build, lint) devono passare secondo `agent_execution_guidelines.md`
  - Se qualsiasi safeguard fallisce, il task è bloccato e non può essere completato
  - Includi sempre clausola "se una verifica fallisce, fermati e segnala il blocco"
NOTE:
  - <dipendenze, fixture da usare, hook disponibili, ecc.>
  - Se un task è troppo grande, suddividilo in prompt consecutivi (es. fixture → spec → run) invece di chiedere tutto insieme.
  - Usa sempre `OPERAZIONI VIETATE` per evitare modifiche collaterali.
  - Richiedi log/diagnostica nei singoli step così l'agente non si ferma senza output.
  - Lancia prompt paralleli solo quando non ci sono dipendenze e assicurati che, quando il coordinator richiede più prompt in blocco, **tutti** quelli consegnati possano essere eseguiti simultaneamente con i prompt già attivi.
```

### Linee guida add-on

- Se un task è troppo grande, suddividilo in prompt consecutivi (es. fixture → spec → run) invece di chiedere tutto insieme.
- Usa sempre `OPERAZIONI VIETATE` per evitare modifiche collaterali.
- Richiedi log/diagnostica nei singoli step così l'agente non si ferma senza output.
- Lancia prompt paralleli solo quando non ci sono dipendenze.

---

## Prismatic Monumental Gate – Environmental Icon Prompt

- **Intent:** Portale monumentale dinamico per splash ambientali e cutscene “adventurous”.
- **Art Stack:** Scala eroica di Huang Guangjian, texture painterly alla Arcane, cromatismi prismatici.

### Prompt (copia/incolla – Prismatic Monumental Gate)

```text
Prismatic Monumental Gate — A colossal, asymmetric gateway forged from scratched, weathered sun-bronze ribs fused with iridescent oil-slick glass panes. It rises from a dark volcanic rock floor veined with glowing red magma threads. Light refracts through every surface, creating wild prismatic lens flares and chromatic dispersion halos. Style blend: Huang Guangjian heroic architecture scale plus Arcane painterly textures—no flat colors, every plane vibrates with light and motion. Mood: dynamic, chaotic good, adventurous. Emphasize sharp silhouettes, layered glass reflections, and swirling dust motes caught in the radiant beams. 
```

### Output Reference – Prismatic Monumental Gate

- **Image:** [Prismatic Monumental Gate Concept](../../src/assets/mood/prismatic%20monumental%20gate.png)
- **Note:** Folder: src/assets/mood

---

## Architettura Impero del Sole – Solar Triumph Balcony Prompt

- **Intent:** Balcony vista per cutscene/glory shot, enfatizzando monumentalità luminosa dell’Impero del Sole.
- **Art Stack:** Jaime Jones impasto materico, palette oro/teal, atmosfera “Solar Triumph”.

### Prompt (copia/incolla – Architettura Impero del Sole)

```text
Architettura Impero del Sole — A monumental white-stone fortress balcony overlooking a vast golden valley, rendered in Jaime Jones’ thick oil impasto. Architecture feels noble and heavy, with chunky bronze railings catching blinding, triumphant sunlight. Shadows are deep and cool, tinted with saturated teal and turquoise ambient light. Every surface shows broad, confident brushstrokes—no digital smoothing, highly textured. Atmosphere is “Solar Triumph”: glorious, vast, uplifting. 8K painterly masterpiece framing the balcony in the foreground, valley stretching into radiant haze beyond.
```

### Output Reference – Architettura Impero del Sole

- **Image:** [Architettura Impero del Sole Concept](../../src/assets/mood/architettura%20impero%20sole.png)
- **Note:** Folder: src/assets/mood

---

## Drago – Emerald Relic Guardian Prompt

- **Intent:** Creature hero shot per concept/moodboard, tono epico serio con scala monumentale.
- **Art Stack:** Jeff Easley realism, pennellate olio eroiche, palette tropicale viva.

### Prompt (copia/incolla – Drago)

```text
Drago — A majestic ancient dragon perched atop an overgrown marble ruin deep in a lush tropical jungle. The dragon’s scales shimmer with iridescent emerald and polished gold, rendered with Jeff Easley–style heroic realism and expressive oil brushstrokes. Bright tropical sunlight cuts through the canopy, casting deep, rich shadows and dappled highlights over the marble and foliage. Palette: vivid turquoise sky fragments, lime-green jungle leaves, bright orange flowers, and bronze architectural accents. Style: hand-painted digital art with thick, confident strokes, high detail, epic scale, serious adventurous tone.
```

### Output Reference – Drago

- **Image:** [Drago Concept](../../src/assets/mood/drago.png)
- **Note:** Folder: src/assets/mood

---

## Ira Celeste – High-Fidelity Character Masterpiece

- **Intent:** Ritratto full-body di un guardiano templare furioso ma compassionevole, pronto a difendere il santuario.
- **Art Stack:** 1990s AD&D Heroic Realism (Jeff Easley) per armature impastate, volto scultoreo Ruan Jia, matericità a impasto Jaime Jones.

### Prompt (copia/incolla – Ira Celeste)

```text
TYPE: High-Fidelity Character Masterpiece. STYLE: 1990s AD&D Heroic Realism (Jeff Easley) with Ruan Jia's sculptural face. SUBJECT: A Westernized Nio Guardian, a wrathful warrior-monk protector.
--- ZONE 1: THE ANATOMY (The Akuma Soul) ---
HAIR: Wild, thick Cinnabar-Red hair that spikes upward like flickering flames, captured in mid-motion.
FACE: A "Wrathful Compassion" expression. Intense brow, clenched teeth, and glowing Azure eyes. Sculptural perfection (Ruan Jia).
BODY: Tanned, powerful muscular physique. Intricate Azure Blue tattoos (NeoRanga/Darth Maul hybrid) pulse with internal light across his chest and arms.
--- ZONE 2: THE MONOLITHIC GEAR (The Paladin Guard) ---
SHOULDERS: Massive, asymmetrical Alabaster White Pauldrons etched with deep Bronze filigree. They look like heavy temple architecture worn as armor.
LOWER BODY: Heavy Bronze and Alabaster greaves. A thick leather belt with ritualistic Bronze plates.
WEAPON: A colossal Bronze Executioner's Cleaver. It’s a massive slab of metal with Azure runic inscriptions. It looks impossibly heavy, designed for "cleaving through legions."
CONTRAST: A long, flowing scarf of Deep Teal heavy silk wraps around his neck and floats behind him like a celestial ribbon.
--- ZONE 3: LIGHTING & MATTER (The Bible DNA) ---
LIGHT: 'Solar Triumph'—a blinding, divine white light from above, hitting the Alabaster plates and creating a glowing subsurface scattering effect.
SHADOWS: Saturated Deep Teal and Turquoise shadows in the muscle definitions and armor crevices.
PALETTE: Cinnabar Red (hair), Alabaster White (armor), Azure Blue (energy/eyes), Antique Bronze (metal), Teal (fabric/shadows).
STYLE: Thick oil impasto (Jaime Jones) for the armor and weapon; smooth, radiant skin (Ruan Jia). NO FLAT SURFACES. NO DIGITAL GRADIENTS.
```

### Output Reference – Ira Celeste

- **Image:** [Ira Celeste Concept](../../src/assets/mood/ira%20celeste.png)
- **Note:** Folder: src/assets/mood

---

## POI Job Detail Roster Integration Fix

**AGENT:** Idle Village Runtime Integration Specialist  
**OBIETTIVO:** Fix POI job detail page issues: start button only for quests, config-first data flow, proper SlotRack behavior  
**FILE TARGET:**  
src/ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage.tsx  
src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx  
src/ui/idleVillage/components/ResidentSlotRack.tsx  
src/balancing/config/idleVillage/poiColorConfig.ts (new)  

**DIPENDENZE:** -  

**INVARIANTI (NON DEROGABILI):** rispetta sempre `.windsurf/rules/` — skin di default (`useSkinPreferences` / `DEFAULT_SKIN_PRESET_ID`), i18n via `react-i18next` (nessuna stringa hardcoded, ns `common`/`idleVillage`), persistenza solo via `@/shared/persistence/PersistenceService`, config-first + Zod, tema Gilded Observatory. Valgono a prescindere da come è formulata la richiesta; in caso di conflitto segnala invece di derogare.  
**UI PHILOSOPHY REFERENCE:**  
  - Se questo task coinvolge UI/interazioni/animazioni/drag-drop/game feel, consulta OBBLIGATORIAMENTE:  
    📖 docs/plans/ui_game_dev_system_prompt.md  
  - Applica principi 2026: React Compiler-first, useRef per high-frequency updates, GPU-optimized CSS, juicy feedback (visual+audio+tactile), Zustand per state, config-first architecture.  
  - Checklist pre-commit UI: <16ms/frame, zero hardcoded values, transform/opacity only, layered feedback.  

**OPERAZIONI DA ESEGUIRE:**  
0. [OBBLIGATORIO] Subito dopo `npm run prompt:check`, apri `src/docs/docs/coordinator/agent_assignments.md`, marca il prompt come "In corso" con agente/data e descrizione aggiornata (nessun altro comando prima di questo).  
1. Create config-first color configuration:  
   - Create `src/balancing/config/idleVillage/poiColorConfig.ts` with Zod schema  
   - Move `WILDERNESS_COLORS` from page to config module  
   - Add color mappings for all pillars (wilderness, empire, etc.)  
   - Export `getDefaultPoiColors(pillar: string)` function  
2. Fix start button conditional rendering:  
   - In `PoiDetailJobRosterIntegrationPage.tsx`, modify `detailProps` to conditionally provide `onStart` only for quest activities  
   - Use `activityKind === 'quest'` check before adding `onStart` handler  
   - Verify `onCancel` and `onCollect` also follow quest-only pattern  
3. Implement proper SlotRack integration:  
   - Add missing `getSlotActivityState` handler in page component  
   - Add `resolveDisplayInfo` handler for slot icons/labels  
   - Ensure proper drop state propagation to `ResidentSlotRack`  
   - Test slot click/detach functionality  
4. Update data flow to be fully config-first:  
   - Replace hardcoded color references with config imports  
   - Verify all UI tokens come from Style Lab or config modules  
   - Add telemetry for POI detail interactions (start/cancel/collect)  
5. Test and verify fixes:  
   - Navigate to `/poi-job-detail-roster-integration`  
   - Verify start button only appears for quest POIs  
   - Verify all colors come from config (no hardcoded values)  
   - Test SlotRack drag/drop and slot interactions  

**OPERAZIONI VIETATE:**  
- Non toccare componenti legacy o pagine non correlate  
- Non aggiungere hardcoded colors o valori UI  
- Non modificare la struttura base di ActivityCapsuleDetailSkinAware  

**ASSUNZIONI:**  
- Esegui direttamente i passi noti senza chiedere conferma.  
- Completa l'intera sequenza di operazioni in modo consecutivo, senza pause tra gli step finché tutti non risultano verdi; passa allo step successivo appena il precedente è riuscito e fermati solo se una verifica fallisce.  
- Se incontri un blocco, logga il problema (file + errore) e fermati.  

**NODE.JS LOCALE (OBBLIGATORIO):**  
- Prima di qualsiasi comando npm/eslint/test esegui **dentro il progetto**:  
  ```bash
  cd "<cartella root del repo>"
  source ~/.nvm/nvm.sh
  nvm use 20.19.6
  node --version
  ```  
- Non aggiornare/alterare la versione globale di Node.js: usa solo quanto definito in `.nvmrc`.  

**KANBAN SAFETY:**  
- **GUIDELINES OBBLIGATORIE**: Segui `docs/coordinator/agent_execution_guidelines.md` per lock, safeguard suite, evidence collection, e completamento Kanban.  
- Prima di iniziare, esegui `npm run prompt:check -- <ID>` e **aggiorna immediatamente** la riga Kanban a "In corso" con agente/data prima di qualsiasi altro comando.  
- Dopo completamento, esegui safeguard suite (test + build + lint) e aggiorna Kanban secondo le guidelines.  

**SAFEGUARD MANDATORY STEPS:**  
1. Prima di qualsiasi modifica: npm run build (baseline)  
2. Ogni 10min: npm run build (incrementale)  
3. Prima di completare: npm run safeguard suite  
4. Se build fallisce: FERMATI e segnala blocco  
5. Evidence log DEVE contenere output completo di: npm run build, npm run lint, npm run test  

**BLOCCANTI ASSOLUTI:**  
- ❌ TypeScript errors (anche 1 solo)  
- ❌ Lint errors (anche 1 solo)  
- ❌ Test failures (anche 1 solo)  
- ❌ Kanban lint fallito  

**SE QUALSIASI DI QUESTI FALLISCE, IL TASK È BLOCCATO.**  

**OUTPUT ATTESI:**  
- Segui safeguard suite da `agent_execution_guidelines.md` (test + build + lint)  
- Evidence log in `test-results/` secondo le guidelines  
- Report finale con lock, safeguard, e Kanban update evidence  

**DOCUMENTAZIONE DA AGGIORNARE:**  
- `src/docs/docs/plans/idle_village_plan.md` (section on POI detail integration)  
- `CHANGELOG.md` (entry for POI job detail fixes)  

**REGRESSION SAFEGUARDS:**  
- Tutti i safeguard (test, build, lint) devono passare secondo `agent_execution_guidelines.md`  
- Se qualsiasi safeguard fallisce, il task è bloccato e non può essere completato  
- Includi sempre clausola "se una verifica fallisce, fermati e segnala il blocco"  

**NOTE:**  
- Config-first design: tutti i colori e token devono venire da `poiColorConfig.ts`  
- I18n: assicurarsi che tutte le stringhe user-facing usino `useTranslation`  
- Telemetry: aggiungere tracking per interazioni POI detail  
- SlotRack: verificare che `getSlotActivityState` e `resolveDisplayInfo` siano propriamente implementati
