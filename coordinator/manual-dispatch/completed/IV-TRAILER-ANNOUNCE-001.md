# IV-TRAILER-ANNOUNCE-001

## Title
Trailer Threat Iter - Fase 1 Announcement (Hearthstone-style card reveal)

## Description
Ridefinire la scena Threat di TrailerThreatIter con presentazione stile Hearthstone: mappa visibile, vignette scuro, corno da guerra, nube di polvere, illustrazione goblin come sticker dipinto grande e sospeso, testo "GOBLIN INVASION" + "The eastern tribes have begun their march" + "5 DAYS REMAIN" con anello bronzeo rotante.

## Prompt

```text
AGENT
Idle Village Task - Trailer Threat Iter Fase 1 Announcement

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Ridefinire la scena Threat di TrailerThreatIter con presentazione stile Hearthstone: mappa visibile, vignette scuro, corno da guerra, nube di polvere, illustrazione goblin come sticker dipinto grande e sospeso, testo "GOBLIN INVASION" + "The eastern tribes have begun their march" + "5 DAYS REMAIN" con anello bronzeo rotante.

CONTEXT
This is part of the Steam teaser trailer production pipeline. The trailer is exempt from gameplay architecture requirements but must preserve presentation architecture requirements. This code exists solely to produce recordable video content.

WHAT YOU MUST DO
1. Implementare Fase 1 Announcement (3 secondi) in TrailerThreatIter
2. Mappa completamente visibile all'inizio
3. Leggero vignette scuro (20-30%) che appare all'improvviso
4. UI rimane visibile ma perde enfasi
5. Suono corno da guerra (placeholder audio file)
6. Nube di polvere attraversa lo schermo (CSS animation)
7. Al centro compare illustrazione goblin come sticker dipinto (non card)
8. Grande, sospeso, stile Hearthstone card reveal
9. Sotto: "GOBLIN INVASION" + "The eastern tribes have begun their march" + "5 DAYS REMAIN"
10. Piccolo anello bronzeo che ruota lentamente attorno al timer
11. Niente pulsanti - solo presentazione

@trailer-only CONVENTION
EXEMPT from gameplay architecture:
- NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- NO telemetry of any kind (marketing asset, not product)
- NO gameplay state mutation, NO economy systems, NO player progression

MUST PRESERVE:
- Config-first: All timing values, animation settings, sequence events in `trailerConfig.ts` with Zod validation
- Skin/Theme: Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- Component Reuse: Verify primitives before creating new components, reuse existing CSS patterns
- State Management: Use React Context for local presentation state, NO Zustand (marketing-only)
- Documentation: JSDoc on all functions/interfaces, update plan changelog
- Node/tooling: Use pinned Node version from .nvmrc
- Safeguards: Run lint, build:check, kanban:lint before task complete

Visual Presentation Requirements:
- REQUIRED: Hearthstone card reveal style - sticker dipinto, non card UI
- REQUIRED: Goblin illustration grande e sospeso al centro
- REQUIRED: Vignette scuro 20-30% opacity
- REQUIRED: Nube di polvere CSS animation
- REQUIRED: Anello bronzeo rotante attorno al timer
- FORBIDDEN: Niente pulsanti o interazioni utente
- FORBIDDEN: Card UI pattern - deve essere sticker dipinto

No Placeholder Rule:
- FORBIDDEN: No temporary shapes, debug boxes, fake assets
- REQUIRED: Every visual element must be final quality
- ALLOWED: Placeholder audio file for war horn (document as placeholder)

SUCCESS CRITERIA
- Fase 1 Duration: 3 secondi totali
- Map Visibility: Mappa completamente visibile all'inizio
- Vignette Effect: 20-30% opacity, appare all'improvviso
- Audio: Corno da guerra suona (placeholder file OK)
- Dust Cloud: Nube di polvere attraversa schermo (CSS animation)
- Goblin Sticker: Illustrazione come sticker dipinto, non card, grande e sospeso
- Text Layout: "GOBLIN INVASION" + subtitle + "5 DAYS REMAIN" sotto
- Bronze Ring: Anello bronzeo rotante attorno al timer
- No Buttons: Niente pulsanti, solo presentazione
- Hearthstone Style: Card reveal feel, sospeso e drammatico

INTEGRATION POINTS
- Existing Component: TrailerThreatIter.tsx (modify phase logic)
- Existing Config: trailerConfig.ts (add announcement timing)
- Existing Asset: goblin-march-trasparente.png (already updated to no-arrow version)
- Audio: Placeholder war horn audio file (create if needed)

FILES TO MODIFY
1. `src/ui/idleVillage/trailer/TrailerThreatIter.tsx` - Add announcement phase logic
2. `src/balancing/config/idleVillage/trailerConfig.ts` - Add announcement timing and config
3. `src/ui/idleVillage/trailer/TrailerThreatDetailPanel.tsx` - Modify for sticker presentation (if needed)

FILES TO CREATE (Optional)
1. `public/audio/war-horn.mp3` - Placeholder war horn audio (if not exists)

TESTING REQUIREMENTS
- Visual Test: Verify Hearthstone-style sticker presentation
- Timing Test: Verify 3-second announcement phase
- Animation Test: Verify dust cloud and bronze ring rotation
- Audio Test: Verify war horn plays (placeholder OK)
- Deterministic Test: F5 refresh produces identical sequence

DOCUMENTATION UPDATES
1. `trailer_threat_iter_rework_plan.md`: Update Fase 1 progress in changelog
2. `docs/trailer_capture_notes.md`: Add best timestamps, successful screenshots

SAFEGUARDS
- Lint Scope: `src/ui/idleVillage/trailer/` (120s timeout)
- Test Scope: None
- Build Check: `npm run build:check` (180s timeout)
- Kanban Lint: `npm run kanban:lint` (30s timeout)

PLAN REFERENCE
[trailer_threat_iter_rework_plan.md](../docs/plans/trailer_threat_iter_rework_plan.md) - Fase 1 Announcement
```

## Files to Modify
- src/ui/idleVillage/trailer/TrailerThreatIter.tsx
- src/balancing/config/idleVillage/trailerConfig.ts
- src/ui/idleVillage/trailer/TrailerThreatDetailPanel.tsx

## Files to Create (Optional)
- public/audio/war-horn.mp3

## Expected Output
- TrailerThreatIter implementa la fase `announcement` della durata di 3 secondi.
- Mappa completamente visibile all'avvio, vignette scuro 20-30% che appare improvvisamente, war horn audio placeholder, nube di polvere animata, goblin sticker centrale, testo e anello bronzeo rotante.
- Safeguards `npm run lint -- src/ui/idleVillage/trailer/`, `npm run build:check`, `npm run kanban:lint` passano.

## Dependencies
None

## Timestamp
2026-07-18

## Executor
manual
