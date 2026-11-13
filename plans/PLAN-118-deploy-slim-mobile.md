# PLAN-118 — Deploy Vercel slim: solo le superfici navigabili da mobile

**Stato:** `battezzato — in esecuzione` (open @ 2026-11-13; dibattito multi-AI integrato in rev2) (run `20261113-plan118-deploy-slim`, report in `.mw/runs/…/report.md`; 4/4 provider: REVISE con correzioni convergenti integrate in questa rev).

**Parent:** R-327.

**Origine (Director, verbatim 2026-11-13):** *"noi abbiamo un deploy su vercel, attualmente è molto pesante, ha tutto, dovremmo mandare solo le cose effettivamente navigabili da cellulare e poco altro, come dovremmo fare? facciamo un plan x escludere tutto quello che nn serve?"*

**Decisioni già prese (non si riaprono):**

- Whitelist route: `/` (landing → mappa2-lab, R-297), `/game`, e lo **shell del menu** (Balancer, Moodboard, ecc. — il ramo di fallback di `App.tsx`). Tutte le ~108 route lab/dev fuori.
- Route esclusa → **fallback «non disponibile»** (mini-pagina, non redirect silenzioso).
- Destino del materiale dev-only di `public/`: **deciso dopo l'audit** (D-1) — su numeri reali, non a occhio.
- **Lazy-load delle tab del menu su mobile/deploy: approvato** (Director 2026-11-13, *"lazy load x quelle tab in mobile/vercel va bene"*) → T-1b.
- I ~150 MB di media delle tab **restano pubblicati su CDN**: l'obiettivo è il peso del first-load, non il totale CDN (conseguenza del ruling lazy).

**Cosa NON è:**

- non cancella pagine lab né il loro codice: restano compilabili in dev e nei build full (`vite build`, `--mode playwright`, `build:check`);
- non tocca il gameplay né componenti `/game`;
- non cambia il workflow di deploy (`buildCommand` Vercel resta `npm run build:deploy`);
- non è un secondo entry/progetto mobile (opzione B scartata in esplorazione).

## 0. Fatti verificati (2026-11-13, aggiornati in dibattito)

- `dist/` ≈ **1.0 GB**: `dist/assets` 622 MB di cui **JS solo ~7.4 MB** (316 chunk lazy); il resto = `public/assets` 470 MB copiato + ~150 MB media emessi dai glob `@/assets/**` delle pagine del menu (kept). `dist/mockups` 372 MB, `lab-fan-mock` 24 MB, `fork-mountains` 4.6 MB, `hud-target` 4.1 MB.
- `public/` = **819 MB**, copiato interamente (`copyPublicDir: true`).
- `src/docs` = 516 MB (di cui `game_surface_audit/` 501 MB) — **non** entra nel bundle (solo 2 `?raw` importati) ma pesa sull'upload/clone sorgente.
- `src/App.tsx` = god-file: ~110 branch `window.location.pathname === '/x'` + `lazy()` per pagina; il ramo default renderizza lo shell menu.
- `src/service-worker.ts`: `precacheAndRoute(self.__WB_MANIFEST)` con `globPatterns` incl. `png,svg` + cap 6 MiB → **precacha centinaia di MB di PNG al primo avvio**. Costo concreto su mobile, più del GB su CDN. Il fetch handler runtime è **scritto a mano** (STATIC_CACHE + DYNAMIC_CACHE, network-first con cache fallback), **senza maxEntries/expiration** → rischio QuotaExceeded su mobile (D-DeepSeek accolto). L'`activate` elimina già le cache di versioni precedenti.
- Le tab del menu sono montate **solo quando `activeTab === id`** (render condizionale, verificato): la precondizione di mount per il lazy è già soddisfatta; il costo eager residuo è emissione asset nel grafo + precache.
- `vite preview` **non** esegue middleware `apply:'serve'` (serve `configurePreviewServer`) — correzione dibattito (DeepSeek).
- `vite.config.ts` ha già `defineConfig(({ mode }) => …)`; i dev-only endpoints sono `apply:'serve'`.
- `webglProbeRoutes: ['/', '/game']` in `vercelDeploymentGuard.ts` — il gate post-deploy (R-304) copre già solo le route whitelist.
- Trappole: **T-22** (dev ≠ preview), **import.meta.env `undefined` in vitest** (pattern safe), **stale-preview-bundle** (`rm -rf dist` prima di misurare), **T-19**, **T-04** (claim sul deploy chiuso solo da probe reale).

