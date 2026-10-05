# Canonical Dev Server Port for Agent Testing

Applies to every task that requires running the application in the Vite dev server for manual or automated testing, smoke checks, browser preview, or runtime verification.

## Single source of truth

- The canonical agent testing URL is `http://localhost:5173/`.
- The only command authorized to start the dev server is `npm run dev`.
- The pinned Node version from `.nvmrc` must be active before starting the server (`source ~/.nvm/nvm.sh && nvm use`).

## Enforcement

- Before testing any page or feature, verify that a dev server is responding on `http://localhost:5173/`.
- If port 5173 is not serving:
  1. Terminate any stale `npm run dev`, `vite`, or other process bound to 5173.
  2. Activate the pinned Node version.
  3. Run `npm run dev`.
- All smoke tests, curl checks, browser previews, and Playwright/RTL runtime checks must target `http://localhost:5173/` unless a harness explicitly overrides the port.

## Avoiding the Devin preview trap

Some tools (e.g. Devin `browser_preview`) may surface a URL like `http://127.0.0.1:58678/`. This is **not** the Vite dev server — it serves `index.html` for every path, so `/src/main.tsx` is returned as HTML instead of JavaScript and the page stays blank.

- If `browser_preview` is called with a URL other than `http://localhost:5173/`, **override it to the canonical URL** unless the user explicitly requests a different port.
- Before opening any `browser_preview`, run:

  ```bash
  curl -s -o /dev/null -w "status:%{http_code}\ncontent-type:%{content_type}\n" http://localhost:5173/src/main.tsx
  ```

- The response must be `text/javascript` or `application/javascript`. If it is `text/html`, the server is not Vite — start `npm run dev` first.

## Relationship to other invariants

- This rule complements the runtime smoke test in `00-project-invariants.md`, which assumes the dev server is available on port 5173.
