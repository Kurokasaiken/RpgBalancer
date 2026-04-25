# 🔧 Tasks: Balancer UI Fixes

**Parent Plan:** [balancer_ui_fix_plan.md](balancer_ui_fix_plan.md)
**Status:** ✅ Completed

---

## Phase 1: Fix Critici (Reset & Import/Export)

- [x] **Reset Stat Funzionante**
  - [x] In `ConfigurableStat.tsx`, collegare `onReset` per aggiornare `mockValue` al valore di default.
  - [x] Verificare che il click su ↺ ripristini il valore numerico corretto.
- [x] **Reset Card Funzionante**
  - [x] In `ConfigurableCard.tsx`, collegare il pulsante ↺ alla prop `onResetCard`.
  - [x] In `Balancer.tsx`, passare la funzione `resetCardToInitial` come `onResetCard`.
  - [x] **Fix Added:** Ensure `simValues` are also reset.
- [x] **Reset Page Funzionante**
  - [x] In `ConfigToolbar.tsx`, collegare "Reset Defaults" a `resetToInitialConfig`.
- [x] **Fix Import Formule**
  - [x] Creare config di test con formula derivata.
  - [x] Esportare config → ispezionare JSON (campo `formula` e `isDerived` devono esserci).
  - [x] Se mancano, fixare `exportConfig` in `BalancerConfigStore.ts`.
  - [x] Importare config → verificare che la stat torni derivata.
  - [x] Se diventa statica, fixare `importConfig` in `BalancerConfigStore.ts`.
  - [x] **Fix Added:** Flush `simValues` on import to prevent stale overrides.
- [x] **Fix Export/Import Actions**
  - [x] In `ConfigToolbar.tsx`, aggiungere feedback visivo (toast/alert) su successo/errore export.
  - [x] In `ConfigToolbar.tsx`, aggiungere feedback visivo su successo/errore import.
  - [x] Verificare che il download parta effettivamente.

## Phase 2: UX Pulsanti & Layout

- [x] **Riordino Pulsanti Card**
  - [x] In `ConfigurableCard.tsx`: Spostare 🗑 (Elimina) a sinistra.
  - [x] In `ConfigurableCard.tsx`: Spostare 👁 (Occhio) tutto a destra.
  - [x] Sequenza desiderata: `[Elimina] ...titolo... [Reset] [Edit] [Occhio]`.
- [x] **Stile Pulsante Elimina**
  - [x] In `ConfigurableCard.tsx`, applicare classi `rounded-full bg-red-900/40 border border-red-500/70 hover:bg-red-900/60` (come nelle stat).
- [x] **Riordino Pulsanti Stat**
  - [x] In `ConfigurableStat.tsx`: Assicurare che 👁 sia l'ultimo a destra.
- [x] **Dimensione Lock**
  - [x] In `ConfigurableStat.tsx`, cambiare dimensione icona lock a `text-sm` o usare emoji più piccola/uniforme (Standardized to Lucide icons).

## Phase 3: Funzionalità Mancanti (Lock & Hide)

- [x] **Implementare Lock**
  - [x] In `StatDefinition` (types.ts), aggiungere field opzionale `locked?: boolean` (Existing).
  - [x] In `ConfigurableStat.tsx`, gestire stato `locked`.
  - [x] Visual: usare 🔓 (unlocked) e 🔐 (locked). Colore rosso/grigio se locked.
  - [x] Logic: se locked, inputs e slider `disabled={true}`.
- [x] **Implementare Hide (Stat)**
  - [x] Aggiungere stato locale `isHidden` (Handled by parent/props).
  - [x] Se hidden: mostrare solo riga compatta (Nome .......... Valore). Nascondere slider e controlli edit.
  - [x] Icona cambia da 👁 a "Occhio Sbarrato" (o opacity reduced).
- [x] **Implementare Hide (Card)**
  - [x] Aggiungere stato locale `isCollapsed` (Handled via Config toggle `isHidden`).
  - [x] Se collapsed: mostrare solo header. `CardWrapper` implementation uses global "Hidden Cards" toolbar.

## Phase 4: Verifica Finale

- [x] **Manual Test Run**
  - [x] Caricare pagina Balancer.
  - [x] Modificare valori.
  - [x] Reset Stat → OK.
  - [x] Reset Card → OK.
  - [x] Reset Page → OK.
  - [x] Lock stat → non modificabile.
  - [x] Hide card → si contrae.
  - [x] Export → save JSON.
  - [x] Refresh pagina.
  - [x] Import JSON → torna come prima (verified code logic).
