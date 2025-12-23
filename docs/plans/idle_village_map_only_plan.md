# Master Plan: Idle Village "Gilded Heroism" (v2.0)

## 1. Visione Filosofica del Progetto

Il gioco è un **"Hero Generator" basato sul sacrificio**.

- **Macro-Economia:** i *Rookie* (carne da macello) automatizzano la produzione tramite Job infiniti.
- **Micro-Strategia:** gli *Eroi* nascono sopravvivendo a Quest uniche ad alto rischio.
- **UI/UX:** passaggio fluido da **Simbolo (Mappa)** → **Contesto (Theater View)** → **Dettaglio (Dossier)**.

## 2. Architettura dei Dati (Data Model)

### 2.1 ResidentState (L'Entità)

Ogni residente deve evolvere: non è una semplice lista di statistiche, ma una storia di sopravvivenza.

- `isHero` (boolean): flag che sblocca bordi dorati, priorità nel roster e bonus statistici.
- `survivalScore` (number): contatore di "Trial of Fire" superati.
- `currentHp` / `maxHp`: risorsa binaria. A 0 il personaggio viene rimosso o diventa un "Cadavere" nello slot.
- `isInjured`: debuff che dimezza l'efficienza e richiede riposo/ospedale.

### 2.2 ScheduledActivity (L'Azione)

- `isAuto` (boolean): se true, il motore re-instanzia l'attività appena finisce (se il residente ha fatica < MAX).
- `resolutionRiskSnapshot`: calcolato all'ultimo secondo del timer (considerando spell/consumabili attivi in quel momento) e usato per il bonus eroismo.

## 3. Gerarchia UI e Flussi di Visualizzazione

Il sistema gestisce la densità informativa tramite **Rivelazione Progressiva**:

| Livello | Componente | Scopo | Visualizzazione |
| --- | --- | --- | --- |
| 0 | GlobalMap Page | Navigazione e ciclo giorno/notte | Mappa con icone distanziate |
| 1 | MarkerMapSlot (chiuso) | Alert e urgenza | Unico halo colorato (priorità alla scadenza più vicina) |
| 2 | ContextTheater View | Gestione del luogo | Panorama 21:9 + fila orizzontale di VerbCard (medaglioni) |
| 3 | FocusVerb Detail (Dossier) | Micro-management | Card esplosa con slot, requisiti e Risk Stripe dettagliata |

## 4. Meccaniche Core: Specifiche Tecniche

### 4.1 Bloom Reveal (Interaction)

- **Trigger:** mouse-over prolungato o ingresso di un ResidentToken nel raggio del luogo.
- **Effetto:** il marker del luogo si espande lateralmente rivelando la Theater View.
- **Logica di drop:** il giocatore rilascia il token faccia direttamente sul medaglione all'interno della Theater View.

### 4.2 Trial of Fire (Heroism Engine)

Alla risoluzione di una Quest (non di un Job):

1. **Check sopravvivenza:** tiro di dado contro % morte.
2. **Calcolo valore:** `Bonus = Rischio alla Risoluzione × Moltiplicatore Difficoltà`.
3. **Promozione:** se il residente sopravvive a un rischio > 30%, riceve il tratto "Eroe" e un aumento permanente delle stat primarie.

### 4.3 Roster Sidebar (Management)

- **Statico:** card compatta (HP bar, fatigue bar, icona ruolo).
- **Filtri:** `[Tutti] [Eroi] [Carne da Macello] [Feriti]`.
- **Drag logic:** a `onDragStart` la card resta in sidebar, ma il cursore trasporta solo l'orb circolare con il volto (token).

## 5. Strategia di Testing e Validazione (QA)

### 5.1 Test Unitari (Logica)

- `TrialOfFire_Calculation`: verificare che il bonus sia proporzionale al rischio al momento del tick finale, non dell'assegnazione.
- `AutoJob_Loop`: verificare che se un residente sviene per fatica, il Job `isAuto` si interrompa correttamente senza uccidere il residente.

### 5.2 Test UI (Playwright/Vitest)

- `Bloom_Expansion_Test`: il luogo deve aprirsi correttamente solo se il trascinamento è sopra il suo perimetro.
- `DragImage_Conversion`: verificare che `setDragImage` trasformi correttamente la card della sidebar in un token circolare durante il movimento.
- `Priority_Glow_Test`: se in un luogo ci sono 3 attività, l'halo sulla mappa deve riflettere il colore di quella con meno tempo rimanente.

