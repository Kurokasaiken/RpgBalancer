---
status: active
owner: RPG Team
last_reviewed: 2026-07-10
description: Catalogo delle pagine validate (e draft) nel /test-hub di Idle Village, con route, scopo e relazioni.
---

<!-- markdownlint-disable MD013 -->

# Idle Village Test Hub — Catalogo Pagine

Questo documento elenca le pagine raggiungibili da `/test-hub` con il loro stato di validazione, il ruolo che svolgono e le relazioni con le altre pagine di test. La fonte di verità viva è `src/ui/idleVillage/TestHub.tsx`, che genera la griglia a partire da `KIT_REGISTRY` + `EXTRA_PAGES`.

---

## 1. Entry point del test environment

| Route | Titolo | File | Scopo |
| --- | --- | --- | --- |
| `/test` | **Slot Lab** / Test Harness | `src/ui/idleVillage/TestRosterPage.tsx` | Pagina di riferimento canonica per L0-L2 e POI detail. Contiene tutti i kit certificati in un'unica superficie e viene usata dai contract sweep. |
| `/test-hub` | **Test Hub** | `src/ui/idleVillage/TestHub.tsx` | Griglia di navigazione che genera le card a partire dal registry. È l'entry point visivo per tutte le pagine di test. |

---

## 2. Legenda stato

- `ok` — pagina validata. In `TestHub` viene mostrata con bordo verde/ambra.
  - Deriva da un kit con `status: 'certified'`.
  - Oppure è una pagina `EXTRA_PAGES` esplicitamente marcata `ok`.
- `needs-refactor` — pagina presente in `/test-hub` ma non ancora certificata. In `TestHub` ha bordo rosso e badge "Da rifare".
  - Deriva da un kit con `status: 'draft'`.

---

## 3. Pagine validate (status `ok`)

