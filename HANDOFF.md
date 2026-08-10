# HANDOFF — Restyle "Material Language" · RPG/Wanderlust

## 0. Il quadro generale (LEGGI QUESTO PRIMA)
Il progetto è un **restyle grafico dell'intera applicazione** (idle-village fantasy "Wanderlust"),
non un singolo task. L'obiettivo: portare TUTTI i componenti reali del gioco (quelli linkati da
**`/test-hub`**, l'hub che raccoglie le pagine di test/minimal-slice/gallery) a una **Material
Language** unica e coerente — bronzo/oro/ossidiana/blu-notte, "AAA da 70€ su Steam", MAI
web-app/dashboard. Il lavoro procede componente per componente, con un metodo fisso a 3 fasi:

1. **Fidelity Lab** (`/visual-fidelity-lab`) — si prova UN'ipotesi visiva isolata, a basso rischio,
   su un artefatto sintetico (non il componente reale).
2. **Harmonization Gallery** (`/harmonization-gallery`) — l'ipotesi validata si monta sul
   **componente VERO** (via i suoi frozen kit, con fixture reali), affiancato as-is/materico,
   per giudicare "appartiene allo stesso gioco?" a occhio.
3. **Trapianto nel componente canonico** — solo dopo il via libera, si applica al file vero
   condiviso da tutto il gioco, con rete di sicurezza (test) e verifica sulle pagine `/minimal-*`
   reali (non sintetiche).

**Stato del restyle per componente** (vedi §5 per dettagli):
| Componente | Stato |
|---|---|
| Roster (pgCard, stat bar, sigillo di stato) | ✅ FATTO — token migrati, verificato |
| POI Detail (modal missione, skin "Dark Luxury") | ✅ VERIFICATO già allineato, nessun intervento |
| **POI / Clock (medaglione condiviso — corona halo)** | 🔧 **IN CORSO — vedi §6, thread attivo** |
| SlotRack, Balancer (tool-tier), altri | ⏳ non ancora iniziati |

## 1. Ambiente
`/Users/faustoboni/progetti_personali/RPG` · React+Vite+TS · `npm run dev` · test: vitest
(`vitest.config.ts` default ESCLUDE `src/ui/**` e `*.rtl.test.tsx` → per quei test serve
`VITEST_INCLUDE=<path> npx vitest run` o `vitest.idlevillage.config.ts`).

## 2. Le pagine-chiave della "rete" di restyle
- **`/test-hub`** — hub che raccoglie tutte le pagine `/minimal-*` (roster, poi, clock,
  slotRack, ecc.) e le gallery. Punto di partenza per navigare l'intero ecosistema.
- **`/visual-fidelity-lab`** — proving ground, magro. ⚠️ **si rompe con gli screenshot**
  (compositing SVG pesante di WanderlustSurface) — non fidarsi degli screenshot lì, verificare
  via DOM/computed-style o pagine dedicate.
- **`/harmonization-gallery`** — monta componenti VERI, tab (Roster/Clock/POI Detail/POI),
  toggle Coppie/Solo-materico/Solo-liscio. Screenshot funzionante qui.
- **`/minimal-poi`, `/minimal-clock`, `/minimal-roster`, `/poi-detail-verification`** — pagine
  REALI isolate (non sintetiche), screenshot funzionante.
- **`/poi-corona-lab`** — pagina lab dedicata al redesign del medaglione (§6), ora usa il
  componente REALE `GenericPoiSkin` con le 4 palette affiancate + bottone "Avanza tempo".

## 3. Leggi della Material Language ("bibbia tecnica")
- **Composizione a layer / spend-photons-up**: volume = layer deliberati (glow→corpo→highlight→
  reflect), la luce sale.
- **Single Physical Geometry**: un oggetto = una geometria fisica coerente, non effetti scollegati.
- **Stable Procedural Identity**: imperfezioni (grana/turbulence) con seed FISSI per-istanza, mai
  ri-rollati; il materiale ha imperfezioni statiche, solo l'energia è animata.
- **Leggibilità #1**: il fronte-riempimento di una barra ha un menisco brillante; canale vuoto
  freddo (azure-black) — MA vedi §6: su un piccolo medaglione CIRCOLARE questa legge del canale
  freddo non si trasporta bene (letta come "riga di troppo", rimossa lì).
- **Warm-only**: bronzo/oro/ambra/ossidiana. Grigio/argento freddo BANDITO.
- **Frame weight = gerarchia**: reward URLA (gold filet pieno), elementi ripetuti SUSSURRANO.
- **Anti-perfezione**: no bordi machine-perfect, no ombre >3-4 livelli, no glow largo, no bottone flat.
- **Depth hierarchy**: no "buchi dentro buchi"; elementi trascinabili = RIALZATI, mai scavati.
- **Matrice semantica energie** (LEGGE game-wide, una costruzione/`CarvedBar` + N energie): HP→
  smeraldo · Stamina→ambra · Mana→ametista · XP/progresso→oro fuso · Pericolo/timer→brace ·
  Capacità/slot→bronzo desaturato · Azure→SOLO ambient, mai semantico.
