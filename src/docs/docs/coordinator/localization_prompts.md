# Game Localization - Prompts per Coordinator

## Obiettivo

Implementare il sistema di internazionalizzazione (i18n) e localizzazione (L10n) per il progetto RPG seguendo il piano `src/docs/docs/plans/game_localization_implementation_plan.md`.

## Protocollo obbligatorio per gli agenti

1. Invocare sempre `agent-execution-mandate` prima di iniziare.
2. Seguire il mandato e le skill pertinenti (`idle-village-task` per i prompt Idle Village).
3. Rispettare la filosofia config-first, `PersistenceService` per la persistenza, e telemetry per eventi di localizzazione.
4. Usare `/kanban-update` per qualsiasi modifica alla board.
5. Non rompere `LocalizationService` e `useLocalization` esistenti fino a completamento della migrazione (usare adapter).

## Frase obbligatoria del coordinator

In fase di assegnazione il coordinator deve scrivere **solo**: `@Cascade prendi <PROMPT_ID> (vedi localization_prompts.md) usando la skill pertinente.`

---

## I18N-001: Foundation - i18next Engine, Config e Tipi

```text
AGENT
Localization Infrastructure Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Installare e configurare il motore i18next con ICU MessageFormat, lazy loading, store locale, provider React e tipi TypeScript generati.

PROMPT READINESS
FILE TARGET
- [nuovo] src/localization/i18n.ts
- [nuovo] src/localization/I18nProvider.tsx
- [nuovo] src/localization/i18n.types.ts
- [nuovo] src/localization/LocaleConfig.ts
- [nuovo] src/localization/LocaleConfigStore.ts
- [nuovo] src/localization/useTranslation.ts
- [nuovo] src/localization/pseudoLocalize.ts
- [nuovo] src/localization/adapters/LocalizationServiceAdapter.ts
- [nuovo] src/localization/adapters/InteractionModeCopyAdapter.ts
- [nuovo] public/locales/en/common.json
- [nuovo] public/locales/en/idleVillage.json
- [nuovo] public/locales/pseudo/common.json
- [nuovo] public/locales/pseudo/idleVillage.json
- [nuovo] scripts/i18n/generateTypes.ts
- [nuovo] scripts/i18n/buildPseudo.ts
- [modifica] package.json
- [modifica] src/main.tsx
- [modifica] src/localization/LocalizationService.ts
- [modifica] src/hooks/useLocalization.ts
- [modifica] src/ui/idleVillage/config/interactionModeCopy.ts
- [sposta] src/data/idleVillage/tooltips.json → public/locales/en/idleVillage.json

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §5 e §6 Fase 1

DIPENDENZE
- Nessuna (primo task di localizzazione)

OPERAZIONI DA ESEGUIRE
1. Aggiungere dipendenze npm: i18next, react-i18next, i18next-icu, i18next-http-backend, i18next-browser-languagedetector, i18next-resources-for-ts (dev), i18next-parser (dev).
2. Creare `LocaleConfig.ts` con Zod schema: locale, direction, fontFamily, fallbackLocale, textExpansionFactor.
3. Creare `LocaleConfigStore.ts` usando `PersistenceService` per load/save asincrono della lingua scelta.
4. Creare `i18n.ts` con ICU, HTTP backend, namespaces, fallback `en`, `useSuspense: false`.
5. Creare `I18nProvider.tsx` e wrappare `App` in `src/main.tsx`.
6. Generare `i18n.types.ts` da `public/locales/en/*.json`.
7. Creare `useTranslation.ts` wrapper tipizzato.
8. Creare `pseudoLocalize.ts` per generare la pseudo-locale da `en`.
9. Spostare `src/data/idleVillage/tooltips.json` in `public/locales/en/idleVillage.json` e creare `pseudo/idleVillage.json`.
10. Creare `LocalizationServiceAdapter` che espone la stessa API del singleton esistente ma delega a i18next.
11. Refactor `LocalizationService.ts` e `useLocalization.ts` per usare l'adapter.
12. Refactor `interactionModeCopy.ts` per leggere le entry da i18next tramite `InteractionModeCopyAdapter`, mantenendo metadata e fallback.
13. Aggiungere script npm: `i18n:types`, `i18n:build-pseudo`.

OPERAZIONI VIETATE
- Vietato usare `localStorage` direttamente per la persistenza della lingua.
- Vietato cambiare il contratto esposto da `useLocalization` (mantenere stessa firma).
- Vietato rimuovere `interactionModeCopy.ts` (deprecare, non cancellare).
- Vietato introdurre `Suspense` per il caricamento lingue.

ASSUNZIONI
- `PersistenceService` è disponibile e funzionante.
- `src/main.tsx` può essere modificato per wrappare il provider.
- `package.json` accetta nuove dipendenze.

REGRESSION SAFEGUARDS
- npm run build:check
- npm run lint
- npm run kanban:lint
- npm run test:unit

AUTONOMIA & CHECK-IN
- Autonomia alta su file nuovi; apri blocker se `PersistenceService` non espone API asincrone o se `main.tsx` non è wrappabile.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-001-foundation-<YYYY-MM-DD>.log`
3. Report finale con: dipendenze installate, provider attivo, locale switch funzionante, `en` e `pseudo` caricabili.

NOTE
- Mantenere `LocalizationService` e `useLocalization` funzionanti tramite adapter.
- Seguire `PROJECT_PHILOSOPHY.md` per config-first.
- Usare ICU MessageFormat per ogni stringa con placeholder/plurali.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-001-foundation-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `localization` (fondamentali i18next / ICU / PersistenceService)

CONTEXTO ATTUALE
- Stack: React 19.2.4, Vite 6, Tailwind CSS 4, Zustand 5, TypeScript 5.9.3.
- `src/localization/LocalizationService.ts` e `src/hooks/useLocalization.ts` sono i legacy point attuali; devono mantenere inalterata la firma pubblica.
- `src/data/idleVillage/tooltips.json` contiene esclusivamente `en.workerTooltip`.
- `src/ui/idleVillage/config/interactionModeCopy.ts` ha 18 entry hardcoded `it-IT` con fallback `en-US` e Zod schema.
- `src/shared/persistence/PersistenceService.ts` espone `saveData`/`loadData` async.
- `package.json` non ha ancora dipendenze i18n e nessuno script `i18n:*`.

CRITERI DI ACCETTAZIONE
- `i18next` installato con `react-i18next`, `i18next-icu`, `i18next-http-backend`, `i18next-browser-languagedetector`, `i18next-resources-for-ts` (dev), `i18next-parser` (dev).
- `src/main.tsx` wrappa sia `<App />` (ramo `else`) che `<AppMinimal />` (ramo `isMinimalEntry`) con `<I18nProvider>`.
- `i18n.ts` ha `useSuspense: false`, `fallbackLng: 'en'`, ICU plugin, lazy backend verso `public/locales/{{lng}}/{{ns}}.json`.
- `LocaleConfigStore` persiste in `PersistenceService` con key `rpg-locale-config`.
- `useLocalization` e `LocalizationService` esportano la stessa API di oggi, delegando internamente a i18next.
- `i18n.types.ts` generato da `public/locales/en/*.json` e `useTranslation` e `Trans` sono tipizzati.
- `public/locales/en/idleVillage.json` include `workerTooltip` migrato; `public/locales/pseudo/` e `public/locales/en/common.json` esistono.
- `npm run i18n:types` e `npm run i18n:build-pseudo` funzionano senza errori.

STRATEGIA DI TESTING
- `tests/unit/localization/LocaleConfigStore.test.ts`: init, load, save, fallback, dati corrotti.
- `tests/unit/localization/LocalizationServiceAdapter.test.ts`: stessa API del singleton (`getLocale`, `setLocale`, `getWorkerTooltipCopy`, `format`, `subscribe`).
- `tests/unit/localization/useTranslation.test.ts`: render, cambio locale, chiave mancante.
- `tests/unit/localization/pseudoLocalize.test.ts`: expansion >= 30%, wrapper `!!`.
- `npm run build:check`, `npm run lint`, `npm run test:unit`, `npm run kanban:lint` passano.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 1: elencare file/script creati e stato.
- `src/docs/docs/coordinator/strategy_tasks.md`: I18N-001 -> `Completato` con data.
- `src/docs/docs/coordinator/agent_assignments.md`: `/kanban-update` con evidence log e link.

NOTE DI PARALLELISMO
- Non parallelizzabile. Prerequisito per I18N-002, I18N-003, I18N-004. Bloccare tutti i successivi finché non e `Completato`.
```

---

## I18N-002: Idle Village Worker Tooltip & Interaction Mode Copy

```text
AGENT
Idle Village Localization Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Esternalizzare i worker tooltip e le interaction mode copy in namespace `idleVillage` ICU, mantenendo metadata e fallback.

PROMPT READINESS
FILE TARGET
- [esistente] public/locales/en/idleVillage.json
- [esistente] public/locales/pseudo/idleVillage.json
- [esistente] src/ui/idleVillage/config/interactionModeCopy.ts
- [esistente] src/ui/idleVillage/hooks/useTooltipCopy.ts
- [esistente] src/localization/LocalizationService.ts
- [esistente] src/localization/adapters/InteractionModeCopyAdapter.ts
- [modifica] src/data/idleVillage/tooltips.json (spostato in Fase 1)

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 2 (priorità 1)

DIPENDENZE
- I18N-001 completato

OPERAZIONI DA ESEGUIRE
1. Verificare che `public/locales/en/idleVillage.json` contenga la sezione `workerTooltip` migrata da `tooltips.json`.
2. Aggiungere al file `idleVillage.json` le chiavi `interactionMode.*` con copia `text`, `description`, `fallback`, `category`, `context`, `maxLength`, `accessibility`.
3. Generare corrispondenti entry in `public/locales/pseudo/idleVillage.json`.
4. Aggiornare `InteractionModeCopyAdapter` per leggere da i18next mantenendo `getCopyEntry`, `getCopyText`, `formatCopyText`.
5. Aggiornare `useTooltipCopy.ts` per usare `useTranslation('idleVillage')` e mantenere telemetry.
6. Sostituire ogni stringa hardcoded relativa a worker tooltip e interaction mode con `t('idleVillage:...')` o `Trans`.
7. Aggiungere JSDoc e Zod schema per i nuovi dati ICU.

OPERAZIONI VIETATE
- Vietato perdere metadata (`context`, `category`, `maxLength`, `accessibility`) esistenti.
- Vietato introdurre stringhe hardcoded nuove.
- Vietato rimuovere `useTooltipCopy` (wrapper attorno a i18next).

ASSUNZIONI
- `interactionModeCopy.ts` ha già Zod schema e entry Italian/English hardcoded.
- I18N-001 ha configurato i18next e gli adapter.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage/config/interactionModeCopy.ts src/ui/idleVillage/hooks/useTooltipCopy.ts
- npm run test -- tests/unit/idleVillage/ (trovare test pertinenti)
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se `InteractionModeCopy` schema non è compatibile con ICU JSON.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-002-idle-tooltip-copy-<YYYY-MM-DD>.log`
3. Report finale con: worker tooltip e interaction mode switchabili in `en` e `pseudo`, metadata preservati.

NOTE
- Usare key naming `idleVillage:workerTooltip.labels.hp` e `idleVillage:interactionMode.defaultAction.text`.
- Integrare telemetry `tooltip_shown` mantenendo payload esistente.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-002-idle-tooltip-copy-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `idle-village-task` (per tutti i file sotto `src/ui/idleVillage/**`)

CONTEXTO ATTUALE
- I18N-001 deve essere `Completato` e `public/locales/en/idleVillage.json` deve esistere.
- `src/ui/idleVillage/config/interactionModeCopy.ts` esporta 8 helper: `getCopyEntry`, `getCopyText`, `getCopyDescription`, `getCopyByCategory`, `getCopyByContext`, `isCopyTranslatable`, `getCopyAccessibility`, `formatCopyText`.
- `src/ui/idleVillage/hooks/useTooltipCopy.ts` e `useTooltipInteraction` emettono `tooltip_shown`/`tooltip_interaction` via `trackTelemetryEvent`.
- `src/hooks/useLocalization.ts` resta disponibile come adapter legacy.
- Le sezioni tooltip attuali sono `workerTooltip` (legacy) e `MinimalUITooltips` (`hudResources`, `workerTraits`, `slotStatus`) da `minimalConfig`; mappa ogni sezione nel namespace `idleVillage`.

CRITERI DI ACCETTAZIONE
- `public/locales/en/idleVillage.json` ha `workerTooltip` (migrato) e `interactionMode` (strutturato per chiavi come `mode.sandbox.text`, `mode.sandbox.description`, `mode.sandbox.accessibility.ariaLabel`).
- `public/locales/pseudo/idleVillage.json` contiene le stesse chiavi in pseudo-locale.
- `InteractionModeCopyAdapter` espone la stessa API di `interactionModeCopy.ts` e legge da i18next, mantenendo `context`, `category`, `maxLength`, `translatable`, `accessibility`.
- `useTooltipCopy.ts` usa `useTranslation('idleVillage')` per `getTooltipCopy` e mantiene `tooltip_shown`/`tooltip_interaction` con payload invariato.
- Nessuna stringa hardcoded nuova viene introdotta; nessun metadata esistente perso.
- `npm run i18n:extract` e `npm run i18n:validate` passano per il namespace `idleVillage`.

STRATEGIA DI TESTING
- `tests/unit/idleVillage/useTooltipCopy.test.tsx`: mock `useTranslation` e verifica telemetry e fallback.
- `tests/unit/idleVillage/InteractionModeCopyAdapter.test.ts`: verifica `getCopyEntry`, `getCopyText`, `formatCopyText` per `it-IT` e `en-US` e fallback a chiave.
- Eseguire `npm run test -- tests/unit/idleVillage/` (aggiornare test con testo esatto).
- `npm run build:check`, `npm run lint -- src/ui/idleVillage`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 2: segnare `workerTooltip` e `interactionMode` come completati.
- Aggiornare `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001.
- Può partire in parallelo con I18N-004 (tooling) appena I18N-001 ha esposto `useTranslation` e il namespace `idleVillage`.
```

---

## I18N-003: Idle Village Core UI Extraction

```text
AGENT
Idle Village UI Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Coordinare l'estrazione del testo hardcoded dalle componenti core di Idle Village nel namespace `idleVillage`, delegando il lavoro ai sottoprompt I18N-003a, I18N-003b e I18N-003c. I18N-003 si considera completato quando tutti i sottoprompt sono completati e le safeguard globali passano.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/SlotV12Renderer.tsx
- [esistente] src/ui/idleVillage/components/QuestChronicle.tsx
- [esistente] src/ui/idleVillage/components/NarrativePanel.tsx
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx
- [esistente] src/ui/idleVillage/components/WanderlustMedalOverlay.tsx
- [esistente] src/ui/idleVillage/components/GenericPoiSkin.tsx
- [esistente] src/ui/idleVillage/components/QuestTelemetryPanel.tsx
- [esistente] src/ui/idleVillage/components/QuestRiskDisplay.tsx
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] src/ui/idleVillage/MultiVillageSchedulerMonitor.tsx
- [modifica] public/locales/en/idleVillage.json
- [modifica] public/locales/pseudo/idleVillage.json
- [modifica] tests/unit/idleVillage/* (aggiornare se test verificano testo esatto)

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 2

DIPENDENZE
- I18N-001 e I18N-002 completati

OPERAZIONI DA ESEGUIRE
1. Eseguire `npm run i18n:extract` o scan manuale per catalogare stringhe visibili in `src/ui/idleVillage/**/*.tsx`.
2. Aggiungere chiavi strutturate in `public/locales/en/idleVillage.json`:
   - `idleVillage:slotRack.*`
   - `idleVillage:poiDetail.*`
   - `idleVillage:activityCapsule.*`
   - `idleVillage:questChronicle.*`
   - `idleVillage:questTelemetry.*`
   - `idleVillage:questRisk.*`
   - `idleVillage:narrative.*`
   - `idleVillage:ftue.*`
   - `idleVillage:map.*`
   - `idleVillage:scheduler.*`
3. Sostituire JSX text con `t('...')` o `<Trans i18nKey="..." />`.
4. Per ogni key aggiungere metadati `context`, `maxLength` dove noto.
5. Generare `pseudo` locale per stress test.
6. Aggiornare test che assertano testo esatto; usare `data-testid` o key dove appropriato.
7. Emettere telemetry `locale_changed`, `translation_missing`, `translation_fallback_used`.

OPERAZIONI VIETATE
- Vietato rompere layout o drag-and-drop esistenti.
- Vietato tradurre testo di test harness/debug-only (lasciare in `en`/`pseudo` a discrezione).
- Vietato rimuovere test senza equivalente valido.

ASSUNZIONI
- I18N-001 ha i18next pronto con namespace `idleVillage`.
- I18N-002 ha già migrato tooltip e interaction mode.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage
- npm run test -- tests/unit/idleVillage/
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se un componente non accetta sostituzione testo senza rifattorizzazione strutturale.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-003-idle-core-extraction-<YYYY-MM-DD>.log`
3. Report finale con: percentuale stringhe estratte da componenti core, test aggiornati, pseudo-locale testata.

