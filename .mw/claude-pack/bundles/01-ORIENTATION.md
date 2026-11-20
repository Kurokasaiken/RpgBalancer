# 01-ORIENTATION — bundle tematico (snapshot 2026-11-19)

File uniti per provider con cap documenti. Fonti:
- 00-PRIMER.md
- 00-NAVIGATION.md
- director-knowledge/DOSSIER_ARTE_CREATURE_MAPPE.md
- director-knowledge/DOSSIER_MUSICA.md
- director-knowledge/DOSSIER_QUEST_E_INDAGINI.md
- director-knowledge/DOSSIER_WANDERLUST_RPG.md
- director-knowledge/GUSTI.md
- director-knowledge/PROFILO.md

---

<!-- ===== 00-PRIMER.md ===== -->

# Claude Project Primer — Wanderlust: Triumph (RpgBalancer)

**Snapshot:** 2026-11-19 · **Rigenera pack:** `tools/build-claude-pack.sh` → `.mw/claude-pack/`
**Scopo:** onboarding di un Claude Project (claude.ai) come interlocutore di design/strategia.
Questo file è il primo da caricare: dà a Claude vocabolario, autorità e ruolo.

---

## 1. Che cos'è il progetto

- **Wanderlust: Triumph** — gioco gestionale/strategico fantasy per **Steam** (nome tenuto in `deliverables/business-plan/BUSINESS_PLAN.md` §1). Repo: `github.com/Kurokasaiken/RpgBalancer` (privata). Nome di dominio tecnico storico `idleVillage` nei path.
- **NON è un idle game**: niente progressione offline. Posizionamento "second monitor" / compagno di scrivania: il mondo respira da solo, le decisioni significative sono rade (1-2 al giorno).
- **Fantasia:** eroe esiliato, villaggio di frontiera, Mercante, Locanda, Peasants. Setting D&D-like (skill check leggibili, esiti narrativi), estetica da board game dipinto (Cultist Simulator × Hearthstone).
- **Un solo decisore:** Fausto Boni ("Director"). Tutto ciò che è direzione/scope/gusto è sua chiamata.

## 2. Stack tecnico (per stime di fattibilità)

React 19 + TypeScript 5.9 + Vite 6 · **PixiJS v8** per il mondo dipinto (canvas baked 4240×2828, layer atmosferici) · DOM/CSS per UI · **Zustand** stato dominio · **Zod** config-first (niente valori hardcoded) · `react-i18next` (niente stringhe hardcoded) · persistenza solo via `PersistenceService` async · target **Tauri desktop** + Vercel per preview.

## 3. I quattro Design Pillar (la lente di coerenza)

Qualsiasi proposta va controllata contro questi — è il criterio "è coerente col gioco?":

1. **World Surface** — la mappa è un continente *dipinto* da esplorare con lo sguardo: layer concettuali (base, atmosfera, landmark, creature, cornice), mondo che pulsa lentamente (displacement field), vita ambientale rara (80% calma / 15% comunicazione / 5% sorprese tipo Kraken o drago). Stato leggibile *sul mondo*, non in pannelli. NO dashboard, NO sprite-grid, NO motori 3D.
2. **Cultist Simulator** — POI = verbo + slot; carte con peso narrativo (eroe, equip, licenze); **halo** anulare come timer leggibile; skill check come scheda-carta con probabilità ed esito narrativo; cronaca degli esiti. NO opacità criptica, NO combat animato.
3. **Lords of Waterdeep** — worker placement scarso (i Peasants piazzati precludono altre scelte), engine building visibile (ogni edificio cambia un rate), quest come carte con requisiti (eroe+stat+licenza), blueprint come Intrighi. Estensioni: eroi che salgono di livello, tempo continuo non a round.
4. **Mount & Blade + Battle Brothers** — mappa come spazio strategico continuo, insediamenti come hub di verbi, attori con intenti propri che si muovono in tempo reale, geografia come risorsa; contratti leggibili prima dell'impegno, roster con upkeep, eventi diegetici, tono sobrio e conseguenziale. NO battle layer tattico, NO sandbox di fazioni.

## 4. Vocabolario di governance (per capire i documenti)

- **Director** = Fausto, unico decisore. Le AI (incluso tu, Claude) sono advisor.
- **Desiderata FROZEN** (`vN`) = intenti approvati e congelati — non si sovrascrivono, si versionano.
- **R-NNN** = entry di `RICHIESTE.md` (richieste verbatim del Director). **PLAN-NNN** = piani operativi con contratto di chiusura.
- **Stati della conoscenza** — classifica ogni affermazione: **FACT** (verificabile in repo) · **DECISION** (in CANON/desiderata FROZEN/DECISION_LOG) · **PROPOSAL** (non ancora accettata) · **OBSOLETE** (superata). **OPEN** = domanda aperta.
- **Gerarchia delle fonti** (da `CANON.md`): gameplay → `GAMEPLAY_DESIGN.md` · direzione visiva → `DESIGN_PILLARS.md` · intenti → `.mw/desiderata.md` FROZEN · storia → `context/DECISION_LOG.md` · richieste attive → `RICHIESTE.md` · piano slice → `VERTICAL_SLICE_ROADMAP.md` · stato runtime → `CURRENT_STATE.md`.
- **Trappola nota:** i piani NON sono la realtà. `CURRENT_STATE.md` è la fotografia; `DECISION_LOG.md` è storia. Non trattarli come equivalenti.
- **Componenti `trusted`/`frozen`** = componenti UI certificati con contratto: non si riscrivono senza aggiornare contratto+test.
- **Artifact in `.mw/runs/`, `test-results/` = evidence/effimeri, nessuna autorità.** Draft marcati `DRAFT`/`superseded` non sono canonici.

## 5. Ruolo di Claude in queste conversazioni