## 1. Principi

- **P1 — La whitelist è un manifest, non un giudizio.** `deploy-manifest.json` generato da script (import graph delle route kept + path runtime risolti da config/manifest JSON). Nessun asset escluso "a occhio".
- **P2 — Slim è una proprietà della build, non del codice.** Un solo flag `VITE_DEPLOY_SLIM`, solo in `build:deploy`. Gate su env, **mai su `mode`**: `--mode playwright` resta full.
- **P3 — Tagliare alla sorgente, non post-build.** Route registry con alias swap + `public/` divisa. Niente prune di `dist` a posteriori.
- **P4 — Ciò che non serve non si precacha e non si accumula.** SW precacha solo shell; le cache runtime hanno cap espliciti (expiration/maxEntries) — niente leak di storage su mobile.
- **P5 — Budget advisory → blocking.** Le soglie numeriche non si inventano: il primo slim build le misura (advisory), `deploy-budget.json` le congela a misura + 15% e da lì sono blocking (T-6).

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| **D-1** | Destino dev-only assets | `dev-public/` servita in dev+preview (correzione F-preview); fuori-repo solo se l'audit lo giustifica | post T-0 |
| **D-2** | Soglie budget | `deploy-budget.json` con `dist`, `coldTransfer`, `installTransfer` = misura T-5 + 15%; advisory fino a T-6 | T-6 |
| **D-3** | `/assets/trailer` (8.7 MB) | dev-public salvo ruling | post T-0 |

## 3. Fasi / Task

### T-0 — Audit meccanico → `deploy-manifest.json` ✅ (2026-11-13)

> **Fatto:** `scripts/deploy/deployManifest.mjs --profile slim` → `deploy-manifest.json` committato; `--check` = drift gate (OB-1). Risultato: 96 route (92 lab, 4 kept), 377 path referenziati, **~510 MB di `public/` orfani candidati** (mockups 275.6, assets-non-referenziati 176.0, lab-fan-mock 18.9, html/png sparsi ~14.5), 11 prefix dinamici censiti, 27 ref src→dev-candidate **tutti da pagine lab** (il filtro sul grafo kept preciso arriva col registry T-1).

- `scripts/deploy/deployManifest.mjs --profile=<slim|full>`: (a) import graph dalle pagine kept → asset emessi attesi; (b) risoluzione dei path `/…` referenziati da config e manifest JSON (`layers.json`, `regions.json`, `fx/**`, locales, fonts, `manifest.json`, icone, cursori); (c) enumera la **semantica di match** delle route esistenti (exact, `startsWith`, parametri, redirect) così il registry la rappresenta fedelmente; (d) rileva riferimenti dal grafo kept verso path dev-only (→ OB-1 blocking); (e) output `deploy-manifest.json` = `{ routes, publicPaths, matchSemantics, orphanCandidates[{path,bytes}] }` + `LAB_PATHS` pure-data generato dalla route table.
- Decide D-1/D-3 con numeri.
- **Deliverable:** script + manifest committato (rigenerabile, drift check in T-4, like-for-like per profilo).

### T-1 — Route registry + fallback «non disponibile» ✅ (2026-11-13)

> **Fatto:** `src/deploy/{labRouteData,labRoutes,labRoutes.slim,RouteUnavailable}` creati; `App.tsx` rifattorizzato via `scripts/deploy/_transformT1.mjs` (backup `App.tsx.bak`): 86 `if` lab + 83 lazy estratti in `LAB_ROUTE_COMPONENTS[92 path]`; alias `@/deploy/labRoutes`→`.slim` sotto `VITE_DEPLOY_SLIM` in `vite.config.ts` (ordine alias: specifico prima di `@`); `build:deploy` settato. Chiavi `deploy.routeUnavailable.*` in en/ar/de/pseudo (it-IT: fallback en, non ha common.json). **Verifica:** tsc pulito; slim build → **73 chunk JS vs 316** (zero chunk lab); `tests/unit/deploy/deploySlim.test.ts` 6/6 verdi. `dist` resta ~1 GB per `public/` copiata intera → T-2.