| Route | Titolo | File | Livello | Cosa fa | Componenti / Kit principali |
| --- | --- | --- | --- | --- | --- |
| `/slot` | Slot | `src/ui/idleVillage/pages/SlotPage.tsx` | **L0** | Single slot: incastonamento PgCard, estrazione press-and-hold, bloom valid/invalid. | `SlotV12Renderer`, `PgCard`, `useExtractionSequence`, `useDragOutcome`, `bloomEffect` |
| `/minimal-roster` | Roster | `src/pages/minimal-roster.tsx` | **L1** | Roster isolato: sort, filter, drag. | `rosterKit` (`RosterDraggable`) |
| `/minimal-slotRack` | SlotRack | `src/pages/minimal-slotRack.tsx` | **L1** | Slot rack isolato con dati di fixture. | `slotRackKit` (`ResidentSlotRackSkin`) |
| `/minimal-poi` | POI Ecosystem | `src/pages/minimal-poi.tsx` | **L1** | Showcase dei medaglioni POI (Day/Night, Job, Quest, Activity). | `poiKit` (`DayNightPoiSkin`, `GenericPoiSkin`, `JobPOI`, `QuestPOI`) |
| `/minimal-clock` | Clock | `src/pages/minimal-clock.tsx` | **L1** | Orologio giorno/notte e `TimeEngineStrip`. | `clockKit` (`TimeEngineStrip`, `DayNightPoiSkin`) |
| `/minimal-destiny-astrolabe` | Destiny Astrolabe | `src/pages/minimal-destiny-astrolabe.tsx` | **L1** | Skill check D100 con fisica della palla e verdicti cinematici. | `destinyAstrolabeKit` (`DestinyAstrolabe`) |
| `/minimal-quest-detail` | Quest Chronicle | `src/ui/idleVillage/MinimalQuestDetailPage.tsx` | **L1/L2** | Dettaglio quest con fasi, progress bar, esito finale e AltVisuals. | `QuestChronicle`, `QuestPowerEngine` |
| `/minimal-roster-slot-integration` | Roster + Slot Rack | `src/pages/minimal-roster-slot-integration.tsx` | **L2** | Integrazione Roster + SlotRack, slot config-driven, infiniti, scroll. | `rosterKit`, `slotRackKit`, `WanderlustSurface`, `useResidentSlotController` |
| `/minimal-job-poi-roster-integration` | POI + Roster Integration | `src/pages/minimal-job-poi-roster-integration.tsx` | **L3/L4** | Esempio di interazione: click sul POI apre/chiude **solo il POI detail** (slot rack visibile solo dentro il detail, mai come pannello standalone). | `rosterKit`, `slotRackKit`, `poiKit`, `JobPOI`, `WanderlustSurface` |
| `/minimal-job-poi-roster-time-integration` | POI + Roster + Time | `src/pages/minimal-job-poi-roster-time-integration.tsx` | **L4** | Aggiunge il ciclo giorno/notte e lo stato del lavoro all'integrazione L3/L4. | `poiKit`, `rosterKit`, `clockKit` |
| `/poi-detail-verification` | POI Detail | `src/ui/idleVillage/pages/PoiDetailVerificationPage.tsx` | **L2+** | Verifica del pannello dettaglio POI con `ActivityCapsuleDetailSkinAware` e slot mock. | `ActivityCapsuleDetailSkinAware`, `GenericPoiSkin` |
| `/poi-quest-detail-roster-integration` | Quest POI Detail + Roster | `src/ui/idleVillage/pages/PoiDetailQuestRosterIntegrationPage.tsx` | **L4** | POI quest reale con roster draggabile e slot rack interattivo da `useResidentSlotController`. | `rosterKit`, `slotRackKit`, `poiKit`, `ActivityCapsuleDetailSkinAware` |
| `/poi-job-detail-roster-integration` | Job POI Detail + Roster | `src/ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage.tsx` | **L4** | POI job reale con roster draggabile e slot rack interattivo da `useResidentSlotController`. | `rosterKit`, `slotRackKit`, `poiKit`, `ActivityCapsuleDetailSkinAware` |
| `/skin-sandbox` | V8 Skin Sandbox | `src/pages/v8-skin-sandbox.tsx` | **L1** | Playground per V8 Material Layer Engine e `WanderlustSurface`. | `WanderlustSurface`, `InsetPanel`, `MATERIAL_PRESETS` |
| `/v9-skin-sandbox` | V9 Skin Sandbox | `src/pages/v9-skin-sandbox.tsx` | **L1** | Playground per V9 skin Explorer Journal. | `V9GlassLayers`, `WanderlustSurface`, generic tokens |
| `/spell-creator` | Spell Creator (Default Skin) | `src/pages/spell-creator.tsx` | **L1** | Spell Creator con default skin system, i18n, e async persistence. | `SpellCreatorTestPage`, `EnhancedStatSlider`, `GlassCard`, `GlassButton` |

---

## 4. Pagine in draft (status `needs-refactor` in `/test-hub`)

| Route | Titolo | File | Stato | Note |
| --- | --- | --- | --- | --- |
| `/minimal-resourcehud` | Resource HUD | `src/pages/minimal-resourcehud.tsx` | draft | Pannello risorse (gold, wood, food, iron) |
| `/minimal-questcard` | QuestCard | `src/pages/minimal-questcard.tsx` | draft | Card quest con risk stripes, countdown, halo |
| `/minimal-outcome` | Outcome Modal | `src/pages/minimal-outcome.tsx` | draft | Modale risultato dopo skill check |
| `/minimal-market` | Market | `src/pages/minimal-market.tsx` | draft | Card mercato per trading/acquisti |
| `/minimal-integration-quest-flow` | Quest Flow Integration | `src/pages/minimal-integration-quest-flow.tsx` | draft | Flusso QuestCard → SkillCheck → Outcome |

---

## 5. Mappa delle interazioni