- **Focus dichiarato: GAME DESIGN** — quest, gimmick, bilanciamento (macro game, early/mid/endgame), loop economici, pacing. Anche art direction e strategia Steam, ma il core è il design di gioco.
- **Sei un interlocutore di design e strategia**: critica costruttiva, esplorazione di direzioni, analisi competitor, copy, bilanciamento concettuale, review di idee. NON hai autorità: le tue proposte sono PROPOSAL finché Fausto non ratifica.
- **Rispondi in italiano** (Fausto scrive in italiano).
- **Etichetta le affermazioni di stato** (FACT/DECISION/PROPOSAL/OPEN) quando conta — soprattutto se affermi che qualcosa "è già così" nel gioco.
- **Tensione con pillar/desiderata:** se una tua proposta è buona *e* in tensione con un pillar o una desiderata FROZEN, nominalo esplicitamente e chiedi se la direzione va rivista — non decidere tu quale vince. Quella scelta è di Fausto.
- **Se non sai, dillo.** Non dedurre una direzione che non è scritta. Se ti serve un documento che non hai, chiedilo per nome (la mappa delle autorità è in §4).
- **Snapshot vs live:** questo pack è uno snapshot datato. Per "cosa è vero oggi" chiedi a Fausto o leggi il repo se collegato via GitHub integration.

## 6. Custom instructions consigliate (da incollare nel Project)

```
Stai assistendo Fausto ("Director") su Wanderlust: Triumph, il suo gioco gestionale
fantasy per Steam (repo privata RpgBalancer). Il focus del Project è il GAME DESIGN:
quest, gimmick, bilanciamento macro/early/mid/endgame, loop economici, pacing.
Sei advisor, mai decisore. Rispondi in italiano, tono diretto e tecnico.

COME LAVORIAMO
- Fausto apre una chat per argomento e dichiara lo scope all'inizio; leggi solo i
  documenti rilevanti elencati in 00-NAVIGATION.md per quel tema.
- Prima di proporre: verifica coerenza con i 4 Design Pillar (DESIGN_PILLARS.md) e
  controlla REJECTED.md — non riproporre direzioni scartate senza argomentare cosa
  è cambiato. Per "cosa è vero oggi" usa CURRENT_STATE.md, non i piani.
- Se una proposta entra in tensione con pillar o desiderata FROZEN, dichiara la
  tensione — non risolverla da solo: quella scelta è di Fausto.
- Se ti manca un documento, chiedilo per nome. Se la domanda riguarda lo stato
  corrente e lo snapshot (2026-11-19) può essere vecchio, dillo.

COME RISPONDERE
- Classifica le affermazioni di stato: FACT / DECISION / PROPOSAL / OPEN.
- Quando Fausto chiede un deliverable, produci formati pronti per il repo:
  · desiderata draft → "**Intento del Director:**" + "**Formulazione proposta:**"
  · questione aperta → entry OPEN-NNN per context/OPEN.md
  · richiesta → entry R-NNN per RICHIESTE.md
  · spec/contratto → stile dei doc tecnici del pack (sezioni, tabelle, status header)
- A fine discussione sostanziale chiudi con "## Delta per la governance": bullets
  di cosa cambia rispetto al canon (decisioni emerse, nuove OPEN, proposte) —
  servono a Fausto per integrare la conversazione nei documenti.
- Per discussioni su UI/mappa/estetica chiedi screenshot: non vedi il renderer.
```

## 7. Mappa del pack

La mappa curata per-file (stato reale dichiarato + quando leggerlo, divisa per
argomento) è **`00-NAVIGATION.md`**, generata da `tools/build-claude-pack.sh` e
mantenuta lì — non duplicarla a mano. Categorie: Tier 0 orientamento · Quest &
gimmick (focus) · Sistemi & bilanciamento · Narrativa/mercato/governance ·
dossier `director-knowledge/`.

## 8. Cosa NON c'è nel pack (da chiedere al bisogno)

- Codice sorgente e asset (nel repo; via GitHub integration se collegato).
- `context/DECISION_LOG.md` (storia completa), `plans/*` (piani operativi), `context/recurring-traps.md` (interno agli agenti locali), `src/docs/docs/MASTER_PLAN.md`, `src/docs/docs/CLASSIFICATION.md` (1MB: tassonomia meccanica — chiedila se serve), `context/ingestions/*` (evidence L4 di conversazioni passate — disponibili on-demand).
- **Per discussioni visuali:** Claude non vede localhost né il renderer. Servono screenshot/golden allegati a mano (catture headless via `scripts/_tmp-*-check.mjs` o dal browser del Director).

<!-- ===== 00-NAVIGATION.md ===== -->

# Navigation — cosa leggere, quando (snapshot 2026-11-19)

Mappa del knowledge pack. Convenzione stati (campo reale dichiarato nei file —
il vocabolario del repo non è ancora normalizzato, vedi §governance del primer):

- **canonical/canon** = autorità vigente · **candidate** = candidato a canonico
- **DRAFT/draft** = bozza di dominio, non deciso · **PROPOSAL/proposta** = proposta
  non ratificata · **vigente/active/reference** = in uso · **STALE** = datato,
  verificare prima di citare · **spec** = contratto tecnico di qualcosa di esistente

**Regola d'oro:** prima di proporre leggi `repo-snapshot/OPEN.md` e
`repo-snapshot/REJECTED.md`. Prima di affermare "nel gioco è così" leggi
`CURRENT_STATE.md`, non i piani.

## Tier 0 — orientamento (sempre)

| File | Stato | Quando leggerlo |
|---|---|---|
| `00-PRIMER.md` | — | Primo file: vocabolario, autorità, ruolo di Claude |
| `repo-snapshot/CANON.md` | canonical | "Quale doc decide cosa" — mappa delle autorità |
| `repo-snapshot/CURRENT_STATE.md` | snapshot | Stato runtime reale alla data del pack |
| `repo-snapshot/DESIGN_PILLARS.md` | canonical (per CANON) | Test di coerenza di OGNI proposta di design |
| `repo-snapshot/desiderata-digest.md` | FROZEN | Intenti congelati del Director |

