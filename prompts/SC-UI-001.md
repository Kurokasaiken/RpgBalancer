# SC-UI-001 — Spell Creator Modern UI Migration (Test Hub)

**AGENT:** harness

**OBIETTIVO:**
Crea una nuova pagina di test `/spell-creator` nel Test Hub come versione modernizzata di `src/ui/spells/SpellCreatorNew.tsx`. La pagina deve preservare **tutta la logica e il comportamento** di `SpellCreatorNew`, ma adottare i colori e i componenti corretti (Arcane Tech Glass), il sistema di skin, l’i18n e le invariants del progetto. Non deve essere toccata la pagina originale, né il suo sistema di componenti in `src/ui/spell/components/*`.

**FILE TARGET:**
- `src/ui/spells/SpellCreatorTestPage.tsx`
- `src/pages/spell-creator.tsx`
- `src/ui/spells/theme/arcane-tech-glass.css`
- `src/ui/spells/components/SpellInfoForm.tsx`
- `src/ui/spells/components/SpellIdentityCard.tsx`
- `src/ui/spells/components/StatsGrid.tsx`
- `src/ui/spells/components/ActionsBar.tsx`
- `src/ui/spells/components/EnhancedStatSlider/*`
- `src/ui/idleVillage/TestHub.tsx`
- `src/App.tsx`
- `src/docs/docs/idle_village/test_hub_pages.md`
- `public/locales/en/spell.json`
- `public/locales/pseudo/spell.json`
- `test-results/SC-UI-001-<YYYY-MM-DD>.log`

**RIFERIMENTI (DA LEGGERE PRIMA DI INIZIARE):**
- `src/docs/docs/plans/spell_creator_new_plan.md`
- `src/ui/spells/SpellCreatorNew.tsx`
- `src/ui/spells/SpellCreatorNewMockup.tsx`
- `src/ui/spell/components/SpellInfoForm.tsx`
- `src/ui/spell/components/SpellIdentityCard.tsx`
- `src/ui/spell/components/StatsGrid.tsx`
- `src/ui/spell/components/ActionsBar.tsx`
- `src/ui/spell/components/EnhancedStatSlider/*`
- `src/ui/styleLab/tokens/gilded-observatory.css`
- `.windsurf/rules/00-project-invariants.md`
- `.windsurf/rules/10-ui-invariants.md`
- `.windsurf/rules/PROJECT_PHILOSOPHY.md`

**DIPENDENZE:**
- Nessuna.

**INVARIANTI (NON DEROGABILI):**
- Non modificare `src/ui/spells/SpellCreatorNew.tsx` né `src/ui/spells/SpellCreatorNewMockup.tsx`.
- Non modificare alcun file in `src/ui/spell/components/*`.
- Non modificare `src/ui/atoms/GlassCard.tsx` né `src/ui/atoms/GlassButton.tsx`: usa gli atomi esistenti passando `className` per applicare il tema Arcane.
- Tutti i colori e i valori visivi devono essere definiti in `src/ui/spells/theme/arcane-tech-glass.css` come variabili CSS; nessun colore hardcoded in JSX/TSX.
- Usa `useSkinPreferences` per legare la pagina al sistema di skin del progetto.
- Tutte le stringhe user-facing devono usare `useTranslation('spell')` e il namespace `spell` di `react-i18next`.
- Nessuna persistenza sincrona: ogni `save`/`load` deve passare per `PersistenceService` (`saveData` / `loadData`). Sostituisci i `localStorage.setItem` diretti presenti in `toggleCollapse` con `saveData` o rimuovili se non fanno parte del flusso canonico.
- La logica di business, i calcoli, gli handler e l’ordine dei componenti di `SpellCreatorNew` devono rimanere invariati; cambia solo la presentazione, gli import e le stringhe.
- JSDoc per ogni nuova funzione e componente.

**OPERAZIONI DA ESEGUIRE:**
1. Crea `src/ui/spells/theme/arcane-tech-glass.css` con il palette Arcane Tech Glass (indaco, ciano, vetro scuro, bordi sottili, ombre colorate). Esempio di variabili: `--spell-bg-primary`, `--spell-surface`, `--spell-text-primary`, `--spell-text-muted`, `--spell-accent-primary`, `--spell-accent-secondary`, `--spell-card-bg`, `--spell-card-border`, `--spell-input-bg`, `--spell-input-border`, `--spell-button-primary`, `--spell-button-primary-hover`, `--spell-button-secondary`, `--spell-button-secondary-hover`, `--spell-success`, `--spell-success-hover`, `--spell-danger`, `--spell-danger-hover`, `--spell-warning`. I valori devono derivare da `SpellCreatorNewMockup` e da `spell_creator_new_plan.md`.
2. Copia i componenti necessari da `src/ui/spell/components/` in `src/ui/spells/components/`:
   - `SpellInfoForm.tsx`
   - `SpellIdentityCard.tsx`
   - `StatsGrid.tsx`
   - `ActionsBar.tsx`
   - `EnhancedStatSlider/` (tutta la cartella, incluse `styles.module.css`)
   La logica resta identica; applica i18n e variabili CSS di Arcane. `StatsGrid` deve accettare e passare `getStatLabel` per tradurre le etichette degli stati. `EnhancedStatSlider` deve usare `useTranslation('spell')` per `placeholder`, `title` e testi dei pulsanti.
