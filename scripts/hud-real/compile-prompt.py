#!/usr/bin/env python3
"""compile-prompt.py — PLAN-110 G-3. Compiles the single-line guided-generation
prompt for one zone from zone.json + defects.json.

zone.json schema (one file per zone):
{
  "component": "C1", "zone": "ring",
  "design_png": "mockups/r1v0/C1-roster.webp",
  "guide_png": "gen-inputs/guide-ring.png",
  "material_ref": ".mw/specs/hud-zanara/kit/approved/K1-ring-ritratto.png",
  "preserve": ["sagoma","proporzioni","palette","motivo","conteggi"],
  "repair":   ["dettaglio anello","forma gemme"],
  "defects": ["D-01","D-03"],
  "extra": "specular continuity with band joint"
}
defects.json (project-level): {"D-01": {"zone":"ring","text":"volute gemma irregolare"}, ...}

Checks: single line, 'Generate an image:' prefix, no banned vocabulary,
roles documented. Output: the prompt on stdout (--write saves to zone dir).
"""
import argparse
import json
import sys
from pathlib import Path

BANNED = ["text", "letters", "font", "leaves", "foglie", "purple", "viola",
          "brown", "marrone", "watermark", "firma", "bordi rigidi", "cornice",
          "nuvolette", "clouds", "people", "persone", "ui panel", "ui elements"]

PREFIX = "Generate an image: "


def compile_prompt(zone_path: Path, defects_path: Path) -> str:
    z = json.loads(zone_path.read_text())
    defects = json.loads(defects_path.read_text()) if defects_path.exists() else {}
    parts = [PREFIX + z["task"] if "task" in z else PREFIX]
    parts.append(
        "Image 1 is the design to preserve: keep the silhouette, proportions, palette, "
        "motif identity and every count unchanged. Image 2 is a geometry guide: red "
        "channels mark regions to repair, blue channels mark regions to preserve. "
        "Image 3 is the material reference: use its enamel, gold sheen and relief "
        "depth for the repaired surfaces."
    )
    fix = [defects[d]["text"] for d in z.get("defects", []) if d in defects]
    if fix:
        parts.append("Repair only these defects, nothing else: " + "; ".join(fix) + ".")
    if z.get("preserve"):
        parts.append("Do not alter: " + ", ".join(z["preserve"]) + ".")
    if z.get("repair"):
        parts.append("Repair scope: " + ", ".join(z["repair"]) + ".")
    if z.get("extra"):
        parts.append(z["extra"].rstrip(".") + ".")
    parts.append("Flat solid dark navy background #0a1622 behind the element. "
                 "No text, no letters, no interface elements.")
    prompt = " ".join(p.strip() for p in parts if p.strip())
    low = prompt.lower()
    bad = [w for w in BANNED if w in low and w not in ("text", "letters")]
    # 'text'/'letters' appear legitimately in the closing "No text, no letters"
    tail_ok = "no text, no letters" in low
    for w in bad:
        if w in ("text", "letters") and tail_ok:
            continue
        raise SystemExit(f"banned vocabulary in prompt: '{w}'")
    if not prompt.startswith(PREFIX):
        raise SystemExit("prompt must start with 'Generate an image:'")
    if "\n" in prompt:
        raise SystemExit("prompt must be a single line")
    return prompt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zone", required=True)
    ap.add_argument("--defects", default=".mw/specs/hud-real/defects.json")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    p = compile_prompt(Path(a.zone), Path(a.defects))
    print(p)
    if a.write:
        out = Path(a.zone).with_suffix(".prompt.txt")
        out.write_text(p + "\n")
        print(f"→ {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