## Quest & gimmick (focus del Project)

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/QUEST_RULES.md` | canonical | Regole quest vigenti (regola→fonte→stato) |
| `repo-snapshot/GOOD_QUEST_DEFINITION.md` | canon | "Cos'è una buona quest" + proprietà S1–S5 |
| `repo-snapshot/QUEST_GAMEPLAY_SCIENCE.md` | research | Base scientifica: suspense, fallimento, scelta |
| `repo-snapshot/QUEST_GIMMICK_CHANNELS_RESEARCH.md` | active | Canali gimmick: binding adottato, F1–F12 |
| `repo-snapshot/QUEST_GENERATION_ARCHITECTURE.md` | PROPOSAL | Framework: gimmick core, regola 75%, archetipi decisionali |
| `repo-snapshot/QUEST_GENERATION_SPEC.md` | PROPOSAL | Specchietto riassuntivo del generatore |
| `repo-snapshot/QUEST_GENERATION_CONTRACTS.md` | PROPOSAL | Contratti del generatore + gap motore noti |
| `repo-snapshot/QUEST_AUTHORING_PLAYBOOK.md` | draft | Come si crea una quest oggi (processo reale) |
| `repo-snapshot/QUEST_IMPRINTS.md` | DRAFT | Imprint: contratti per beat + istanziazioni |
| `repo-snapshot/QUEST_OPPORTUNITY_LAYER.md` | PROPOSAL | Meta-layer opportunità: gate, famiglie, tempo |
| `repo-snapshot/QUEST_CAMPAIGN_MACRO.md` | PROPOSAL | Macro-campagna, mid/endgame |
| `repo-snapshot/QUEST_ECONOMY_NOTES.md` | PROPOSAL | Economia villaggio↔quest (human-days, juice) |
| `repo-snapshot/QUEST_V6_REDESIGN.md` | PROPOSAL | Redesign quest S1 guidato dalla science |
| `repo-snapshot/QUEST_S1_DESIGN.md` | vigente | Matrice design quest «La cassa delle sementi» |
| `repo-snapshot/QUEST_GOBLIN_REWORK_PROPOSAL.md` | proposta | Critica pacing/suspense della quest goblin |
| `repo-snapshot/quest_sterminio_goblin_spec.md` | spec | Manoscritto completo quest goblin (implementata) |
| `repo-snapshot/GAME_INVASION_SEQUENCE.md` | reference | Sequenza evento invasione (implementata) |

## Sistemi & bilanciamento

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/idle_village_gameplay_math_spec.md` | candidate | Matematica: tempo, fatica, quest power, reward |
| `repo-snapshot/skill_check_workflow_spec.md` | candidate | Skill check D20/D100 |
| `repo-snapshot/quest_failure_and_recovery_spec.md` | spec | Fallimento, timeout, morte, recovery |
| `repo-snapshot/village_event_system_spec.md` | spec | Eventi di mondo, outcome post-quest |
| `repo-snapshot/BALANCING_SYSTEM.md` | reference | Sistema di bilanciamento |
| `repo-snapshot/BALANCING_DEEP_DIVE.md` | reference | Analisi approfondita bilanciamento |
| `repo-snapshot/STAT_BALANCING_ANALYSIS.md` | reference | Analisi bilanciamento stat |
| `repo-snapshot/COMBAT_SYSTEM_DESIGN.md` | reference | Design del combat |
| `repo-snapshot/SPELL_CREATION_SPEC.md` | spec | Creazione spell |
| `repo-snapshot/SPELL_TYPE_GUIDELINES.md` | reference | Linee guida tipi di spell |
| `repo-snapshot/VILLAGE_ECONOMY.md` | DRAFT | Economia villaggio (bozza — early/midgame da definire) |
| `repo-snapshot/PROGRESSION.md` | DRAFT | Progressione eroi/villaggio (bozza — endgame aperto) |

## Narrativa, mercato, governance

| File | Stato | Quando leggerlo |
|---|---|---|
| `repo-snapshot/NARRATIVE.md` | DRAFT | Setting, semi narrativi, storia emergente |
| `repo-snapshot/GAMEPLAY_DESIGN.md` | canonical (per CANON) | Visione gameplay attuale |
| `repo-snapshot/COMPETITIVE_LANDSCAPE.md` | research | Competitor, prezzi, posizionamento |
| `repo-snapshot/STEAM_PAGE_PLAN.md` | plan | Piano pagina Steam |
| `repo-snapshot/BUSINESS_PLAN.md` | reference | Business plan, funding, round outreach |
| `repo-snapshot/RPG_PROJECT_CONTEXT.md` | reference | Governance e vincoli semantici |
| `repo-snapshot/GLOSSARY.md` | reference | Termini di dominio |
| `repo-snapshot/architecture_state.md` | canonical | Router dominio→fonte tecnica |
| `repo-snapshot/PROJECT_PHILOSOPHY.md` | active | Filosofia del progetto |
| `repo-snapshot/RICHIESTE.md` | live | Richieste attive: cosa è in volo ORA |
| `repo-snapshot/OPEN.md` | live | Domande aperte — leggi prima di proporre |
| `repo-snapshot/REJECTED.md` | live | Direzioni scartate — non riproporle |
| `repo-snapshot/VERTICAL_SLICE_ROADMAP.md` | **STALE** (auto-dichiarato) | Solo storia del piano slice — NON citare come stato |
| `repo-snapshot/CLAUDE_PROMPTS.md` | tool | Prompt stub del Director per sessioni per-argomento |
| `director-knowledge/*` | curated | Gusti e direzione di Fausto (fuori repo, sempre caricare) |

## Esclusi di proposito

`CLASSIFICATION.md` (1MB tassonomia meccanica), `context/ingestions/*` (transcript
L4 di conversazioni passate — chiedili a Fausto se servono), `DECISION_LOG` (storia),
`plans/*`, `context/recurring-traps.md` (interno agli agenti locali), codice e asset.

<!-- ===== director-knowledge/DOSSIER_ARTE_CREATURE_MAPPE.md ===== -->

# DOSSIER — Arte, mappe, HUD e creature

> Ultimo consolidamento: 2026-10-28. Le immagini di riferimento originali non sono incorporate.

## Pipeline 2.5D e immagini panoramiche

- **FACT** — Pipeline descritta: una singola scena panoramica 21:9, circa 3168×1320, resa con pittura a olio e impasto marcato, senza persone e senza testo.
- **FACT** — Il piano prevede Depth Anything V2 per ricavare profondità e parallax.
- **DECISION** — Quando si modificano mappe fornite dall'utente, mantenere stile, colori e visione artistica della reference, senza alterazioni arbitrarie.
- **OPEN** — La richiesta del 2026-10-27 menzionava una versione di mappa e biomi aggiunti, ma le immagini non sono archiviate in questo documento; servono di nuovo per un confronto visivo affidabile.

