# Alt Visuals v8 – "Obsidian Meridian" (Removed)

<!-- markdownlint-disable MD013 -->

> **Stato:** **RIMOSSO COMPLETAMENTE** il 2026‑01‑07. Tutti i file v8 sono stati eliminati dal repo, referenze rimosse dal codice, e la documentazione aggiornata. Il laboratorio SkillCheck Preview rimane V6 Asterism-only.

## Azioni di Decommissioning Completate

- **Rimozione file v8**: Eliminati tutti i componenti e file correlati:
  - `src/ui/testing/AltVisualsV8ObsidianField.tsx`
  - `src/ui/testing/useAltVisualsV8Quality.ts`
  - `src/ui/altVisuals/utils/pixiV8Loader.ts`
  - `src/ui/testing/altVisualsV8Theme.ts`
- **Pulizia referenze**: Rimosso interface `AltVisualsV8Theme` da `axisTypes.ts` e commenti v8 da file correlati
- **Verifica completata**: Nessuna referenza attiva a v8 rimane nel codice base
- **Documentazione aggiornata**: Questo documento ora riflette lo stato finale di rimozione

## Dove trovare i dettagli storici

- [alt_visuals_v8_archive.md](alt_visuals_v8_archive.md) conserva il piano completo (asset list, architettura PIXI, checklist). È sola consultazione storica.
- [skill_check_preview_lab_plan.md](skill_check_preview_lab_plan.md) descrive il laboratorio esclusivamente in chiave V6.

## Stato corrente SkillCheck Preview

- Visuale ufficiale: **V6 Asterism** (colonne cinematiche + dispatch polygon deterministico).
- Nessun tab o componente v8 presente nel codebase.
- QA e Playwright devono verificare esclusivamente la resa V6.

## Note Finali

v8 è stato completamente rimosso dal repository. Qualsiasi futuro lavoro su alt visuals dovrà:
1. Creare una nuova Wave con approvazione WS
2. Partire da zero con nuova architettura
3. Rispettare i guardrail prestazionali che hanno causato il rollback di v8

Finché queste condizioni non verranno soddisfatte, Alt Visuals V8 è considerato completamente decommissioned.
