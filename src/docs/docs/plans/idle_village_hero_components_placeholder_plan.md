# Idle Village — Hero Components Placeholder Plan (Umbrella)

**Status:** Draft  
**Scope:** componenti placeholder funzionali e skin-wired per scheda del personaggio, meccanismo di equip, oggetti equippabili, oggetti consumabili e skill da equippare.  
**Desiderata FROZEN:** `.mw/desiderata.md` v10  
**Related plans:** `idle_village_plan.md`, `idle_village_ftue_plan.md`, `idle_village_art_style_plan.md`, `poi_quest_system_plan.md`  
**Last updated:** 2026-08-18

---

## 1. Goal

Progettare e tracciare il lavoro per ottenere cinque superfici placeholder già **funzionalmente corrette**, collegate al sistema di skin, i18n e config-first, in modo che il lavoro **Golden UI Foundation** possa affinarne solo l’estetica senza dover rifare i contratti.

---

## 2. Non-goal

- Non si disegnano asset finali, palette definitive o animazioni polacche.
- Non si cambiano le meccaniche di skill check, quest o time engine già congelate (desiderate v3/v4/v8).
- Non si sostituisce Golden UI Foundation: i componenti devono essere **compatibili con esso**, non anticiparlo.

---

## 3. Invariants and constraints

- **Config-first:** tutti i valori gameplay/stat/equip/consumabili/skill vengono da `IdleVillageConfig` o da nuovi sottoschemi di `idleVillageConfigSchema`.
- **i18n:** nessuna stringa user-facing hardcoded; namespace `common` per UI generiche, `idleVillage` per dominio.
- **Skin:** ogni componente usa `SkinScope`, `data-skin` e i token `--skin-*` di Style Lab. Vietati file `.css` standalone.
- **Component reuse:** prima di crearne uno nuovo, verificare `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/components/`, `src/ui/idleVillage/skins/primitives/`.
- **Persistence:** tutto il salvataggio/caricamento passa tramite `PersistenceService` (`saveData` / `loadData`).
- **State management:** Zustand per stato eroe/inventario condiviso; React Context solo per UI locale.
- **Tests:** ogni componente placeholder ha almeno un test RTL che verifica render, contratto dati e skin tokens.
- **Safeguards:** `npm run build:check`, `npm run lint -- <scope>`, `npm run test -- <scope>` verdi prima di chiudere ogni sub-plan.

---

## 4. State of the art

- `SlottedMedal` è il medaglione PG del roster (`DESIGN_PILLARS.md` §R3.4).
- `FloatingPanel` (desiderata v4) è il pattern per pannelli flottanti.
- `QuestChronicle` e `MilestoneCheckModal` gestiscono consumabili pre-quest (desiderata v3/v4).
- `IdleVillageConfig` e `useIdleVillageConfig()` sono la sorgente config-first.
- `skinConfigRegistry` e Style Lab forniscono i token skin per i componenti.
- `DESIGN_PILLARS.md` §R2.6 descrive la “Licenza di Caccia” come item-card drag; §R3.4 colloca XP ed equip sul medaglione.

---

## 5. Sub-Plans

### 5.1 — Sub-Plan A: Scheda del personaggio (PgCard / CharacterSheetPanel)

- **Status:** Completato placeholder v1 (2026-08-18) — `PgDetailCard` esistente reso skin-wired, i18n e config-first.
- **Evidence:** `test-results/idle-village-pgdetailcard-2026-08-18.md`
- **Open:** livello/XP/skill equip rimangono fuori da questo placeholder; saranno gestiti in Sub-Plan A2 o fase di integrazione.
- **Sub-Plan A2:** `idle_village_hero_sheet_dynamic_stats_plan.md` (Draft 2026-09-16) — statistiche dinamiche dal Balancer registry, Lv/XP mock via config, skill equipaggiate in card. Decisioni Director R-073.
- **Goal:** un pannello/card che mostri nome, livello, XP, statistiche, slot equip e skill equip del PG.
- **Input:** `ResidentState` (o `Character`) dalla store; `pgCardSkinConfig` da `IdleVillageConfig`.
- **Output:** componente `PgCard` o `CharacterSheetPanel`, montabile in `FloatingPanel`, aperto dal click sul medaglione del roster.
- **Open decisions:** pannello flottante vs pagina dedicata; forma rettangolare vs espansione diretta del medaglione.
- **Verifiable result:** `PgCard` rendera da test con dati mock, skin tokens corretti e i18n keys definite.

### 5.2 — Sub-Plan B: Meccanismo di equip (EquipSlotRack)

- **Status:** Completato placeholder v1 (2026-08-18) — `EquipSlotRack` drag-and-drop e `useEquipment` con test.
- **Evidence:** `test-results/equip-slot-rack-2026-08-18.md`
- **Open:** validazione per tipo di slot e item verrà aggiunta quando esisterà `EquippableItemSchema` (Sub-Plan C).
- **Goal:** trascinare o cliccare un oggetto equip su uno slot del PG.
- **Input:** oggetti equippabili, `EquipmentSlot[]` da config, `dnd-kit` o `useResidentDropValidation` esistente.
- **Output:** `EquipSlotRack` con slot weapon/amulet/armor (placeholder); hook `useEquipment`.
- **Open decisions:** drag vs click; se l’equipaggiamento è permanente per run o modificabile a piacere.
- **Verifiable result:** test che equipaggia un item e aggiorna lo stato derivato del PG.