3. Crea `src/ui/spells/SpellCreatorTestPage.tsx` copiando il corpo di `SpellCreatorNew.tsx`. Sostituisci gli import con i componenti locali. Sostituisci `useState` per `targetBudget` e gli stati, gli handler, `useDefaultStorage`, `useSpellConfig` e i calcoli come in `SpellCreatorNew` (nessuna modifica logica). Sostituisci le classi `observatory-*` con classi `spell-creator-*` definite nel CSS. Sostituisci i `localStorage.setItem` diretti in `toggleCollapse` con `saveData` di `PersistenceService`. Usa `useSkinPreferences` e `useTranslation('spell')`.
4. Crea `src/pages/spell-creator.tsx` come thin wrapper che esporta `SpellCreatorTestPage` come default.
5. Registra la route `/spell-creator` in `src/App.tsx` con una `Suspense` standalone, analogo a `/v9-skin-sandbox` e `/poi-detail-verification`.
6. Aggiungi la pagina a `EXTRA_PAGES` in `src/ui/idleVillage/TestHub.tsx` con titolo, descrizione, path `/spell-creator`, icona ✨ e stato `ok`.
7. Aggiorna `src/docs/docs/idle_village/test_hub_pages.md` aggiungendo `/spell-creator` nella tabella delle pagine validate.
8. Aggiorna `public/locales/en/spell.json` e `public/locales/pseudo/spell.json` con tutte le chiavi usate. Esegui `npm run i18n:extract`, `npm run i18n:validate` e `npm run i18n:build-pseudo` per sincronizzare.
9. Aggiungi un test minimo (es. `tests/unit/spell/SpellCreatorTestPage.test.tsx` o `tests/e2e/spell-creator.spec.ts`) che verifichi che la pagina renderizzi, che non contenga stringhe hardcoded, e che la route `/spell-creator` sia raggiungibile. Se non esiste la directory `tests/unit/spell`, creala.
10. Esegui la safeguard suite e salva l’evidence log.

**OPERAZIONI VIETATE:**
- Modificare `SpellCreatorNew.tsx`, `SpellCreatorNewMockup.tsx` o qualsiasi componente in `src/ui/spell/components/*`.
- Modificare `src/ui/atoms/GlassCard.tsx` o `src/ui/atoms/GlassButton.tsx`.
- Creare nuove varianti permanenti di `GlassCard`/`GlassButton`; usa `className` per override temporanei.
- Usare `localStorage`/`sessionStorage` diretti.
- Hardcodare colori, font, spaziature o ombre in componenti TSX/TS.
- Usare `observatory-*` classi CSS deprecate.
- Aggiungere dipendenze esterne.

**ASSUNZIONI:**
- `useDefaultStorage` e `useSpellConfig` si possono riutilizzare come in `SpellCreatorNew`.
- Il namespace `spell` è già registrato in `src/localization/i18n.ts`.
- `BUFFABLE_STATS`, `SPELL_CORE_STATS`, `SPELL_ADVANCED_STATS`, `SPELL_OPTIONAL_STATS` e le funzioni di `spellBalancingConfig` non cambiano.
- L’agente può copiare file esistenti per poi modificarne solo presentazione e stringhe.

**SAFEGUARD:**
```bash
npm run lint -- src/ui/spells
npm run lint -- src/pages/spell-creator.tsx
npm run lint -- src/ui/idleVillage/TestHub.tsx
npm run lint -- src/App.tsx
npm run test -- tests/unit/spell
npm run i18n:validate
npm run i18n:build-pseudo
npm run build:check
npm run kanban:lint
```

**OUTPUT ATTESI:**
- `src/ui/spells/SpellCreatorTestPage.tsx` (logica identica, presentazione moderna)
- `src/pages/spell-creator.tsx`
- `src/ui/spells/theme/arcane-tech-glass.css`
- `src/ui/spells/components/SpellInfoForm.tsx`
- `src/ui/spells/components/SpellIdentityCard.tsx`
- `src/ui/spells/components/StatsGrid.tsx`
- `src/ui/spells/components/ActionsBar.tsx`
- `src/ui/spells/components/EnhancedStatSlider/index.tsx` e file correlati
- `src/ui/idleVillage/TestHub.tsx` aggiornato
- `src/App.tsx` aggiornato
- `src/docs/docs/idle_village/test_hub_pages.md` aggiornato
- `public/locales/en/spell.json` e `public/locales/pseudo/spell.json` aggiornati
- `test-results/SC-UI-001-<YYYY-MM-DD>.log`

**NOTE:**
- Quando prendi questo prompt, imposta la riga in `src/docs/docs/coordinator/agent_assignments.md` su `In corso` con data e nome agente.
- Al completamento, esegui la safeguard suite e chiudi con: `KANBAN STATUS: SC-UI-001 – Completato (Evidence: test-results/SC-UI-001-<YYYY-MM-DD>.log)`.
- Il Coordinator deve assegnare questo prompt a un agente UI/runtime e verificare che `SpellCreatorNew.tsx` originale non sia modificato.
