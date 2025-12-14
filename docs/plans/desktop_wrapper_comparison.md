# Desktop Wrapper Comparison: Tauri vs Electron

> **Goal:** Pick the most suitable desktop shell for packaging the Idle Village / Stat Lab suite (Steam-first, Overlay Mode, Deck support) while keeping the config-first TypeScript stack intact.

**Created:** 2025-12-14  
**Status:** Draft recommendation  
**Owner:** Platform/Infra (Phase 12)

---

## 1. Requirements Snapshot

| Requirement | Details |
|-------------|---------|
| Steam-first delivery | Need native window management, auto-update hooks, Steamworks integration, optional overlay window. |
| Overlay Mode support | Spawn second frameless window (always-on-top), share state with main React app, low memory/CPU. |
| Cross-platform | Target Windows/macOS/Linux + Steam Deck (Linux). Mobile/PWA stays web. |
| Tool reuse | Continue running React/Vite/TypeScript bundle; minimal rewrite. |
| Dev velocity | Hot reload, inspector, ability to share code between shell and web. |

---

## 2. Capability Matrix

| Dimension | **Tauri 2.x** | **Electron 29+** |
|-----------|---------------|------------------|
| Runtime footprint | Rust core + system WebView; typical idle app < 150 MB RAM, < 50 MB disk once packaged. | Bundles Chromium + Node; RAM 250–400 MB baseline, disk 150+ MB. |
| Overlay windows | Supports multiple windows with transparent/always-on-top flags; needs custom event loop bridging via `tauri://` channels. | Mature multi-window API (`BrowserWindow`, `BrowserView`); overlay/splash windows widely documented. |
| IPC & engine access | Secure command pattern; Rust side can call engine modules (Node bindings via plugins). Slightly more boilerplate to expose JS APIs. | Node runtime available directly; same codebase can share modules (fs, net). More surface area but familiar. |
| Steam integration | No official plugin yet; need to embed Steamworks SDK via Rust crate (e.g., `steamworks-rs`). Requires writing light glue. | Multiple maintained modules (`greenworks`, `steamworks.js`); community examples for overlay + achievements. |
| Auto-update | Built-in updater (Tauri updater + MSIX/pkg). CLI assists signing. | Proven solutions (`electron-updater`, Squirrel, NSIS). Rich ecosystem for differential updates. |
| Security | Smaller attack surface (no bundled Chromium, CSP enforced by default). | Needs explicit hardening (disable nodeIntegration, enable contextIsolation). More moving parts. |
| Dev tooling | CLI integrates with Vite; hot reload is fast but Rust compile step slows plugin changes. | DevTools identical to Chrome; instant reload; huge ecosystem of examples/snippets. |
| Community maturity | Growing rapidly; still fewer deep-dive guides for complex setups (Steam). | Long history, many tutorials, more stackoverflow coverage. |

---

## 3. Risks & Mitigations

| Risk | Tauri Impact | Electron Impact | Mitigation |
|------|--------------|-----------------|------------|
| Steamworks SDK complexity | Must write/maintain Rust bindings; limited samples. | Ready-made JS wrappers but some are outdated; requires C++ runtime on Windows. | Prototype both SDK integrations early; factor 1–2 weeks for whichever shell is picked. |
| Overlay performance | Depends on system WebView (Edge/WebKit); good on modern OS but inconsistent on legacy Linux. | Consistent across OS thanks to bundled Chromium. | Target OS > Windows 10 / modern macOS / SteamOS; run synthetic tests early. |
| Build size perception | Very small installers expected from Tauri; good for webrunner narrative. | Large installers may hurt first impression but acceptable for Steam PC titles. | Communicate file size expectations; provide delta patching whichever shell. |

---

## 4. Recommendation

1. **Short term (Phase 12 vertical slice):** start with **Electron** to unblock overlay mode prototyping and Steamworks experiments quickly. Reasons:
   - Documentation + tooling are richer; easier to integrate always-on-top overlay window and system tray in days, not weeks.
   - Node access simplifies bridging existing TypeScript utilities (storage, telemetry) without new Rust layer.
   - Steam community expects ~200 MB desktop builds; footprint penalty is acceptable for demo/Next Fest.

2. **Medium term (post demo):** reassess **Tauri** once overlay + Steam integration are stable. Tauri’s lower footprint is attractive for long-term battery/Deck performance, but migration only makes sense after requirements are proven and time budget exists.

---

## 5. Next Steps

1. Spin up `packages/desktop-shell-electron` with Vite preload, preload-to-renderer IPC, and placeholder overlay window.  
2. Integrate Steamworks via `greenworks` or `steamworks.js`; expose minimal APIs (achievements, rich presence, overlay toggle).  
3. Instrument CPU/RAM metrics in overlay mode; document baseline.  
4. Parallel spike: create `desktop-shell-tauri` branch to validate window spawning + IPC; document blockers for future migration.
