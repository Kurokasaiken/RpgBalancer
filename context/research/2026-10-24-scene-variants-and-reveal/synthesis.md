# Synthesis — variants & reveals (broadcast 2026-10-24, 5/5 voci, protocollo R-278)

## Banda 1 — CONVERGENZE (segnale, ≥4/5 voci)

1. **La regola "no layer pipeline" va EMENDATA, non abbandonata** — tutti e 5
   indipendentemente propongono lo stesso compromesso: piatto canonico unico +
   eccezioni sparse allineate (deepseek: minimal 3-layer contract; claude:
   sidecar map bundle — matte/ID/emission/flow a stessa risoluzione; chatgpt:
   sparse exception model; gemini: decomposed master; grok: dipinto resta,
   strati procedurali sì). **La mask è la moneta comune di varianti e reveal.**
2. **Reveal ≠ dissolvenza**: qualità = segnali orchestrati (silhouette →
   occlusion → light → timing). Claude: tiered budget — T0 occhi/glint nel
   buio, T1 reveal-as-grade, T2 patch plate, T3 video plate. La maggior parte
   dei beat vive in T0–T1.
3. **Reveal-as-grade (l'idea più forte del set)**: la figura è DIPINTA
   camuffata nel piatto base; il reveal è solo lift di chiarezza/contrasto +
   rim light + glint. Zero pixel nuovi, zero disocclusione, sopravvive a
   qualsiasi camera path.
4. **Varianti**: edit models ok per delta object-level, falliscono su cambi
   globali → globale = grading/LUT, mai generazione. Star topology: sempre
   editare DAL base, align→diff→keep-masked-region→feather (claude).
5. **Transizioni**: motivated cover (fog bank/ember burst = blackout cue
   teatrale), depth-swept wipe (la depth map come asse della tendina),
   brush-stroke wipes. Crossfade puro = ultima spiaggia.
6. **Camera = proxy dell'attenzione**: il reveal avviene dove la camera VA.
   Ambient motion = "il mondo è vivo"; narrative motion = "il mondo ti ha
   notato" — tenerle separate (chatgpt/deepseek).
7. **Orizzonte tecnico condiviso**: flow fields (tutti e 5), color cycling
   (4/5), audio coupling (4/5), impasto normal map (2/5).

## Banda 2 — DIVERGENZE (opzioni per ruling Director)

1. **Quale modello di layer**: (a) 3-layer contract minimo [deepseek];
   (b) sidecar aligned maps, mai painted layers [claude]; (c) auto-
   segmentazione del master in 3-5 piani [gemini]; (d) exception model
   sparso [chatgpt]. Stessa direzione, profondità diverse → ruling.
2. **Camera agency** (domanda aperta di claude — da sciogliere PRIMA di
   qualsiasi tooling): camera interamente authored → reveal = scheduling,
   tutto bakabile; player può influenzare la camera → attention mechanics
   (Obra Dinn). Cambia il design di tutto il layer quest.
3. **Varianti come stato condizionale ai check** (claude): esito skill check
   cambia cosa la scena mostra — delta spatially disjoint tipo layer comps.
   Discussione di design, non solo rendering.
4. **Deterministic canvas → WebGL?** claude: gli shader effect (boil,
   relighting, rack focus) sono facili su WebGL, i golden-frame test con
   tolleranza sostituiscono il pixel-exact. Ruling tecnico.
5. **Generator = delta machine** (star topology) vs owner: decisione di
   processo, non di codice.

## Banda 3 — VOCI SOLITARIE (possibili blind spot condivisi)

- **gemini**: impasto normal map da luminanza → la torcia rastrella luce
  reale sulle creste di pennellata (specular under candlelight).
- **claude**: Diaroma di Daguerre (1820s, front/back-lit) → emission mask
  states; **flow map da video models**: genera clip 3-4s image→video,
  estrai optical flow medio, cuoci flow map, butta il video — movimento
  dipinto-regione gratis; audio-first cue (suono 300ms PRIMA del visual).
- **deepseek**: impossible camera (violazione prospettica solo-da-dipinto);
  shadow-first reveal; la scena che "guarda indietro".
- **grok**: stereo anaglifico; reveal ritmico su audio envelope.
- **chatgpt**: reflection che mentisce; temporal misregistration; controlled
  stillness (congelare tutto tranne UN elemento); painting-as-memory
  (segni persistenti delle scelte del player = variante come agenzia).

## Nota di processo (protocollo R-278 — prima applicazione)

Il prompt aperto ha prodotto: 3 proposte di layer-model indipendenti
convergenti (segnale forte), 1 domanda strutturale non posta (camera
agency = fork di design), e ≥6 tecniche fuori dal nostro frame (reveal-as-
grade, Daguerre, flow-map-da-video, impossible camera, temporal misreg,
painting-as-memory). Confronto col broadcast precedente (4 taxonomy e
zero sorprese): il protocollo funziona.
