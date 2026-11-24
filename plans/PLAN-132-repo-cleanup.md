# PLAN-132 — Pulizia artefatti repo: cernita manifest-driven con protect-list

**Stato:** draft — in attesa di battesimo Director.
**Parent:** R-381 (richiesta verbatim 2026-11-24: pulizia screenshot/artefatti
non usati, temporanei cancellati, file di codice piccoli archiviati,
revisione degli archivi).
**Documentation impact:** REQUIRED — `RICHIESTE.md` (R-381), `plans/INDEX.md`,
`test-results/cleanup/evidence.md` (manifest + freed-space report).
**Visual-fork:** skipped — nessuna decisione estetica; il plan sposta/cancella
artefatti, non crea né modifica resa visiva di produzione.
**Regression-test (R-247):** eccezione dichiarata — il task non muta il
comportamento del codice (nessun `src/` toccato in scrittura); la guardia
permanente equivalente è `scripts/cleanup/check-protected-paths.mjs`
(OB-2): ri-eseguibile sempre, fallisce se un path protetto sparisce.

---

## 1. Ricognizione (fatta, 2026-11-24)

| Zona | Peso | Tracked? | Disposizione |
|---|---|---|---|
| `.claude/worktrees/` | 6.5G | no (`.claude/` ignorato) | T-003 — 4 worktree git; il grosso è `node_modules` clonato per worktree |
| `.mw/runs/` | 3.7G | no (`.mw/runs/` ignorato) | T-004 — pruning per età+citazione |
| `.mw/providers/profiles/` | 2.8G | no | T-003 — solo cache Chrome (~1.5-2G liberabili, login in `Network/Cookies` ecc. intatti) |
| `src-tauri/target/` | 4.4G | no | T-003 — cache Cargo, ultimo build 2025-11-30 |
| `tools/hud-real/` (venv+models) | 2.1G | no (`tools/*` ignorato) | T-003 — riscaricabile via `fetch-models.py` |
| `test-results/` | 2.0G | no | tutto <60gg → niente da fare ora |
| `.mw/venv` | (symlink) | — | **PROTETTO**: punta a `mind-weaver/.mw/venv`, non toccare |
| `.mw/specs/` | 1.1G | **sì** | T-006 REVIEW — spec HUD attive, contengono sorgenti congelate (R-379) |
| `dist/`, `dist-playwright/` | ~1.3G | no | T-003 — output di build |
| `.sdx-venv/`, `venv/` | ~810M | no (`.sdx-venv` ignorato; `venv` non tracked) | T-003 — venv SD/ad-hoc alla root |
| `scripts/_tmp*` | ~0.5M (519 file, 448 tracked) | misto | T-005 — cernita |
| `out/` | 338M (1331 tracked) | **sì** | T-006 REVIEW — contiene `out/medallion-edit/pylib/` 156M con `cv2.abi3.so` 42MB committato |
| `dev-public/` | 347M (459 tracked) | **sì** | T-006 REVIEW — asset lab/dev |
| `marketing/` | 163M (122 tracked) | **sì** | T-006 REVIEW — media Steam |
| `deliverables/` | 41M (73 tracked) | **sì** | T-006 REVIEW |
| `assets-source/` | 140M (82 tracked) | **sì** | T-006 REVIEW — sorgenti arte |
| `artifacts/`, `diagnostics/` | ~39M | **sì** | T-006 REVIEW |
| `.mw/archive/` | 24M | sì | KEEP — archivio curato con README di provenance |
| `context/research/` | 585M (784 tracked, 601 media) | **sì** | T-006 REVIEW — mood/sprite research; contiene `*-approved.png` → regola 46, sottoinsieme protetto |
| `src/docs` media | ~500M (subset dei 721 tracked) | **sì** | T-006 REVIEW — immagini/video in docs |
| strays root (`map.jpg`, `Map finale.jpg`, `report_tmp.jpg`, `hd-photo-Map finale/`) | ~23M | misto | T-006 REVIEW — possibili sorgenti mappa (regola 46) |
| `assets_originals/` | 22M | no (ignorato) | T-006 REVIEW — sorgenti arte non tracked |
| `.git` | 8.4G pack | — | FUORI SCOPE — i 30 blob più grossi sono binari committati (cv2.so 42M, .mov Steam 24M, .hdr 4K 23M, PNG research 16-19M); recupero solo via `git filter-repo` = riscrive gli hash, plan/commit separato con via esplicito Director |

Età `.mw/runs` (~503 dir): 62 ago · 21 set · 312 ott · 108 nov.
Soglia Director: **90 giorni** → idonei alla cancellazione i run con mtime
pre-2026-08-26 (~i 62 di agosto) **e** non citati e senza asset battezzati.

## 2. Protect-list (derivata meccanicamente, non a memoria)

`scripts/cleanup/build-cleanup-manifest.mjs` produce
`test-results/cleanup/protected.txt` raccogliendo:

1. Path `.mw/runs/*`, `test-results/*`, `.mw/specs/*` citati in `RICHIESTE.md`
   (voci `aperta`/`in corso`/`da chiarire`) — evidenza viva (R-329, R-331,
   R-332, R-333, R-335, R-377–R-380).
2. Riferimenti battezzati (regola 46): `medaglione-battezzato-v3*` e ogni
   `*-battezzato-*`, baseline `visual-fork-*.md` + asset che citano,
   `mappa2ApprovedLook`, golden/`refs/` sotto `.mw/specs/**`.
