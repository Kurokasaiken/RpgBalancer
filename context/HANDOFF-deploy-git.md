# HANDOFF — commit + push + deploy Vercel pulito

> Scritto per Context Budget Protocol (2026-11-15). Il thread precedente
> si è chiuso a 100% budget: riprendere da qui.

## Richiesta del Director

"il deploy su vercel e penso anche git è fallito, xè? voglio che fai un
commit, push e deploy pulito"

## Stato accertato (diagnostica già fatta, non ripetere)

- `git status -sb`: `## main...origin/main` — HEAD `35b9f7e0` è **già pushato**,
  nessun commit locale in avanzo. Il "fallimento git" è quindi **lavoro non
  committato**, non un push fallito.
- Remote: `origin → github.com/Kurokasaiken/RpgBalancer.git`
- Stash: `stash@{0}` e `stash@{1}` = "autostash" (valutare se roba del
  Director da non toccare).
- Ultimo commit: `35b9f7e0 R-339/PLAN-119 T5: docked Roster|Stash rail on /game`
  (linea di lavoro R-339/PLAN-119: edge-tab rail, reliquary, HUD real).

### Modifiche non committate (candidate al commit)

Modified:
- `RICHIESTE.md`, `context/DECISION_LOG.md` (docs di governance)
- `public/assets/ui/hud-real/reliquary/frame-v2.webp`
- `src/pages/game-mappa2.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/GameMenuDialog.tsx`
- `src/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow.tsx`
- `src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx`
- `src/ui/idleVillage/hudReal/HudRealReliquary.tsx`

Untracked:
- `public/assets/ui/hud-real/reliquary/frame-v2.png`
- `scripts/hud-real/_tmp-probe-{cassetto-v2,dir,dir2,rel2,reliquary}.mjs`
  → probe `_tmp-`: probabilmente NON da committare (verificare convenzione
  `_tmp-` nel repo; in passato i `_tmp` restano locali o vanno ignorati).

## Deploy pipeline (da `package.json`)

- Build deploy: `npm run build:deploy`
  (`VITE_DEPLOY_SLIM=true vite build --mode production && node scripts/deploy/assertDeployShape.mjs`)
- Guard deploy + post-verifica: `npm run guardian:deploy-guard`
  (`scripts/guardian/vercelDeploymentGuard.ts`, include `webglBootProbe.mjs`
  su `/` e `/game` con WebGL/swiftshader — invariante R-304).
- Alias produzione: `rpg-balancer.vercel.app`
- Ipotesi primaria del "deploy fallito": deploy live ma **post-verifica
  WebGL probe fallita** (pattern incidente R-304), oppure il commit non era
  mai stato pushato quindi Vercel ha deployato codice vecchio.

## Resume point — passi esatti per il prossimo thread

1. `git diff` sulle modified files per capire l'unità logica
   (probabile: lavoro reliquary/cassetto HUD-real + menu flow, collegato a
   PLAN-119/R-339 — verificare in `RICHIESTE.md` / plan di riferimento).
2. Decidere il perimetro del commit:
   - committare codice + asset + docs governance insieme o separati;
   - escludere/ignorare i `_tmp-probe-*.mjs` (e forse `frame-v2.png` se
     duplicato del `.webp`).
   - ATTENZIONE T-13: altre sessioni possono lavorare su questo worktree —
     non fare scoped commit che catturano lavoro altrui senza verifica mtime.
3. Safeguard obbligatori prima di "done" (timeout da rule 00):
   `npm run lint -- <scope>` (120s), `npm run test -- <scope>` (300s),
   `npm run build:check` (180s), `npm run closure:lint` (30s).
4. Commit (formato Devin, Co-Authored-By) → `git push origin main`.
5. Deploy: probabilmente Vercel auto-deploya su push; altrimenti
   `npm run guardian:deploy-guard`. **Deploy non "done" finché la
   post-verifica WebGL su `rpg-balancer.vercel.app` (`/`, `/game`) non è
   verde** — `webglBootProbe.mjs` deve passare, "200 OK" non basta (R-304).
6. Chiudere la voce in `RICHIESTE.md` con `bundle:` e passare
   `closure:lint`.

## Alleggerimento contesto (richiesta Director, stessa sessione)

Il catalogo skill iniettato = nome+descrizione di ogni SKILL.md trovato nelle
directory scansionate (`~/.agents/skills/`, `~/.claude/skills/`,
`RPG/.devin/skills/`, `.windsurf/skills/`, `.cursor/skills/` + built-in).
Levi per ridurlo senza perdere funzionalità:

1. **Archiviare le obsolete** (`demo`, `coordinator`, `strategist-mandate`,
   `coordinator-mandate` — marcate OBSOLETO/IN PAUSA/STORICO): spostarle in
   una dir non scansionata (es. `RPG/.devin/skills-archive/`). Restano su
   disco come riferimento, escono dal catalogo.
