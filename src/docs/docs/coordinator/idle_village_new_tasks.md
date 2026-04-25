# Idle Village – Nuovi Task Strategici (Feb 2026)

1. **NP-350 – Premium SFX Pack Integration**
   - Owner: Audio-Manager (dipende da NP-231 Audio System Manager)
   - Scope: acquistare pacchetto Fantasy UI SFX (€20‑30), importarlo nel player condiviso e mappare click/coin/level-up/notifica.
   - SAFE suite: lint, test, build, kanban.
   - Evidence atteso: `test-results/np-350-fantasy-sfx.log`.

2. **NP-351 – Telemetry MVP (Idle Village)**
   - Owner: Telemetry-Agent
   - Scope: integrare logger eventi anonimo (PostHog o backend proprietario) con eventi minimi `level_up`, `death`, `quit`, `sop_assignment`, `resource_zero`, opt-out GDPR e ID run pseudonimo.
   - SAFE suite: lint, test, build, kanban.
   - Evidence: `test-results/np-351-telemetry.log`.

3. **NP-352 – Studio Naming Decision**
   - Owner: Coordinator
   - Scope: definire il brand ufficiale (nome studio) per Steam Store / press-kit; finché il nome non è deciso, bloccare asset marketing che richiedono branding. Aggiornare `idle_village_plan.md` §2.1 una volta scelto.
