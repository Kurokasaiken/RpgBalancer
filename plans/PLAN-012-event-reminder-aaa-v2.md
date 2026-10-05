---
title: 'Event Reminder AAA v2 — polish round 3'
status: active
created: 2026-08-31
---

## Spec

### Goal
Portare il Gilded Event Reminder a livello AAA senza toccare la versione corrente (`ReminderComponent.tsx` / `GildedEventFrame.tsx`). Si crea una nuova versione `*V2` che convive con l’esistente e viene esposta in `/primitives` per confronto.

### In Scope
- Nuovo `src/ui/idleVillage/components/ReminderComponentV2.tsx`.
- Nuovo `src/ui/idleVillage/components/GildedEventFrameV2.tsx`.
- Aggiornamento token in `src/balancing/config/idleVillage/eventReminderTokens.ts` (Zod).
- Nuova tab `reminderV2` in `src/pages/primitives.tsx`.
- i18n per nuove stringhe (se necessario).
- `prefers-reduced-motion`.
- Build e lint devono passare.

### NOT In Scope
- Modifiche a `ReminderComponent.tsx` e `GildedEventFrame.tsx` esistenti.
- Nuovi componenti puri: tutto dentro i due file V2.
- Modifiche a `MatericEventCard`, `SkinTitle` API.

### Tasks
1. **T1 — Token update** — aggiungere token per placca metallica, glare, medaglione ridotto, colori state-driven.
2. **T2 — `GildedEventFrameV2`** — bordi unificati a filetti continui, gemme più interne, nessuna maniglia a gancio.
3. **T3 — `ReminderComponentV2`** — monta `PoiMatericV3_5`, medaglione ~75%, glass/parallasse sottile, glare statico.
4. **T4 — Placca countdown** — oggetto metallico con bordo cromato e colori per stato (calm=teal, urgent=gold, active=red).
5. **T5 — Ierarchia tipografica** — 5 hero, INVASION H2, DAYS REMAINING caption.
6. **T6 — Primitives tab** — aggiungere `reminderV2` in `src/pages/primitives.tsx`.
7. **T7 — Safeguards** — lint, build:check, build.

### Acceptance
- `ReminderComponentV2` renderizza in `/primitives` tab `reminderV2`.
- Build, lint, build:check passano.
- File originali `ReminderComponent.tsx` e `GildedEventFrame.tsx` non modificati.