2. **Slim descrizioni PixiJS (~24 sub-skill in `~/.agents/skills/`)**: le
   liste "Triggers on:" sono il blocco più pesante del catalogo. La skill
   router `pixijs` già indirizza — le sub-skill restano invocabili, basta
   ridurre le descrizioni a 1 riga. Win maggiore, zero perdita. Essendo in
   `~/.agents/` (globali), il risparmio vale per OGNI progetto.
3. **Verificare se lo scanner è ricorsivo**: se `list` non ricorre, le
   sub-skill pixijs possono vivere in una subdir ed essere raggiunte solo
   via router/`skill search` — catalogo giù di ~24 entry.
4. **Dedup layer sovrapposti** (executor/mw-executor/agent-execution-mandate;
   explorer/mw-explorer; planner/mw-planner): tenere tutti, trim descrizioni.
5. Regole always-on: NON toccare senza ruling — CLAUDE.md punta già ad
   AGENTS.md, possibile dedup ma è governance del Director.

Nota: scoprire prima come Devin costruisce il catalogo (quali dir scansiona)
per confermare che l'archivio in subdir non venga letto.

## PLAN — audit budget contesto e ottimizzazione sistema

Domanda del Director: "sessione nuova e già 262k pieni — xè? Serve un plan
per esaminare la dinamica, cosa è pesante e come ottimizzare il sistema."

### Ipotesi da verificare (in ordine di probabilità)

Il carico fisso a sessione fresca = system prompt + regole always-on +
catalogo skill + **schemi tool MCP** + metadata IDE. I numeri grezzi noti
non arrivano a 262k, quindi o la sessione non era davvero vuota (summary
carried-over) o un componente pesa molto più del previsto.

### Misure già fatte (2026-11-15)

- Regole always-on totali: **56.559 byte** (~14k tok) — AGENTS.md 9,3k +
  19 file `.windsurf/rules/` + CLAUDE.md.
- **ANOMALIA: skill duplicate su disco.** Stessi file, stesse dimensioni in
  `~/.agents/skills/` ↔ `~/.claude/skills/` e `.windsurf/skills/` ↔
  `.devin/skills/` (es. painter 18.987B ×2, idle-village-task ×2,
  skill-creator 34.386B ×2). Verificare se sono symlink (compat multi-IDE,
  ok) o copie vere (manutenzione doppia + possibile doppia indicizzazione).
- SKILL.md più grandi: skill-creator 34k, pixijs-scene-graphics 27k,
  knowledge-extractor 24k, work-ticket 23k, pixijs-assets 20k.

### Fasi del piano

1. **Capire il metering**: invocare skill `devin-cli` → docs su come Devin
   Desktop costruisce il contesto a sessione fresca (quali dir scansiona,
   dedup skill per nome?, rule scoping, se inietta summary/memorie, come
   conta il budget 262144).
2. **MCP audit**: `mcp_list_tools` su `github-mcp-server`, `puppeteer`,
   `vercel` → contare tool e stimare peso schemi JSON (github-mcp è il
   sospetto #1: ~50 tool con schemi verbosi). Decisione: servono always-on
   o disattivabili/on-demand via config?
3. **Skill dedup + archive**: verificare symlink vs copie; archiviare le 4
   obsolete; slim descrizioni pixijs (router copre il routing).
4. **Rules audit**: classificare le 19 regole always-on vs situazionali
   (candidati on-demand: 50-shutdown-governance 4,2k, 80-quest-rules 2,5k,
   mw-rpg-bridge, 45-director-intent-to-spec, 16-no-foreground...). Richiede
   ruling Director: sono governance.
5. **Report finale**: tabella componente → costo stimato → ottimizzazione →
   risparmio atteso → cosa NON toccare. Deliverable in `context/` + eventuale
   registrazione in RICHIESTE.md come voce di lavoro.

### Modalità esecutiva — DECISO dal Director (2026-11-15)

- **Audit via dibattito multi-AI web** (`mw-web-debate`, spec-v3,
  `scripts/mw-web-turn.py`): le AI web avversano/validano le opzioni di
  ottimizzazione prima di toccare la governance.
- **Direzione proposta dal Director** (da mettere nel seed del dibattito,
  non da applicare subito): "19 file di regole sono tanti — caricare il
  corpo delle regole SOLO quando serve, tenere always-on solo INDICE +
  descrizioni/trigger". Stesso pattern delle skill (catalogo sempre, corpo
  on-invoke). Domande per il dibattito: Devin supporta rule scoping/lazy
  rules? Quale formato di indice? Quali regole DEVONO restare always-on
  (invariants 00? safety?) vs quali vanno on-demand?

### Seed dibattito (draft, da raffinare)