NOTE
- Lavorare per componente; non spazzare tutto in un unico grande diff.
- Documentare nel log qualsiasi stringa diagnostic-only non estratta.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-003-idle-core-extraction-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `idle-village-task` (per tutti i file sotto `src/ui/idleVillage/**`)

CONTEXTO ATTUALE
- I18N-001 e I18N-002 devono essere `Completati`.
- `src/ui/idleVillage/` contiene componenti con testo player-facing hardcoded: `SlotV12Renderer`, `QuestChronicle`, `NarrativePanel`, `ActivityCapsule`, `WanderlustMedalOverlay`, `GenericPoiSkin`, `QuestTelemetryPanel`, `QuestRiskDisplay`, `TestRosterPage`, `MultiVillageSchedulerMonitor`, `VillageSandbox`, `MinimalGameplayPage`.
- `i18n:extract`/`i18n:validate` sono disponibili se I18N-004 e già iniziato; in alternativa usare scansione manuale.
- I test esistenti fanno spesso assert su testo esatto; devono essere migrati su `data-testid` o chiavi.
- La regola `PROJECT_PHILOSOPHY.md` richiede config-first, Style Lab tokens, `trackTelemetryEvent` per `locale_changed`, `translation_missing`, `translation_fallback_used`.

CRITERI DI ACCETTAZIONE
- Ogni componente listato non contiene testo player-facing hardcoded; usa `t('idleVillage:...')` o `<Trans i18nKey="..." />`.
- Le chiavi seguono la naming `namespace:domain.section.key` (es. `idleVillage:slotRack.emptySlot.label`, `idleVillage:questRisk.high`, `idleVillage:ftue.welcomeTitle`).
- Metadata `context` e `maxLength` aggiunti per le chiavi che ne hanno bisogno.
- `public/locales/pseudo/idleVillage.json` e pseudo-`common.json` sono generati e testati.
- Drag & drop, layout, animazioni e skin non devono regredire.
- Test con assert su testo esatto aggiornati o riscritti con `data-testid`.
- Telemetry `locale_changed`, `translation_missing`, `translation_fallback_used` emessi con payload completo.

