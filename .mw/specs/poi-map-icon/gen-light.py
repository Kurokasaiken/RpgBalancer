#!/usr/bin/env python3
"""Generate the LIGHT (far-zoom LOD) version of the POI marker via NVIDIA
NIM FLUX txt2img — the light version is a NEW asset (reductio of the
baptized Zanara), so no image-edit channel needed.

Gemini's design: bold teardrop-compass, thick sun-bronze rim, elongated
south wedge, 3 small cardinal brass nubs, solid sapphire cabochon with a
single specular highlight, basalt inner stroke, no engraving, no icon.
"""
import base64
import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "gen"
OUT.mkdir(exist_ok=True)

MODEL = "black-forest-labs/flux.1-dev"
SHOTS = 4

PROMPT = (
    "single ornate fantasy map pin icon, teardrop-compass shape: a thick polished sun-bronze "
    "metal ring frame with one sharp elongated triangular tail pointing down like a map pin, "
    "and three small solid triangular brass protrusions at top, left and right cardinal points; "
    "the ring has a dark basalt-black inner stroke, inside it one large perfectly circular "
    "deep sapphire-blue cabochon gem filling most of the frame with a single bright specular "
    "highlight at top-left; heavy solid brass casting, hand-painted dark-fantasy game UI asset, "
    "clean bold silhouette readable at tiny icon size, centered, fills 80 percent of the canvas, "
    "flat solid magenta chroma-key background, even lighting, no shadow, no text, no letters, "
    "no watermark, no signature, no purple, no violet, no brown, no grey"
)


def env_key(name):
    for p in (Path("/Users/faustoboni/progetti_personali/RPG/.env"), Path("/Users/faustoboni/progetti_personali/mind-weaver/.env")):
        if p.exists():
            for line in p.read_text().splitlines():
                if line.startswith(f"{name}="):
                    return line.split("=", 1)[1].strip()
    raise SystemExit(f"{name} missing")


def gen(prompt):
    payload = {"prompt": prompt, "width": 1024, "height": 1024, "steps": 28, "cfg_scale": 4}
    req = urllib.request.Request(
        f"https://ai.api.nvidia.com/v1/genai/{MODEL}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {env_key('NVIDIA_API_KEY')}", "Content-Type": "application/json", "Accept": "application/json"},
    )
    r = urllib.request.urlopen(req, timeout=300)
    arts = json.load(r).get("artifacts", [])
    return base64.b64decode(arts[0]["base64"]) if arts and arts[0].get("base64") else None


for n in range(SHOTS):
    img = gen(PROMPT)
    if img:
        p = OUT / f"L-light-raw-{n}.png"
        p.write_bytes(img)
        print(f"saved {p.name}")
    else:
        print(f"shot {n} empty")
    time.sleep(2)
print("done")