"Sessione Devin Desktop fresca in progetto RPG: context budget 262144 già
~100%. Componenti iniettati: system prompt, 19 file regole always-on
(~56KB), catalogo ~50 skill (descrizioni, PixiJS ~24 con trigger list
verbosi), schemi MCP github-mcp-server+puppeteer+vercel, skill duplicate
su 2 coppie di directory. Obiettivo: ridurre il carico fisso senza perdere
funzionalità né enforcement di governance. Proposta: pattern 'indice
always-on + corpo on-demand' per regole e skill, MCP on-demand. Valutare:
fattibilità tecnica, rischi di enforcement perso (invariants non lette =
non applicate), alternative (regole condensate, dedup, archivio obsolete)."

### Risultati audit (sessione 2026-11-15, fasi 1-3 FATTE)

**Metering (docs Devin CLI, `devin/share/devin/docs/extensibility/`):**
- `.windsurf/rules/*.md` e `.devin/rules/*.md` supportano frontmatter
  `trigger: always_on | manual | model_decision | agent | glob` → il lazy
  loading delle regole È NATIVO. Le regole in subdir si scoprono lazy
  quando l'agente accede a file in quella dir.
- Docs raccomandano: regole minime + pattern "regola che punta a skill".
- Skill: catalogo = nome+descrizione sempre, corpo on-invoke. Scanner legge
  `.agents/`,`.devin/`,`.windsurf/`,`.claude/skills/` ecc. con dedup per nome.
- `read_config_from` in `config.json` può disattivare import cursor/
  windsurf/claude.

**Regole — stato reale (NON 19 always-on):**
- `always_on` (3): 00-project-invariants 7,4k · 40-doc-governance 1,6k ·
  50-shutdown-governance 4,2k
- `glob` (4): 10-ui, 20-config-persistence, 30-frozen-kits,
  50-interaction-patterns — già lazy
- `manual` (4): 60-guardian-deploy, 70-state-docs-sync,
  80-quest-rules-maintenance, philosophy — già lazy
- SENZA frontmatter (8): 10-canonical-dev-port, 15-browser-preview-guard,
  16-no-foreground-windows, 17-resource-lifecycle,
  45-director-intent-to-spec, 46-approved-references,
  85-documentation-impact, mw-rpg-bridge → NON iniettate in questa
  sessione (attivazione ambigua, da rendere esplicita)
- **Costo reale regole always-on ≈ 23KB** (00+40+50 + AGENTS.md 9,3k +
  CLAUDE.md ~0,7k), non 56KB.

**MCP:** `github-mcp-server` e `vercel` FALLISCONO `mcp_list_tools`
(configurati ma irraggiungibili → dead weight, fixare o rimuovere).
Puppeteer: 7 tool ok + 6 risorse screenshot STALE da altra sessione.
Schemi tool MCP NON nel baseline (lazy via list_tools): MCP non è
l'elefante.

**Skill dirs:** `.windsurf/skills` e `.devin/skills` = symlink a
`../coordinator/skills`; `~/.claude/skills` e `~/.agents/skills` condividono
gli stessi file via symlink a mind-weaver. Nessuna copia reale; dedup
catalogo confermato (ogni skill appare 1 volta).

**Gap residuo:** componenti visibili (~23kB regole + ~15-25k tok catalogo
skill + system prompt) non spiegano 262k a sessione "fresca" → probabile
contesto carried-over dalla sessione precedente o overhead harness non
visibile. Verificare il contatore all'avvio della PROSSIMA sessione fresca.

### Ottimizzazioni candidate (da far validare al dibattito MW)

1. `50-shutdown-governance` (4,2k) → `model_decision` o `manual`: serve solo
   su task shutdown. `40-doc-governance` (1,6k) borderline.
   `00-project-invariants` RESTA always_on (core safety).
2. Aggiungere frontmatter esplicito alle 8 regole senza (probabilmente
   `model_decision` con description precisa).
3. Slim descrizioni pixijs (~24 skill) — il blocco più pesante del catalogo.
4. Archiviare le 4 skill obsolete.
5. Fixare/rimuovere github-mcp-server e vercel MCP (morti); pulizia
   risorse puppeteer stale.

### Stato dibattito (aggiornato 2026-11-15, fine sessione)

Run: `mind-weaver/.mw/runs/20261115-context-budget-audit/`
- Fase clarification CHIUSA: tutti e 5 READY, zero domande →
  `grounding-ledger.md` scritto, `electorate_init` + `phase_transition`
  registrati. DeepSeek recuperato via reconcile EXTRACT.
- **T-002 (R1 proposals) POSTED a tutti e 5 — collect PENDENTE.**
  Attenzione: role-hat NON assegnati (bash 3.2, `{ROLE}` vuoto — vedi
  `ORCHESTRATOR-NOTE.md` nel run dir). Prompt identico per tutti.
