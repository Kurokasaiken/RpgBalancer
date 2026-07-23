# HANDOFF — Redesign UI "Material Language" · progetto RPG/Wanderlust

## 1. Cos'è il progetto
Idle-village game fantasy ("Wanderlust"), React + Vite + TypeScript, in `/Users/faustoboni/progetti_personali/RPG`. Estetica target: **AAA da 70€ su Steam**, fantasy materico (bronzo/oro/ossidiana + blu notte), NON web-app/dashboard. Dev server via `npm run dev` (porta variabile, es. 57071). Test: vitest, config multipli (`vitest.config.ts` default esclude `src/ui/**`; `vitest.idlevillage.config.ts`; suite roster girano con `NODE_OPTIONS=--require=./polyfill-crypto.cjs npx vitest run tests/unit/idleVillage/02_roster_pgtoken.unit.test.tsx`).

## 2. Obiettivo di questa fase
C'è un **"Visual Fidelity Lab"** (`/visual-fidelity-lab`) dove è stata validata una **Material Language**. Ora la si **armonizza sui componenti reali/canonici** senza rifarli. Superfici:
- `/visual-fidelity-lab` = proving ground (magro, non gonfiare)
- `/harmonization-gallery` = **Harmonization Gallery** (nuova): monta componenti VERI con dati fixture, tab (Roster / Clock / POI Detail / POI), toggle **Coppie / Solo materico / Solo liscio**. Serve a giudicare "stesso gioco?" a occhio.
- Design System (fase 7, futura) = industrializzazione i18n/config/registry.

## 3. Leggi ("bibbia tecnica") già codificate
- **Composizione a layer / spend-photons-up**: costruire volume con layer deliberati (glow → corpo → highlight → reflect), la luce sale.
- **Single Physical Geometry**: un oggetto = una geometria fisica coerente, non effetti sovrapposti scollegati.
- **Stable Procedural Identity / imperfezioni**: imperfezioni (grana, turbulence) con **seed FISSI per-istanza, mai ri-rollati**; il materiale ha imperfezioni statiche, solo l'**energia/Life Layer** è animata.
- **Leggibilità #1**: su una barra/meter il fronte-riempimento ha un **menisco brillante**; canale vuoto **freddo (azure-black)** perché l'energia calda stacchi; numerico = segnale primario, colore secondario (accessibilità daltonici → mai colore-solo, sempre 2 segnali forma+colore).
- **Warm-only**: bronzo/oro/ambra/ossidiana. **Grigio/argento freddo BANDITO** (sa di cyberpunk).
- **Frame weight = gerarchia**: reward URLA (gold filet pieno), elementi ripetuti SUSSURRANO.
- **Anti-perfezione**: no bordi machine-perfect (micro-usura), no ombre a 8 livelli, no glow largo, no bottone flat, no materiali stesso-valore.
- **Depth hierarchy**: no "buchi dentro buchi"; elementi trascinabili = RIALZATI (drop-shadow), mai scavati (uno scavo dice "fisso").
- **Tool/Config vs Diegetic** (proposta, non ancora congelata): schermi tool/power-user (es. Balancer) possono essere densi; schermi player-facing restano governati dalla Material Language.

## 4. Matrice semantica dei materiali (LEGGE game-wide)
Una sola costruzione (canale scavato/`CarvedBar`), N energie:
- **HP → smeraldo** · **Stamina → ambra** · **Mana → ametista** · **XP/progresso → oro fuso** · **Pericolo/timer → brace** · **Capacità/slot → bronzo desaturato** (~~argento~~) · **Azure → solo ambient, nessun significato semantico**.