## Creature ibride

- **DECISION** — Cercare associazioni visive leggibili ma meno abusate, con originalità desiderata pari a 4/5.
- **FACT** — Esempio: gorgone + leone, con capelli e criniera come elemento condiviso.
- **FACT** — Esempio: drago + ali di libellula.
- **FACT** — Concept recente: creatura anfibia/rettiliana ispirata ai nudibranchi; gambe circa 2,5 volte il torso; braccia lunghe; mani snelle con poche dita.
- **REJECTED** — Evitare proposte che non rendano visibile il collegamento fra i due animali; l'utente ha segnalato che alcune proposte non facevano capire l'associazione.
- **REJECTED** — Evitare un aspetto generico da goblin o da orda di zombie.
- **FACT** — L'utente ha esplorato anche la domanda estetica su come creare un “mostro sexy” destinato al pubblico femminile, chiedendo quali qualità intrinseche possano risultare attraenti. **OPEN** — Non risulta qui una decisione finale di design.

## HUD e UI

- **FACT** — Il 2026-10-27 l'utente ha chiesto di valutare una versione della mappa (bilanciamento, bellezza, elementi incongrui) e di generare tre esempi diversi di HUD/UI.
- **OPEN** — Non sono conservati qui i tre esempi generati né una decisione finale fra essi. Non presumere che una proposta visiva sia stata approvata.

## Metodo di collaborazione

- **DECISION** — Usare le immagini fornite come fonte primaria per stile, palette e composizione.
- **FACT** — L'utente vuole riferimenti visivi concreti; diagrammi ASCII non sono sufficienti quando la domanda riguarda associazioni visive.
- **REJECTED** — Non proporre concetti visivi senza spiegare in modo evidente quali tratti vengono combinati e dove si vedono.
- **OPEN** — Per riprendere un lavoro di art direction, chiedere o allegare la reference più recente, perché il testo sintetico non può sostituire le immagini.

## Materiali da allegare in una nuova sessione

- `PROFILO.md` + `DOSSIER_ARTE_CREATURE_MAPPE.md`.
- Aggiungere `PROGETTI.md` per il contesto del gioco.
- Allegare le immagini correnti di mappa/creatura e, se disponibile, la variante approvata. Non dedurre la reference da descrizioni testuali incomplete.

<!-- ===== director-knowledge/DOSSIER_MUSICA.md ===== -->

# DOSSIER — Generazione musicale per Wanderlust: Triumph

> Ultimo consolidamento: 2026-10-28. Non sono disponibili qui i file audio generati.

## Obiettivo

- **FACT** — L'utente vuole un tema orchestrale riutilizzabile in loop per la mappa del gioco.
- **FACT** — Cerca un senso di potenza e slancio; riferimenti menzionati: un passaggio del finale della Sinfonia n. 9 di Dvořák, il Dies Irae di Verdi e O Fortuna.
- **PROPOSAL** — È stata considerata anche una variante in direzione power metal; non risulta scelta come direzione definitiva.

## Strumenti e prove

- **FACT** — È stato provato Suno.
- **FACT** — È stato provato ACE-Step V1.5 su Mac Apple Silicon con 24 GB di RAM, dopo problemi di disinstallazione/uso di ACE-Step 2.0.
- **FACT** — Il risultato ottenuto con ACE-Step non somigliava abbastanza alla fonte di riferimento.
- **OPEN** — Mancano prompt esatti, parametri, checkpoint/modello, durata, file audio e valutazione comparativa delle generazioni.
- **OPEN** — Non è documentata una soluzione tecnica definitiva per trasformare il riferimento in un loop orchestrale coerente.

## Vincoli e metodo

- **DECISION** — Il risultato deve servire come tema di mappa del gioco e poter essere riutilizzato in loop.
- **INFERENCE** — Occorre distinguere fra ispirarsi all'energia e alla struttura del riferimento e tentare una somiglianza letterale; il contesto disponibile non specifica quale grado di somiglianza sia tecnicamente desiderato.
- **OPEN** — Non assumere che l'utente preferisca orchestrale puro o power metal: entrambe le strade sono state considerate.

## Per riprendere

Fornire `PROFILO.md` + questo dossier; aggiungere `PROGETTI.md` e gli audio/prompt originali se disponibili.

<!-- ===== director-knowledge/DOSSIER_QUEST_E_INDAGINI.md ===== -->

# DOSSIER — Quest e meccaniche investigative

> Ultimo consolidamento: 2026-10-28. Questo dossier conserva soltanto ciò che è presente nei riepiloghi disponibili.

## Quest goblin

- **FACT** — La quest `Sterminio dei goblin` è identificata come `R-099` e indicata come fonte di verità.
- **FACT** — Il riferimento `MP-06 resolveMissionRun` deve tenere conto della disponibilità reale, dell'addestramento e di prove di FOR (Forza).
- **OPEN** — Il contenuto completo di R-099 e il contratto esatto di MP-06 non sono presenti qui. Consultare i file canonici del repository prima di cambiare il comportamento.

## Problema di design investigativo

- **FACT** — Nella conversazione del 2026-10-22 l'utente ha detto che il sistema di gimmick per le indagini sembrava bello e utile, ma non era ancora stata identificata la meccanica con cui si raccolgono le informazioni.
- **FACT** — La domanda centrale formulata era: “Quindi come indaghi?”, oltre alla scena di indagine specifica.
- **INFERENCE** — Il problema riguarda il ciclo generale di raccolta e organizzazione delle informazioni, non soltanto il design di una singola scena.
- **OPEN** — Non è possibile ricostruire da questo appunto il modello di indizi, le azioni disponibili, il modo di formulare ipotesi o le condizioni con cui si considera risolto un caso.

## Vincoli

- **DECISION** — Non dichiarare risolta la meccanica investigativa finché non è stata definita la raccolta delle informazioni.
- **DECISION** — Usare R-099 come fonte di verità per la quest indicata, senza sostituirla con una ricostruzione inventata.
- **OPEN** — Verificare lo stato attuale nel repository e distinguere tra idee discusse, specifiche approvate e implementazione.