---

## 6. Integrazione con gli altri Implementation Plan

Questa sezione consolida i piani precedenti: quando emergono conflitti, prevalgono le regole del presente **Master Plan v2.0**.

### 6.1 Phase 12 – Idle Incremental RPG (loop completo)

- Manteniamo i pilastri “Config-First”, “High Risk / High Reward” e “Worker Placement & Time as Resource” descritti nel piano Phase 12 @docs/plans/idle_village_plan.md#14-214.
- I sottosistemi 12.1–12.10 restano validi come backlog tecnico: Time & Activity Engine, Jobs/Quests, Combat integration, Economy e UI/HUD verranno orchestrati per supportare Bloom Reveal + Theater View senza duplicare logiche nella UI.
- Success criteria della Phase 12 (loop completo giocabile, feriti utili, suite di test) sono ora KPI di questo Master Plan @docs/plans/idle_village_plan.md#255-307.

### 6.2 FTUE & First 60 Minutes

- La timeline FTUE (0–60 min) rimane il canovaccio per run iniziale, injury guidata e meta-upgrade rapido @docs/plans/idle_village_ftue_plan.md#22-135.
- L’implementazione Bloom/Theater deve assicurare hook di tutorial leggeri: primo job entro 30 secondi, injury controllata 15–30 min, mini-collasso e meta shop entro 60 min @docs/plans/idle_village_ftue_plan.md#180-227.
- Config preset per FTUE (popolazione iniziale, jobs sicuri, quest “cittadina sui ratti”) diventano parte delle snapshot config lette dalla UI.

### 6.3 Art Style & Visual Direction

- Il mood “grim cozy” e il rispetto della palette Gilded Observatory sono vincolanti per Theater View, VerbCard medaglioni e RosterSidebar @docs/plans/idle_village_art_style_plan.md#8-176.
- Vista top-down stilizzata, silhouettes distinte (Founder, Worker, Ferito, Morto) e uso coerente di accenti oro/teal devono riflettersi nei nuovi token e panorami.

### 6.4 Trial of Fire & Heroism

- Le estensioni di `ResidentState`, `ScheduledActivity` e le regole Trial of Fire/auto-loop sono recepite integralmente: `survivalCount`, `isHero`, `snapshotDeathRisk`, `isAuto`, curve `calculateSurvivalBonus`, auto-scheduling con check fatica @docs/plans/idle_village_trial_of_fire_plan.md#26-167.
- RosterSidebar + TheaterView sono gli shell principali per visualizzare hero halos, filtri `[Tutti, Eroi, Carne da Macello, Feriti]` e CTA di raccolta/auto-loop.

### 6.5 VerbCard, Map Editor e Map Rebuild

- Il refactor VerbCard garantisce single source of truth (`VerbSummary`, `MapSlotVerbCluster`, HUD compatto) e resta la pipeline dati per qualsiasi visualizzazione @docs/plans/idle_village_verbcard_refactor_plan.md#8-135.
- Il Map Editor plan rimane la guida per editing layout/tag direttamente dal tab Activities, assicurando pixel-normalized coordinates e validazioni condivise @docs/plans/idle_village_map_editor_plan.md#1-83.
- Il Map Rebuild plan (map-only shell) viene superato dal Theater/Bloom focus; tuttavia, i guard-rail “config-first” e “nessuna logica HUD duplicata” restano validi come baseline per refactoring @docs/plans/idle_village_map_rebuild_plan.md#1-62.

### 6.6 Drag & Drop E2E QA

- Il flusso Playwright deterministico (reset stato → assign → advance → verify) rimane requisito di regressione per ogni rilascio Drag/Bloom @docs/plans/idle_village_drag_drop_e2e_plan.md#1-45.
- I debug controls (`reset`, feedback su assign falliti) devono essere preservati anche dopo l’introduzione di Theater View e token orb.

### 6.7 Governance

- Tutte le nuove sezioni devono essere sincronizzate con `idle_village_tasks.md` e `MASTER_PLAN.md`. Quando nuove feature (es. Trial of Fire UI) sono completate, aggiornare sia questo Master Plan sia i documenti specialistici relativi.