STRATEGIA DI TESTING
- `npm run i18n:extract` (o scansione) per trovare stringhe residue.
- `npm run i18n:validate` per verificare chiavi mancanti.
- `npm run test -- tests/unit/idleVillage/` per aggiornare e far passare i test.
- `npm run test:visual` (se disponibile) per pseudo-locale su `/test` e `/idle-village`.
- `npm run build:check`, `npm run lint -- src/ui/idleVillage`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 2: aggiornare percentuale copertura e componenti completati.
- `src/docs/docs/plans/idle_village_plan.md` e component fact sheets: annotare che i testi sono in `idleVillage` namespace.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001 e I18N-002.
- I sottoprompt I18N-003a, I18N-003b e I18N-003c possono partire in parallelo dopo I18N-002.
- I18N-003 si considera completato quando tutti i sottoprompt sono completati e le safeguard globali passano.
```

---

## I18N-003a: Idle Village Core UI Extraction – Slot Rack & POI

```text
AGENT
Idle Village UI Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estrarre il testo hardcoded dalle componenti di Slot Rack, POI detail, Activity Capsule e overlay medal in `idleVillage`, sostituendo JSX text con chiavi i18n.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/SlotV12Renderer.tsx
- [esistente] src/ui/idleVillage/components/GenericPoiSkin.tsx
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx
- [esistente] src/ui/idleVillage/components/ActivityCapsuleDetailSkinAware.tsx
- [esistente] src/ui/idleVillage/components/WanderlustMedalOverlay.tsx
- [esistente] src/ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage.tsx
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [modifica] public/locales/en/idleVillage.json
- [modifica] public/locales/pseudo/idleVillage.json
- [modifica] tests/unit/idleVillage/* (aggiornare se test verificano testo esatto)

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 2

DIPENDENZE
- I18N-001 e I18N-002 completati

OPERAZIONI DA ESEGUIRE
1. Catalogare stringhe visibili nelle componenti target.
2. Aggiungere chiavi in `public/locales/en/idleVillage.json` sotto:
   - `idleVillage:slotRack.*`
   - `idleVillage:poiDetail.*`
   - `idleVillage:activityCapsule.*`
   - `idleVillage:medalOverlay.*`
   - `idleVillage:testRoster.*`
3. Sostituire JSX text con `t('...')` o `<Trans i18nKey="..." />`.
4. Aggiungere metadata `context`, `maxLength` dove noto.
5. Generare `pseudo` locale per le chiavi aggiunte.
6. Aggiornare test con assert su testo esatto.
7. Emettere telemetry `translation_missing`/`translation_fallback_used` per le chiavi dello scope.

OPERAZIONI VIETATE
- Vietato rompere layout, drag-and-drop, skin o animazioni.
- Vietato tradurre testo di test harness/debug-only (lasciare in `en`/`pseudo` a discrezione).
- Vietato rimuovere test senza equivalente valido.

ASSUNZIONI
- I18N-001 ha i18next pronto con namespace `idleVillage`.
- I18N-002 ha già migrato tooltip e interaction mode.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage
- npm run test -- tests/unit/idleVillage/
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se un componente richiede rifattorizzazione strutturale.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-003a-slot-rack-poi-<YYYY-MM-DD>.log`
3. Report finale con: componenti coperti, chiavi aggiunte, test aggiornati, pseudo-locale testata.

NOTE
- Lavorare per componente; non spazzare tutto in un unico grande diff.
- Documentare nel log qualsiasi stringa diagnostic-only non estratta.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-003a-slot-rack-poi-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `idle-village-task` (per tutti i file sotto `src/ui/idleVillage/**`)

CONTEXTO ATTUALE
- I18N-001 e I18N-002 devono essere `Completati`.
- `SlotV12Renderer`, `GenericPoiSkin`, `ActivityCapsule`, `ActivityCapsuleDetailSkinAware`, `WanderlustMedalOverlay`, `PoiDetailJobRosterIntegrationPage` e `TestRosterPage` contengono testo player-facing hardcoded.
- I test esistenti fanno spesso assert su testo esatto; devono essere migrati su `data-testid` o chiavi.
- `PROJECT_PHILOSOPHY.md` richiede config-first, Style Lab tokens, `trackTelemetryEvent` per `translation_missing`/`translation_fallback_used`.

CRITERI DI ACCETTAZIONE
- I componenti target non contengono testo player-facing hardcoded; usano `t('idleVillage:...')` o `<Trans i18nKey="..." />`.
- Chiavi strutturate `namespace:domain.section.key` (es. `idleVillage:slotRack.emptySlot.label`, `idleVillage:poiDetail.title`).
- Metadata `context` e `maxLength` aggiunti per le chiavi che ne hanno bisogno.
- `public/locales/pseudo/idleVillage.json` aggiornato e testato.
- Drag & drop, layout, animazioni e skin non devono regredire.
- Test con assert su testo esatto aggiornati o riscritti con `data-testid`.

STRATEGIA DI TESTING
- `npm run i18n:extract` (o scansione) per trovare stringhe residue.
- `npm run i18n:validate` per verificare chiavi mancanti.
- `npm run test -- tests/unit/idleVillage/` per aggiornare e far passare i test.
- `npm run test:visual` (se disponibile) per pseudo-locale su `/test` e `/idle-village`.
- `npm run build:check`, `npm run lint -- src/ui/idleVillage`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 2: annotare `slotRack`, `poiDetail`, `activityCapsule`, `medalOverlay` come completati.
- `src/docs/docs/plans/idle_village_plan.md` e component fact sheets: annotare namespace e chiavi usate.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001 e I18N-002.
- Può partire in parallelo con I18N-003b e I18N-003c.
- Non deve sovrapporsi in modo concorrenziale con I18N-002 (tooltip/interaction).
```

---

## I18N-003b: Idle Village Core UI Extraction – Quest & Telemetry

```text
AGENT
Idle Village UI Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estrarre il testo hardcoded dalle componenti di Quest, Telemetry e Risk display in `idleVillage`, sostituendo JSX text con chiavi i18n. Il flavor text lore rimane in carico a I18N-005.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/QuestChronicle.tsx
- [esistente] src/ui/idleVillage/components/QuestTelemetryPanel.tsx
- [esistente] src/ui/idleVillage/components/QuestRiskDisplay.tsx
- [modifica] public/locales/en/idleVillage.json
- [modifica] public/locales/pseudo/idleVillage.json
- [modifica] tests/unit/idleVillage/* (aggiornare se test verificano testo esatto)

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 2

DIPENDENZE
- I18N-001 e I18N-002 completati

OPERAZIONI DA ESEGUIRE
1. Catalogare stringhe visibili in `QuestChronicle`, `QuestTelemetryPanel`, `QuestRiskDisplay`.
2. Aggiungere chiavi in `public/locales/en/idleVillage.json` sotto:
   - `idleVillage:questChronicle.*`
   - `idleVillage:questTelemetry.*`
   - `idleVillage:questRisk.*`
3. Sostituire JSX text con `t('...')` o `<Trans i18nKey="..." />`.
4. Per `QuestChronicle` estrarre solo le etichette UI; il flavor text lore verrà gestito nel namespace `lore` da I18N-005.
5. Aggiungere metadata `context`, `maxLength` dove noto.
6. Generare `pseudo` locale per le chiavi aggiunte.
7. Aggiornare test con assert su testo esatto.
8. Emettere telemetry `translation_missing`/`translation_fallback_used` per le chiavi dello scope.

OPERAZIONI VIETATE
- Vietato rompere layout, animazioni o skin.
- Vietato tradurre testo di test harness/debug-only.
- Vietato rimuovere test senza equivalente valido.

ASSUNZIONI
- I18N-001 ha i18next pronto con namespace `idleVillage`.
- I18N-002 ha già migrato tooltip e interaction mode.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage
- npm run test -- tests/unit/idleVillage/
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se `QuestChronicle` richiede cambi architetturali per separare UI e lore.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-003b-quest-telemetry-<YYYY-MM-DD>.log`
3. Report finale con: componenti coperti, chiavi aggiunte, test aggiornati, pseudo-locale testata.

NOTE
- Lavorare per componente; non spazzare tutto in un unico grande diff.
- Documentare nel log qualsiasi stringa diagnostic-only o lore non estratta.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-003b-quest-telemetry-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `idle-village-task` (per tutti i file sotto `src/ui/idleVillage/**`)

CONTEXTO ATTUALE
- I18N-001 e I18N-002 devono essere `Completati`.
- `QuestChronicle`, `QuestTelemetryPanel` e `QuestRiskDisplay` contengono testo player-facing hardcoded.
- I test esistenti fanno spesso assert su testo esatto; devono essere migrati su `data-testid` o chiavi.
- `PROJECT_PHILOSOPHY.md` richiede config-first, Style Lab tokens, `trackTelemetryEvent` per `translation_missing`/`translation_fallback_used`.

CRITERI DI ACCETTAZIONE
- I componenti target non contengono testo player-facing hardcoded (eccetto flavor text lore); usano `t('idleVillage:...')` o `<Trans i18nKey="..." />`.
- Chiavi strutturate `namespace:domain.section.key` (es. `idleVillage:questTelemetry.title`, `idleVillage:questRisk.high`).
- Metadata `context` e `maxLength` aggiunti per le chiavi che ne hanno bisogno.
- `public/locales/pseudo/idleVillage.json` aggiornato e testato.
- Layout, animazioni e skin non devono regredire.
- Test con assert su testo esatto aggiornati o riscritti con `data-testid`.

STRATEGIA DI TESTING
- `npm run i18n:extract` (o scansione) per trovare stringhe residue.
- `npm run i18n:validate` per verificare chiavi mancanti.
- `npm run test -- tests/unit/idleVillage/` per aggiornare e far passare i test.
- `npm run test:visual` (se disponibile) per pseudo-locale su `/test` e `/idle-village`.
- `npm run build:check`, `npm run lint -- src/ui/idleVillage`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 2: annotare `questChronicle`, `questTelemetry`, `questRisk` come completati.
- `src/docs/docs/plans/idle_village_plan.md` e component fact sheets: annotare namespace e chiavi usate.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001 e I18N-002.
- Può partire in parallelo con I18N-003a e I18N-003c.
- Non deve sovrapporsi in modo concorrenziale con I18N-002 (tooltip/interaction).
```

---

## I18N-003c: Idle Village Core UI Extraction – Narrative, FTUE, Map & Scheduler

```text
AGENT
Idle Village UI Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estrarre il testo hardcoded dalle componenti narrative, FTUE, map e scheduler in `idleVillage`, sostituendo JSX text con chiavi i18n.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/NarrativePanel.tsx
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/MultiVillageSchedulerMonitor.tsx
- [modifica] public/locales/en/idleVillage.json
- [modifica] public/locales/pseudo/idleVillage.json
- [modifica] tests/unit/idleVillage/* (aggiornare se test verificano testo esatto)

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 2

DIPENDENZE
- I18N-001 e I18N-002 completati

OPERAZIONI DA ESEGUIRE
1. Catalogare stringhe visibili nelle componenti target.
2. Aggiungere chiavi in `public/locales/en/idleVillage.json` sotto:
   - `idleVillage:narrative.*`
   - `idleVillage:ftue.*`
   - `idleVillage:map.*`
   - `idleVillage:scheduler.*`
3. Sostituire JSX text con `t('...')` o `<Trans i18nKey="..." />`.
4. Aggiungere metadata `context`, `maxLength` dove noto.
5. Generare `pseudo` locale per le chiavi aggiunte.
6. Aggiornare test con assert su testo esatto.
7. Emettere telemetry `translation_missing`/`translation_fallback_used` per le chiavi dello scope.

OPERAZIONI VIETATE
- Vietato rompere layout, animazioni o skin.
- Vietato tradurre testo di test harness/debug-only.
- Vietato rimuovere test senza equivalente valido.

ASSUNZIONI
- I18N-001 ha i18next pronto con namespace `idleVillage`.
- I18N-002 ha già migrato tooltip e interaction mode.

REGRESSION SAFEGUARDS
- npm run lint -- src/ui/idleVillage
- npm run test -- tests/unit/idleVillage/
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se un componente richiede rifattorizzazione strutturale.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-003c-narrative-ftue-map-scheduler-<YYYY-MM-DD>.log`
3. Report finale con: componenti coperti, chiavi aggiunte, test aggiornati, pseudo-locale testata.

NOTE
- Lavorare per componente; non spazzare tutto in un unico grande diff.
- Documentare nel log qualsiasi stringa diagnostic-only non estratta.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-003c-narrative-ftue-map-scheduler-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `idle-village-task` (per tutti i file sotto `src/ui/idleVillage/**`)

CONTEXTO ATTUALE
- I18N-001 e I18N-002 devono essere `Completati`.
- `NarrativePanel`, `VillageSandbox`, `MinimalGameplayPage` e `MultiVillageSchedulerMonitor` contengono testo player-facing hardcoded.
- I test esistenti fanno spesso assert su testo esatto; devono essere migrati su `data-testid` o chiavi.
- `PROJECT_PHILOSOPHY.md` richiede config-first, Style Lab tokens, `trackTelemetryEvent` per `translation_missing`/`translation_fallback_used`.

CRITERI DI ACCETTAZIONE
- I componenti target non contengono testo player-facing hardcoded; usano `t('idleVillage:...')` o `<Trans i18nKey="..." />`.
- Chiavi strutturate `namespace:domain.section.key` (es. `idleVillage:narrative.intro`, `idleVillage:scheduler.title`).
- Metadata `context` e `maxLength` aggiunti per le chiavi che ne hanno bisogno.
- `public/locales/pseudo/idleVillage.json` aggiornato e testato.
- Layout, animazioni e skin non devono regredire.
- Test con assert su testo esatto aggiornati o riscritti con `data-testid`.

STRATEGIA DI TESTING
- `npm run i18n:extract` (o scansione) per trovare stringhe residue.
- `npm run i18n:validate` per verificare chiavi mancanti.
- `npm run test -- tests/unit/idleVillage/` per aggiornare e far passare i test.
- `npm run test:visual` (se disponibile) per pseudo-locale su `/test` e `/idle-village`.
- `npm run build:check`, `npm run lint -- src/ui/idleVillage`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 2: annotare `narrative`, `ftue`, `map`, `scheduler` come completati.
- `src/docs/docs/plans/idle_village_plan.md` e component fact sheets: annotare namespace e chiavi usate.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001 e I18N-002.
- Può partire in parallelo con I18N-003a e I18N-003b.
- Non deve sovrapporsi in modo concorrenziale con I18N-002 (tooltip/interaction).
```

---

## I18N-004: Localization Tooling & Validation

```text
AGENT
Tooling Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Rendere automatizzata l'estrazione delle chiavi, la validazione dei key mancanti, la generazione tipi e la pseudo-locale.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/i18n/extractKeys.ts
- [nuovo] scripts/i18n/validateKeys.ts
- [nuovo] scripts/i18n/generatePseudo.ts
- [nuovo] scripts/i18n/auditKeys.ts
- [nuovo] tests/i18n/i18n.test.ts
- [modifica] package.json
- [modifica] src/localization/i18n.types.ts
- [modifica] public/locales/pseudo/**/*.json

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 3