<!-- ===== director-knowledge/DOSSIER_WANDERLUST_RPG.md ===== -->

# DOSSIER — Wanderlust: Triumph / RpgBalancer

> Ultimo consolidamento: 2026-10-28. Non è stato consultato direttamente il repository in questa operazione.

## 1. Identità e visione

- **FACT** — Repository: `Kurokasaiken/RpgBalancer`, indicato come progetto personale. README ricordato: `RPG Combat Simulator & Balancing Tool`.
- **FACT** — Nome/identità del gioco: `Wanderlust: Triumph`.
- **VERIFIED (2026-10-28)** — Eroe esiliato che giunge al villaggio (`GAMEPLAY_DESIGN.md` L80); `Solar Triumph` citato in `NARRATIVE.md` L21 (tono: no grim/mud).
- **DECISION** — Tono: meraviglia, scoperta e bellezza rude.
- **DECISION** — Tagline: `PREPARE · ENDURE · TRIUMPH`.
- **FACT** — L'idea è un roguelite strategico RPG incrementale sulla comunità/villaggio e sugli abitanti che diventano eroi.
- **VERIFIED (2026-10-28)** — Mondo persistente su più run, 5–10 run ~200 anni (`NARRATIVE.md` L308, L134). La parte “centinaia di ore” resta dichiarazione di intenti dei riepiloghi.
- **VERIFIED (2026-10-28)** — `Cultist Simulator` (halos, slot-verbi, skill check, estetica carte) e `Lords of Waterdeep` (gameplay loop) sono nei documenti canonici (`GAMEPLAY_DESIGN.md`, `DESIGN_PILLARS.md` Pillar 2).
- **UNVERIFIED** — They Are Billions, Frosthaven, XCOM, Darkest Dungeon e MTG “Value vs Response” non risultano nei documenti canonici consultati: restano riferimenti ricordati dai riepiloghi.
- **FACT** — Bozza di descrizione Steam ricordata: “A roguelite strategy RPG about the villagers who dare to become heroes...”.
- **FACT** — Pagina Steam “Coming Soon” prevista sotto Kurokasaiken, ma non c'è fretta di pubblicarla prima di avere teaser/video.

## 2. Personaggi e statistiche

- **CORRECTION (2026-10-28)** — Nel codice i canali stat implementati sono sei: `str, agi, con, int, perc, cha` (`src/balancing/config/idleVillage/quests/questScenario.schema.ts:33`, `questMemberStats.ts`). Il set canonico resta una questione aperta nel design (`GAMEPLAY_DESIGN.md` ~L224: full D&D o subset). La lista a cinque stats dei riepiloghi (Forza/Intelligenza/Destrezza/Costituzione/Carisma) è superata: non usarla come verità.
- **FACT** — Regola di distribuzione ricordata: eroe `+25/+10/+5`; non-eroe `+5` in una o due statistiche e `−10` nelle altre. **OPEN** — Il riepilogo non specifica integralmente a quali statistiche o contesti si applichi ogni valore; verificare nel codice/design.
- **CORRECTION (2026-10-28)** — `S1`–`S4` non sono slot: sono gli **stadi del macro-plan quest** (PLAN-019, desiderata v24; `context/GOOD_QUEST_DEFINITION.md`). Gli slot equipaggiamento reali sono `weapon, armor, mount, trinket` (`questItems.schema.ts:25`).
- **VERIFIED (2026-10-28)** — I giorni-uomo esistono nel Quest Simulation Preview (`QuestSimulationPreview.tsx`: tempo/giorni-uomo per outcome).
- **VERIFIED (2026-10-28)** — I consumabili sono reali (`consumables.json`, `heroItems.ts`; `deathChanceDelta`/`injuryChanceDelta`/`rewardMultiplierDelta`; pool party, decisione D3) e la ritirata è checkpoint continua/ritirati dopo ogni fase (D2). Nel preview di quest-total i consumabili sono però ignorati per scelta del Director (restano commitment per-check nel pre-check).
- **FACT** — Lo scout rivela statistiche secondarie.
- **PROPOSAL** — Considerare in futuro una struttura tattica a griglia, con riferimenti a Heroes/Final Fantasy; non è documentato come decisione implementativa.
- **FACT** — Il motore di combattimento precedente era ritenuto corretto e preciso e non doveva essere sostituito solo per inseguire una nuova architettura.
- **OPEN** — Mancano in questo contesto schema completo delle statistiche, formule, API, formato dei salvataggi e test del motore.

## 3. Combattimento e progressione

- **FACT** — Esisteva un auto-battler; il motore di combattimento preesistente era considerato adeguatamente corretto.
- **OPEN** — La varietà di incantesimi/abilità non è ancora stata completata; l'utente ha sottolineato la necessità di molte spell e opzioni per costruire personaggi differenti.
- **PROPOSAL** — Trattare l'equipaggiamento come “average gear” e mantenerne i contributi separati dalle statistiche di nascita del personaggio. Da verificare se sia stata congelata come decisione.
- **FACT** — Le ispirazioni Value vs Response indicano interesse per scelte tattiche in cui valore e risposta dell'avversario siano parte del bilanciamento; non implica da sola una meccanica precisa.
- **OPEN** — Non sono disponibili formule complete di danno, priorità, AI avversaria o sistema di status.

## 4. Quest e contenuti

- **VERIFIED (2026-10-28)** — `R-099` è la richiesta del *flavor layer* sulla quest goblin nel lab S1 (chiusa `fatta`). La fonte di verità della quest è la spec `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`; piani collegati: PLAN-022 (quest goblin), PLAN-023 (UI redesign S1 lab).
- **VERIFIED (2026-10-28)** — `resolveMissionRun` esiste: `src/engine/game/idleVillage/missionResolver.ts:221`. Gestisce outcome per membro (dead/injured), fasi sequenziali e **ritirata al checkpoint dopo ogni fase** (`shouldContinue`, decisione D2). Il requisito FOR/disponibilità/addestramento deriva dalla spec MP-06; il dettaglio per-stat va verificato sulla spec, non dedotto.
- **OPEN** — Non sono disponibili il testo integrale della quest, il contratto di `resolveMissionRun`, i criteri di successo/fallimento o i test.
- **FACT** — La conversazione del 2026-10-22 ha individuato un problema di design investigativo: le gimmick delle scene d'indagine erano considerate promettenti, ma mancava una meccanica chiara per raccogliere informazioni e investigare oltre la singola scena.
- **OPEN** — Il modello completo di raccolta indizi, inferenze, registrazione e verifica delle informazioni non è presente nel riepilogo.