## 5. Cosa è FATTO e verificato (71/71 test roster verdi ad ogni step)
- **`CarvedBar`** (`src/ui/visualFidelityLab/CarvedBar.tsx`): primo primitivo estratto, prop `energy` → `BAR_ENERGY`. Provato sulle osservatorie.
- **Migrazione roster ai token del lab**: le stat-bar del roster (`WanderlustStatBar` path `isMateric`, che legge `MATERIC_SKIN_CONFIG` in `src/ui/wanderlust-surface/matericSkinConfig.ts`) sono ora **token-driven additive**: `var(--mat-hp-fill, <fallback attuale>)` / `--mat-stamina-fill`. Fallback = valori attuali → `/minimal-roster` INVARIATO. Il flag CSS **`.materic-skin`** (`src/ui/visualFidelityLab/matericSkin.css`) definisce HP=smeraldo, Stamina=**ambra** (scelta confermata), + menisco, + `--mat-card-shadow` (card roster RIALZATA non scavata).
- **Sigillo di stato** in `WanderlustRosterCard.tsx`: il dot verde "chat/online" sostituito (dietro flag `.materic-skin` via `--mat-status-dot-display`/`--mat-status-seal-display`) da un sigillo bronzo con 2 segnali forma+colore: active=oro pieno+glow, injured=rust statico, neutral=anello vuoto. (Varianti injured/neutral non viste a schermo: fixture = solo hero.)
- **Filtro "Ordina per stat"** (mockup visivo) in `DragTestContainer.tsx`: nuovo `<select>` popolato dalle 15 stat REALI (`getFilterStatKeys()` da `rosterFilterConfig.ts`, ereditate da `StatBlock`/Balancer) + toggle direzione. **Inerte** (state locale), con TODO dettagliato nel codice che punta a `filteredResidents`(~241)/`sortedResidents`(~294) — combinare col filtro status esistente (7 stati → resta dropdown, NON tab).
- **POI Detail**: il vero è `ActivityCapsuleDetailSkinAware` + skin "Dark Luxury" (`POI_DETAIL_SKIN_CONFIG`), riferimento su `/poi-detail-verification`. **Verdetto: già vicino alla Material Language** (bronzo/oro, slot medaglione, stessi anti-pattern) → nessun override forzato. **Bug separato flaggato** (task spawn): chiavi i18n grezze visibili a schermo (`ACTIVITYCAPSULE.STATUS.INPROGRESS`).

## 6. LAVORO IN CORSO — redesign medaglione POI + Clock
`GenericPoiSkin` (`src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx`, ~542 righe) = **SVG puro palette-driven via props**, CONDIVISO da: Clock giorno/notte, tutti i marker POI, medaglione del POI Detail → **blast radius alto, prova-nel-lab-poi-industrializza**.

Target approvato = HTML `~/Downloads/poi-skin-preview.html`: **halo "corona"** turbolento che si riempie (glow + arco turbolento + arco fine + reflect che deriva) su pietra ossidiana con rim bronzo. Da **RIMUOVERE le "stanghette"** (tick ring + dot cardinali) e i due anelli sfocati attuali. Da **TENERE l'animazione ring esistente** (rim-breath + sweep dorato in hover). Da **AGGIUNGERE menisco sul fronte** + canale freddo.

**Step 1 FATTO**: `src/ui/visualFidelityLab/poiMedallionRecipe.ts` — 4 palette approvate (amber/lapis/ember/verdigris) come dati + `getPoiPalette(type)`. Le palette sono SKIN mappabili al tipo POI (che esiste già come **`cardKind`**: 'job'|'quest'|'event'|'activity'), ma la mappa è **bassa priorità in questa fase** (sono solo colori). NB: "arcano" NON è un tipo valido.

