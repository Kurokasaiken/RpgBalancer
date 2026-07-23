# HANDOFF — Redesign UI "Material Language" · RPG/Wanderlust

## 1. Cos'è il progetto
Idle-village game fantasy ("Wanderlust"), React + Vite + TypeScript, in `/Users/faustoboni/progetti_personali/RPG`. Estetica target: AAA da 70€ su Steam, fantasy materico (bronzo/oro/ossidiana + blu notte), NON web-app/dashboard. Dev server via `npm run dev`. Test: vitest, config multipli (`vitest.config.ts` default esclude `src/ui/**`; `vitest.idlevillage.config.ts`).

## 2. Obiettivo di questa fase
Armonizzare la Material Language validata su `/visual-fidelity-lab` sui componenti reali/canonici senza rifarli. Superfici:

- `/visual-fidelity-lab` = proving ground (magro, non gonfiare)
- `/harmonization-gallery` = Harmonization Gallery (nuova): monta componenti VERI con dati fixture, tab (Roster / Clock / POI Detail / POI), toggle Coppie / Solo materico / Solo liscio. Serve a giudicare "stesso gioco?" a occhio.

## 3. Leggi ("bibbia tecnica") già codificate

- **Composizione a layer / spend-photons-up**: costruire volume con layer deliberati (glow → corpo → highlight → reflect), la luce sale.
- **Single Physical Geometry**: un oggetto = una geometria fisica coerente, non effetti sovrapposti scollegati.
- **Stable Procedural Identity / imperfezioni**: imperfezioni (grana, turbulence) con seed FISSI per-istanza, mai ri-rollati; il materiale ha imperfezioni statiche, solo l'energia è animata.
- **Leggibilità #1**: su una barra/meter il fronte-riempimento ha un menisco brillante; canale vuoto freddo (azure-black); numerico = segnale primario, colore secondario.
- **Warm-only**: bronzo/oro/ambra/ossidiana. Grigio/argento freddo BANDITO.
- **Frame weight = gerarchia**: reward URLA (gold filet pieno), elementi ripetuti SUSSURRANO.
- **Anti-perfezione**: no bordi machine-perfect, no ombre a 8 livelli, no glow largo, no bottone flat.
- **Depth hierarchy**: no "buchi dentro buchi"; elementi trascinabili = RIALZATI (drop-shadow), mai scavati.

## 4. Matrice semantica dei materiali (LEGGE game-wide)
Una sola costruzione (canale scavato/`CarvedBar`), N energie:
- HP → smeraldo · Stamina → ambra · Mana → ametista · XP/progresso → oro fuso · Pericolo/timer → brace · Capacità/slot → bronzo desaturato · Azure → solo ambient

## 5. Cosa è FATTO e verificato (71/71 test roster verdi)

- `CarvedBar` primitivo estratto
- Migrazione roster ai token (WanderlustStatBar token-driven, fallback = valori attuali)
- Sigillo di stato (dot verde → sigillo bronzo con 2 segnali forma+colore)
- Filtro "Ordina per stat" (mockup)
- POI Detail "Dark Luxury" (già vicino, no override forzato)

## 6. LAVORO IN CORSO — redesign medaglione POI + Clock

`GenericPoiSkin` (~542 righe) = SVG puro palette-driven, CONDIVISO da: Clock giorno/notte, tutti i marker POI, medaglione del POI Detail.

Target approvato = `poi-skin-preview.html`: halo turbolento + pietra ossidiana + rim bronzo.
- RIMUOVERE: stanghette (tick ring + dot cardinali) + due anelli sfocati
- TENERE: animazione ring (rim-breath + sweep hover)
- AGGIUNGERE: menisco + canale freddo

### Spec comportamentale halo

- **Fill (attività in corso)**: orario, colore-skin.
- **Timed/scadenza**: carico, scarica ANTIORARIO, virata brace.
  - 3 stadi monotòni guidati da `remainingFraction`:
    - **Calmo** (>50%): base color, no rotation
    - **Allerta** (≤50%): pulse medio + flash soglia, antiorario rotation
    - **Critico** (≤~15%): brace pieno, pulse rapido, movimento aggiunto
  - Milestone proporzionali alla durata totale, NON ms assoluti.
  - Escalation monotòna (evitare crying-wolf).
- **Pronto non raccolto**: halo pieno + pulsazione leggera (riusa `poi-bloom-pulse`).
- **Disambiguazione fill vs discharge**: fill (cresce=buono) vs discharge (cala=cattivo) → disambiguare con direzione + colore.
- **Perf**: gatare turbulenza animata su `data-perf-tier` + `prefers-reduced-motion`.
- **Particelle**: implementarle, perf-gated.
- **Clock**: eredita ESTETICA corona, NON logica scadenza (è ciclo giorno/notte).

### TRAPIANTO IN `GenericPoiSkin` — FATTO E VERIFICATO (2026-07-19)
Scoperta importante: al momento del trapianto, il file era GIÀ stato parzialmente riscritto
(non da me in questa sessione — probabilmente coordinator/altro processo) con: palette-per-tipo
già collegata (`getPoiPalette(cardKind)`), una macchina a 3 stadi già implementata in un nuovo
file `expiryStageEngine.ts` (calm/alert/critical, soglie proporzionali 50%/15%, coerente col
piano), un nuovo `PoiParticles.tsx` (particelle deterministiche, seed fisso, CSS-only), e le
stanghette/tick-mark GIÀ RIMOSSE. Mancava però la parte centrale: corona turbolenta/menisco/
canale freddo — l'halo era ancora blur piatto. Aggiunto SOPRA il lavoro esistente (non riscritto):
- Canale freddo (azure-black, sempre visibile) dietro l'arco
- Due filtri di turbolenza (`feTurbulence`+`feDisplacementMap`, seed fissi, animati solo se
  perf-tier lo consente) → l'arco "inner" e un nuovo strato "fine" (highlight sottile)