DIPENDENZE
- I18N-001 completato

OPERAZIONI DA ESEGUIRE
1. Configurare `i18next-parser` per scansionare `src/ui/**/*.{ts,tsx}` e scrivere `public/locales/$LOCALE/$NAMESPACE.json`.
2. Implementare `scripts/i18n/extractKeys.ts` che esegue `i18next-parser` con configurazione custom.
3. Implementare `scripts/i18n/validateKeys.ts` che verifica che ogni chiave usata nel codice esista in `public/locales/en/*.json`.
4. Implementare `scripts/i18n/generatePseudo.ts` che genera `pseudo` locale da `en` con expansion e accenti.
5. Implementare `scripts/i18n/auditKeys.ts` che stampa key mancanti per namespace.
6. Aggiungere script npm: `i18n:extract`, `i18n:validate`, `i18n:build-pseudo`, `i18n:audit`.
7. Aggiungere test `tests/i18n/i18n.test.ts` per missing-key e pseudo-locale consistency.
8. Aggiornare `i18next-resources-for-ts` e script `i18n:types` per rigenerare tipi automaticamente.

OPERAZIONI VIETATE
- Vietato modificare file JSON manualmente se `i18n:extract` li sovrascriverebbe senza backup.
- Vietato introdurre dipendenze non necessarie.
- Vietato committare JSON `pseudo` non rigenerato.