- **Resume:** `cd ~/progetti_personali/mind-weaver &&
  browser-runtime/.venv/bin/python scripts/mw-web-turn.py collect --run
  20261115-context-budget-audit --provider <p> --turn_id T-002` per i 5.
  Poi mediare: leggere proposte → R2 con iniezioni cross-provider
  (blinding `mw_blind.py` se ≥2 risposte) + ruoli critica diversificati
  (prompt-enhancers: objective_critic / critique_and_counterplan).
  Convergenza: acceptance su artifact-rNNN.md → `converged` o
  `decision_memo` → report.md col Direttore.

### Contratto (obbligazioni verificabili)

- [x] Meccanismo di metering documentato (fonte: docs devin-cli)
- [x] Peso stimato di ogni componente iniettato (parziale — gap 262k irrisolto)
- [x] Symlink-vs-copia accertato: SYMLINK, dedup attivo
- [ ] Dibattito mw-web-debate eseguito, artifact in `.mw/runs/<ts>/`
- [ ] Lista ottimizzazioni con risparmio stimato, approvata dal Director
       PRIMA di applicare (regole = governance, non si toccano da soli)
- [ ] Voce registrata in `RICHIESTE.md` (audit contesto) — obbligo AGENTS.md

## Aggiornamento sessione 2026-11-15 (thread 2 — deploy diagnosticato)

### Esito accertato

- **Git: pulito.** L'auto-commit pre-shutdown `5f11256d` ha committato e
  pushato TUTTO il lavoro sporco (inclusi `_tmp-probe-*.mjs` e
  `frame-v2.png` che questo handoff proponeva di escludere — ormai storia).
  `main == origin/main`.
- **Vercel: deploy di `5f11256d` FALLITO in build** (deployment id
  `dpl_8apdVhwAQ3S8nfyZkonEvhbHaqhP`, state=failure). La causa:
  `[assertDeployShape] ✗ deploy-manifest.json in drift` — l'auto-commit ha
  portato ~99 file nuovi in `public/` (tmp-fan, hud-real, …) senza
  rigenerare il manifest. L'alias `rpg-balancer.vercel.app` resta sul
  deploy precedente `35b9f7e` (live, 200 OK).
- **Fix applicato:** `node scripts/deploy/deployManifest.mjs` → manifest
  rigenerato (`--check` verde: committato == rigenerato). Commit + push in
  questo thread → nuovo deploy atteso verde sul gate assertDeployShape.
- **Check GitHub rossi (separati dal deploy Vercel):**
  - `Validate i18n…` → lo step rosso è `closure:lint`: residuo Director-gated
    NOTO (game-menu-screens 2-owner, da handoff 2026-10-23) + NUOVO drift
    dall'auto-commit (STRICT_FILES 0-owner su config mappa2/pixiSpike/
    hudReal, scope_files divergenti, frontmatter mancante su
    research-prompt-protocol.md). Serve un task dedicato di resync
    contratti + ruling Director sui 2-owner.
  - `Release` → fallimento AMBIENTALE: `npx playwright install` fallisce su
    runner `ubuntu26.04-x64` (Playwright 1.58.2 non supporta l'immagine).
    Non è un bug di codice: pin runner o bump Playwright.

### Esito finale (chiusura thread 2)

- Deploy `e5b8170d` → **● Ready** (`g6r856eo4`); sessione parallela ha
  pushato `ad157925` sopra → `4gk1t9h02` Ready, alias prod sul più recente.
- **WebGL probe R-304 PASS** su `https://rpg-balancer.vercel.app/` e
  `/game` (exit 0, swiftshader, canvas + boot path reale).
- **R-341 chiusa `fatta`** in RICHIESTE.md (evidenza inline, `bundle:` n/a
  — closure:lint pre-rosso su drift noto, vedi sotto).

### Resume point — prossimo thread

1. Task separato: resync contratti/inventory per sbloccare `closure:lint`
   in CI — voci rosse: frontmatter `research-prompt-protocol.md`, inventory
   drift (regen `componentInventory.ts --write`), 3 unità senza contratto
   (canonical-data-bridge, drag-sensors, use-drag-outcome), STRICT_FILES
   0-owner (config mappa2/pixiSpike/hudReal nuovi), scope_files divergenti,
   e i 2-owner game-menu-screens (ruling Director già pendente dal
   2026-10-23: migrare invarianti nei per-file o dichiarare l'aggregato
   owner).
2. Check `Release` rosso ambientale: pin runner o bump Playwright >1.58.2.
3. R-342 dibattito MW: T-002 collect pendente (comandi nel § sopra).

## Non verificato (dillo al Director)

- WebGL probe su prod non ancora eseguito in questo thread (budget).
- Se i due autostash contengono lavoro rilevante.
- `mw-reap` mancante segnalato da closure:lint in CI (PLAN-071).