### 5.3 — Sub-Plan C: Oggetti equippabili (EquippableItemCard)

- **Status:** Completato placeholder v1 (2026-08-18) — `EquippableItemCard` e tipo `EquippableItem` con test.
- **Evidence:** `test-results/hero-components-cde-2026-08-18.md`
- **Open:** schema Zod in `IdleVillageConfig` e registry verranno aggiunti quando il dominio sarà congelato.
- **Goal:** card modello per oggetti equip (arma, amuleto, armatura).
- **Input:** nuovo `EquippableItemSchema` in `IdleVillageConfig`; `itemCardSkinConfig`.
- **Output:** `EquippableItemCard` + icona placeholder; `EquippableItemRegistry`.
- **Open decisions:** rarità, tier, effetti numerici vs stat tags.
- **Verifiable result:** card rendera con icona placeholder ed effetti da config.

### 5.4 — Sub-Plan D: Oggetti consumabili (ConsumablePile)

- **Status:** Completato placeholder v1 (2026-08-18) — `ConsumablePile` e tipo `ConsumableItem` con test.
- **Evidence:** `test-results/hero-components-cde-2026-08-18.md`
- **Open:** schema Zod e integrazione con `QuestChronicle` in fase successiva.
- **Goal:** mazzo di consumabili spendibili pre-quest e/o in quest.
- **Input:** `ConsumableItemSchema`; `QuestChronicle` come consumer primario.
- **Output:** `ConsumablePile` in un `InventoryStrip` placeholder; `ConsumableItemCard`.
- **Open decisions:** uso pre-quest only (come v3/v4) vs inventario globale; stacking vs singole card.
- **Verifiable result:** test di consumo in `QuestChronicle` e aggiornamento inventario.

### 5.5 — Sub-Plan E: Skill da equippare (SkillDeck / SkillSlot)

- **Status:** Completato placeholder v1 (2026-08-18) — `SkillDeck` con `useSkillLoadout` e test.
- **Evidence:** `test-results/hero-components-cde-2026-08-18.md`
- **Open:** schema `EquippableSkill` e effetti sullo skill check quando `DestinyAstrolabeV1` espone l'API.
- **Goal:** deck di skill che si equipaggiano sul PG e influenzano gli skill check.
- **Input:** `EquippableSkillSchema`; `DestinyAstrolabeV1` come resolver.
- **Output:** `SkillDeck`, `SkillSlot`, `useSkillLoadout`.
- **Open decisions:** skill come oggetti-card o come unlock permanenti; come modificano i check (bonus stat, extra dado, threshold).
- **Verifiable result:** test che un’equipaggiata skill modifica il calcolo dello skill check.

---

## 6. Integration surface

- `HeroComponentsLabPage` (route `/hero-components-lab`) per isolare e testare i placeholder. **Stato:** creato, raggiungibile dal `/test-hub`, e collegato a `ResidentState` via `useResidentHeroState` con persistenza `PersistenceService`.
- Integrazione in `MinimalGameplayPage` solo dopo che i sub-plan A–E sono verdi.
- Layout di riferimento: `InventoryStrip` laterale + `PgCard` flottante, coerente con `DESIGN_PILLARS.md` §R1.1 e §R3.4.

---

## 7. Execution order

1. **Sub-Plan A** (`PgCard`) — definisce il contratto del PG.
2. **Sub-Plan B** (`EquipSlotRack`) — dipende dal contratto slot di A.
3. **Sub-Plan C** (`EquippableItemCard`) — fornisce le card per B.
4. **Sub-Plan D** (`ConsumablePile`) — può girare in parallelo a B/C.
5. **Sub-Plan E** (`SkillDeck`) — dipende dal contratto skill check esistente.
6. **Integration** — `HeroComponentsLabPage` e merge in `MinimalGameplayPage`.
7. **Evidence log** — `test-results/idle-village-hero-components-placeholder/`.

---

## 8. Open decisions to freeze before execution

- 8.1 Personaggio: pannello flottante o pagina dedicata?
- 8.2 Equip: drag/click, permanenza per run o modificabile a piacere?
- 8.3 Consumabili: inventario globale o solo pre-quest?
- 8.4 Skill: card-equipaggiabili o unlock permanenti?
- 8.5 Dove collocare `HeroComponentsLabPage` rispetto a `/design-system` e `/minimal-gameplay`?

---

## 9. Success criteria (final, measurable)

Alla chiusura del piano ombrello:

1. `npm run build:check`, `npm run lint -- <scope>`, `npm run test -- <scope>` passano.
2. I 5 placeholder componenti sono montabili in `HeroComponentsLabPage`.
3. Ogni componente ha i18n, skin tokens e almeno un test RTL.
4. I contratti dati sono documentati in JSDoc e non contengono valori hardcoded.
5. Gli evidence log sono in `test-results/idle-village-hero-components-placeholder/`.
