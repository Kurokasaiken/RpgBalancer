# Idle Village Cross-Device & Mobile Vision (2026-01-04)

**Owner:** Cascade (Village Sandbox pod)  
**Allineamento artistico:** aderire al tema *Gilded Observatory* e ai principi descritti in [Art Direction Plan](../plans/art_direction_plan.md).  
**Documenti correlati:** [Village Sandbox Refactor Plan](../plans/village_sandbox_refactor_plan.md), [Responsive UI Plan](../plans/responsive_ui_plan.md), [MOBILE_GUIDELINES.md](../../../../MOBILE_GUIDELINES.md).

---

## 1. Obiettivi e guardrail

1. **Esperienza coerente su tutti i device:** drag completo e feedback bloom su desktop, tap-first su mobile senza sacrificare la leggibilità del tool.  
2. **Config-first sempre:** nessun valore di layout o interazione hardcoded; tutte le soglie (breakpoint, densità, input precedence) derivano da config condivisi (`mapLayoutConfig`, `DensityContext`, token Style Lab).  
3. **Requisiti artistici:** palette, superfici e luce devono rispettare la bibbia "Prismatic Wanderlust"; niente varianti dark/grim in mobile view.  
4. **Testabilità:** ogni variazione di comportamento deve essere coperta da Playwright (Desktop Chrome + Mobile Chrome) e da RTL per i controller.

### KPI di riferimento

| KPI | Target | Misurazione |
| --- | --- | --- |
| **Tap-to-assign successo su mobile** | ≥ 95% entro 2026-02-20 | `tests/villageSandbox-touch-mode.spec.ts` (nuova) usa `getAssignmentDiagnostics()` |
| **Fallback tastiera/click** | 100% slot Operativi su desktop | `useSandboxInteractionMode.test.ts` + rifinitura `villageSandbox-drag-assign.spec.ts` |
| **Reset cross-device** | 0 reset automatici su cambio viewport | QA manuale + `tests/villageSandbox-preserve-state.spec.ts` |
| **HUD leggibile su <1024px** | WCAG AA contrasti + CTA ≥44px | Visual regression `docs/ui_regressions/mobile-hud.png` |

---

## 2. Framework di input

| Device | Modalità primaria | Fallback obbligatori | Note tecniche |
| --- | --- | --- | --- |
| **Desktop / Laptop (≥1024px)** | Drag & drop completo gestito da `useSandboxDragController` | Click slot → highlight resident compatibili, tastiera (Tab + Invio) | Bloom sempre attivo, `pointer-coarse` detection ignora tap override |
| **Tablet (768–1023px)** | Touch-first con drag opzionale | Tap slot → bottom sheet `WorkerPicker`, swipe per chiudere | `useSandboxInteractionMode` seleziona "hybrid" e limita drag ad asse Y |
| **Phone (<768px)** | Tap slot / tap residente → picker compatibile | Drag disabilitato salvo gesture OS, CTA primarie in bottom sheet | `window.matchMedia('(pointer: coarse)')` + `navigator.maxTouchPoints` alimentano l'adapter |

**Hook da introdurre:** `useSandboxInteractionMode()` (deriva `interactionMode: 'drag' | 'hybrid' | 'tap'`, `canUsePicker`, `surfaceDensity`) e fornisce API per aprire/chiudere il picker condiviso. Reusa gli stessi validator di `useSandboxDragController` (no logiche duplicate).

---

## 3. Linee guida layout & densità

1. **Breakpoints ufficiali:** leggere da `mapLayoutConfig.breakpoints` (nuovo file) e non da media-query inline.  
2. **Stack mobile:** ordine fisso `Clock → Active Jobs → Quests → Roster → HUD` con pannelli come bottom sheet (`VillageSandboxColumns` riceve `layout="stack"`).  
3. **Desktop columns:** `VillageSandboxColumns` passa a 2fr/1fr e mantiene HUD sempre visibile.  
4. **Token di densità:** usare `DensityContext` per ridurre padding su mobile (`density="compact"`).  
5. **CTA & chip:** min height 44px, spaziature `gap-3` massimo per mantenere leggibilità su phone.  
6. **Riferimento visivo:** ogni nuova schermata deve validare colori/texture contro [Art Direction Plan](../plans/art_direction_plan.md).

---

