# HudRealCassetto (V1) — Frozen Documentation

## Metadata
- Status: `frozen`
- Area: `game-frame` (expedition drawer)
- Canonical Name: `HudRealCassetto` (V1 baseline)
- Primary Files:
  - `src/ui/idleVillage/hudReal/HudRealCassetto.tsx` (FROZEN — do not modify)
  - `src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx` (production adapter, shared)
  - `src/ui/idleVillage/components/gameFrame/ExpeditionDrawer.tsx` (host)
  - `src/balancing/config/idleVillage/cassettoLayoutConfig.ts` (aspect/width)
- Runtime/Test Pages: `/game` (drawer on quest POI), `/hud-compose?comp=cassetto&poi=poi-goblin`
- Living contract: `.mw/contracts/components/hud-real-cassetto.md`
- Approved references:
  - `.mw/specs/expedition-ui/refs/mockup-r357-cassetto-largo.png` (golden R-357)
  - `.mw/specs/expedition-ui/refs/mockup-cassetto-goblin-v3.webp` (goblin quest v3)
- Last Certified: `2026-11-21`
- Last Updated By: `Devin` (freeze on Director request, R-374)

## 1. Purpose
Right-docked expedition drawer column on `/game`: quest cartouche/vignette, party seats
(slotRackKit `draghi`), supplies niches, journey strip, risk/reward wells, CONFIRM CTA.
Publishes occupied width via `useGameLayoutInsets`; slides via `cassettoSlideIn/Out`.

## 2. Frozen baseline
Frozen at the **worktree state of 2026-11-21** — the R-357/PLAN-125 DOM rebuild plus the
same-day Director rulings (mirrored bottom frame corner «togli il ricciolo grande di sotto»,
top-bar well recipe «non c'è bilanciamento», Gemini journey bar, painted `niche`/`box-frame`/
`cta-plaque` pieces, ground under the rail «nero tutto dietro il frame», CTA 820u centred on
the content column). That work was **uncommitted** at freeze time (shared worktree, T-13):
this doc records the baseline so it cannot be silently reverted to the older baked
`column-*-extracted.webp` implementation (already lost once, restored 2026-11-20).

Audit witnesses of the frozen state: `.mw/runs/20261121-cassetto-aesthetic-audit/`
(`cass-empty.png`, `board-details.png`).

Post-freeze drift (shared worktree, T-13): a parallel session kept applying same-day
Director rulings on V1 (enamel left-edge mask «il rettangolo … sia sopra che sotto»,
vignette `marginLeft u(-50)` + left-edge mask «quel quadrato»). V2 ported both verbatim —
the freeze below records the audit baseline, not a claim that V1 stopped evolving.

## 3. Freeze rule
- `HudRealCassetto.tsx` is a signed baseline: **no in-place edits** (behaviour, geometry,
  styling, exported API). Same rule as frozen kits — a change is a new version.
- Exports still consumed by live code (`useCassettoColumnSpec`, `CASSETTO_*`,
  `CassettoQuest`/`HudRealCassettoProps` types, existing unit tests) remain readable-only.
- To evolve the component: copy to a V2 module and certify it (pattern `rosterV2/`).
  The mounted surface switched to `HudRealCassettoV2` on 2026-11-21 (R-374 V2).

## 4. Known residual issues (fixed in V2, R-374)
Audit of the frozen state found 10 issues, kept intentionally as baseline:
1. well contents ~5–10px from the painted frame band (party/bag/journey);
2. CTA centred on the content area (u541), ~14.5px right of the panel centre (u512);
3. title/briefing fill the cartouche to the filets (padding u26);
4. risk/reward wells use a hand-drawn rounded border, not `paintedBoxFrame`;
5. fixed-px geometry inside a `cqw` column (seat cols 104px, `zoom:1.15`, journey icons ~19px);
6. 4th party seat fully clipped, no overflow affordance on the scroller;
7. journey icons visually weak; empty bag niche uses a generic `+` (rule 6b);
8. vignette right edge and bottom rim end short of the screen edge;
9. dead `subtitle` field on `CassettoQuest` (populated, never rendered);
10. scroll band heavier than needed (kept — overflow is real).

## 5. Contract mapping
Living contract `.mw/contracts/components/hud-real-cassetto.md` covers V1 INVs and stays
attached to this frozen file. V2 inherits the same behavioural INVs plus the R-374
additions in `.mw/contracts/components/hud-real-cassetto-v2.md`.
