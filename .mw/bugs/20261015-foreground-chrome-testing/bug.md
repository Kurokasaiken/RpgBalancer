# BUG — Agente ha aperto Chrome for Testing in primo piano

**Data:** 2026-10-15
**Superficie:** comportamento agente / tooling di verifica
**Gravità:** violazione UX/governance (furto del focus del Director), non un difetto di runtime

## Sintomo

Durante una sessione di testing un agente ha aperto una finestra di **Chrome for
Testing** (il binario usato da Puppeteer) in primo piano, rubando il focus alla
finestra che il Director stava guardando.

Segnalazione verbatim del Director:

> "un agente ha aperto chrome d testing in primo piano, nn deve succedere.
> i plan devono prevedere che nn sia mai aperto in primo piano e tutte le skill
> devono sapere di nn aprire mai in automatico altre finestre in primo piano"

## Causa radice

Il divieto esisteva già a livello Mind Weaver (CTR-foreground-001,
`mind-weaver/.mw/contracts/ui-focus.md`), ma:

1. non era propagato nel repo RPG: nessuna regola in `.windsurf/rules/`, nessun
   bullet nelle skill, nessun vincolo nei template di plan/prompt;
2. il repo conteneva ~13 script con `headless: false` hardcoded
   (Puppeteer/Playwright) e 2 chiamate `open` in foreground — qualsiasi agente
   che li eseguiva apriva una finestra visibile come side effect.

## Risoluzione (R-198)

- Nuova invariante `.windsurf/rules/16-no-foreground-windows.md` (port di
  CTR-foreground-001) + registrazione in `00-project-invariants.md`, `AGENTS.md`
  e `coordinator/canonical-systems.md`.
- Bullet in tutte le skill RPG (`coordinator/skills/*/SKILL.md`).
- Plan/spec: `strategist-mandate` (Guardrails/Safeguards/Quality Gates),
  `coordinator-mandate` (Invariant Compliance), `mw-planner` (Planning rules) —
  ogni piano con verifica runtime dichiara esecuzione headless/background.
- `headless: false` → `headless: process.env.HEADLESS !== 'false'` in tutti gli
  script; `open` → `open -g`.
- Enforcement statico: `npm run foreground:lint` (`scripts/foregroundLint.ts`).

## Regola preventiva

Un agente non apre **mai** una finestra in primo piano in automatico: esecuzioni
browser/test sempre headless o in background; una finestra visibile richiede
opt-in esplicito del Director in sessione (o resta uno step manuale nel piano).