- **Tool/Config vs Diegetic** (proposta non ancora congelata): schermi tool/power-user (Balancer)
  possono restare densi; schermi player-facing seguono sempre la Material Language.

## 4. Regole di lavoro/governance (IMPORTANTE, sempre valide)
- **Mai toccare alla cieca i componenti canonici/frozen.** C'è uno Skin Binding System
  (`SkinBindingRegistry.ts`) + skin config-driven per componente. Armonizzare via seam
  token/config, ADDITIVO, fallback = comportamento/aspetto attuale invariato. Test verdi
  prima/dopo ogni modifica a un file condiviso.
- **Il componente "di test" NON è mai il vero consumer player-facing.** Errore ripetuto 3 volte
  in questo lavoro: PgCard-standalone ≠ Roster reale; ActivityCapsule bare ≠
  ActivityCapsuleDetailSkinAware; ClockWidgetStandalone (pannello QA nudo) ≠ TimeEngineStrip+
  DayNightPoiSkin (il vero Clock coi dial). **Prima di giudicare/armonizzare un componente,
  verificare qual è il vero composito player-facing**, non il widget "bare" usato nei test.
- **PERICOLO repo**: c'è un coordinator/ai-worker autonomo che fa commit/checkout automatici.
  Verificare `git status` prima di assumere che un file sia stato perso/rotto da noi — spesso
  è un falso allarme (letture in istanti di transizione, dep-optimizer di Vite non assestato
  su server fresco: aspettare 5-15s e ricontrollare prima di conclude una regressione).
- **LIMITE STRUMENTO scoperto**: la tab del Browser-pane automatizzato non è mai
  `document.hidden=false`/focalizzata per il browser reale → `requestAnimationFrame` è
  THROTTLED. Qualunque animazione rAF-driven (fill, pulse, escalation) NON avanza in modo
  affidabile se verificata da qui, anche aspettando a lungo — un click reale sblocca solo un
  breve burst di frame, non un loop sostenuto. **Non è un bug del codice.** Per verificare
  comportamenti animati serve la tab REALE dell'utente (foreground) — chiedere conferma visiva
  diretta all'utente invece di fidarsi di uno screenshot automatizzato per quello specifico stato.
- **Kit frozen** (`src/ui/idleVillage/frozen/kits/`): il barrel `index.ts` è AVVELENATO
  (`slottedMedalKit` importa un `SlottedMedal` inesistente) → importare i kit SEMPRE dai singoli
  file, mai dal barrel.
- **Il lab resta lab**: i consumatori reali non devono importare da `visualFidelityLab` a lungo
  termine — è un'area di prova, non una home definitiva per i primitivi.

## 5. Cosa è FATTO e verificato (roadmap per componente)
- **Roster**: `CarvedBar` primitivo estratto; `WanderlustStatBar` migrato a token (fallback =
  valori attuali, zero regressione); sigillo di stato (dot verde → sigillo bronzo, 2 segnali
  forma+colore); filtro "Ordina per stat" (mockup). 71/71 test roster verdi.
