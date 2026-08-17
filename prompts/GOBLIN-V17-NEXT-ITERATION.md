# GOBLIN-V17-NEXT-ITERATION

## Scope

Solo il componente `GoblinEventModalV17`, la pagina di confronto `MockupToComponentPage`, i token `goblinEventModalTokens.ts`, gli asset generati sotto `public/mockups/goblin-invasion-painted/`, gli script di split (`scripts/split-goblin-assets.py`), e i testi i18n. **Nessun lavoro POI o Day/Night clock.**

## Stato attuale

- Commit `fcc16826` su `origin/main` contiene V17.6 iniziale.
- Reference mockup: `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png` (1086×1448 px).
- Asset split generati:
  - `goblin-invasion-frame.png`
  - `goblin-invasion-hero.png`
  - `goblin-invasion-banner.png`
  - `goblin-invasion-panel.png`
  - `goblin-invasion-button-primary.png`
  - `goblin-invasion-button-secondary.png`
  - `goblin-invasion-icon-enemy.png`
  - `goblin-invasion-icon-arrival.png`
  - `goblin-invasion-icon-target.png`
- Componente: `src/ui/idleVillage/trailer/GoblinEventModalV17.tsx` (split asset + bottoni reali).
- Pagina: `src/ui/idleVillage/pages/MockupToComponentPage.tsx` (mostra V17.6).
- Tokens: `src/balancing/config/idleVillage/goblinEventModalTokens.ts`.
- Route di verifica: `http://localhost:5173/mockup-to-component`.

## Problemi noti da risolvere

1. **Testo baked del banner/pannello ancora visibile.** Il mockup ha testi scolpiti/incisi nel banner superiore e testi stampati nel pannello. Gli asset generati non li hanno rimossi completamente. Necessita inpainting o texture pulita.
2. **Pannello inpaint sfocato / artefatto.** L'ultimo tentativo con OpenCV `cv2.inpaint` ha prodotto smear. Serve un paintover migliore (o generazione AI).
3. **Bottoni con `clip-path` generico.** La forma a losanga è approssimata. Va rifinita per matchare il mockup.
4. **Icone semplici.** Le icone dei 3 stat sono ritagliate dal mockup ma piccole; eventualmente sostituirle con SVG o con ritagli più puliti.
5. **Fedeltà visiva ~75%.** Obiettivo 80%+

## Obiettivo della prossima iterazione

Raggiungere **≥ 80% di fedeltà visiva** rispetto al mockup, risolvendo almeno:

- Banner pulito (nessun testo baked visibile) + testo React/i18n leggibile.
- Pannello pulito (nessun testo baked visibile) + testi React/i18n allineati.
- Bottoni cliccabili, con texture e forma corrette.
- Frame, hero, totem, icone integri.

## Indicazioni operative

1. **Preferire inpainting AI** (Stable Diffusion / img2img / ControlNet) per produrre versioni pulite del banner e del pannello. Se non disponibile, migliorare `scripts/split-goblin-assets.py` con tecniche di paintover più sofisticate.
2. **Seguire il workflow `painter`** (`.windsurf/skills/painter/SKILL.md`):
   - Authority / reference lock.
   - Visual inventory aggiornata.
   - Reconstruction spec.
   - Token contract.
   - Asset production.
   - Component implementation.
   - Visual verification.
3. **Vincoli:**
   - Config-first: nessun valore UI hardcoded nel JSX.
   - i18n: tutti i testi utente in `public/locales/**/idleVillage.json`.
   - Skin system: niente CSS ad-hoc, usare token e skin primitives.
   - Componenti riutilizzabili: non duplicare primitive esistenti.
   - No lavoro POI: ignorare completamente `poi_*_spec.md`, `PoiDetailQuest...`, `defaultConfig.ts` e `types.ts` del POI.
4. **Safeguards da passare prima di dichiarare completato:**
   - `npm run lint:painter`
   - `npm run lint -- src/ui/idleVillage/trailer/GoblinEventModalV17.tsx`
   - `npm run build:check`
   - `npm run kanban:lint`
   - Screenshot side-by-side su `/mockup-to-component`.

## Note di contesto

- Il mockup è **reference only** (classe B), non un asset di produzione.
- Gli asset puliti devono essere generati solo per le parti non riproducibili in CSS/React.
- I testi e i valori devono essere React/i18n, non rasterizzati.
- Il componente V17.6 è già funzionante; questa iterazione è **polish visivo** e non refactor architetturale.
