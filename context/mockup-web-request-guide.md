# Mockup via web providers (ChatGPT/Gemini) — guida operativa

Workflow verificato 2026-11-20 (run `.mw/runs/20261120-eventi-mockup/`): come far
generare a un provider web (ChatGPT, Gemini) un mockup partendo da uno
screenshot, e come recuperare l'immagine. **Tutto in background: mai alzare
finestre** (CTR-foreground-001, `.windsurf/rules/16-no-foreground-windows.md`).

## Pezzi (repo mind-weaver)

- `scripts/mw-web-turn.py` — CLI: `run-create`, `send`, `collect`, `status`.
  `send` supporta `--image <path>` (allega al composer, transport browser).
- `browser-runtime/` — CDP su Chrome keep-alive (porta `MW_CDP_PORT`, default
  `9222`), lanciato `open -g -j -n` (nascosto), tab create con
  `Target.createTarget {background:true}`.
- `.mw/providers/sessions/*.yaml` — sessioni/cookie per provider
  (`chatgpt.yaml`, `gemini.yaml`, `grok.yaml`, …).
- Skill `mw-web-debate` (`mind-weaver/.agents/skills/mw-web-debate/SKILL.md`)
  — il workflow multi-provider completo se serve dibattito, non solo 1 shot.

## Ricetta (cwd: mind-weaver)

```bash
.mw/venv/bin/python scripts/mw-web-turn.py run-create --run <run-id> --providers chatgpt
.mw/venv/bin/python scripts/mw-web-turn.py send --run <run-id> --provider chatgpt \
  --prompt-file <prompt.txt> --image <screenshot.png> --timeout 600 \
  --meta '{"turn_id":"T-001","phase":"clarification","round":1,"kind":"proposal"}'
```

- `--meta` con `turn_id` è **obbligatorio** (altrimenti `META_MISMATCH`).
- Ogni `send` riusa la stessa conversation tab del provider: N turn → tutte
  le immagini generate nella stessa tab.
- `collect`/`send` ritornano SOLO testo — le immagini generate restano nella
  pagina; vanno raccolte via CDP.

## Harvest delle immagini generate (CDP, zero finestre)

Connect al browser keep-alive, `page.evaluate` sulla tab esistente, screenshot
dell'elemento `img` o fetch del blob/src in-page:

```js
import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = b.contexts()[0].pages().find(p => p.url().includes('<provider-tab-frag>'));
// immagini generate: ChatGPT = img[src^="blob:"] (escludere avatar);
// Gemini = img[src^="blob:"] w>200 o lh3.googleusercontent.com
await page.locator('img[src^="blob:"]').first().screenshot({ path: 'out.png' });
```

Esempio funzionante: `RPG/.mw/runs/20261120-eventi-mockup/fetch-blobs.mjs`,
`gem-shot.mjs`. **Niente** `browser.newPage()` né `createTarget` senza
`background:true`: creare una tab la attiva e ruba il foreground.

## Limiti noti (2026-11-20)

- ChatGPT piano Free: ~2 immagini poi rate-limit «riprova tra 24 ore». Fan-out
  su Gemini per le varianti restanti.
- Gemini image gen può superare il timeout di `send` («response did not
  stabilize»): l'immagine può comunque comparire nella tab — harvest a
  posteriori, non dare per fallito.
- Il testo raccolto da `send` può essere l'eco del prompt, non la risposta:
  il successo reale va verificato sull'immagine harvestata (T-04).