ASSUNZIONI
- `i18next-parser` è installato come dev dependency.
- I key nel codice usano sintassi `t('namespace:key')` o `<Trans i18nKey="namespace:key" />`.

REGRESSION SAFEGUARDS
- npm run i18n:extract
- npm run i18n:validate
- npm run i18n:types
- npm run test -- tests/i18n/
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker se `i18next-parser` non supporta la sintassi `t` wrapper del progetto.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-004-tooling-<YYYY-MM-DD>.log`
3. Report finale con: comandi funzionanti, CI step definito, zero key mancanti in `en`.

NOTE
- Documentare la naming convention `namespace:domain.section.key`.
- CI: eseguire `i18n:extract --fail-on-update` per bloccare PR con key non estratte.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-004-tooling-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `localization` + tooling TypeScript/CLI

CONTEXTO ATTUALE
- I18N-001 deve essere `Completato` con `i18next` e `public/locales/en/` iniziale.
- Il repo usa `tsx` per CLI (es. `scripts/`). Non e richiesto un bundler separato per gli script i18n.
- `i18next-parser` e `i18next-resources-for-ts` sono installati in devDependencies.
- I key nel codice usano la sintassi `t('namespace:key')` o `<Trans i18nKey="namespace:key" />`.

CRITERI DI ACCETTAZIONE
- `scripts/i18n/extractKeys.ts` esegue `i18next-parser` e scrive/aggiorna `public/locales/$LOCALE/$NAMESPACE.json`.
- `scripts/i18n/validateKeys.ts` verifica che ogni chiave usata in `src/` esista in `public/locales/en/*.json` e restituisce exit code 1 su mismatch.
- `scripts/i18n/generatePseudo.ts` (o `buildPseudo.ts`) genera `public/locales/pseudo/*.json` da `en` con expansion >= 30% e `!!` wrapper.
- `scripts/i18n/auditKeys.ts` stampa chiavi mancanti/obsolete per namespace.
- `scripts/i18n/generateTypes.ts` rigenera `src/localization/i18n.types.ts` da `public/locales/en/*.json`.
- `package.json` include `i18n:extract`, `i18n:validate`, `i18n:build-pseudo`, `i18n:types`, `i18n:audit`.
- CI step: `i18n:extract --fail-on-update` (o `i18n:validate`) per bloccare PR con key non estratte.
- `tests/i18n/i18n.test.ts` verifica missing-key e pseudo-locale consistency.

STRATEGIA DI TESTING
- `npm run i18n:extract` non sovrascrive commenti/entry manuali non presenti nel codice (configurare `i18next-parser` `keepRemoved` a `false` per entry obsolete e `true` per commenti).
- `npm run i18n:validate` passa con zero key mancanti in `en`.
- `npm run i18n:types` rigenera tipi coerenti con `en`.
- `npm run i18n:build-pseudo` produce JSON validi e pseudo-locale consistente.
- `npm run test -- tests/i18n/` passa.
- `npm run build:check`, `npm run lint`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 3: elencare script e CI step.
- `README.md` o `docs/localization/TOOLING.md`: documentare `namespace:domain.section.key` e il workflow extract/validate/pseudo/types.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001.
- Può partire in parallelo con I18N-002 e I18N-003, ma non può essere `Completato` finché i namespace `idleVillage`/`common` non sono stabili. Una volta stabili, diventa prerequisito per CI e per I18N-005/006/007.
```

---

## I18N-005: Wider Project Localization

```text
AGENT
UI Localization Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Estendere i namespace a Balancer, Spell, StyleLab, STS, Wanderlust e Lore surfaces, sostituendo testo hardcoded con chiavi ICU.

PROMPT READINESS
FILE TARGET
- [nuovo] public/locales/en/balancing.json
- [nuovo] public/locales/en/spell.json
- [nuovo] public/locales/en/styleLab.json
- [nuovo] public/locales/en/sts.json
- [nuovo] public/locales/en/wanderlust.json
- [nuovo] public/locales/en/lore.json
- [nuovo] public/locales/en/errors.json
- [modifica] src/balancing/config/lore/loreDropSamples.ts
- [modifica] src/balancing/config/lore/loreDropTypes.ts
- [modifica] src/ui/idleVillage/hooks/useQuestLoreDrop.ts
- [modifica] src/ui/balancing/**/*.tsx
- [modifica] src/ui/spell/**/*.tsx
- [modifica] src/ui/styleLab/**/*.tsx
- [modifica] src/ui/moodboard/**/*.tsx
- [modifica] src/ui/wanderlust/**/*.tsx
- [modifica] src/App.tsx o router per preload namespace on route

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 4

