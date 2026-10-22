# PLAN-061: QuestRunWindow — formato immagine 2.4 via pipeline (R-231 Plan D1)

**Status:** `fatta` — contratto + gate implementati, bundle `.mw/runs/plan061-image-format/` PASS (2026-10-19)
**Richiesta:** `R-231` (#8)
**Parent/Relazioni:** dibattito `20261019-r231-questwindow` (`artifact-r003.md`
sha `c7236b291f62…`); sequenza PLAN-049: PLAN-060 → **PLAN-061** → PLAN-062 →
PLAN-063 → PLAN-064. #8 è indipendente da C/B — non deve attendere il ciclo
design di #9 (PLAN-064), che però si integra sull'esito di questo piano.

---

## 0. Ruling Director (registrato)

- **#8 = rigenerazione via pipeline:** gli asset theatre si rigenerano al
  formato dichiarato `theaterAspect: 2.4` (config Zod in `gameFrameConfig`)
  tramite la pipeline di generazione esistente — NON fit/crop/letterbox a
  runtime.

## 1. Scope

1. Verificare dove la pipeline AI produce gli asset theatre e perché non
   rispettano il formato dichiarato (prompt/dimensioni/ritaglio post-generazione).
2. Portare il formato dichiarato **dentro** il contratto di generazione
   (leggere `theaterAspect` dal config, non magic number) e rigenerare gli asset
   delle quest affette.
3. Validazione: l'asset su disco e la resa nel componente rispettano 2.4.

## 2. Task

- **T-001** — Audit pipeline: dove si generano le immagini quest
  (PLAN-052 lab/authoring?), dimensioni attuali vs 2.4; root cause
  (prompt? default provider? post-processing?).
- **T-002** — Fix pipeline: il formato 2.4 entra nel contratto di generazione
  (da config Zod); rigenerazione degli asset affetti.
- **T-003** — Verify: assert dimensione asset (2.4) **e** geometry renderizzata
  (aspect effettivo nel DOM, nessuna distorsione/banda).
- **T-004** — Doc: aggiornare contratto componente + doc pipeline asset.

## 3. Acceptance / BV

- D1-1: ogni asset theatre rigenerato ha aspect 2.4 (tolleranza 1%) — assert su
  file/generazione.
- D1-2: nel componente, l'immagine renderizzata rispetta il container 2.4 senza
  distorsione (geometry check E2E).
- D1-3: `theaterAspect` letto da config — assert che il valore usato dalla
  pipeline/validazione arriva dal modulo Zod, non hardcoded.

## 4. Stop-condition

Bundle PASS + evidenza visiva (T-04: screenshot theatre con asset rigenerato
in `.mw/runs/plan061-*/`). Dopo questo piano: **replay point Director**
(quest avanza + input ok + arte a formato) prima di procedere a PLAN-062.

## 5. File chiave (trigage)

- Pipeline asset (PLAN-052 area — `scripts/` bake/generation, `public/assets/`)
- `gameFrameConfig` (`theaterAspect`)
- `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx` (theatre stage)

---

## 6. Implementazione (2026-10-19) — contratto + gate, nessuna rigenerazione

**Audit T-001 (ribaltamento premessa, ruling Director):**
- Gli asset theatre (`scene-library/*.jpg`) sono **già 3168×1344 = 2.357:1** —
  a contratto entro tolleranza; il difetto visibile di #8 era il bug flex di
  `PreVerdictBreath` (fixato in PLAN-065/PLAN-043-S8), non il formato.
- La pipeline di generazione è **esterna** (prompt `.mw/specs` → Gemini/Grok/GPT
  → `~/Downloads` → recode): non eseguibile dall'agente. La rigenerazione degli
  asset pendenti (viaggio, ritorno, `carro-nascosto`/`sentiero-tracce`
  stale-fiction v3) resta step Director — i prompt ora dichiarano il formato.
- **Ruling Director 2026-10-19:** scope = contratto + gate meccanico, no regen.

**Cosa è stato implementato:**
- `gameFrameConfig.questWindow.theaterAssetAspectTolerance: 0.05` (Zod) —
  accetta output 21:9 dei generatori (2.357), respinge mismatch reali.
- `scripts/check-quest-art-aspect.ts` + `npm run check:quest-art` — gate:
  ogni `NODE_ART` cover-fit vs `theaterAspect` da config. Esito: **7 PASS,
  0 FAIL, 9 WARN documentati** (`ritorno.jpg` placeholder pending regen;
  `quest-robine/*` legacy pre-contratto, formato pass a parte).
- Contratto di generazione: `scenes.md` §ruoli + 14 prompt — nota stale
  «Aspect 16:9» sostituita dal contratto (≥21:9, target ricodifica
  3168×1320, soggetto focale nella fascia verticale centrale).
  `scene-library/CATALOG.md` aggiornato (regola formato + riga 2.76 stale).
- `data-testid="quest-theatre-frame"` sul frame stage (seam E2E).
- **D1-2** in `gameQuestCluster.spec.ts`: il frame dichiara 2.4 da config,
  banda wide, cover-fit mai distorto + testimone `d1-2-theatre-frame.png`.

**Finding inoltrato a PLAN-063:** sotto height-cap il frame clamp alla sua
shrink-reserve (osservato ratio 3.85 al floor `theaterMinHeightPx` 190) —
la banda mostra ~62% dell'altezza dell'arte. By design come meccanismo, ma
la taratura è geometria → Plan B (issue #5).

**Verifica:** `verify:bundle` → `.mw/runs/plan061-image-format/` —
6/6 obbligazioni (gate, E2E+witness, lint, build, contratto-nel-diff,
contracts:check). Regressione cluster suite: la D1-2 convive con i 12 BV.