- Menisco (bright cap al fronte-riempimento), posizionato/animato dallo stesso loop rAF esistente
- Gate perf (`data-perf-tier !== 'low'` + `!prefers-reduced-motion`, sempre pieno su hover)
**BUG PREESISTENTE trovato e corretto** (non mio, nel codice già lì): variabile dichiarata
`basePulse` ma referenziata come `pulse` (non definita) in 2 punti → probabile eccezione silenziosa
dentro il loop `requestAnimationFrame` che fermava l'animazione al primo frame senza errore
visibile. Corretto con sed su tutto il file.
**NOTA ARCHITETTURALE non risolta**: il componente reale ha UN SOLO arco guidato da `progress`,
con l'urgenza come overlay (colore+pulse+deriva rotazionale), NON due archi separati (fill-cresce
vs timed-si-scarica) come nel prototipo lab. Non ho cambiato questo — decisione da prendere
esplicitamente se si vuole il vero doppio-verso "antiorario quando si scarica".
**Verificato**: nessun crash, zero errori console, su `/minimal-poi` (21 medaglioni, menisco/fine/
outer tutti presenti e animati, zero tick mark) e `/minimal-clock` (dial giorno/notte, stessa
estetica, logica invariata). Un allarme di "pagina vuota" durante la verifica si è rivelato un
falso positivo (dep-optimizer di Vite non ancora assestato su server fresco, non un bug del
trapianto — confermato riproducendo lo stesso vuoto su `/minimal-roster`, non toccato).

**Corona ISPESSITA (2026-07-19, richiesta esplicita utente).** L'utente ha ricaricato lo stesso
`poi-skin-preview.html` + un nuovo `poi-detail.skin.json` (spec Dark Luxury per il POI Detail
modal — palette/bronzo/rack, non l'halo) e ha chiesto: "l'halo è molto più spessa e interessante
in questa versione, la voglio così". Causa: outer/inner/fine erano rimasti sugli spessori SOTTILI
originali (2/1.6/0.9) su DUE raggi diversi (outerHaloRadius≈22-23 vs innerHaloRadius=18.5), mentre
il riferimento disegna glow/main/fine allo STESSO raggio con spessori ~18%/25%/9% del raggio
(molto più spessi) — più uno strato "reflect" (riflesso che scivola nell'arco pieno) assente dal
mio trapianto. Fix: unificato tutto a `outerHaloRadius`, nuovi spessori proporzionali
(`coronaGlowWidth`=25%, `coronaMainWidth`=18%, `coronaFineWidth`=9% del raggio), aggiunto lo
strato `reflect` (drift sinusoidale, stessa formula del riferimento, soglia fillProg>0.12).
Canale freddo ispessito in coerenza. Verificato: `innerStrokeWidth` passato da 1.6px→3.96px
(misurato via DOM), 21 istanze con `reflect` presente e cablato correttamente (opacity=0 su
questa pagina solo perché nessuna fixture demo supera 12% di fill — soglia/matematica identiche
al riferimento, non testato oltre per non modificare dati demo fuori scope). Nessun crash.
Il nuovo JSON `poi-detail.skin.json` (Dark Luxury per l'intero modal POI Detail: palette,
bronzo 3-zone, slot bezel, rack blu mezzanotte) NON ancora processato/applicato — riguarda la
skin del modal, non l'halo; da valutare separatamente se/quando si riprende il POI Detail.

### Trigger a zero — RISOLTO
Esistono entrambi i casi (sparizione E trigger evento) → il componente NON decide: espone un
callback generico `onExpire?: () => void`, fired UNA VOLTA quando `remainingFraction` tocca 0.
Il chiamante decide cosa fare (unmount/implode vs dispatch evento/detonazione). Il componente
visivo non possiede logica di gameplay — solo stato/rendering + lifecycle hook.

## 7. Regole di lavoro (IMPORTANTE)

- **No blind touch componenti frozen**: Skin Binding System (`SkinBindingRegistry.ts`) + config-driven skin. Armonizzare via token/config seam, additivo, fallback = look attuale. Test verdi prima/dopo.
- **PERICOLO**: repo ha ai-worker autonomo. Verificare `git status`.
- **Screenshot**: si rompe su `/visual-fidelity-lab` (SVG pesanti), funziona su `/minimal-poi`, `/harmonization-gallery`, `/poi-detail-verification`.
- **Kit frozen**: `src/ui/idleVillage/frozen/kits/`. Barrel `index.ts` avvelenato → importare dai singoli file.
- **Lab è lab**: consumatori reali non importano da `visualFidelityLab` a lungo.

## 8. File chiave

- `src/ui/visualFidelityLab/`: CarvedBar.tsx, FieldGrain.tsx, matericSkin.css, poiMedallionRecipe.ts, HarmonizationGallery.tsx
- `src/ui/wanderlust-surface/`: matericSkinConfig.ts, WanderlustStatBar.tsx
- `src/ui/idleVillage/components/`: WanderlustRosterCard.tsx, GenericPoiSkin.tsx, ClockWidget.tsx, minimal/*
- `src/ui/idleVillage/skins/`: activityCapsuleSkinConfig.ts, SkinBindingRegistry.ts

## 9. Prossimo step
Prototipare corona halo (menisco, canale freddo, ring conservato, 3-stadi timed, ready-pulse, perf-gate) su `/minimal-poi`; poi trapiantare in `GenericPoiSkin` con test; poi Clock.
