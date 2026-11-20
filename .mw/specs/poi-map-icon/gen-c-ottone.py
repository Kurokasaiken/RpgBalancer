#!/usr/bin/env python3
"""Retry of direction C with an explicit all-brass field (first batch drifted
to teal enamel). NIM FLUX dev, headless."""
import base64
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "gen"

env = dict(
    l.split("=", 1) for l in (ROOT.parents[2] / ".env").read_text().splitlines()
    if "=" in l and not l.startswith("#")
)
KEY = env["NVIDIA_API_KEY"].strip().strip('"').strip("'")

PROMPT = """Paint a single game map marker icon, square 1:1.

SUBJECT: A small round brass seal dominated by one bold four-point compass star engraved in relief across its whole face — the star arms reach almost to the rim, the vertical arm slightly longer and pointing down; tiny bead rivets in the four notches between the arms. IMPORTANT: the star AND the disc face are BOTH metal — a light champagne brass star on a deeper antique-bronze face, no coloured enamel anywhere, all brass tones only.

STYLE — Wanderlust painted map marker. A small ornate brass marker for the world map of a fantasy strategy game, centred and seen from the front, with a bold silhouette that fills about 80% of the square; it must read as one solid shape at 16 pixels and stay distinct in greyscale. MATERIAL: all metal — hand-cast champagne brass, rubbed warm and bright on every raised edge, with deeper antique bronze pooled in the hollows; depth comes from engraving and relief, not enamel colour fields. LIGHT: one warm white key light from the upper left, deep cool teal shadow on the lower right; a strong value split between the lit face and the shadow side. RENDERING: painted game asset, rich oil impasto in the manner of Jaime Jones on the metal surfaces, a crisp clean silhouette edge, engraved detail kept bold and sparse so it survives at 16 pixels; luminous, never black murk; shadows are deep teal, NO grey, NO muddy brown.

STRICT RULES: no text, letters, numbers or runes; no skulls or bones; no scene, no landscape, no ground shadow; no flat vector look, no 3D-render plastic, no cartoon outline; no teal, green or blue enamel fields — ALL brass; no purple, no grey, no brown, no mud; no busy filigree finer than a thick engraved notch; no signature.

OUTPUT: square 1:1 image, the marker alone on a perfectly flat solid magenta background (#FF00FF) with no gradient and no shadow on it; the background will be keyed out and the marker reduced to 64, 32, 24, 20 and 16 px."""

for i in range(2):
    r = requests.post(
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev",
        headers={"Authorization": f"Bearer {KEY}", "Accept": "application/json"},
        json={"prompt": PROMPT, "width": 1024, "height": 1024, "steps": 28, "cfg_scale": 4},
        timeout=300,
    )
    if r.status_code != 200:
        print("HTTP", r.status_code, r.text[:200])
        break
    arts = r.json().get("artifacts", [])
    if arts:
        p = OUT / f"C-stella-ottone-raw-{i}.png"
        p.write_bytes(base64.b64decode(arts[0]["base64"]))
        print("saved", p.name)