## 5. Stato di sviluppo ricordato

- **FACT** — Intorno al 2026-10-22 era stata fatta una prima prova di una quest con un amico; erano emersi problemi di UI e integrazione.
- **FACT** — L'utente riferiva circa sette agenti AI in esecuzione e desiderava un dispatcher/coda, concorrenza dinamica e audit notturno con screenshot e auto-spegnimento.
- **DECISION** — Valutare il comportamento reale del repository, non fidarsi di piani o dichiarazioni dell'agente senza verifica.
- **OPEN** — Non è verificato se dispatcher, audit, UI, bug o feature siano stati implementati dopo il 2026-10-22.

## 6. Creature, mappe e direzione artistica

- **FACT** — Pipeline 2.5D descritta: un'immagine panoramica 21:9, circa 3168×1320, con forte impasto/pittura a olio, senza persone né testo; Depth Anything V2 per generare parallax.
- **FACT** — Direzione creature: combinazioni di tratti riconoscibili ma poco usati, originalità desiderata 4/5.
- **FACT** — Esempi: gorgone + leone (capelli/criniera come tratto condiviso); drago + ali di libellula.
- **FACT** — Un concept recente prevedeva una creatura anfibia/rettiliana con ispirazione nudibranco, gambe lunghe circa 2,5 volte il torso, braccia lunghe e mani snelle con poche dita.
- **REJECTED** — Evitare che il risultato sembri un goblin o una semplice ondata di zombie.
- **OPEN** — Le immagini discusse nelle chat non sono incluse in questo dossier; senza allegati non si possono ricostruire esattamente composizione, palette o silhouette.

## 7. Decisioni, alternative e cautele

- **DECISION** — Conservare il motore di combattimento esistente come baseline valida, salvo evidenze concrete che ne richiedano la sostituzione.
- **DECISION** — Non pubblicare frettolosamente la pagina Steam prima di avere materiali teaser/video adeguati.
- **REJECTED** — Non inventare feature del gioco o trasformare ispirazioni in meccaniche già implementate.
- **PROPOSAL** — Tenere separati, nella documentazione, fatti del repository, intenzioni di design e idee future.
- **OPEN** — Verificare nel repository il README, il codice corrente, le decisioni congelate e la corrispondenza fra documenti e implementazione.

## 8. Documenti da allegare in una nuova sessione

- Base: `PROFILO.md` + `PROGETTI.md` + questo dossier.
- Se si lavora sulla direzione artistica: aggiungere `DOSSIER_ARTE_CREATURE_MAPPE.md` e le immagini di riferimento correnti.
- Se si lavora su quest/indagini: aggiungere `DOSSIER_QUEST_E_INDAGINI.md` e i file canonici del repository.
- Se si lavora sulla musica: aggiungere `DOSSIER_MUSICA.md`.

## 9. Stato verificato nel repository (2026-10-28)

Verifica eseguita su checkout reale; i riferimenti puntano ai file.

- **VERIFIED** — Mission planner reattivo esiste: `useQuestAssignmentPreview.ts` (preview deterministica rng-free, delta live), desiderata FROZEN v23; decisioni Director D1–D4 chiuse (cover, checkpoint ritirata, consumabili party, stat tags).
- **VERIFIED** — Quest Simulation Preview implementata nel lab S1: `questS1Lab/questSimulation.ts` (`analyzeCheck` analitico + `simulateQuest` Monte Carlo seeded FNV-1a), `QuestSimulationPreview.tsx`, `QuestCheckPreview.tsx` con counterfactual consumabili e giorni-uomo.
- **VERIFIED** — Quest goblin giocabile nel lab: `questScenarioGoblin.ts`, flavor layer completo (transit + verdictFlavor, pacing da config).
- **VERIFIED** — Combat/balancing: `src/balancing/1v1/simulator.ts`, `matrixRunner.ts`, `EHPCalculator.ts`; motore quest `src/engine/game/idleVillage/` (missionResolver, QuestPowerEngine).
- **VERIFIED** — Superficie di gioco canonica: `/game` (Game Frame Pixi); `/world-surface` mappa viva; governance in `AGENTS.md`, `CANON.md`, `RICHIESTE.md`, `.windsurf/rules/`.
- **UNVERIFIED** — Regola di distribuzione eroe `+25/+10/+5`: non trovata nei documenti/codice consultati (resta da riepiloghi).
- **UNVERIFIED** — Tagline `PREPARE · ENDURE · TRIUMPH`: non trovata nei documenti canonici.
- **UNVERIFIED** — “Scout rivela statistiche secondarie”: non verificato.
- **OPEN** — L'indice `context/OPEN.md` e gli ingest `context/ingestions/` contengono meccaniche discusse (Exposure Targeting E-06, profili letalità E-08) che possono essere evolute: lo stato va riletto sul repository.

<!-- ===== director-knowledge/GUSTI.md ===== -->

# GUSTI CULTURALI E CREATIVI

> Ultimo consolidamento: 2026-10-28. Il profilo anime è il più dettagliato; altre preferenze creative sono parziali.

## Legenda

- **FACT** — Preferenza o valutazione esplicitamente riportata.
- **DECISION** — Vincolo esplicito da applicare.
- **PROPOSAL** — Indicazione da provare, non preferenza confermata.
- **REJECTED** — Elemento/approccio esplicitamente rifiutato o valutato male.
- **OPEN** — Dato mancante.
- **INFERENCE** — Sintesi interpretativa delle preferenze.

## Anime: criteri generali

