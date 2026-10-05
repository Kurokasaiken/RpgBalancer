# Destiny Astrolabe — Mockup Provenance

**Tool:** `scripts/rpg-gen-mockup.py` with `--enforce-canon`
**Generator:** stabilityai/stable-diffusion-xl-base-1.0
**Hardware:** Apple MPS (`torch.backends.mps.is_available()` = True)
**Spec directory:** `.mw/specs/destiny-astrolabe`
**Canonical files:** `design-intent.md`, `identity.md`, `prompt.md`, `authority.md`
**Date:** 2026-08-15

## Outputs

| Seed | File | Size | Notes |
| --- | --- | --- | --- |
| 3508323798 | `public/mockups/external/destiny-astrolabe/destiny-astrolabe-3508323798-20260815-174813.png` | 2150365 bytes | First candidate |
| 3508323799 | `public/mockups/external/destiny-astrolabe/destiny-astrolabe-3508323799-20260815-175556.png` | 2090346 bytes | Second candidate |
| 3508323800 | `public/mockups/external/destiny-astrolabe/destiny-astrolabe-3508323800-20260815-180429.png` | 2079734 bytes | Third candidate |
| 3508323801 | `public/mockups/external/destiny-astrolabe/destiny-astrolabe-3508323801-20260815-181532.png` | 1895392 bytes | Fourth candidate |

## Generation parameters

- `count`: 4
- `width`: 1024
- `height`: 1024
- `steps`: 30 (default)
- `cfg`: 7.5 (default)
- `out-dir`: `public/mockups/external/destiny-astrolabe`

## Prompt note

The positive prompt from `prompt.md` was truncated by CLIP at 77 tokens. The truncated portion included secondary Empire/Wilderness variants and the full negative prompt. The next iteration must shorten the prompt to stay within the 77-token budget or split it into separate spec files per variant.

## Evaluation checklist (to be filled by Director/agent)

- [ ] Coherent with `gilded-observatory` skin / Empire pillar
- [ ] No text, no watermark, no signature
- [ ] Asymmetric frame
- [ ] No flat digital surfaces
- [ ] No grey, no brown, no mud
- [ ] Decomposable into CSS/SVG/texture
