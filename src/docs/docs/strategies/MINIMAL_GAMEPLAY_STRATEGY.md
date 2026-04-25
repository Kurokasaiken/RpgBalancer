# Strategy: Minimal Gameplay Vertical Slice (The "Turbo" Workflow)

Documento di riferimento per l'implementazione della demo minima. Definisce il protocollo di sviluppo per la pagina `/minimal-gameplay` con l'obiettivo di validare il loop principale con iterazioni rapide e controllo qualità mirato.

---

## 🎯 Obiettivo Strategico

Creare una vertical slice giocabile che dimostri il ciclo completo:

1. **Assegnazione (Drag)**
2. **Attesa (Timer)**
3. **Guadagno (Reward)**
4. **Sopravvivenza (Food/Fatigue)**

**Philosophy:** *Logic First, UI Second, E2E Last.* Prima si blinda la matematica, poi la UI, infine i test end-to-end quando l'interfaccia è stabile.

---

## 🛠 Protocollo di Sviluppo (5 Fasi)

### FASE 1 – Il Cervello (Pure Logic & Rules)
- **Obiettivo:** Definire la matematica fuori da React.
- **File:**
  - `src/balancing/config/idleVillage/minimalConfig.ts`
  - `src/engines/minimalGameRules.ts`
- **Regole:**
  - Input: stato attuale + `deltaTime`.
  - Output: nuovo stato (Gold, Food, Fatigue).
  - **Testing:** Vitest immediato su `minimalGameRules.ts` (es. `expect(calculateTick({ gold: 0, job: 'active' })).toStrictEqual({ gold: 5, ... })`).
  - **Vietato:** Importare React o hook.

### FASE 2 – Lo Scheletro (React Wireframe)
- **Obiettivo:** Collegare logica e stato senza grafica.
- **File:**
  - `src/store/useMinimalGameplay.ts` (Zustand store che usa le regole della fase 1)
  - `src/ui/idleVillage/MinimalGameplayPage.tsx`
- **UI:** `<div>` e `<button>` nativi; niente CSS.
- **Verifica:** Un bottone "Tick" aggiorna i numeri secondo i test di fase 1.

### FASE 3 – I Muscoli (UI Polish & Components)
- **Obiettivo:** Applicare design system e interazioni.
- **Azioni:**
  - Sostituire i wireframe con `WorkerCard` e `ActivitySlot`.
  - Implementare `@dnd-kit/core` (mouse + touch sensor con delay).
  - Collegare `dropFeedbackConfig.ts`.
  - **Feedback:**
    - Valid → bloom verde.
    - Invalid → shake rosso.
- **Verifica:** Il prototipo deve sembrare un prodotto finito, anche se mal bilanciato.

### FASE 4 – L'Anima (Manual Playtesting)
- **Obiettivo:** Cercare il divertimento tramite gioco manuale.
- **Azioni:**
  - Iterare sui valori in `minimalConfig.ts` (timer, costi, reward).
  - **Vietato:** Scrivere test automatici per feature ancora fluide.

### FASE 5 – L'Armatura (The "Ice" Rule - E2E Lock)
- **Obiettivo:** Congelare la build stabile.
- **Regola:** Scrivere test Playwright **solo** quando l'UI è stabile per ≥48h.
- **Test:**
  - Funzionali (drag → wait → verifica gold).
  - Visual regression (screenshot) solo ora.

---

## 📋 Task List per lo Strategist

1. **[TASK-001] Logic Core** – Implementare `minimalConfig` + `minimalGameRules` con Vitest 100% (no React).
2. **[TASK-002] State & Wireframe** – Creare `useMinimalGameplay` + pagina `/minimal-gameplay` grezza e collegare il loop temporale.
3. **[TASK-003] UI Integration** – Sostituire il wireframe con `WorkerCard`/`ActivitySlot`, integrare drag & drop reale.
4. **[TASK-004] Visual Feedback** – Collegare stati valid/invalid/warning alle animazioni CSS/config.
5. **[TASK-005] Final Polish** – Aggiungere HUD stilizzato, log eventi e game over modal.
6. **[TASK-006] E2E Safeguard** – Solo a UI definitiva: test Playwright happy path.

---

## ⚠️ Vincoli Tecnici

- **State Management:** Zustand (`useGameplayStore` o slice dedicato).
- **Drag & Drop:** `@dnd-kit/core` con sensori mouse + touch (delay configurato).
- **Time Management:** Il loop deve fermarsi quando la tab perde focus (es. `requestAnimationFrame` o visibility API).
- **Persistenza:** Usare `PersistenceService` per salvare lo stato su cambio pagina/unload.

---

## 📌 Note Operative

- Evitare over-engineering automatizzando i test solo quando la UI è stabile.
- Applicare la filosofia config-first: nessun numero magico dentro i componenti.
- Telemetria e HUD vanno introdotti nella fase polish, mai prima.