- **FACT** — L'utente cerca anime televisivi con una storia forte e una scrittura seria; la fama di un titolo non basta. Ha iniziato a guardare anime a 19 anni e ne ha 43 nel contesto del 2026.
- **DECISION** — Non proporre come novità titoli che risultano già visti, né suggerimenti palesemente incompatibili “per testarlo”.
- **FACT** — Preferisce psicologia, identità, simbolismo, thriller morale, personaggi realistici, indagini/politica e idee astratte sulla realtà.
- **FACT** — Tollera mistero e filosofia, ma può abbandonare serie lente. Frieren e Gurren Lagann sono esempi di serie che alla fine lo hanno conquistato nonostante un inizio non immediatamente decisivo.
- **REJECTED** — Non apprezza il nichilismo opaco e radicalmente lento di Texhnolyze (4/10).
- **REJECTED** — In Great Pretender ha criticato la sensazione che i personaggi “intelligenti” vincano perché l'autore fa andare le cose a loro vantaggio, senza un motivo dimostrato: vittorie non guadagnate, deus ex machina e intelligenza non resa comprensibile.
- **FACT** — Monster è apprezzato per thriller, moralità e personaggi realistici, pur non essendo tra i voti massimi.
- **FACT** — Evangelion è apprezzato per identità, psicologia e simbolismo.
- **OPEN** — La serie Link Click non è stata vista; l'utente ha detto di non credere che lo interessi. Non trattarlo come titolo visto o come rifiuto definitivo.

## Valutazioni anime esplicite

| Titolo | Voto | Nota disponibile |
|---|---:|---|
| Hunter x Hunter | 10/10 | **FACT** — Valutazione esplicita. |
| Ping Pong | 9/10 | **FACT** — Valutazione esplicita. |
| Neon Genesis Evangelion | 9/10 | **FACT** — Identità, psicologia, simbolismo. |
| Fullmetal Alchemist: Brotherhood | 9/10 | **FACT** — Valutazione esplicita. |
| Pluto | 9/10 | **FACT** — Valutazione esplicita. |
| The Apothecary Diaries | 9/10 | **FACT** — Valutazione esplicita. |
| Monster | 8/10 | **FACT** — Thriller, moralità, personaggi realistici. |
| Serial Experiments Lain | 8/10 | **FACT** — Identità, realtà, idee astratte. |
| Summer Time Rendering | 8/10 | **FACT** — Valutazione esplicita. |
| Re:Zero | 8/10 | **FACT** — Valutazione esplicita. |
| Cowboy Bebop | 7/10 | **FACT** — Personaggi, malinconia, struttura episodica. |
| Ghost in the Shell: Stand Alone Complex | 7/10 | **FACT** — Cyberpunk, politica, indagini. |
| One Outs | 7/10 | **FACT** — Valutazione esplicita. |
| Ergo Proxy | 6/10 | **FACT** — Valutazione esplicita. |
| Paranoia Agent | 6/10 | **FACT** — Valutazione esplicita. |
| Golden Kamuy | 6/10 | **FACT** — Valutazione esplicita. |
| Kaiji | 5/10 | **FACT** — Valutazione esplicita. |
| World Trigger | 5/10 | **FACT** — Valutazione esplicita. |
| Texhnolyze | 4/10 | **FACT** — Lento/opaco e nichilista, poco adatto. |
| ID: INVADED | 4/10 | **FACT** — Valutazione esplicita. |

## Altri titoli menzionati

- **FACT** — `91 Days`: l'utente ha visto un paio di episodi, ma non è riuscito a coinvolgerlo.
- **FACT** — `Great Pretender`: lo stava ritentando come visione di sottofondo dopo averlo abbandonato in precedenza; la premessa non lo convinceva per la sensazione di vittorie non meritate.
- **OPEN** — `Link Click`: non visto, interesse basso/negativo ma non rifiuto definitivo.
- **OPEN** — `Vivy`: è stata posta la domanda se fosse un anime musicale; non risulta qui una valutazione o una decisione di guardarlo.
- **FACT** — I film non sono una categoria che cerca volentieri; fa eccezione l'apprezzamento per i film dello Studio Ghibli, mentre alcune opere Ghibli più recenti non lo hanno convinto.
- **REJECTED** — Evitare di proporre ripetutamente titoli già visti o di usare consigli inadatti come “test” del profilo.

## Preferenze di scrittura e worldbuilding

- **FACT** — Per la critica di narrativa vuole un voto complessivo da 1 a 10, sottopunteggi, commenti/riscritture dettagliati e un voto finale.
- **FACT** — Apprezza realismo sensoriale concreto, indizi nascosti, Dick, Lovecraft, fantascienza classica e fantasy epico.
- **REJECTED** — Non apprezza worldbuilding basato su qi, latino o neon come scorciatoie estetiche.
- **FACT** — Nei testi in inglese ha chiesto di evitare lo stile con trattini lunghi/em dash o trattini usati come espediente stilistico.
- **FACT** — Per le creature vuole combinazioni visive leggibili, originali e non banali; esempi di associazioni proposte dall'utente: gorgone/leone, drago/libellula.
- **FACT** — Per il gioco, il tono guida è meraviglia, scoperta e bellezza rude; evitare di introdurre elementi non approvati.

## Musica per il gioco

- **FACT** — Cerca un tema orchestrale potente e riutilizzabile in loop per la mappa del gioco.
- **FACT** — Riferimenti di energia/colore: finale della Sinfonia n. 9 di Dvořák, Dies Irae di Verdi, O Fortuna; è stata considerata anche un'opzione power metal.
- **OPEN** — Non è documentata una preferenza definitiva tra orchestrale puro e ibrido power metal.

<!-- ===== director-knowledge/PROFILO.md ===== -->

# PROFILO

> Scopo: profilo operativo riutilizzabile come contesto iniziale in nuove sessioni.
> Ultimo consolidamento: 2026-10-28 (verifica repo inclusa).
> **Limite delle fonti:** questo documento deriva dal contesto attualmente consultabile (memorie sintetiche, riepiloghi di conversazioni e messaggi recenti), non da una lettura integrale di tutte le chat.

## Legenda epistemica

- **FACT**: informazione esplicitamente riferita dall'utente o direttamente presente nel contesto consultabile.
- **DECISION**: scelta esplicita dell'utente.
- **PROPOSAL**: idea o opzione proposta, non necessariamente adottata.
- **REJECTED**: opzione o approccio esplicitamente rifiutato.
- **OPEN**: questione aperta o informazione mancante.
- **INFERENCE**: interpretazione ragionevole, non dichiarazione letterale dell'utente.