- **POI Detail**: skin "Dark Luxury" (`ActivityCapsuleDetailSkinAware` + `POI_DETAIL_SKIN_CONFIG`)
  già vicina alla Material Language di suo — NESSUN intervento fatto, verdetto = va bene così.
  C'è un nuovo `poi-detail.skin.json` ricevuto dall'utente (palette/bronzo-3-zone/rack/slot-bezel
  per l'INTERO modal) — NON ancora processato, tema separato dall'halo, da riprendere a parte.
- **Harmonization Gallery**: tab Clock corretto (montava il widget QA sbagliato, ora monta il
  vero TimeEngineStrip+DayNightPoiSkin).

## 6. THREAD ATTIVO — redesign medaglione POI + Clock (`GenericPoiSkin`)
`GenericPoiSkin` (`src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx`) = SVG puro
palette-driven, CONDIVISO da: Clock giorno/notte (`DayNightPoiSkin`), tutti i marker POI
(Job/Activity/Quest), medaglione del POI Detail. Blast radius alto.

**Target approvato** (HTML `poi-skin-preview.html` dell'utente): halo "corona" turbolento che si
riempie (glow+arco+fine+reflect), pietra ossidiana, rim bronzo. Rimosse le "stanghette" (tick
ring + dot cardinali) e i due anelli sfocati originali.

**Trapianto fatto**: al momento di intervenire, il file era GIÀ parzialmente riscritto da un
altro processo (palette-per-tipo via `getPoiPalette(cardKind)` — usa `poiMedallionRecipe.ts`,
4 palette: amber/lapis/ember/verdigris —, macchina a 3 stadi in nuovo `expiryStageEngine.ts`
calm/alert/critical su soglie proporzionali 50%/15%, particelle in nuovo `PoiParticles.tsx`
seed-fisse CSS-only, tick-mark già rimossi). Aggiunto SOPRA (non riscritto): canale freddo (poi
RIMOSSO, vedi sotto), turbolenza vera (`feTurbulence`+`feDisplacementMap`, 2 filtri, seed fissi,
gate perf), menisco (bright cap al fronte), layer "reflect" (riflesso che scivola nell'arco).

**Bug preesistente trovato e corretto**: variabile `basePulse` dichiarata ma referenziata come
`pulse` (non definita) in più punti → eccezione silenziosa nel loop rAF, animazione bloccata al
primo frame. Fix con sed su tutto il file.

**Ispessimento (richiesta esplicita utente)**: gli spessori originali (2/1.6/0.9) su DUE raggi
diversi leggevano sottili. Il riferimento disegna glow/main/fine allo STESSO raggio con spessori
~25%/18%/9% del raggio. Fix: unificato tutto a `outerHaloRadius`, spessori proporzionali
(`coronaGlowWidth`/`coronaMainWidth`/`coronaFineWidth`), aggiunto layer `reflect` mancante.
Verificato via DOM: `innerStrokeWidth` 1.6px→3.96px.

**REGRESSIONE segnalata dall'utente e in parte corretta**: "gli halo sono strani e brutti... ci
sono delle linee che non voglio vedere". Diagnosi: il **canale freddo** (2 cerchi statici pieni
a 360° sotto la corona, pensati per la leggibilità delle barre LINEARI) su un piccolo medaglione
CIRCOLARE legge come una riga di troppo che compete col rim bronzo già presente — **RIMOSSO**.
Non ancora confermato dall'utente se la rimozione risolve del tutto la percezione "strana/brutta"
— **verifica pendente**, vedi §6bis sul limite dello strumento (non posso verificare l'animazione
dal vivo da qui).

**Nota architetturale aperta, non risolta**: il componente reale ha UN SOLO arco guidato da
`progress`, con l'urgenza-scadenza come overlay (colore/pulse/rotazione), NON due archi separati
(fill-cresce vs timed-si-scarica antiorario) come nel prototipo lab iniziale. Non cambiato —
decisione esplicita da prendere se si vuole il vero doppio-verso.

**Trigger a zero — RISOLTO**: esistono entrambi i casi (sparizione E trigger evento) → il
componente espone un callback generico `onExpire?: () => void`, fired una volta a
`remainingFraction=0`. Il chiamante decide il comportamento (il componente non possiede logica
di gameplay).

**Verificato senza crash** (zero errori console) su `/minimal-poi`, `/minimal-clock`,
`/poi-corona-lab`. **NON verificabile da questo strumento**: il comportamento dell'animazione a
fill medio/alto (vedi limite in §4) — serve conferma dell'utente sulla sua tab reale.

**Prossimo step immediato**: attendere il verdetto dell'utente su (a) se la rimozione del canale
freddo risolve "strano/brutto", (b) se lo spessore a fill realistico (40-70%, testabile col
bottone "Avanza tempo" su `/poi-corona-lab`) convince.

## 7. File chiave
- `src/ui/visualFidelityLab/`: CarvedBar.tsx, FieldGrain.tsx, matericSkin.css,
  poiMedallionRecipe.ts (4 palette + mappa tipo→skin), HarmonizationGallery.tsx,
  PoiCoronaHaloLab.tsx (showcase reale + bottone avanza-tempo)
- `src/ui/wanderlust-surface/`: matericSkinConfig.ts, layout/WanderlustStatBar.tsx
- `src/ui/idleVillage/components/minimal/`: GenericPoiSkin.tsx (il file del thread attivo),
  expiryStageEngine.ts, PoiParticles.tsx, ClockWidget.tsx, TimeEngineStrip.tsx,
  DayNightPoiSkin.tsx, QuestPOI.tsx, JobPOI.tsx, ActivityPOI.tsx
- `src/ui/idleVillage/components/`: WanderlustRosterCard.tsx
- `src/ui/idleVillage/skins/`: activityCapsuleSkinConfig.ts, poi/poiDetailSkinConfig.ts,
  SkinBindingRegistry.ts
- `src/ui/idleVillage/frozen/kits/`: poiKit.tsx, clockKit.tsx (import DIRETTO dai singoli file,
  mai dal barrel index.ts)
- Riferimenti utente (Downloads): `poi-skin-preview.html` (target halo), `poi-detail.skin.json`
  (target skin modal POI Detail — separato, non processato)
- Memoria persistente completa (dettagli storici oltre questo file):
  `/Users/faustoboni/.claude/projects/-Users-faustoboni-progetti-personali-RPG/memory/project_visual_grammar_spike.md`

## 8. Domanda aperta con l'utente (bloccante per il thread attivo)
Dopo la rimozione del canale freddo: l'halo ora ti sembra giusto, o resta "strano"? E a fill
40-70% (bottone "Avanza tempo" su `/poi-corona-lab`, verificato sulla TUA tab reale) lo spessore
ti convince?
