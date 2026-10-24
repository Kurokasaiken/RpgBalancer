#!/usr/bin/env python3
"""Compila `prompt.md` di scena da un `brief.json` (PLAN-080, T-003).

Il compiler è uno **scheletro + slot**: assembla le clausole canoniche del
kernel pittorico (R9, scene_prompt_authoring_guide) attorno alla prosa
autoriale nei campi `prose` del brief. Non decide contenuti: campo prosa
vuoto → placeholder `<!-- AUTHOR: campo -->` e rifiuto di scrivere senza
`--allow-placeholders`.

Regole:
- emissione solo da chiavi allowlisted → nessun leak engineering;
- overwrite di un prompt.md esistente solo con `--force`;
- deterministico: stesso input → stesso output (byte-identico).

Uso:
    python3 scripts/build-scene-prompt.py --brief <brief.json> --out <dir/prompt.md>
    python3 scripts/build-scene-prompt.py --brief <brief.json> --out <dir/prompt.md> [--force] [--allow-placeholders]
"""
import argparse
import json
import pathlib
import re
import sys

PIGMENTS = ("ultramarine", "veronese", "cinnabar", "amber", "azure", "teal")

PROSE_KEYS = (
    "subject",
    "composition",
    "lighting",
    "palette_extra",
    "technique_extra",
    "mood",
)
REQUIRED_PROSE = ("subject", "composition", "lighting", "mood")

CANON_KILL = (
    "NO grim, NO gore, NO decay, NO mud, NO symmetry, NO flat digital, "
    "NO airbrushed smoothness, NO sci-fi, NO text/UI, NO signature, "
    "NO watermark, NO logo, NO frames"
)


def _slot(name: str, value) -> str:
    v = (value or "").strip()
    return v if v else f"<!-- AUTHOR: {name} -->"


def _occluder_clause(brief):
    """Traduce l'occlusore in vincolo di vocabolario + pigmento di scena."""
    pig = (brief.get("pigment") or "deep teal").strip()
    side = (brief.get("occluder") or "").strip().lower()
    if not side or side == "null":
        reason = (brief.get("no_occluder_reason") or "").strip()
        if not reason:
            return "<!-- AUTHOR: no_occluder_reason -->"
        return (
            f"open vista by design ({reason}) — the frame edge is left "
            "unobstructed"
        )
    side_txt = {
        "left": "the extreme left edge",
        "right": "the extreme right edge",
        "both": "BOTH the extreme left and right edges",
    }.get(side)
    if side_txt is None:
        return "<!-- AUTHOR: occluder side -->"
    return (
        f"a broad saturated mass in {pig} anchored at {side_txt} of the "
        "frame, physically continuing beyond the border — one broad convex "
        "silhouette on a single near plane"
    )


def _calm_clause(brief):
    zones = brief.get("calm_zones") or []
    if not zones:
        return ""
    pig = (brief.get("pigment") or "deep teal").strip()
    return (
        " Under the runtime overlay bands the paint stays a low-frequency "
        f"{pig} field — broad masses only, no fine relief."
    )


def _fx_clause(brief):
    anchors = [a for a in (brief.get("fx_anchors") or []) if a.strip()]
    if not anchors:
        return ""
    src = ", ".join(anchors)
    return (
        f" The painted light sources are the {src} — particles, smoke and "
        "glow are runtime overlays, never painted."
    )


def build_text(brief) -> str:
    """Assembla il fenced prompt block canonico (deterministico)."""
    title = (brief.get("title") or brief.get("slug") or "").strip().upper()
    prose = brief.get("prose") or {}
    pig = (brief.get("pigment") or "deep teal").strip()
    aspect = (brief.get("aspect") or "21:9").strip()
    kill_extra = [k.strip() for k in (brief.get("kill_extra") or []) if k.strip()]
    kill = CANON_KILL + (", " + ", ".join(kill_extra) if kill_extra else "")

    # aspect riconosciuto dal lint (Q11): 21:9/3:4/1:1/16:9 — il raster
    # canonico 2.4:1 viene dichiarato insieme alla finestra 21:9.
    aspect_txt = (
        aspect if re.search(r"\b(21:9|3:4|1:1|16:9)\b", aspect)
        else f"{aspect} (21:9 window)"
    )

    return (
        f"{title} — painted in heavy textured oil impasto: "
        f"SUBJECT: {_slot('subject', prose.get('subject'))} "
        f"COMPOSITION: {_slot('composition', prose.get('composition'))} "
        f"{_occluder_clause(brief)}."
        f"{_calm_clause(brief)} "
        f"LIGHTING: {_slot('lighting', prose.get('lighting'))}"
        f"{_fx_clause(brief)} "
        f"PALETTE: {pig} ground, {_slot('palette_extra', prose.get('palette_extra'))}"
        " NO grey, NO brown, NO mud; the frame stays luminous and high-chroma"
        " — light wins over darkness, even the deepest shadow is saturated"
        " color, never black murk. "
        f"TECHNIQUE: thick oil impasto, broad palette-knife brushstrokes, "
        f"visible layers of paint adding physical depth — Jaime Jones and "
        f"Jeff Easley brushwork; {_slot('technique_extra', prose.get('technique_extra'))}"
        " the world rendered as rude beauty — weathered and tactile, "
        "never squalid. "
        f"MOOD: {_slot('mood', prose.get('mood'))} "
        f"{kill}. Aspect {aspect_txt} cinematic scope."
    )


def build_file(brief) -> str:
    """File prompt.md completo: fenced block + Tags + generation notes."""
    slug = (brief.get("slug") or "scene").strip()
    tags = ", ".join(brief.get("tags") or ["generic"])
    return (
        f"# {slug} — scene prompt (compiled from brief.json)\n\n"
        "```text\n" + build_text(brief) + "\n```\n\n"
        f"**Tags riuso:** {tags}\n\n"
        "## Generation notes\n\n"
        "- Compiled from `brief.json`; regenerate with "
        "`python3 scripts/build-scene-prompt.py --brief brief.json "
        "--out prompt.md --force`.\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brief", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--allow-placeholders", action="store_true")
    args = ap.parse_args()

    brief = json.loads(pathlib.Path(args.brief).read_text())
    unknown = set(brief) - {
        "slug", "title", "prose", "pigment", "occluder", "no_occluder_reason",
        "calm_zones", "fx_anchors", "kill_extra", "aspect", "tags", "_note",
    }
    if unknown:
        print(f"chiavi non allowlisted nel brief: {sorted(unknown)}")
        return 2

    out = pathlib.Path(args.out)
    if out.exists() and not args.force:
        print(f"{out} esiste — serve --force (prompt.md è canonico)")
        return 2

    missing = [k for k in REQUIRED_PROSE
               if not (brief.get("prose") or {}).get(k, "").strip()]
    rendered = build_file(brief)
    has_ph = "<!-- AUTHOR:" in rendered
    if (missing or has_ph) and not args.allow_placeholders:
        print(
            "campi prosa vuoti (placeholder <!-- AUTHOR: -->): "
            f"{missing or 'presenti'} — riempi il brief o usa "
            "--allow-placeholders"
        )
        return 2

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rendered)
    print(f"scritto {out} ({len(build_text(brief).split())} parole prompt)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