- **Estrazione incrementale** (correzione Claude): primo commit comportamentalmente identico — snapshot golden `pathname → route renderizzata` generato **prima** del refactor (red-first); poi i ~110 branch diventano `src/deploy/labRoutes.ts`: tabella **pure-data** `ROUTE_TABLE: Array<{ path, match: 'exact'|'prefix', param? }>` + `loaders` — la tabella è la fonte di verità da cui T-0 genera `LAB_PATHS` (niente due liste che divergono).
- In slim build alias → `labRoutes.slim.ts`: `LAB_ROUTES = {}` + `LAB_PATHS` pieno (stessa interfaccia TS identica — il typecheck non deve rompere, correzione Gemini). I `import()` lab non entrano nel grafo.
- Ordine di valutazione: `LAB_PATHS` match → `<RouteUnavailable/>` **prima** del ramo default dello shell menu (correzione Claude: il default altrimenti cattura tutto).
- `RouteUnavailable`: solo primitivi esistenti + i18n `common` (`deploy.routeUnavailable.*`) + link a `/`. **Zero asset da `public/`/`dev-public/`** (correzione DeepSeek: in preview slim dev-public non è servita).
  - `visual-fork: skipped — placca-notice da primitivi esistenti, nessuna seconda forma plausibile per un avviso utilitario.`
- **Gate flag** vitest-safe: `const DEPLOY_SLIM = ((import.meta as {env?: Record<string,string|undefined>}).env?.VITE_DEPLOY_SLIM) === 'true';`

### T-1b — Tab del menu a consumo on-demand (mobile/deploy) ✅ (2026-11-13)

