#!/usr/bin/env python3
"""Ask GEMINI (vision) to design the "light" far-zoom version of the
PRODUCTION /game POI marker, which must transition into the baptized
Zanara marker when zooming in.

Director keys only (GOOGLE_API_KEY) — zero ACU, D-229.
"""
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

ENV_CANDIDATES = [
    Path("/Users/faustoboni/progetti_personali/mind-weaver/.env"),
    Path("/Users/faustoboni/progetti_personali/RPG/.env"),
]

MODEL = os.environ.get("POI_ASK_MODEL", "gemini-3-flash-preview")

PROMPT = """You are an art director for a dark-fantasy idle game HUD ("Gilded Observatory" language: obsidian/basalt black, sun-bronze/brass, ivory, controlled teal accents).

CONTEXT — this is the design problem:
IMAGE 1 is the PRODUCTION map marker for a "Point of Interest" (POI), already BAPTIZED by the Director — it is the FINAL look and must NOT change: an ornate brass ring with 4 sapphire dagger-points (N/E/S/W, south elongated into a tail so it reads as a map pin), a large blue enamel dome in the centre (a painted icon of the place sits inside), and a thin channel ring that fills/drains as a timer (job fills clockwise, quest deadline drains counter-clockwise, urgent shifts to red).
IMAGE 2 shows it at real sizes on the map (24, 32, 48 px on dark sea): at far zoom the engraved detail turns to noise and it reads as a "blue blob with gold rim".

The Director's ruling: the marker needs TWO LOD states.
- FAR ZOOM = a "light" version: simplified, instantly visible, sits beautifully on the map.
- NEAR ZOOM = the baptized marker you see in IMAGE 1 (untouchable).
- Zooming in, the light version TRANSITIONS into the full marker (crossfade/morph) — so the light version must be a REDUCTIO of the same design: same silhouette grammar, same material language, just fewer elements and more contrast, so the morph reads as "the same object gaining richness", not a different icon swapping in.

CRITICAL REVISION — read carefully: the marker is not just the brass piece. Around it sits a MAGIC-CIRCLE HALO — a luminous ring band in the family colour (sapphire blue for quest) with small white runes, which carries the timer (job fills clockwise, quest deadline drains counter-clockwise). The halo is part of the object's identity: the piece reads as "a brass instrument held inside a ring of light". In production there is already a far-zoom ruling for it: at far distance the runes vanish and the halo becomes a plain luminous saturated band. THE LIGHT VERSION MUST INCLUDE THE HALO — simplified (plain luminous band, maybe segmented to hint the timer), but present and visible.

Your task — design the LIGHT version (REVISED, halo included):
0. FIRST describe how the halo works in the light version: band thickness relative to the piece, colour/luminosity, whether it stays a full ring or becomes segmented arcs, and how it helps (not hurts) readability at 16-32px on dark sea and light terrain.
1. Which elements of the baptized marker survive in the light version (silhouette? south tail? brass ring? dome colour? halo?), and which are dropped or flattened — and why, element by element.
2. Exact visual description of the light version (proportions, colour split, stroke weights) such that it reads instantly at ~20-32px on BOTH dark sea AND light terrain backgrounds (bright ochre/green land). It should still say "brass instrument", not generic game pin.
3. How the transition should read: which shapes morph into which — INCLUDING the halo (e.g. plain luminous band -> white runes fade in + band darkens to family colour; simple brass pin silhouette -> the 4-point compass appears; flat dark centre -> enamel dome + icon fades in). Describe the 0%, 50%, 100% frames briefly.
4. A compact prompt fragment an image generator could execute to render the light version WITH its halo ring as a painted asset on a solid chroma background.

Hard constraints: no purple/violet/magenta; no brown or grey; brass must read as metal; painted material object, not a flat digital glyph; must converse with the HUD's ornate baroque frames; no text, no watermark.

One final paragraph: the single biggest risk in a two-LOD marker and how to avoid it. Compact English prose, no fluff."""


def load_key():
    for p in ENV_CANDIDATES:
        if p.exists():
            for line in p.read_text().splitlines():
                if line.startswith("GOOGLE_API_KEY="):
                    return line.split("=", 1)[1].strip()
    sys.exit("GOOGLE_API_KEY not found")


def main():
    key = load_key()
    imgs = sys.argv[1:]
    if not imgs:
        sys.exit("usage: ask-gemini-light.py <img1> [img2 ...]")
    parts = [{"text": PROMPT}]
    for i, p in enumerate(imgs):
        parts.insert(i, {"text": f"IMAGE {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(Path(p).read_bytes()).decode()}})
    body = {"contents": [{"parts": parts}]}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=240))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read()[:2000].decode(), file=sys.stderr)
        sys.exit(1)
    for cand in resp.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if "text" in part:
                print(part["text"])
    print(f"\n---\nmodel={MODEL}", file=sys.stderr)


if __name__ == "__main__":
    main()
