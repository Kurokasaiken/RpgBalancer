# Browser Preview Guard (ALL SKILLS)

Applies to **every skill, agent, and task** that opens a web preview, smoke check, or automated browser session — including `browser_preview`, Puppeteer, Playwright, curl checks, and any "open in browser" action.

## Canonical preview URL

- The only default preview URL is `http://localhost:5173/`.
- `http://127.0.0.1:58678/` and similar Devin/Codeium injected URLs are **not** the Vite dev server. They serve `index.html` for every path and produce a blank white screen. Do not use them unless the user explicitly requests that exact URL.

## Mandatory pre-flight check

Before opening any preview, verify the Vite dev server is serving JavaScript modules:

```bash
curl -s -o /dev/null -w "status:%{http_code}\ncontent-type:%{content_type}\n" http://localhost:5173/src/main.tsx
```

The response must:
- Have `status: 200`
- Have `content-type:` containing `javascript` (`text/javascript` or `application/javascript`)

If the response is `text/html` or any non-200, the server is not ready.

## Auto-start on failure

If the pre-flight check fails:

1. Terminate any stale `npm run dev`, `vite`, or other process bound to `5173`.
2. Activate the pinned Node version: `source ~/.nvm/nvm.sh && nvm use`
3. Start the dev server: `npm run dev`
4. Re-run the pre-flight check.
5. Only then open `browser_preview` (or any other preview tool) on `http://localhost:5173/`.

## Overrides

A harness or an explicit user instruction may override the port. If the override URL fails the same `/src/main.tsx` content-type check, treat the server as invalid and fall back to `http://localhost:5173/`.

## Rationale

Vite transforms `.tsx` modules on the fly. A server that returns `index.html` for `/src/main.tsx` prevents React from mounting and causes a blank white screen. This guard applies to all skills so no agent can accidentally show a broken preview.