DIPENDENZE
- I18N-001, I18N-004 completati

OPERAZIONI DA ESEGUIRE
1. Creare i file JSON `en` per ogni namespace: `balancing`, `spell`, `styleLab`, `sts`, `wanderlust`, `lore`, `errors`.
2. Estrarre stringhe da ogni area, incluse le Lore Drop in `src/balancing/config/lore/loreDropSamples.ts` e i sample del piano `lore_system_plan.md`, priorizzando testo player-facing.
3. Sostituire JSX/const hardcoded con `t('namespace:...')` o `Trans`; per i testi di lore usare `t('lore:...')` anche in `src/ui/idleVillage/hooks/useQuestLoreDrop.ts` e `src/ui/idleVillage/components/QuestChronicle.tsx` (flavor text).
4. Aggiungere `i18n.changeLanguage` preload per namespace nel route guard o nel componente radice.
5. Generare pseudo-locale per ogni namespace, incluso `lore`.
6. Aggiornare test che dipendono da testo esatto.
7. Aggiungere `errors.json` per messaggi globali (error boundary, fallback).
8. Migrare `src/balancing/config/lore/loreDropSamples.ts` (e `loreEntries.ts` se presente) in `public/locales/en/lore.json` (e pseudo); aggiornare `LoreDrop`/`LoreEntry`/`LoreFragment` per usare chiavi i18n (es. `titleKey`/`bodyKey` o `title`/`body` risolti da `t`) senza perdere category/tags/weight/metadata.

OPERAZIONI VIETATE
- Vietato caricare tutti i namespace all'avvio (deve essere lazy).
- Vietato introdurre stringhe hardcoded nuove.
- Vietato tradurre testo di demo/debug interno se non player-facing.

ASSUNZIONI
- `i18next` è configurato con namespace support.
- `i18n:extract` e `i18n:validate` funzionano.

REGRESSION SAFEGUARDS
- npm run i18n:extract
- npm run i18n:validate
- npm run lint -- src/ui/balancing src/ui/spell src/ui/styleLab src/ui/wanderlust
- npm run test:unit
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker se un'area richiede rifattorizzazione strutturale per accettare le chiavi.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-005-wider-coverage-<YYYY-MM-DD>.log`
3. Report finale con: namespace creati, key estratte per area, test aggiornati.

NOTE
- Focus su testo player-facing; non estrarre testo di tool di sviluppo invisibile all'utente.
- Documentare nel log qualsiasi namespace con eccezioni.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-005-wider-coverage-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `localization` + conoscenza delle singole superfici (Balancer, Spell, StyleLab, STS, Wanderlust, Lore)

CONTEXTO ATTUALE
- I18N-001, I18N-003 e I18N-004 devono essere `Completati`.
- `src/ui/balancing/`, `src/ui/spell/`, `src/ui/styleLab/`, `src/ui/moodboard/` (per STS?), `src/ui/wanderlust/`/`src/ui/wanderlust-surface/` contengono testo player-facing hardcoded.
- `src/balancing/config/lore/loreDropSamples.ts` contiene testi lore hardcoded in italiano; `src/ui/idleVillage/hooks/useQuestLoreDrop.ts` e `src/ui/idleVillage/components/QuestChronicle.tsx` (flavor text) renderizzano lore.
- `src/App.tsx` o il router gestiscono il caricamento lazy; ogni namespace deve essere caricato su richiesta.
- `errors.json` deve contenere messaggi globali per error boundary, fallbacks e notifiche.
- `docs/plans/lore_system_plan.md` (o `src/docs/docs/plans/lore_system_plan.md`) definisce le entità Lore, LoreFragment e LoreBook; i testi vanno nel namespace `lore`.

CRITERI DI ACCETTAZIONE
- Creati `public/locales/en/{balancing,spell,styleLab,sts,wanderlust,lore,errors}.json` con chiavi strutturate `namespace:domain.section.key`.
- Pseudo-locale generata per ogni nuovo namespace, incluso `lore`.
- Testo player-facing sostituito con `t('namespace:...')` o `Trans` nelle aree indicate; i testi di lore usano `t('lore:...')`.
- Lazy loading: `i18n.loadNamespaces` o `useTranslation(ns, { useSuspense: false })` usato nelle route principali; nessun namespace caricato all'avvio oltre `common`/`idleVillage` se necessario.
- `src/balancing/config/lore/loreDropSamples.ts` non contiene più testi hardcoded; i sample sono in `public/locales/en/lore.json`.
- Nessuna nuova stringa hardcoded player-facing.
- `i18n:extract` e `i18n:validate` passano per tutti i namespace.
- Test con testo esatto aggiornati.