3. `.mw/bugs/`, `.mw/red-first/`, `.mw/contracts/` — citati da
   `context/recurring-traps.md` e dai contratti INV.
4. `.mw/providers/{sessions,auth}/`, `.mw/venv` (symlink), ledger archivi
   (`*-backlog.md`, `*-archive.md`, `DECISION_LOG-archive.md`).
5. Ogni `bundle.json` e ogni path citato da un `bundle.json` esistente.
6. Asset in `public/` referenziati da `src/` (T-29) — grep `assets/…` nei
   sorgenti; niente in `public/` si tocca in questo plan comunque.

Un path che compare in `protected.txt` non entra MAI nella delete-list;
`check-protected-paths.mjs` verifica che tutti esistano post-esecuzione.

## 3. Task

- **T-001 — Manifest.** `scripts/cleanup/build-cleanup-manifest.mjs` →
  `test-results/cleanup/manifest.csv` (path, bytes, mtime, ageDays, tracked,
  categoria, citatoDa). Produce anche `protected.txt` e `delete-candidates.txt`
  (DELETE) / `review-candidates.txt` (REVIEW). Dry-run obbligatorio prima di
  ogni `rm`.
- **T-002 — Worktree `.claude`.** Report: diff stat del lavoro non committato
  di `eloquent-goodall` (`pixiDestroy.ts`, guard test, 4 file M) → **gate
  Director** (commit su branch `claude/eloquent-goodall-4d2bf1` poi remove,
  oppure discard esplicito). Gli altri 3 (HEAD raggiungibili da altri branch):
  `git worktree remove` diretto.
- **T-003 — Rigenerabili (decisione presa).** `rm -rf src-tauri/target`,
  `rm -rf dist dist-playwright`, `rm -rf tools/hud-real/{venv,models,__pycache__}`,
  pulizia cache profili: solo `Cache/`, `Code Cache/`, `GPUCache/`,
  `DawnWebGPUCache/`, `DawnGraphiteCache/`, `component_crx_cache/`,
  `optimization_guide_model_store/`, `WasmTtsEngine/`, `Safe Browsing/`,
  `Local Traces/`, `BrowserMetrics/` dentro `shared/*` e `pool-0/*`.
  MAI: `Cookies*`, `Login Data*`, `Local Storage/`, `IndexedDB/`,
  `Session Storage/`, `Network/`, `Preferences`, `Bookmarks*`, `Sync Data/`,
  `Accounts/`, `Secure Preferences`, `Device Bound Sessions*`.
- **T-004 — `.mw/runs` >90gg non citati** + lista REVIEW dei run >50MB non
  citati (qualunque età) → decisione Director batch.
- **T-005 — `scripts/_tmp*`.** Citati da regole/gate (`_tmp-boot-wait.mjs`,
  `_tmp-landing-check.mjs`) → promossi in `scripts/probes/` con `git mv` +
  update dei riferimenti. Citati solo da RICHIESTE/evidenza → restano (il
  rename romperebbe la provenance). Resto → `git rm` (history = archivio).
- **T-006 — REVIEW batch Director.** Una tabella per categoria
  (`out/`, `dev-public/`, `marketing/`, `deliverables/`, `artifacts/`,
  `context/research`, `.mw/specs` item grossi, strays root): per ognuna
  thumb/count/size + proposta keep/move/delete → ruling per riga.
- **T-007 — Verifica + bundle.** Safeguard + check protetti + evidence.

## 4. Contratto di chiusura (`.mw/runs/<task>/verification.json`)

- **OB-1 (state):** `node scripts/cleanup/build-cleanup-manifest.mjs`
  rieseguito post-esecuzione → `manifest.csv` + `protected.txt` presenti e
  coerenti con il risultato.
- **OB-2 (state):** `node scripts/cleanup/check-protected-paths.mjs` → exit 0
  (ogni path in `protected.txt` esiste ancora). **Check permanente** — resta
  in repo ed è rieseguibile.
- **OB-3 (command):** `npm run build:check` verde post-cancellazione (prova
  che niente di referenziato dal build è sparito) + `npm run lint -- scripts/cleanup`
  + `npm run closure:lint` + `npm run governance:check`.
- **OB-4 (state):** `test-results/cleanup/evidence.md` con du prima/dopo per
  ogni zona, lista decisioni Director del REVIEW batch, esito T-002.
- **Human-eye:** il Director sfoglia `delete-candidates.txt`/`review-candidates.txt`
  prima dell'esecuzione — nessuna cancellazione senza approvazione della lista.

## 5. Note operative

- Ogni batch parte da dry-run (`find … -print` → file firmato dal Director),
  poi `rm`. Niente cancellazioni fuori lista.
- Per i tracked si usa `git rm`/`git mv` (history come archivio); gli ignorati
  `rm` diretto. Commit: uno per batch, messaggio `chore(cleanup): …`.
- `report_tmp.jpg` (root, ott 24) → DELETE candidato diretto (nome tmp esplicito).
- Worktree condiviso (T-13): se sessioni parallele hanno run in corso, il
  manifest marca i path con mtime <24h come protetti comunque.
- `.mw/archive/` (24M, 2 entry curate con README) e i ledger archivi:
  **KEEP** proposto — costo irrisorio, provenance utile.