## Contatti e dati anagrafici (moduli, candidature, CV)

- **FACT** — Nome e cognome: **Fausto Boni**.
- **FACT** — Email: `licaone12@gmail.com`.
- **FACT** — Telefono: `3920044477` (+39).
- **FACT** — Codice fiscale: `BNOFST83L04A052C`.
- **FACT** — Città/provincia per moduli: Carpi (MO).
- (Aggiunto 2026-11-16 su richiesta esplicita del Director: «segnale da qualche parte come riferimenti su di me accessibile ad ogni progetto».)

## Identità professionale e competenze

- **FACT** — L'utente lavora come programmatore Java/backend. Nel profilo indica il ruolo «Programmatore java».
- **FACT** — Usa Java e Quarkus quotidianamente da circa tre anni e ha lavorato su moduli completi. Usa PostgreSQL e REST nel lavoro quotidiano; usa Docker Compose, ma non ha una grande esperienza di ottimizzazione query o cloud. (Contesto professionale aggiornato intorno al 2026-10-18.)
- **FACT** — Vive a Carpi e lavora a Reggio Emilia; il contesto recente cita la zona AV/via Umbria. Queste località sono logistiche e potrebbero cambiare.
- **FACT** — Ha un impiego a tempo indeterminato; retribuzione riferita: circa €26.000 lordi annui, circa €1.600 netti/mese per 13 mensilità. Obiettivo professionale riferito: circa €30.000 e crescita. (Informazioni riportate nel contesto intorno al 2026-10-18; da riconfermare se usate per decisioni attuali.)
- **FACT** — Ha usato Devin Desktop e Windsurf. Budget aggiuntivo preferito per strumenti AI: circa €20/mese. (2026-10-18 circa.)

## Stile di lavoro e collaborazione

- **FACT** — Vuole che le decisioni progettuali siano basate su ciò che è stato effettivamente verificato nel repository o nei materiali, non su piani presentati come se fossero già implementati.
- **FACT** — Per i progetti software distingue esplicitamente fatti, decisioni, proposte, elementi superati e questioni irrisolte. Nel progetto Mind Weaver usa anche le etichette FACT / INFERENCE / ASSUMPTION / UNRESOLVED / FROZEN.
- **INFERENCE** — È utile separare sempre stato verificato, intenzione, ipotesi e prossima azione; evitare di confondere «proposto» con «fatto».
- **FACT** — Apprezza analisi approfondite quando la richiesta è complessa e si irrita se la ricerca è superficiale o se la risposta non affronta la domanda effettiva. Ha espresso frustrazione per output poco approfonditi il 2026-10-22.
- **FACT** — Vuole conservare il contesto di progetti e decisioni tra account/sessioni, evitando di dover ricostruire tutto a memoria. (Richiesta esplicita il 2026-10-28.)
- **OPEN** — Il formato finale desiderato per il futuro archivio (solo Markdown, repository Git, archivio compresso, sincronizzazione) non era stato definito prima della richiesta corrente.

## Preferenze per le risposte

- **DECISION** — Rispondere in italiano naturale e adattato al contesto italiano.
- **FACT** — Preferisce risposte dirette, compatte e con meno prolissità/spaziatura verticale rispetto a risposte molto lunghe, soprattutto per domande semplici.
- **FACT** — Non gradisce che la risposta ripeta la sua domanda o riassuma ciò che ha già detto senza aggiungere valore.
- **FACT** — Non gradisce un tono aggressivo o volgarità; ha chiesto di evitare lo stile aggressivo statunitense.
- **FACT** — Apprezza umorismo pronto e intelligente quando appropriato, incoraggiamento e un orientamento al futuro.
- **FACT** — Quando una domanda è precisa, preferisce una risposta altrettanto precisa, senza deviazioni lunghe su argomenti che non servono.
- **FACT** — Se chiede un approfondimento, si aspetta rigore, sfumature, motivazioni e limiti espliciti, non una risposta superficialmente sicura.
- **REJECTED** — In ambito anime, rifiuta suggerimenti già noti o deliberatamente poco adatti presentati «per metterlo alla prova».
- **REJECTED** — In ambito software/progetti, non inventare caratteristiche o comportamenti non confermati.

## Vincoli ricorrenti

- **FACT** — Nei progetti creativi e software, non introdurre caratteristiche che l'utente non ha deciso o che non sono supportate dalle fonti.
- **FACT** — Preferisce che le alternative scartate e le motivazioni siano mantenute, non cancellate dal riepilogo.
- **FACT** — Per l'alimentazione pratica, ha vincoli di budget e cucina minima: frigorifero/freezer, microonde e padella; preferisce preparazioni rapide, congelabili o da dispensa, con massimo circa cinque minuti di preparazione attiva.
- **FACT** — Per il lavoro di sviluppo, vuole mantenere il controllo delle decisioni di direzione mentre gli agenti AI possono svolgere implementazione e ricerca entro regole definite.
- **INFERENCE** — In un nuovo thread conviene iniziare con questo file e allegare soltanto il dossier specifico del tema, invece di fornire tutto l'archivio a ogni richiesta.
- **FACT (aggiunta 2026-10-28)** — Esiste anche un profilo Director machine-readable nel repo RPG: `context/auto/director-profile.jsonl` (200+ voci D-xxx con class preference/veto/constraint, confidence, review_by) + `veto-block.md`. È advisory e RPG-scoped, ma contiene preferenze trasversali su verifica visiva, trappole ricorrenti e metodo di lavoro.

## Come riutilizzare l'archivio

- **DECISION** — Le informazioni devono essere etichettate come FACT, DECISION, PROPOSAL, REJECTED, OPEN o INFERENCE.
- **PROPOSAL** — All'inizio di una nuova sessione, fornire `PROFILO.md` e il dossier pertinente; aggiungere `PROGETTI.md` se serve orientamento tra più progetti.
- **OPEN** — Questo archivio non è ancora un registro completo delle conversazioni né una trascrizione integrale. Va aggiornato con decisioni nuove e con riferimenti alle fonti verificabili.
