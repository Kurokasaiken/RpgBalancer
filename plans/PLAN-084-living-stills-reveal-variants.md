# PLAN-084 — Living stills: reveal narrativi + varianti di scena

**Stato:** `fatta` — slice T1/T3 committata e verificata (Director ruling 2026-10-24); residui OB-4/5/8 passano a plan dedicato

### Coperto (bundle 2026-10-24)
- OB-1 schema `reveal` Zod (forma: `region + trigger: click|timed + afterSeconds + burst[] + flag`) — manca `cameraZ`/`decisionPoint` come trigger
- OB-2 hotspot img-fraction cliccabile (region `[x,y,w,h]` nel manifest)
- OB-3 variante FX-reveal (burst glint+leaves, NON grade/mask — decisione presa: FX-reveal prima, grade dopo)
- OB-7 region-locked + manifest-declared
- `revealFlag` → `run.flags` (useQuestRun), click→`revealedAmbush` wired

### Aperto
- OB-4 delta plate pipeline (T-004)
- OB-5 motivated-cover transition
- OB-6 determinismo puro (React state oggi, non pure-fn)
- OB-8 scorecard arte estesa
- Auto-reveal al check (`decisionPoint` trigger — T-003 seconda metà)
**Fonte:** R-278; ricerca `context/research/2026-10-24-scene-variants-and-reveal/`
(broadcast aperto 5/5, prima applicazione del research-prompt-protocol R-278);
tassonomia archetipi `src/docs/docs/art-direction/composition_archetypes.md`;
contratto ambient `.mw/contracts/components/ambient-layer.md`.

## Ruling acquisiti (Director, 2026-10-24)

1. **Camera agency MISTA**: la scena respira authored; il segreto può essere
   scoperto dal player cliccando l'hotspot (reward attentivo) OPPURE si rivela
   da solo quando check/scelta diventa attivo. Il reveal è garantito, il click
   è il merito — design Obra Dinn senza il rischio "mai guardato".
2. **Layer model delegato** («modifichiamo tutto quello che serve»): scelta
   mia → **sidecar aligned maps + sparse delta plates** (claude b + chatgpt d):
   raster canonico unico; per scena dati allineati opzionali (mask reveal,
   ID-map, emission, flow) e al massimo UN delta plate regionale. Mai uno
   stack generale di painted layers.
3. **Pilota**: f7-agguato — reveal-as-grade T1 (sagome già dipinte camuffate
   nella treeline; reveal = lift chiarezza + glint + micro-rise opzionale).

## Contratto (obbligazioni verificabili)

- **OB-1** — `reveal` nuovo tipo FX con schema Zod: `{ at, region mask,
  trigger: cameraZ|clickHotspot|decisionPoint, ramp: {dur, lift, glint} }`;
  trigger astratto (non "camera z" hardcoded — così l'attenzione player è
  un backend futuro senza riscrivere).
- **OB-2** — hotspot: `hotspot: [x, y, r]` in frazioni img (stesso dominio
  degli anchor FX); click sul punto giusto = reveal anticipato. Zone
  cliccabili = campo, non "ovunque".
- **OB-3** — reveal-as-grade T1 su f7: mask di chiarezza (authoring PIL o
  da depth) + lift contrasto + glint occhi; le sagome restano dipinte.
- **OB-4** — delta plate pipeline: aligned patch + mask + feather (star
  topology — si edita sempre DAL base, mai a catena); pilota = forziere
  bottino che si apre o equivalente T2.
- **OB-5** — motivated-cover transition: fog/ember burst come blackout cue
   per lo swap (o depth-swept wipe via depth map come asse).
- **OB-6** — determinismo: stato reveal = funzione pura di
  (sceneId, storyState, cameraPos, clickLog, seed). Ambient resta loop;
  reveal è event-driven non-looping — timing model separato.
- **OB-7** — niente universal layer pipeline: ogni eccezione è region-locked,
   dichiarata in manifest, e coperta da test che verifica bounds/mask shape.
- **OB-8** — scorecard arte estesa: campi per mask/plate authored assets;
  la reveal deve avere causa visibile nel frame (non wipe astratta).

## Task

- T-001 — contratto: emendamento "sparse exception model" in
  ambient-layer.md + PLAN-052; `reveal` schema + tipi trigger.
- T-002 — T1 reveal-as-grade su f7-agguato (dipende dal brief v2 già
  scritto + generazione).
- T-003 — logica ibrida: auto-reveal all'attivazione del check/choice;
  click-hotspot = discovery anticipato (mystery slot nello state).
- T-004 — variante: delta plate + motivated cover su una scena (cassa
  bottino apri/chiudi come prova "piccole animazioni").
- T-005 — protocollo mask authoring (bake-mask.py riuso) + scorecard.

## Out-of-scope / rischi

- Video plates T3, live player camera control, attention model vero —
  deferred. Il fork camera agency resta "authored + click hotspot".
- Rischio mismatch stile delta plate (sticker su dipinto) → gate visivo
  Director a ogni plate; se fallisce 2×, fallback a reveal-as-grade solo.
- `f7-agguato` v2 brief già dipinge sagome nascoste — il T1 non richiede
  rigenerazione se il candidato tiene le sagome leggibili-ma-camuffate.

## Sequenza consigliata

T-001 (contratto) → generazione f7 v2 + tracce v2 check → T-002/003 pilota
reveal su f7 → T-004 delta plate su bottino → T-005 formalizzazione.

## Addendum — interaction affordances (Director 2026-10-24)

- **OB-9** — catalogo affordance in
  `src/docs/docs/art-direction/scene_interaction_affordances.md`
  (A1 discovery bonus … A8 timed pressure); ogni brief dichiara
  `interaction hooks` nella correlazione. Il segreto deve essere
  dipinto leggibile-ma-camuffato (anti-frustrazione).
- **OB-10** — gameplay coupling: discovery flag consumabili dai check
  (`revealedAmbush` → bonus stealth/percezione; `lootUntouched` →
  trappola non scatta; `sawEscape` → opzione sbloccata). Bonus in
  config quest, non nel manifest FX.
- T-006 — wiring flag→check nella quest (consume lo stato reveal come
  modificatore del check collegato — authored per nodo).

## Collegamento quest-generation (Director 2026-10-24)

- **OB-11** — la pipeline quest-generate (`questRefine`, domainVocabs,
  scene spec) deve portare `archetype` + `interaction hooks` come dati
  di input al prompt, non come testo libero: la spec di scena generata
  assegna archetipo da coverage matrix + affordance da catalogo.
- T-007 — estendere la spec scena generata con `archetype`/`hooks`
  (campi dati) + il compiler `build-scene-prompt.py` con slot
  corrispondenti (raccordo con PLAN-080).