STRATEGIA DI TESTING
- `npm run i18n:extract` per catalogare nuove stringhe.
- `npm run i18n:validate` per verificare chiavi mancanti in tutti i namespace.
- `npm run test:unit` per test area-specific aggiornati (inclusi `tests/unit/lore/` se presenti).
- `npm run build:check` per assicurarsi che i chunk lazy siano corretti.
- `npm run lint -- src/ui/balancing src/ui/spell src/ui/styleLab src/ui/wanderlust src/balancing/config/lore`.
- `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 4: aggiornare namespace coverage e route preload, incluso `lore`.
- `docs/plans/lore_system_plan.md` / `src/docs/docs/plans/lore_system_plan.md`: aggiornare con le convenzioni i18n per title/body/fragment.
- `docs/components/*.md` per componenti toccati: indicare namespace e chiavi usate.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-001, I18N-003 e I18N-004.
- Si può dividere per namespace e assegnare in parallelo a più agenti (`I18N-005-balancing`, `I18N-005-spell`, `I18N-005-styleLab`, `I18N-005-sts`, `I18N-005-wanderlust`, `I18N-005-lore`, `I18N-005-errors`). Ogni sotto-task deve rispettare i criteri sopra e non dipendere da altri sotto-namespace. `I18N-005-lore` può includere `loreDropSamples`/`loreDropTypes`/`useQuestLoreDrop`/`QuestChronicle` flavor text.
```

---

## I18N-006: Advanced Localization - ICU, Date/Number, RTL, Fonts

```text
AGENT
Localization & Rendering Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Aggiungere plurali/select ICU, formattazione data/numeri, supporto RTL e strategia font stack per tutte le lingue target.

PROMPT READINESS
FILE TARGET
- [modifica] public/locales/en/**/*.json (aggiungere plurali e select)
- [modifica] src/localization/LocaleConfig.ts
- [modifica] src/localization/LocaleConfigStore.ts
- [modifica] src/ui/**/utils o hooks che usano date-fns
- [modifica] tailwind.config.js o theme config per font-family
- [nuovo] src/localization/rtlUtils.ts
- [nuovo] public/locales/ar/common.json (opzionale, stub per RTL)
- [nuovo] public/locales/de/**/*.json (per expansion test)
- [modifica] playwright.config.ts e visual tests per pseudo/de/ar

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 5

DIPENDENZE
- I18N-001 e I18N-005 completati

OPERAZIONI DA ESEGUIRE
1. Aggiungere esempi ICU plural/select nei bundle `en` (es. `swordCount`, `riskLevel`).
2. Sostituire `date-fns` con `Intl.DateTimeFormat` ove appropriato per formattazione locale.
3. Aggiungere `Intl.NumberFormat` per valori numerici, percentuali, valute.
4. Aggiungere helper RTL in `src/localization/rtlUtils.ts` e aggiornare `LocaleConfigStore` per impostare `html lang` e `dir`.
5. Aggiungere font-family tokens per locale in `LocaleConfig` e Tailwind config: Noto Sans, Noto Sans Arabic, Source Han Sans SC/TC/JP/KR.
6. Aggiungere `de` locale per test expansion 30-40%.
7. Aggiungere `ar` locale stub per test RTL (opzionale).
8. Aggiungere snapshot Playwright per `pseudo`, `de`, `ar` nelle pagine principali.

OPERAZIONI VIETATE
- Vietato attivare layout mirroring RTL senza verificare ogni componente critico.
- Vietato rimuovere `date-fns` completamente se usato per logica temporale (sostituire solo formattazione).
- Vietato committare font pesanti senza subsetting.

ASSUNZIONI
- Tailwind CSS 4 supporta `rtl:`/`ltr:` prefixes e logical properties.
- Browser supporta `Intl` APIs.
- I18N-005 ha coperto tutte le superfici.

REGRESSION SAFEGUARDS
- npm run i18n:extract
- npm run i18n:validate
- npm run lint
- npm run test:unit
- npm run build:check
- npm run kanban:lint
- npm run test:visual (dove esistente)

AUTONOMIA & CHECK-IN
- Autonomia media-bassa; apri blocker per decisioni su font CJK o RTL layout mirroring.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-006-advanced-<YYYY-MM-DD>.log`
3. Report finale con: plurali funzionanti, date/numeri localizzati, RTL rilevato, font stack documentato.

NOTE
- RTL è un feature UI-system; non attivare in produzione senza QA specifico.
- Documentare nel log la strategia font per CJK e Arabic.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-006-advanced-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `localization` + CSS/Tailwind e visual testing

CONTEXTO ATTUALE
- I18N-005 deve essere `Completato`.
- `date-fns` e usato nel progetto per logica temporale, non solo formattazione; non rimuoverlo.
- `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.PluralRules` sono disponibili in tutti i browser target.
- Tailwind CSS 4 supporta prefissi `rtl:`/`ltr:` e proprieta logiche (`ms-`, `me-`, `start`, `end`).
- Il font stack attuale e `Cinzel`, `Crimson Text`, `Lato` (Gilded Observatory); per CJK/Arabic serve Noto/Source Han.

CRITERI DI ACCETTAZIONE
- Bundle `en` contengono esempi ICU plural/select (es. `swordCount`, `riskLevel`, `characterGreeting`).
- `date-fns` rimane per calcoli temporali; `Intl.DateTimeFormat` usato per render locale-aware di date.
- `Intl.NumberFormat` usato per percentuali, valute, decimali nelle UI.
- `src/localization/rtlUtils.ts` esporta `getLocaleDirection(locale)` e `isRTL(locale)`.
- `LocaleConfig`/`LocaleConfigStore` impostano `document.documentElement.lang` e `document.documentElement.dir` al cambio lingua.
- Font-family tokens per `en`/`de`/`ar`/`ja`/`zh-CN` aggiunti a `LocaleConfig` e a `tailwind.config.js` (estensione del theme `fontFamily`).
- Locale `de` aggiunto per test di espansione 30-40%; `ar` locale stub per RTL (opzionale ma consigliato).
- Snapshot Playwright/VRT per `pseudo`, `de`, `ar` nelle pagine principali (`/`, `/idle-village`, `/balancer`, `/punch-club`).
- RTL non e attivato in produzione; e solo testabile e documentato.

STRATEGIA DI TESTING
- Unit test ICU plural/select in `tests/i18n/i18n.test.ts`.
- Unit test `rtlUtils` e `LocaleConfigStore` per `lang`/`dir`.
- Visual regression `npm run test:visual` per `pseudo`/`de`/`ar` (se disponibile).
- `npm run i18n:extract`, `npm run i18n:validate`, `npm run i18n:types`.
- `npm run build:check`, `npm run lint`, `npm run test:unit`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 5: aggiornare con font/RTL/ICU.
- `docs/localization/TRANSLATION_GUIDE.md` (verra creato in I18N-007): aggiungere sezione font e RTL.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-005.
- Può partire in parallelo con I18N-007 (TMS/LQA) perche entrambi dipendono da I18N-005, ma I18N-007 non richiede ICU/RTL. Non attivare RTL in I18N-007 se I18N-006 non e ancora completato.
```

---

## I18N-007: TMS Export / Import & LQA Pipeline

