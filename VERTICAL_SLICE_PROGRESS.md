# Vertical Slice Progress — Idle Village

**Ultimo aggiornamento:** 2026-06-09
**Surface canonica:** `/minimal-gameplay`
**Riferimento piano:** `VERTICAL_SLICE_ROADMAP.md` (Macro-Fasi A–F)

---

## Stato Macro-Fasi

| Fase | Titolo | Stato | Note |
|------|--------|-------|------|
| **A** | Drag pickup fix | ⚠️ DA VERIFICARE | Modifier `snapOverlayCenterToCursor` implementato, PgCard cattura offset. Serve verifica runtime |
| **B** | Core loop minimo girabile | ❌ NON INIZIATA | Pezzi singoli esistono, loop non assemblato |
| **C** | Skill check Cultist Simulator-style | ⚠️ PARZIALE | SkillCheck kit frozen, layout/UX da raffinare |
| **D** | Reward + Level up + Upgrade | ❌ NON INIZIATA | OutcomeKit frozen, logica reward da collegare |
| **E** | Contenuto Steam-presentabile | ❌ NON INIZIATA | — |
| **F** | Polish, audio, distribuzione | ❌ NON INIZIATA | — |

---

## Componenti UI (Frozen Kits)

| Kit | Status | E2E Test | Note |
|-----|--------|----------|------|
| rosterKit | candidate | ✅ parziale | Sorting/filtering funzionante |
| pgcardKit | candidate | ✅ parziale | Character card rendering ok |
| slotRackKit | candidate | ✅ parziale | 4 slot grid |
| clockKit | candidate | ✅ parziale | Time display |
| resourceHudKit | candidate | ✅ parziale | Gold/food/materials |
| jobCardKit | candidate | ✅ parziale | Job activity card |
| questCardKit | candidate | ✅ parziale | Quest activity card |
| skillCheckKit | candidate | ✅ parziale | Skill check resolver |
| outcomeKit | **frozen** | ❌ mancante | 4 outcome tiers |
| marketKit | **frozen** | ❌ mancante | MarketActionCard è TODO/placeholder |
| activeHudKit | candidate | ❌ mancante | Active notifications |
| slottedMedalKit | candidate | ✅ parziale | Medal token in slot |
| integrationDragJobKit | integration | ❌ mancante | Drag→Job flow |
| integrationQuestFlowKit | **frozen** | ❌ mancante | Quest→SkillCheck→Outcome |

---

## Engine Systems (esistenti e funzionanti)

- ✅ TimeEngine (dual-layer, tick management, day/night)
- ✅ JobResolver (completamento job, reward)
- ✅ QuestResolver (outcome determination)
- ✅ QuestEngine (lifecycle)
- ✅ QuestPowerEngine (matchmaking)
- ✅ CharacterToResidentBootstrap (pipeline conversione)
- ✅ ProductionEngine (risorse)
- ✅ EconomyEngine (gold, food, materials)
- ✅ MarketEngine (trading logic)
- ✅ InjuryEngine (HP/injury/death)
- ✅ SurvivalEngine (fatigue)
- ✅ VillageStateStore (state management)
- ✅ PersistenceService (save/load — 3 versioni, da consolidare)

---

## Test Strutturati per Fase

| Fase | Unit Test | Integration Test | E2E |
|------|-----------|-----------------|-----|
| 1. PgToken | ❌ | — | ⚠️ non strutturato |
| 2. Roster | ❌ | ❌ | ⚠️ non strutturato |
| 3. SlotRack | ⚠️ esiste ma non allineato | ❌ | ⚠️ non strutturato |
| 4. Drag | ⚠️ DragAnimation/Diagnostics | ❌ | ✅ 11 test |
| 5. Activity | ❌ | ❌ | ❌ |
| 6. HUD | ❌ | ❌ | ❌ |

---

## Blockers Attuali

1. **Drag pickup alignment** — Serve verifica runtime (A.4). Modifier esiste, potrebbe essere già risolto
2. **MarketActionCard.tsx** — Placeholder, serve implementazione reale per B.5
3. **MinimalActivityPage** — Non esiste (Fase 5 del piano testing)
4. **Loop non assemblato** — I singoli pezzi esistono ma `/minimal-gameplay` non ha il core loop completo

---

## Prossimi Passi (in ordine)

1. **Verificare drag pickup** — Avviare dev server, testare su `/minimal-gameplay`
2. **Assemblare core loop** (Macro-Fase B) — Collegare i pezzi esistenti in gameplay
3. **Test strutturati** — Dopo che il loop funziona
4. **Skill check polish** (Macro-Fase C)
5. **Reward/Level up** (Macro-Fase D)