## 4. Mobile PWA & cross-device rollout

| Fase | Deadline | Owner | Deliverable |
| --- | --- | --- | --- |
| **F0 – Device detection refactor** | 2026-01-12 | Cascade + Platform | `useSandboxInteractionMode` hook + unit test |
| **F1 – Picker & HUD responsive** | 2026-01-22 | UI Guild | `WorkerPickerSheet` + `VillageSandboxColumns` layout prop + visual diff mobile |
| **F2 – PWA polish** | 2026-02-02 | Platform | Manifest + service worker aggiornati (riuso linee guida `MOBILE_GUIDELINES.md`) |
| **F3 – QA & Playwright** | 2026-02-15 | QA Guild | New specs (`touch-mode`, `preserve-state`, `mobile-hud`) + report cross-device |

**PWA note:** riutilizzare l'attuale pipeline Vite/Tauri; nessuna logica offline custom dentro i componenti. Il manifest deve citare i breakpoint e le icone già definite in `src-tauri/icons`. Il budget prestazionale (CLS < 0.1, TTI < 3s su Pixel 6) resta ereditato da `MOBILE_GUIDELINES.md`.

---

## 5. Relazione con Punch Club Minimal UI

- Punch Club funge da *minimum viable loop* per verificare il nuovo schema mobile.  
- Le card Gym Shift / Bout devono condividere i layout token descritti qui e nel [Punch Club Minimal Draft Plan](../plans/punch_club_realistic.md#punch-club-minimal-draft-plan-2026-01-03).  
- Il picker mobile deve supportare preset "mono job" (es. Punch Club) e "multi job" (Village full) senza duplicare componenti: tutto parte dai dati `config.activities`.  
- Gli screenshot/mobile HUD pubblicati in `docs/ui_regressions/` vanno aggiornati dopo ogni milestone Punch Club.

---

## 6. Backlog operativo

1. **Interaction hook & density source of truth** *(owner: Cascade, 2026-01-12)*  
   - Creare `src/ui/idleVillage/hooks/useSandboxInteractionMode.ts` (pure + JSDoc).  
   - Coprire con `src/ui/idleVillage/hooks/__tests__/useSandboxInteractionMode.test.ts`.  
   - Esportare `interactionMode` nel context per ActivityArea, Roster, Columns.

2. **Worker picker sheet** *(owner: UI Guild, 2026-01-18)*  
   - Nuovo componente `WorkerPickerSheet` config-first (props = `compatibleResidents`, `slotMeta`, `onAssign`).  
   - Playwright spec `tests/villageSandbox-worker-picker.spec.ts` per tap flow mobile.  
   - Aggiornare `ActivityActionCard` per chiamare `openWorkerPicker(slotId)` quando `interactionMode !== 'drag'`.

3. **Layout prop plumbing** *(owner: Cascade, 2026-01-22)*  
   - Estendere `VillageSandboxColumns` con prop `layout: 'columns' | 'stack'`.  
   - Aggiornare `ActivityActionCard`, `AncillaryPanels`, `SummaryStrip` per densità dinamica.  
   - Storybook knobs per `layout` per QA visivo.

4. **State preservation** *(owner: Platform + QA, 2026-02-05)*  
   - Rimuovere reset automatici da `useMapContext` su resize; mantenere solo reset via UI.  
   - Aggiungere test Playwright `villageSandbox-preserve-state.spec.ts` che cambia viewport senza perdere assignment.

5. **Touch-mode QA suite** *(owner: QA Guild, 2026-02-15)*  
   - Script `tests/villageSandbox-touch-mode.spec.ts` con `page.emulateMedia({ colorScheme: 'dark' })` e viewport 390x844.  
   - Assertions: picker appare, CTA ≥44px (usare `boundingBox()`), completamento assignment e no console errors.

---

## 7. Checklist di conformità

- [ ] `useSandboxInteractionMode` mergeato con test.  
- [ ] Worker picker mobile collegato a config.  
- [ ] Playwright suite mobile verde su Desktop & Mobile Chrome.  
- [ ] Screenshot HUD mobile aggiornati e archiviati.  
- [ ] Village Sandbox plan §WS6.3 referenzia questa strategia.  
- [ ] Art direction review completata con riferimento al documento "Il Drago" / "Prismatic Wanderlust".
