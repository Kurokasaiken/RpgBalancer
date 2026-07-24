AGENT
WL-LORE-DROP-F1 — Lore Drop Prototype: Lore Drop Types + Sample Pool

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Questa e' la fase F1 del master task `WL-LORE-DROP-001`.

OBIETTIVO
Definire i tipi e creare 12 sample lore drops config-first in `src/balancing/config/lore/`.

FILE CHIAVE
- `src/balancing/config/lore/loreDropTypes.ts` (nuovo)
- `src/balancing/config/lore/loreDropSamples.ts` (nuovo)
- `src/docs/docs/plans/lore_drop_prototype_plan.md` (aggiorna changelog F1)

INVARIANTI
- Config-first: ogni definizione in Zod schema; nessun testo hardcoded.
- i18n namespace `idleVillage` per stringhe player-facing.
- No CSS standalone.
- JSDoc per ogni tipo/funzione.

OPERAZIONI DA ESEGUIRE
1. Creare `loreDropTypes.ts` con:
   - `LoreDropRarity` enum (common, uncommon, rare, epic, legendary).
   - `LoreDropTrigger` union (quest_complete, location_visit, curio_interact, time_of_day).
   - `LoreDropSchema` (Zod): id, titleKey, bodyKey, rarity, trigger, weight, condition, tags.
   - Tipi e export.
2. Creare `loreDropSamples.ts` con 12 sample drops variati per trigger/rarity, con chiavi i18n.
3. Aggiornare `lore_drop_prototype_plan.md` changelog F1.

OPERAZIONI VIETATE
- Hardcodare stringhe di flavor text.
- Implementare servizio/store in questa fase (deve essere WL-LORE-DROP-F2).
- Modificare `QuestChronicle.tsx` o `locationDetailKit.tsx` in questa fase.

ASSUNZIONI
- `loreConfig.ts` e `loreEntries.ts` esistono (WL-LORE-001-A completato) e forniscono pattern.
- Il namespace `lore` e' gia' registrato in `src/localization/i18n.ts`.

SAFEGUARDS
- `npm run lint -- src/balancing/config/lore/loreDropTypes.ts src/balancing/config/lore/loreDropSamples.ts`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/wl-lore-drop-f1-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `WL-LORE-DROP-F1` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: WL-LORE-DROP-F1 – Completato (Evidence: test-results/wl-lore-drop-f1-2026-07-23.log)`
