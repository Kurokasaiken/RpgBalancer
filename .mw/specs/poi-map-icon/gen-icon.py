#!/usr/bin/env python3
"""gen-icon.py — PLAN-125 Fase-4a POI: generate the 3 brass map-marker
directions (A fermaglio / B sigillo-ottone / C stella) via the Gemini image
API. Headless, no browser (ruling 16 — solo headless).

Prompts are read from prompt.md's ```text blocks (the linted channel — T-17),
one block per direction in order A/B/C. Output: gen/<dir>-raw-<n>.png.

Usage:
    python gen-icon.py [--model MODEL] [--shots N]
"""
import base64
import json
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "gen"
OUT.mkdir(exist_ok=True)

MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"]
DIRS = ["A-fermaglio", "B-sigillo-ottone", "C-stella"]

def env_key(name: str) -> str:
    for line in (ROOT.parents[2] / ".env").read_text().splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""

key = env_key("GOOGLE_API_KEY")
or_key = env_key("OPENROUTER_API_KEY")
assert key or or_key, "no image-capable key in .env"

# Extract the ```text blocks from prompt.md: the LAST block of each `##` section
# is that direction's full prompt (style+rules+output are shared blocks).
text = (ROOT / "prompt.md").read_text()
sections = re.split(r"^## ", text, flags=re.M)[1:]
prompts = []
for sec in sections:
    blocks = re.findall(r"```text\n(.*?)```", sec, flags=re.S)
    assert blocks, f"no text block in section: {sec[:40]}"
    prompts.append(blocks[-1].strip())
assert len(prompts) == len(DIRS), f"{len(prompts)} prompts vs {len(DIRS)} dirs"


def generate(model: str, prompt: str) -> bytes | None:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    r = requests.post(url, params={"key": key}, json=payload, timeout=300)
    if r.status_code != 200:
        print(f"  HTTP {r.status_code} [{model}] {r.text[:300]}")
        return None
    for cand in r.json().get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            data = part.get("inlineData") or part.get("inline_data")
            if data and data.get("data"):
                return base64.b64decode(data["data"])
    print(f"  no image part [{model}] {json.dumps(r.json())[:300]}")
    return None


OR_MODELS = ["google/gemini-3.1-flash-image", "google/gemini-2.5-flash-image"]
NIM_MODELS = ["black-forest-labs/flux.1-dev", "black-forest-labs/flux.1-schnell"]


def generate_nim(model: str, prompt: str) -> bytes | None:
    """NVIDIA NIM hosted image gen — JPEG artifact in artifacts[].base64."""
    nim_key = env_key("NVIDIA_API_KEY")
    steps = 4 if "schnell" in model else 28
    payload = {"prompt": prompt, "width": 1024, "height": 1024, "steps": steps, "cfg_scale": 0 if "schnell" in model else 4}
    r = requests.post(
        f"https://ai.api.nvidia.com/v1/genai/{model}",
        headers={"Authorization": f"Bearer {nim_key}", "Accept": "application/json"},
        json=payload,
        timeout=300,
    )
    if r.status_code != 200:
        print(f"  HTTP {r.status_code} [nim:{model}] {r.text[:300]}")
        return None
    arts = r.json().get("artifacts", [])
    if arts and arts[0].get("base64"):
        return base64.b64decode(arts[0]["base64"])
    print(f"  no artifact [nim:{model}]")
    return None


def generate_openrouter(model: str, prompt: str) -> bytes | None:
    """OpenRouter chat/completions with image output (data-URL in message.images)."""
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"],
    }
    r = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=300,
    )
    if r.status_code != 200:
        print(f"  HTTP {r.status_code} [or:{model}] {r.text[:300]}")
        return None
    try:
        for img in r.json()["choices"][0]["message"].get("images", []):
            url = (img.get("image_url") or {}).get("url", "")
            if url.startswith("data:"):
                return base64.b64decode(url.split(",", 1)[1])
    except (KeyError, IndexError) as exc:
        print(f"  bad or response [{model}] {exc} {json.dumps(r.json())[:200]}")
    print(f"  no image in or response [{model}]")
    return None


model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else None
shots = int(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else 1
google_models = [model] if model else MODELS

for d, prompt in zip(DIRS, prompts):
    for n in range(shots):
        saved = False
        attempts = [(f"g:{m}", generate) for m in google_models] + [
            (f"or:{m}", generate_openrouter) for m in OR_MODELS
        ] + [(f"nim:{m}", generate_nim) for m in NIM_MODELS]
        for label, fn in attempts:
            m = label.split(":", 1)[1]
            print(f"{d} shot {n} → {label}")
            img = fn(m, prompt)
            if img:
                p = OUT / f"{d}-raw-{n}.png"
                p.write_bytes(img)
                print(f"  saved {p.name} ({len(img)//1024} KB)")
                saved = True
                break
            time.sleep(2)
        if not saved:
            print(f"  FAIL {d} shot {n}")
        time.sleep(3)
print("done")
