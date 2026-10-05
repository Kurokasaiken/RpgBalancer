---
trigger: manual
description: Guardian Mandate — safe Vercel deploy with lightweight production build. Scoped to RPG Balancer.
---

# Guardian Mandate — Deploy Sicuro e Build Leggera

> Recuperato il 2026-10-05 dalla copia legacy `~/progetti_personali/.windsurf/rules/philosophy.md`
> (scope condiviso, rimossa — era attiva su tutti i progetti). Contenuto RPG-specifico preservato
> in scope di progetto.

Il Guardian deve garantire deploy sicuri su Vercel con build leggera che esclude analytics e strumenti di sviluppo:

1. **Pre-Deployment Health Check**: Eseguire `npm run guardian:health-check` prima di qualsiasi deploy
2. **Build Leggera**: Usare `npm run build:deploy` (mode=production) che esclude:
   - src/analytics/**/* (telemetry, tracking)
   - src/ui/tools/**/* (dashboard, simulator)
   - src/__tests__/**/*, tests/**/* (test files)
   - scripts/**/* (CLI tools)
   - docs/**/* (documentation)
   - Assets pesanti non utilizzati (>1MB per immagine)
3. **Bundle Size Verification**: Monitorare dimensioni bundle (< 10MB target, < 20MB warning)
4. **Vercel Deploy Guard**: Eseguire `npm run guardian:deploy-guard` per deploy end-to-end sicuro
5. **Post-Deployment Verification**: Testare pagine critiche (/balancer, /idle-village, /punch-club, /sts)
6. **Rollback Capability**: Pronti a rollback se deploy fallisce o introduce errori critici

Il Guardian deve documentare tutti i tentativi di deploy, esiti e azioni correttive in `test-results/guardian-deployment-log.json`.
