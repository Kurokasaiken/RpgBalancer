#!/usr/bin/env python3
"""One-shot: retouch the compass medallion via Gemini image editing.

Input : pasted PNG (medallion on map background + banner bar).
Edit  : keep only the medallion, empty the center (no emerald/X/+),
        solid magenta background for easy chroma-key later.
Output: out/medallion-edit/raw-<model>.png
"""
import base64
import json
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1])
MODEL = sys.argv[2] if len(sys.argv) > 2 else "gemini-3.1-flash-image"
OUT = ROOT / "out" / "medallion-edit"
OUT.mkdir(parents=True, exist_ok=True)

key = None
for line in (ROOT / ".env").read_text().splitlines():
    if line.startswith("GOOGLE_API_KEY="):
        key = line.split("=", 1)[1].strip().strip('"').strip("'")
assert key, "GOOGLE_API_KEY missing in .env"

PROMPT = (
    "Edit this image. Keep ONLY the golden ornate compass medallion: the "
    "outer gold ring, the gold star/spike points around it, the small emerald "
    "gems at the cardinal points, and the inner dark teal-green glassy disc "
    "with its engraved rings. Remove EVERYTHING else: the map background, "
    "the horizontal gold-and-teal banner bar behind the medallion, and any "
    "text. Inside the medallion, empty the very center completely: remove "
    "the big central emerald gem, the gold X-shaped star and the gold plus-sign "
    "crosshair in the middle. Fill that central area with the same smooth dark "
    "teal-green glassy material as the inner disc, clean and empty, ready to "
    "hold an icon. Place the medallion centered on a flat solid magenta "
    "background (pure #FF00FF), medallion edge to edge, nothing else in frame."
)

b64 = base64.b64encode(SRC.read_bytes()).decode()
payload = {
    "contents": [
        {
            "parts": [
                {"inlineData": {"mimeType": "image/png", "data": b64}},
                {"text": PROMPT},
            ]
        }
    ],
    "generationConfig": {"responseModalities": ["IMAGE"]},
}
url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
r = requests.post(url, params={"key": key}, json=payload, timeout=300)
if r.status_code != 200:
    print("HTTP", r.status_code, r.text[:2000])
    sys.exit(1)

saved = 0
for cand in r.json().get("candidates", []):
    for part in cand.get("content", {}).get("parts", []):
        data = part.get("inlineData") or part.get("inline_data")
        if data and data.get("data"):
            out = OUT / f"raw-{MODEL}-{saved}.png"
            out.write_bytes(base64.b64decode(data["data"]))
            print("saved", out)
            saved += 1
if not saved:
    print(json.dumps(r.json(), indent=2)[:2000])
    sys.exit(1)
