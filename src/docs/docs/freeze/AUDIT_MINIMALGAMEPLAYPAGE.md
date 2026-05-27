# Audit: `MinimalGameplayPage.tsx` — Mappa "linea → ruolo" per kit basati su reference `/minimal-gameplay`

**Author:** Wave 1 Day 6
**Date:** 2026-05-21
**Source file:** `src/ui/idleVillage/MinimalGameplayPage.tsx` (862 righe)
**Purpose:** Identificare per ciascun kit il **subtree esatto** del rendering canonico per i kit che usano `MinimalGameplayPage` come reference invece di `TestRosterPage`.

---

## 1. Sintesi (per la decisione veloce)

Tre risultati importanti per la pianificazione di Wave 1:

1. **`MinimalGameplayPage` NON renderizza `ActivityCapsule` o `ActiveHUD`**. Questi componenti sono importati ma non usati nel render. I kit `activityKit` e `hudKit` non possono usare `MinimalGameplayPage` come reference. Devono trovare un'altra reference (probabilmente pagine `minimal-*` esistenti che li usano).
2. **`ClockWidget` è renderizzato ma senza `data-testid`**. Linea 493-503. Deve essere aggiunto un `data-testid` per il contract test del `clockKit`.
3. **`ResourcePanel` è renderizzato ma senza `data-testid`**. Linea 459-476. Deve essere aggiunto un `data-testid` per il contract test del `resourceHudKit`.

---

## 2. Struttura del file (mappa "blocchi → linee")

```
MinimalGameplayPage.tsx (862 righe)
│
├── 1–38     Imports
│             ├── canonical components (ClockWidget, ResourcePanel, VillageRosterSection, ResidentSlotRack, SlotRackWithSkin, DayNightPOI)
│             ├── hooks canonici (useVillageResidents, useMinimalGameplay, useResidentDropValidation, useCentralizedTiming)
│             └── config canonici (DEFAULT_IDLE_VILLAGE_CONFIG, MINIMAL_GAMEPLAY_CONFIG)
│
├── 39–76    JSDoc + layout documentation
│
├── 78–100   Component initialization (theme, config, state)
│
├── 101–200  State management (selectedPOI, isDetailOpen, sortMode, etc.)
│
├── 201–300  Event handlers (handlePOIClick, handleBuyFood, etc.)
│
├── 301–400  POI handlers for ActivityCapsule (commented, not rendered)
│             ⚠️ ActivityCapsule importato ma NON renderizzato
│
├── 401–439  Drag handling + overlay
│
└── 440–862  Render JSX principale
              │
              ├── 440  <div data-testid="minimal-gameplay-page">  ← ROOT con testid
              │
              ├── 442–453  StyleLaboratoryPanel (collapsible)    ← UI di test harness (NON parte del subtree canonico)
              │
              ├── 456–478  ResourcePanel                         ← ★ CONTRACT SURFACE resourceHudKit (manca testid)
              │
              ├── 481–549  Time Engine Controls
              │   ├── 483–488  Header (Day/Night indicator)
              │   ├── 493–503  ClockWidget                         ← ★ CONTRACT SURFACE clockKit (manca testid)
              │   ├── 507–535  Time controls (Day, Tick, Cycle, Pause, Reset)
              │   └── 538–546  DayNightPOI                         ← ★ CONTRACT SURFACE dayNightKit (testid: day-night-poi-skin)
              │
              ├── 552–564  ActionToolbar                          ← UI di test harness (NON parte del subtree canonico)
              │
              ├── 567–578  VillageRosterSection                    ← ★ CONTRACT SURFACE rosterKit (già certificato)
              │
              ├── 581–623  Available Activities
              │   ├── 586  SlotRackWithSkin                        ← ★ CONTRACT SURFACE slotRackKit (manca testid su wrapper)
              │   └── 594  ResidentSlotRack                        ← ★ CONTRACT SURFACE slotRackKit (testid: resident-slot-rack-root)
              │
              └── 626–862  POI Detail Panel                        ← UI di test harness (NON parte del subtree canonico)
```

---

## 3. Mappa kit → contract surface (MinimalGameplayPage)

| Kit | Reference route | Subtree selector | Status |
|---|---|---|---|
| `clockKit` | `/minimal-gameplay` (MinimalGameplayPage L493) | `[data-testid="clock-widget"]` (da aggiungere) | ⚠️ MISSING testid |
| `resourceHudKit` | `/minimal-gameplay` (MinimalGameplayPage L459) | `[data-testid="resource-panel"]` (da aggiungere) | ⚠️ MISSING testid |
| `dayNightKit` | `/minimal-gameplay` (MinimalGameplayPage L542) | `[data-testid="day-night-poi-skin"]` | ✅ EXISTS |
| `slotRackKit` | `/minimal-gameplay` (MinimalGameplayPage L586) | `[data-testid="slot-rack-with-skin"]` (da aggiungere) + `[data-testid="resident-slot-rack-root"]` | ⚠️ MISSING testid su wrapper |
| `activityKit` | **TBD** (NOT in MinimalGameplayPage) | TBD | ❌ NOT FOUND |
| `hudKit` | **TBD** (NOT in MinimalGameplayPage) | TBD | ❌ NOT FOUND |

---

## 4. Provider chain

```
MinimalGameplayPage (mount point /minimal-gameplay)
│
└── (No explicit provider chain in render)
    ⚠️ Differente da TestRosterPage che ha SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext
```

**Implicazione:** I kit basati su `MinimalGameplayPage` potrebbero richiedere una provider chain diversa da quelli basati su `TestRosterPage`. Da auditare.

---

## 5. Componenti NON renderizzati (ma importati)

- **ActivityCapsule**: Importato (linea ?) ma NON renderizzato. Commentato nelle linee 301-308.
- **ActiveHUD**: NON importato, NON renderizzato.

**Implicazione:** `activityKit` e `hudKit` non possono usare `MinimalGameplayPage` come reference. Devono trovare un'altra reference (probabilmente pagine `minimal-*` esistenti).

---

## 6. Prerequisiti per Wave 1

### 6.1 Aggiungere data-testid mancanti

1. **ClockWidget** (linea 493): Aggiungere `data-testid="clock-widget"`
2. **ResourcePanel** (linea 459): Aggiungere `data-testid="resource-panel"`
3. **SlotRackWithSkin** (linea 586): Aggiungere `data-testid="slot-rack-with-skin"`

### 6.2 Trovare reference per activityKit e hudKit

- `activityKit`: Trovare pagina che renderizza `ActivityCapsule` (probabilmente `minimal-activity` o `MinimalGameplayPage` in una versione diversa)
- `hudKit`: Trovare pagina che renderizza `ActiveHUD` (probabilmente `minimal-hud` o `MinimalGameplayPage` in una versione diversa)

### 6.3 Audit provider chain

- Verificare se i kit basati su `MinimalGameplayPage` richiedono la stessa provider chain di `TestRosterPage`
- Se no, aggiungere provider chain opzionale a `contract.ts`

---

## 7. Conclusioni

Wave 1 Day 6 audit completato. Output:

1. **MinimalGameplayPage NON è reference universale** come TestRosterPage. Non renderizza ActivityCapsule o ActiveHUD.
2. **3 data-testid mancanti** da aggiungere (ClockWidget, ResourcePanel, SlotRackWithSkin).
3. **activityKit e hudKit** richiedono reference diversa da MinimalGameplayPage.
4. **Provider chain diversa** da TestRosterPage (da auditare).

Wave 1 Week 2 (kit basati su MinimalGameplayPage) richiede questi prerequisiti prima di procedere.