```text
/test (Slot Lab — reference harness)
  │
  ├─ /slot ........ L0 single slot (SlotV12Renderer, bloom, extraction)
  ├─ /minimal-roster ............ L1 roster isolato
  ├─ /minimal-slotRack .......... L1 slot rack isolato
  │
  └─ /minimal-roster-slot-integration ...... L2 roster + slot rack
          │
          ├─ /minimal-job-poi-roster-integration ......... L3/L4 + POI proxy (click → POI detail only)
          │       └─ /minimal-job-poi-roster-time-integration  L4 + day/night
          │
          ├─ /poi-detail-verification ......... L2+ dettaglio POI in isolamento
          ├─ /poi-quest-detail-roster-integration ... L4 dettaglio POI quest + slot rack reale
          └─ /poi-job-detail-roster-integration ... L4 dettaglio POI job + slot rack reale

/test-hub (navigazione)
  ├─ Componenti isolate L1 ........... /minimal-poi, /minimal-clock, /minimal-destiny-astrolabe, /minimal-quest-detail
  ├─ Integrazioni L2-L4 .............. /minimal-roster-slot-integration, /minimal-job-poi-roster-integration, ecc.
  ├─ Skin playground ................. /skin-sandbox, /v9-skin-sandbox
  └─ Draft ........................... /minimal-resourcehud, /minimal-questcard, /minimal-outcome, /minimal-market, /minimal-integration-quest-flow
```

### Flussi di dipendenza

1. **L0 → L1 → L2**
   - `/slot` certifica il comportamento single-slot (incastonamento, estrazione, bloom).
   - `/minimal-roster` e `/minimal-slotRack` isolano i due kit principali.
   - `/minimal-roster-slot-integration` combina i due kit senza re-implementare la logica di drag.

2. **L2 → L3/L4**
   - `/minimal-job-poi-roster-integration` aggiunge `JobPOI` come proxy del primo slot compatibile: drop sul medaglione equivale a drop sullo slot.
   - **Click sul POI**: apre/chiude **solo il POI detail**; lo slot rack è visibile solo dentro il detail e non deve mai apparire come pannello standalone. Questa pagina è un esempio di interazione, non uno schermo di produzione.

3. **L4 + Time**
   - `/minimal-job-poi-roster-time-integration` riusa i componenti POI + roster e aggiunge `DayNightPoiSkin`/`TimeEngineStrip` per il ciclo temporale.

4. **POI Detail**
   - `/poi-detail-verification` isola il pannello dettaglio con slot mock.
   - `/poi-quest-detail-roster-integration` collega il pannello a un POI quest reale e a un roster draggabile.
   - `/poi-job-detail-roster-integration` collega il pannello a un POI job reale e a un roster draggabile.

5. **Skin / Visual**
   - `/skin-sandbox` e `/v9-skin-sandbox` sono standalone; forniscono i token/materiali (`WanderlustSurface`, `V9GlassLayers`) usati dalle pagine L1-L4.

6. **Tutte le pagine L2-L4**
   - Condividono `useDragOutcome`, `useExtractionSequence`, `bloomEffect`, `CustomDragOverlay`/`WanderlustMedalOverlay`.
   - Usano `WanderlustSurface` per il pannello bronze e `useResidentSlotController` per la derivazione config-driven degli slot infiniti.

---

## 6. Come mantenere aggiornato questo catalogo

- Quando si aggiunge una pagina a `/test-hub`, aggiornare `src/ui/idleVillage/TestHub.tsx` (aggiungere la entry a `KIT_REGISTRY` o `EXTRA_PAGES`).
- Quando una pagina passa da `draft` a `certified`, spostarla dalla tabella "Draft" a quella "Validate".
- Quando il livello di integrazione cambia, aggiornare la colonna **Livello**.
- Quando una pagina viene rimossa, eliminarla da entrambe le tabelle.

---

## 7. Riferimenti utili

- `src/ui/idleVillage/TestHub.tsx` — generazione della griglia
- `src/ui/idleVillage/frozen/registry.ts` — registry dei kit con stato e metadata
- `src/App.tsx` — mappa route → componenti
- `src/docs/docs/idle_village/interaction_core_spec.md` — protocolli di drag, flight, estrazione, bloom
- `src/docs/docs/idle_village/INTEGRATION_TEST_PAGE_GUIDE.md` — guida alla creazione di nuove pagine di integration test