```text
AGENT
Localization Pipeline Engineer

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare script di export/import per Translation Management System (TMS) e modalità in-game LQA per mostrare key e contesto.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/i18n/exportTms.ts
- [nuovo] scripts/i18n/importTms.ts
- [nuovo] src/ui/components/LQAOverlay.tsx (o equivalente)
- [nuovo] docs/localization/TRANSLATION_GUIDE.md
- [modifica] package.json
- [modifica] src/App.tsx per toggle LQA mode

DATO DI ORIGINE
- Piano: src/docs/docs/plans/game_localization_implementation_plan.md §6 Fase 6

DIPENDENZE
- I18N-004 e I18N-005 completati

OPERAZIONI DA ESEGUIRE
1. Implementare `exportTms.ts` per convertire `public/locales/en/*.json` in XLIFF 1.2 con `context` e `maxLength`.
2. Implementare `importTms.ts` per mergiare file XLIFF/PO esportati in `public/locales/<locale>/*.json`.
3. Aggiungere modalità LQA (overlay key e contesto) attivabile tramite query param o config.
4. Creare `docs/localization/TRANSLATION_GUIDE.md` con tone, glossario, abbreviazioni e style guide.
5. Aggiungere script npm: `i18n:export`, `i18n:import`.
6. Verificare che metadata vengano preservati in round-trip export/import.

OPERAZIONI VIETATE
- Vietato committare file XLIFF/PO generati nel repo (usare `.gitignore` o `dist/`).
- Vietato esporre API key TMS nel codice.

ASSUNZIONI
- I18N-004 ha tooling valido.
- I file JSON hanno struttura flat o gerarchica compatibile con XLIFF.

REGRESSION SAFEGUARDS
- npm run i18n:export
- npm run i18n:import
- npm run i18n:validate
- npm run build:check
- npm run kanban:lint

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker per decisioni su formato TMS o vendor.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/i18n-007-tms-lqa-<YYYY-MM-DD>.log`
3. Report finale con: export/import funzionanti, round-trip testato, LQA mode attivabile.

NOTE
- Documentare come collegare Crowdin/Lokalise/Tolgee CLI a `public/locales`.
- LQA mode non deve essere accessibile in build produzione.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/i18n-007-tms-lqa-<YYYY-MM-DD>.log

SKILL RICHIESTE
- `agent-execution-mandate`
- `localization` + CLI tooling e opzionalmente esperienza TMS (Crowdin/Lokalise/Tolgee)

CONTEXTO ATTUALE
- I18N-004 e I18N-005 devono essere `Completati`.
- I JSON di origine sono in `public/locales/en/*.json` e `public/locales/pseudo/*.json`.
- I18N-006 (RTL/font) e in parallelo; non richiedere RTL per il round-trip XLIFF.
- Il repo non deve contenere API key TMS o file XLIFF/PO generati in git (usare `.gitignore` o `dist/`).

CRITERI DI ACCETTAZIONE
- `scripts/i18n/exportTms.ts` converte `public/locales/en/*.json` in XLIFF 1.2 per namespace, preservando `context` e `maxLength`.
- `scripts/i18n/importTms.ts` mergia file XLIFF/PO esportati in `public/locales/<locale>/*.json`, aggiornando solo chiavi esistenti o nuove senza perdere metadata.
- Round-trip export -> import non perde chiavi e produce JSON valido; `npm run i18n:validate` passa.
- `package.json` include `i18n:export` e `i18n:import`.
- `LQAOverlay` (o componente equivalente) mostra key e contesto sopra gli elementi UI; attivabile tramite query param `?lqa=true` o `?lqa=1` in dev mode.
- `docs/localization/TRANSLATION_GUIDE.md` esiste con tone, glossario, abbreviazioni, style guide e istruzioni per TMS.
- Nessun endpoint o API key esposto; nessun file XLIFF/PO committato nel repo.
- LQA mode non e inclusa nella build produzione (tree-shake o `import.meta.env.DEV` guard).

STRATEGIA DI TESTING
- `npm run i18n:export` produce XLIFF validi.
- `npm run i18n:import` con XLIFF di esempio (locale `it`/`de`) produce JSON corrispondenti.
- `npm run i18n:validate` passa dopo round-trip.
- Test unit per `exportTms`/`importTms` in `tests/i18n/`.
- Test RTL per `LQAOverlay` (render in dev mode, non render in produzione).
- `npm run build:check`, `npm run lint`, `npm run test:unit`, `npm run kanban:lint`.

AGGIORNAMENTI DOCUMENTALI
- `src/docs/docs/plans/game_localization_implementation_plan.md` §6 Phase 6: segnare TMS/LQA e Translation Guide come completati.
- Creare `docs/localization/TRANSLATION_GUIDE.md` se non esiste.
- `docs/localization/TRANSLATION_GUIDE.md` include sezione per collegare Crowdin/Lokalise/Tolgee CLI a `public/locales`.
- `strategy_tasks.md` e `agent_assignments.md` via `/kanban-update`.

NOTE DI PARALLELISMO
- Dipende da I18N-004 e I18N-005.
- Può partire in parallelo con I18N-006 (Advanced) perche non dipende da ICU/RTL. Se I18N-006 e in corso, non produrre LQA per `ar` finche I18N-006 non e stabile.
```

---

## Priorità Esecuzione

1. **I18N-001** (Foundation) — bloccante per tutti
2. **I18N-002** (Tooltip & Interaction Mode) — parallelo a I18N-001 se adapter pronto
3. **I18N-004** (Tooling) — bloccante per CI e validazione
4. **I18N-003** (Idle Village Core) — dipende da I18N-001/002
5. **I18N-005** (Wider Coverage) — dipende da I18N-003/004
6. **I18N-006** (Advanced) — dipende da I18N-005
7. **I18N-007** (TMS/LQA) — dipende da I18N-004/005

---

## Success Criteria Complessivi

- ✅ i18next installato e configurato con ICU
- ✅ Provider root e store locale asincrono con `PersistenceService`
- ✅ Namespace `idleVillage` completamente estratto
- ✅ Tooling automatico per extract/validate/types/pseudo
- ✅ Pseudo-locale rivela overflow UI prima di traduzioni
- ✅ Superfici Balancer/Spell/StyleLab/STS/Wanderlust localizzabili
- ✅ ICU plurali/select funzionanti
- ✅ RTL e font stack documentati/testabili
- ✅ Export/import TMS e LQA mode disponibili
- ✅ `build:check`, `lint`, `kanban:lint` passano

---

## Note per Coordinator

### Mandato

- Agisci come coordinator. Prima di assegnare un prompt verifica che non esista già in `agent_assignments.md` in stato `In corso` o `Completato`.
- Ogni assegnazione deve usare esclusivamente la frase: `@Cascade prendi <PROMPT_ID> (vedi localization_prompts.md) usando la skill pertinente.`
- I prompt possono essere passati a più agenti solo se esplicitamente paralleli (vedi `NOTE DI PARALLELISMO` in ogni prompt).

### Sequenza di assegnazione

1. **I18N-001** (Foundation) — bloccante per tutti. Non assegnare altri I18N fino a `Completato`.
2. **I18N-002** (Tooltip & Interaction Mode) e **I18N-004** (Tooling) — possono partire in parallelo appena I18N-001 è `Completato`.
3. **I18N-003** (Idle Village Core) — dipende da I18N-001 e I18N-002; può essere diviso in sottoprompt per componente se necessario.
4. **I18N-005** (Wider Coverage) — dipende da I18N-003 e I18N-004; può essere diviso per namespace.
5. **I18N-006** (Advanced) e **I18N-007** (TMS/LQA) — dipendono da I18N-005; possono partire in parallelo.

### Regole di assegnazione

- Verificare che ogni agente invochi `agent-execution-mandate` e la skill appropriata prima di modificare i file.
- Per I18N-002 e I18N-003 richiedere esplicitamente `idle-village-task`.
- Per I18N-001, I18N-004, I18N-005, I18N-006, I18N-007 la skill base `localization` e sufficiente, ma l'agente deve consultare `PROJECT_PHILOSOPHY.md` per config-first e `PersistenceService` per persistenza.
- Bloccare task successivi finché il precedente non è `Completato` e l'evidence log `test-results/<prompt-id>-<YYYY-MM-DD>.log` e presente.
- Se un prompt e troppo grande (es. I18N-003 o I18N-005), crearne sottoprompt numerati (`I18N-003a`, `I18N-005-balancing`, ecc.) e aggiornare `agent_assignments.md` e `strategy_tasks.md`.

### Aggiornamento Kanban

- Quando un prompt viene preso in carico: `agent_assignments.md` -> `In corso` con nome agente e data.
- Quando un prompt viene consegnato: `agent_assignments.md` -> `Completato` con link all'evidence log; `strategy_tasks.md` -> `Completato` con data.
- I prompt completati rimangono tracciati solo nella documentazione (`strategy_tasks.md`, evidence log), non come righe attive sul Kanban.