> **Fatto:** call-site verificati — entrambi i glob iterano `Object.entries` a module-top (serve l'URL set completo), quindi `eager:false` sarebbe inutile/rotto; applicato l'idioma esistente del progetto `query:'?url'` (URL stringhe senza wrapper JS per asset, stesso pattern di `portraitAutoImports.ts`) a `MoodboardPage` (`@/assets/mood/**`) e `PromptAndBibleStylePage` (`@/assets/**`); `loading="lazy" decoding="async"` su img stage/gallery (moodboard, PromptReferenceGallery). Emissione media invariata per ruling Director; costo client = fetch on-demand + precache stretta (T-3).

Le tab sono già `lazy()` e montate solo all'attivazione (F5). Il lavoro reale è su **emissione + fetch**:

- `eager: true` → `eager: false` sui glob di massa (`@/assets/mood/**` ~84 MB, `@/assets/**` ~97 MB in `PromptAndBibleStylePage`). Attenzione al contratto dei consumatori (verificare accesso per-chiave vs `Object.entries` top-level — correzione DeepSeek).
- `<img loading="lazy" decoding="async">` nelle gallery (moodboard/storyboard).
- Nota dibattito (Claude): con `eager:true` il chunk contiene solo stringhe URL → il costo client vero è **emissione + precache**; `eager:false` resta utile per separare i chunk-asset per tab, ma il fix client decisivo è T-3.
- I media restano emessi su CDN (ruling Director). Misura: transfer all'apertura di Moodboard/PromptBible registrato in T-5.

### T-2 — Build flag + split `public/` ✅ (2026-11-13)

> **Fatto:** `dev-public/` = 345 MB fisicamente spostati (`mockups`, `lab-fan-mock`, `fork-mountains`, `hud-target`, `spike-land-breath`, `example-circle-star`, `lab-preview`, `labs` + 16 file mockup/config sparsi alla root). `public/` 819→474 MB. Plugin `devPublicPlugin` (`configureServer` **+ `configurePreviewServer`**) serve dev-public agli stessi URL in dev e preview — smoke test preview: 200 + MIME corretto. `.vercelignore` aggiunto (`?raw` in `@docs/plans|prompts` non coperti). **Slim build: dist 1.0 GB → 624 MB**, precache 87 entry/4.9 MB. Residuo D-1: ~176 MB di `public/assets` non referenziati staticamente — esclusi dallo split (rischio ref dinamici; decide T-5 con raccolta 404 runtime).

- `package.json`: `"build:deploy": "VITE_DEPLOY_SLIM=true vite build --mode production"`.
- `vite.config.ts`: se `DEPLOY_SLIM` (env only, mai `mode`) → alias `labRoutes` → slim **e** `publicDir` ridotto.
- Split `public/`: dev-only in `dev-public/` (stessa struttura) + plugin con **`configureServer` E `configurePreviewServer`** che la serve agli stessi URL → dev e `vite preview`/playwright full non si accorgono di nulla; in build slim `dev-public/` non è copiata.
- `.vercelignore` (secondario — vale per upload CLI, non riduce il clone con integrazione Git): `dev-public/`, `test-results/`, `coverage/`, `src/docs/docs/game_surface_audit/`. **Mai** pattern che coprono file importati (i 2 `?raw`): assert in T-4.

### T-3 — Precache SW stretta + cap runtime ✅ (2026-11-13)

> **Fatto:** `globPatterns` → `{js,css,html,ico,woff2}` + `vite.svg`/`manifest.*` (icone PWA come eccezione nominata); `globIgnores` ripulito. `service-worker.ts`: `putWithCap` (200 entry max + 7 giorni via header Date) applicato a tutti e 3 i `cache.put` runtime (fetch handler, `networkFirstStrategy`, `cacheFirstStrategy`). Verifica dist: **0 entry immagine nel manifest precache** (87 entry shell, ~4.9 MB). Test: 8/8.

- `workbox.globPatterns`: solo `{js,css,html,ico}` (+ `woff2` se emessi) + **whitelist esplicita delle icone PWA d'installazione** (`manifest.json` icons, apple-touch) — eccezione nominata, non glob.
- Fetch handler hand-written: aggiungere cap esplicito (maxEntries + maxAge) alle cache runtime immagini — equivalente ExpirationPlugin, implementato sull'handler esistente. Senza cap, il fix precache sposta il problema nel runtime leak (QuotaExceeded → SW update fallito → client stuck su bundle vecchio).
- Assert (T-4): ogni ramo fetch/registerRoute ha un cap dichiarato (check lint-like sul sorgente); manifest SW generato senza entry immagine fuori whitelist; prefix degli asset kept coperti da una strategia runtime.

### T-4 — Gates meccanici + test di regressione (R-247) ✅ (2026-11-13)

> **Fatto:** `scripts/deploy/assertDeployShape.mjs` in coda a `build:deploy`; `deploy-budget.json` committato (`tuned:false` → advisory); `build.manifest` attivo solo in slim. Check implementati: dev-dirs, **moduleIds lab** (manifest, non basename — con esclusione dei moduli lab importati anche dalle tab kept), chunk kept, precache senza immagini, `?raw` vs `.vercelignore`, ref non-lab→dev-public (match per directory di pagina lab, spike incluse), drift manifest, budget advisory. **PASS: dist=568.2 MB, 73 chunk.** Test 8/8.

- `scripts/deploy/assertDeployShape.mjs` in coda a `build:deploy`:
  - **inverso forte** (correzione dibattito): `build.manifest: true` o plugin `generateBundle` → fallisce se un `moduleIds` di pagina lab appare in qualsiasi chunk (non sui basename, fragili);
  - no dir dev-only in `dist` (`mockups/`, `lab-fan-mock/`, `hud-target/`, `fork-mountains/`, `dev-public/`); chunk delle route kept presenti;
  - manifest SW senza immagini fuori whitelist icone;
  - per ogni `?raw` import nel grafo kept: il file target **non** è coperto da `.vercelignore`;
  - nessun riferimento kept→`dev-public/` (OB-1 blocking, correzione Claude);
  - manifest rigenerato == committato (drift check, like-for-like per profilo);
  - soglie da `deploy-budget.json`: fino a T-6 advisory (stampa misura), poi blocking.
- `deploy-budget.json` (committato): `{ distMaxBytes, coldTransferMaxBytes, installTransferMaxBytes }` — cold e install sono **due misure distinte** (correzione DeepSeek).
- `tests/unit/deploy/deploySlim.test.ts` (permanente, red-first): golden path→route (legacy ≡ registry), esaustività LAB_PATHS/loaders (tipo + runtime), match prefix/param/redirect, `RouteUnavailable` render + link `/`, flag falsy in vitest.

### T-5 — Verifica reale (T-22/T-04) ✅ (2026-11-13)

> **Fatto:** `scripts/deploy/slimPreviewVerify.mjs` (misura cold transfer + fallback + failed-requests + walk). Su `vite preview` slim: probe WebGL **PASS su `/` e `/game`**; `/hud-lab` → RouteUnavailable; zero request fallite/pageerror. **Misure: cold transfer `/` = 6.0 MB, `/game` = 8.5 MB; install (precache) ≈ 4.9 MB.** Report: `test-results/deploy-slim/report.json`.

- `rm -rf dist` → `build:deploy` → `vite preview` → probe WebGL (`webglBootProbe.mjs`) su `/` e `/game`: boot pulito, canvas mondo, **zero richieste fallite o content-type incoerente** + walk minimo (menu radiale, pannelli principali) per coprire gli asset oltre il boot (correzione Claude).
- Route nota (`/hud-lab`) → fallback, nessun chunk lab.
- Misurare e registrare `coldTransfer` e `installTransfer` su `/` e `/game` → input per `deploy-budget.json` (T-6).
- Deploy reale → `guardian:deploy-guard` + `deploy:vercel:verify` verdi sull'alias (R-304).

### T-6 — Taratura budget ✅ (2026-11-13)

> **Fatto:** `deploy-budget.json` → `tuned:true`, `distMaxBytes=685 MB` (568.2+15%), `coldTransferMaxBytes=10.5 MB` (8.5+15%), `installTransferMaxBytes=6 MB` (4.9+15%). Gate attivo in `assertDeployShape`.

Dopo il primo slim build verificato: scrivere `deploy-budget.json` = misura + 15%, girare l'interruttore advisory→blocking in `assertDeployShape`.

## 4. Contratto di chiusura (verification.json → verify:bundle → bundle.json)

| OB | Tipo | Obbligazione | Blocking |
|---|---|---|---|
| OB-1 | state | `deployManifest.mjs --profile=slim` exit 0; manifest committato == rigenerato; **zero** riferimenti grafo kept→`dev-public/`; orfani elencati con byte | sì |
| OB-2 | state | `rm -rf dist && npm run build:deploy` → `assertDeployShape` PASS: no dev-only dirs, **nessun moduleId lab nei chunk** (manifest/moduleIds), chunk kept presenti, SW manifest senza immagini fuori whitelist, `?raw` non coperti da `.vercelignore`, budget PASS o advisory pre-T-6 | sì |
| OB-3 | state | `npm run test -- tests/unit/deploy/` verde — golden path→route, registry/fallback/flag, red-first | sì |
| OB-4 | state | Probe WebGL su `vite preview` slim: `/`,`/game` bootano, zero request fallite + walk minimo; `/hud-lab` → fallback; cold+install transfer misurati e registrati in `test-results/deploy-slim/` | sì |
| OB-5 | state | Invarianti full: `vite build` e `--mode playwright` contengono ancora lab e `dev-public` (mockups in dist); `lint`, `build:check`, `closure:lint` verdi | sì |
| OB-6 | human-eye | Deploy reale: `guardian:deploy-guard` + `deploy:vercel:verify` verdi sull'alias; misura cold load su dispositivo/throttling mobile. Al deploy, non alla chiusura | no |

## 5. Rischi / note

- **Asset runtime non nel manifest**: path da `assetBase`+chiave coperti risolvendo i manifest JSON in T-0; il probe T-5 raccoglie i 404 residui (walk minimo) → riammissione nel manifest, non nel codice.
- **Ownership file caldi**: PLAN-118 dichiara ownership di `App.tsx` e `vite.config.ts` — lavoro parallelo (T-13) fa rebase, non edit concorrente (correzione dibattito).
- **`vercel.json` rewrite**: invariata; fallback client-side sul path.
- **Preview deploys Vercel**: slim come produzione → **i test e2e su lab route non devono puntare a preview Vercel**; girano su `vite preview` full locale / playwright mode (nel contratto).
- **`external` rollupOptions production**: probabilmente no-op; lasciato, fuori scope.
- **PWA update**: `activate` elimina cache vecchie (verificato); i client esistenti ricevono il nuovo manifest ridotto + cap runtime.