**Spec comportamentale halo da implementare** (nel prototipo lab, poi trapianto):
- **Fill** (attività in corso) = orario, colore-skin.
- **Timed/scadenza** (quest/event a tempo) = parte **carico** e si **scarica ANTIORARIO**, con virata cromatica verso brace. Macchina a **3 stadi monotòni** guidata da `remainingFraction`: Calmo (>50%) → Allerta (≤50%: pulse medio + flash una-tantum alla soglia) → Critico (≤~15%: brace pieno, pulse rapido, movimento aggiunto). **Milestone proporzionali alla durata totale, NON ms assoluti** (bug attuale: `expirationThresholdMs` fisso 60s). Escalation monotòna, non "effetti diversi a caso" (evitare crying-wolf).
- **Pronto ma non raccolto** (richiesta ultima dell'utente): halo resta **PIENO e pulsa leggermente** — verificare l'animazione già esistente `poi-bloom-pulse`/il pulse a fill≥0.999 nel loop rAF (righe ~219, `pulse = 0.6+0.4*sin(phase)`) e riusarla/rifinirla.
- **Ambiguità critica da risolvere**: fill (cresce=buono) vs discharge (cala=cattivo) sullo stesso halo → disambiguare con direzione + colore, non solo direzione.
- **Perf**: 3 feTurbulence animati × N POI = costoso → **gatare su `data-perf-tier` + `prefers-reduced-motion`**, turbolenza animata piena solo su hovered/selected.
- **Particelle**: implementarle (nel JSON dell'HTML sono dichiarate ma NON implementate = config morto), perf-gated.
- **Clock**: è un POI SPECIALE → eredita solo l'ESTETICA corona, **logica/funzioni IDENTICHE**, e NON eredita la macchina di scadenza (è un ciclo giorno/notte, non un countdown-verso-trigger).

**Domanda aperta all'utente**: quando il timer arriva a zero il POI **sparisce** (occasione persa → "implode") o **triggera un evento** (es. invasione → "detonazione")?

## 7. Regole di lavoro / workflow (IMPORTANTE)
- **Non toccare i componenti canonici/frozen alla cieca**: c'è uno **Skin Binding System** (`SkinBindingRegistry.ts`, componenti certificati) + config-driven skin. Armonizzare via **token/config seam**, additivo, con fallback = look attuale (zero regressione). Test verdi prima/dopo. Freeze/restore documentato (`roster_trusted_components.md`).
- **PERICOLO**: il repo ha un **coordinator/ai-worker autonomo** che fa commit/checkout automatici e può creare falsi allarmi o toccare file. Verificare git status; non fidarsi di letture in istanti di transizione.
- **Screenshot del preview pane**: si rompe (nero) sulla pagina `/visual-fidelity-lab` (filtri SVG pesanti), ma **funziona** su `/minimal-poi`, `/minimal-clock`, `/harmonization-gallery`, `/poi-detail-verification`. Per decisioni di colore: usare **swatch renderizzati in chat** (tool visualize/show_widget) o queste pagine.
- **Kit frozen**: `src/ui/idleVillage/frozen/kits/` — Standalone montabili (PgCardStandalone, RosterDraggable, ClockWidgetStandalone, QuestPOIStandalone, ActivityCapsuleStandalone…). **Il barrel `index.ts` è AVVELENATO** (`slottedMedalKit` importa un `SlottedMedal` inesistente) → importare i kit **direttamente dai singoli file**, non dal barrel.
- Consumatori reali NON devono importare a lungo dal `visualFidelityLab` (è lab); la home definitiva dei primitivi è una decisione di Consolidation.

## 8. File chiave
- `src/ui/visualFidelityLab/`: CarvedBar.tsx, FieldGrain.tsx, matericSkin.css, poiMedallionRecipe.ts, HarmonizationGallery.tsx, VisualFidelityLabPage.tsx
- `src/ui/wanderlust-surface/`: matericSkinConfig.ts, MatericSkinProvider/Context, layout/WanderlustStatBar.tsx
- `src/ui/idleVillage/components/`: WanderlustRosterCard.tsx, DragTestContainer.tsx, MatericRosterComponent.tsx, minimal/GenericPoiSkin.tsx, minimal/ClockWidget.tsx, minimal/TimeEngineStrip.tsx, minimal/QuestPOI.tsx
- `src/ui/idleVillage/skins/`: activityCapsuleSkinConfig.ts, poi/poiDetailSkinConfig.ts, questPoiSkinConfig.ts, timeEngineSkinConfig.ts, SkinBindingRegistry.ts
- Memoria persistente completa: `/Users/faustoboni/.claude/projects/-Users-faustoboni-progetti-personali-RPG/memory/project_visual_grammar_spike.md`

## 9. Prossimo step immediato
Prototipare la **corona halo** (con menisco, canale freddo, animazione ring conservata, macchina 3-stadi per timed, ready-pulse, perf-gate) come artefatto lab verificabile su `/minimal-poi`; poi trapiantare in `GenericPoiSkin` con rete di sicurezza test; poi Clock (solo estetica).

## 10. Domanda ancora aperta con l'utente
A zero, il POI a tempo **sparisce** (occasione persa) o **triggera un evento** (es. l'invasione parte)? Cambia se lo stadio critico deve chiudersi con un "implode/spegnimento" o con una "detonazione/rilascio".
