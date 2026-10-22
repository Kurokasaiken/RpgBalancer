---
name: mw-explorer
description: >
  Workflow di esplorazione Mind Weaver scopato al progetto RPG. Usa per
  richieste aperte, valutazione di direzione o brainstorming dentro RPG:
  legge desiderata FROZEN, RICHIESTE, DESIGN_PILLARS e recurring-traps
  prima di rispondere. Per esplorazione generica fuori da RPG usa
  `explorer`.
---

# mw-explorer

Use for open requests, idea exploration, and direction evaluation before planning.

## Pre-flight

1. Read `.mw/desiderata.md` and identify the latest FROZEN version.
2. Read `RICHIESTE.md` and check for `aperta` or `in corso` items.
3. Read `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, and `context/INDEX.md`.
4. If the Director's request changes the FROZEN goal, scope, or constraints, emit `## Desiderata drift detected` and ask before continuing.

## When to use

- Open questions: "come", "ha senso", "cosa ne pensi", "esploriamo"
- Brainstorming and option evaluation
- Before a design or spec exists

## Rules

- Stay in **CLARIFICATION** if no matching FROZEN desiderata exists. Ask one neutral, open question per turn. Do not present binary options unless the Director named them.
- In **EXPLORATION**, generate 2-3 plausible directions and expose the strongest critique of each.
- Do not converge to a single option before the Director has seen the alternatives.
- Reuse existing context; do not invent new abstractions without a concrete need.
- Never open a window/app/browser in the foreground automatically; any demonstration run is headless/background unless the Director explicitly asks for a visible window (`.windsurf/rules/16-no-foreground-windows.md`).

## Visual fork gate (v35 FROZEN — PLAN-047)

Quando una richiesta crea o modifica elementi grafici/visivi, l'explorer decide
esplicitamente se serve un **fork visivo** prima che esista un plan — l'agente
non sceglie mai a priori una rappresentazione quando esistono alternative
materiali.

**Trigger** — fork obbligatorio se TUTTE queste condizioni:
1. il task crea o modifica elementi grafici/visivi;
2. esistono ≥2 rappresentazioni materialmente diverse (gerarchia, composizione,
   densità o affordance differenti — non micro-variazioni);
3. la direzione non è già fissata da desiderata FROZEN, ruling Director,
   frozen kit (`src/ui/idleVillage/frozen/kits/`), `skinConfigRegistry`, token
   `--skin-hud-*` o `*_trusted.md`.

**Boundary effect-based**: lo skip è valido solo se la modifica conserva
grammatica visiva, gerarchia, affordance e leggibilità (un ritocco di token che
cambia il contrasto percepito non è cosmetico). **Incertezza = fork.**
**Regola aggregata**: se i task visivi cumulativamente alterano composizione o
gerarchia di una regione a schermo, lo skip è nullo per l'intero plan.

**Se non serve fork** → dichiarazione nella run con puntatore verificabile:
`visual-fork: skipped — <motivo> — <puntatore>` dove il puntatore è: file +
clausola del riferimento frozen (cond. 3), la rappresentazione unica
considerata + perché nessuna seconda (cond. 2), o il perimetro file non-visivo
del task (cond. 1). Uno skip senza puntatore è un difetto del plan.

**Se serve fork** → produrre una **visual-fork card**
(`.mw/runs/<run>/visual-fork[-<nome>].md`, template
`.mw/templates/visual-fork/visual-fork-card.md`) con:
- **scope list**: componenti coperti per nome (una card per decisione estetica;
  componenti che differiscono per funzione/gerarchia non condividono una card);
- **condizioni della decisione**: viewport/stato rilevanti; le viewport a cui
  il Director valuta vanno registrate — il ruling non si estende oltre;
- **2 opzioni default, max 3**, ognuna con `option_provenance` (famiglia +
  perché materialmente distinta), argomento più forte e costo; ≥1 asse della
  matrice vinto da ogni opzione o il fork è degenere → riformulare; **nessun
  marker "recommended"** di default;
- **matrice su assi selezionati per il fork** dal menu (gerarchia/densità,
  token skin, overflow/testi localizzati, stati interattivi, responsive, costo
  implementativo, reduced-motion/a11y); assi DOM-dipendenti selezionati ⇒
  superficie minima #2;
- **superficie di preview** (la più economica sufficiente, servita su
  localhost e **aperta automaticamente nella scheda Preview di Devin
  Desktop** — la scheda Preview è la superficie prevista dal Director, non
  una finestra foreground esterna; `browser_preview` va registrato sulla
  ROOT del dev server, mai su una sub-path — per aprire direttamente una
  route si usa un redirect-stub, vedi trappola T-19): #1 galleria PNG,
  #2 harness HTML/CSS su token reali fuori dal
  tree, #3 route lab `/lab/*` (visual spike: `spike: promote|remove` dichiarato,
  default `remove`, baseline verificata sulla produzione mai sullo spike);
- **ruling** `selected: A|B|C|null` + vincoli verbatim del Director;
  `reject_all` → ritorno a explorer col feedback (secondo giro = opzione di
  sintesi dalle ragioni del rigetto + asse di variazione dichiarato; composito
  A' rigettato conta come voto; 2 rigetti → vincoli scritti dal Director);
- **baseline congelata al ruling**: `baseline_kind: png|screenshot|dom-region`
  + `baseline_frozen_at: <ruling-id>` + sha256;
- **due ledger**: `amendments` (approvati Director, spostano l'accettazione) vs
  `incidental_deviations` (dichiarate dall'agente a chiusura; materiale =
  tocca un asse compilato → STOP + ruling).

Più card indipendenti possono essere presentate nella stessa seduta di ruling.
Dettaglio completo: `plans/PLAN-047-visual-fork-gate.md`.

## Post-session learning

- If the session produced a non-trivial assumption, workaround, bugfix, pattern, or insight that other tasks may encounter, invoke `.agents/skills/learn/SKILL.md` before closing.
- If triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for trivial or purely informational exchanges.

Always begin your response with `explorer:` followed by a blank line.
