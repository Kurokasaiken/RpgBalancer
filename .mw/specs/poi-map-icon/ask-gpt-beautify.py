#!/usr/bin/env python3
"""Ask GPT (vision) how to beautify the PRODUCTION /game POI marker.

Sends the composited Zanara quest marker + a real-size strip (24/32/48px)
and returns concrete art-direction proposals, ranked, executable by an
image generator (the production asset is a painted webp master).

Director keys only (OPENAI_API_KEY via mind-weaver/.env) — zero ACU, D-229.
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

MODEL = os.environ.get("POI_ASK_MODEL", "gpt-5.5")

PROMPT = """You are an art director for a dark-fantasy idle game HUD ("Gilded Observatory" language: obsidian/basalt black, sun-bronze/brass, ivory, controlled teal accents).

IMAGE 1 is the PRODUCTION map marker for a "Point of Interest" (POI) as it ships today in /game: an ornate brass ring with 4 sapphire dagger-points (N/E/S/W, the south point elongated into a tail so it reads as a map pin), a large blue enamel dome in the centre (a painted icon of the place sits inside the dome), and a thin channel ring between dome and rim that fills/drains as a timer (job fills clockwise, quest deadline drains counter-clockwise, urgent state shifts the arc colour to red).

IMAGE 2 shows the same marker at its REAL rendered sizes on the map: 24, 32 and 48 px tall, on a dark sea. At these sizes the blue enamel dome dominates everything — it reads as a "blue blob with gold rim".

The Director's verdict: from afar the marker must be IMPROVED / beautified.

Hard constraints:
- No purple/violet/magenta anywhere. No brown or grey on the marker surfaces.
- Brass stays brass — it must read as metal, not plastic.
- It is a material object (painted), not a digital glyph.
- The silhouette must read clearly at 24-48 px on BOTH dark sea and light terrain map backgrounds.
- It must converse with the HUD's ornate baroque frames/filigree.
- The timer arc (channel ring) and the central dome that hosts a painted place-icon are FUNCTIONAL — keep them, but their treatment can change.
- The blue family colour for quest is provisional and can change; job uses green, urgency shifts to red.

Your task: propose 3-4 CONCRETE directions to beautify this marker, ranked by your recommendation. For each direction give:
1. Name + one-line concept.
2. Exactly what changes visually (materials, proportions, ornament, colour splits between brass/enamel/gem).
3. Why it reads better at 24-48 px and from afar.
4. A compact prompt fragment an image generator could execute to re-render the marker (the production asset is a painted 1786x1873 px webp master, regenerated as a single painted illustration on a solid chroma background).

Also: one paragraph on what is CURRENTLY wrong / weakest in the design from afar. Be specific and honest. Answer in English, compact prose, no fluff."""


def load_key():
    for p in ENV_CANDIDATES:
        if p.exists():
            for line in p.read_text().splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    return line.split("=", 1)[1].strip()
    sys.exit("OPENAI_API_KEY not found")


def b64(path):
    return base64.b64encode(Path(path).read_bytes()).decode()


def main():
    key = load_key()
    imgs = sys.argv[1:]
    if not imgs:
        sys.exit("usage: ask-gpt-beautify.py <img1> [img2 ...]")
    content = [{"type": "text", "text": PROMPT}]
    for i, p in enumerate(imgs):
        content.insert(i, {"type": "text", "text": f"IMAGE {i + 1}:"})
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64(p)}", "detail": "high"}})
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": content}],
        "max_completion_tokens": 4000,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        resp = json.load(urllib.request.urlopen(req, timeout=240))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read()[:2000].decode(), file=sys.stderr)
        sys.exit(1)
    print(resp["choices"][0]["message"]["content"])
    usage = resp.get("usage", {})
    print(f"\n---\nmodel={MODEL} usage={usage}", file=sys.stderr)


if __name__ == "__main__":
    main()
