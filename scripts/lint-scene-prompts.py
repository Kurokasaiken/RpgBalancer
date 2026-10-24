#!/usr/bin/env python3
"""Lint meccanico dei prompt di scena — gate "battezzato" (R8).

Verifica che ogni `prompt.md` in una directory `scenes/` raggiunga il
livello minimo della prompt library (`public/docs/prompts/prompt_library.md`).

Uso:
    python scripts/lint-scene-prompts.py .mw/specs/quest-goblin-scenes/scenes/
    python scripts/lint-scene-prompts.py <dir> [--include-reserve]

Exit code 0 = tutti i prompt passano; 1 = almeno un fallimento.
"""
import re
import sys
import pathlib

PIGMENTS = ["ultramarine", "veronese", "cinnabar", "amber", "azure"]
ANCHORS = ["SUBJECT", "COMPOSITION", "LIGHTING", "PALETTE", "TECHNIQUE", "MOOD"]
KILL_MIN = 8  # voci "NO ..." attese nella kill list finale

# --- R9 kernel pittorico (PLAN-080) -------------------------------------
MEDIUM_TOKENS = ("oil painting", "impasto", "oil ")
CAMERA_TOKENS = (
    "depth of field",
    "establishing shot",
    "bokeh",
    "telephoto",
    "dslr",
    "lens flare",
    "shallow focus",
)
CAMERA_RES = (
    re.compile(r"\b\d+\s*mm\b", re.I),
    re.compile(r"\bf/\s*\d", re.I),
)
NUMERIC_RES = (
    re.compile(r"\b\d+(?:\.\d+)?\s*%"),
    re.compile(r"\b[xy]\s*0?\.\d+\b", re.I),
    re.compile(r"\b[xy]\s*=\s*0?\.\d+", re.I),
    re.compile(r"\(\s*0?\.\d+\s*,\s*0?\.\d+\s*\)"),
)
STYLE_TOKENS = (
    "impasto",
    "brushstroke",
    "palette-knife",
    "palette knife",
    "painterly",
    "oil painting",
    "visible layers of paint",
)
HEDGE_RES = (
    re.compile(r"in the [^.]* tradition", re.I),
    re.compile(r"in the style of", re.I),
    re.compile(r"reminiscent of", re.I),
)
NEG_RUN = re.compile(r"\b(?:NO|DO NOT|NEVER)\s+[A-Z0-9' /,\-]*")
STYLE_FLOOR = 3
# Q16 warn-only per contratto PLAN-080 (promozione = eye-check Director).
NEG_WARN_RATIO = 0.30  # riferimento corpus: dusk-v1 ~30%; print + range, exit 0.


def _strip_negated(text: str) -> str:
    """Rimuove run espliciti NO/DO NOT/NEVER e hedge-style prima dei conteggi."""
    t = NEG_RUN.sub(" ", text)
    for r in HEDGE_RES:
        t = r.sub(" ", t)
    return t


def _negation_words(text: str) -> int:
    """Parole dentro run espliciti NO/DO NOT/NEVER (terminati a fine frase)."""
    n = 0
    for m in NEG_RUN.finditer(text):
        n += len(m.group(0).split())
    return n


def lint(slug: str, text: str, file_text: str) -> tuple[list[str], list[str]]:
    errs: list[str] = []
    warns: list[str] = []
    low = text.lower()
    words = len(text.split())

    # Q1 densità
    if words < 200:
        errs.append(f"Q1 densità: {words} parole (<200)")
    # Q2 titolo
    if not re.match(r"^[A-ZÀ-Ü][A-ZÀ-Ü' ]{2,}\s—", text):
        errs.append("Q2 titolo: non apre con `NOME —`")
    # Q3 ancore CAPS (standalone o con qualificatore: "COMPOSITION intimate:")
    for a in ANCHORS:
        if not re.search(rf"\b{a}\b", text):
            errs.append(f"Q3 ancora mancante: {a}")
    # Q4 pigmenti
    n_pig = sum(1 for p in PIGMENTS if p in low)
    if n_pig < 2:
        errs.append(f"Q4 pigmenti: solo {n_pig} bibbia (<2)")
    # Q5 ombre
    if "deep teal" not in low and "teal-emerald" not in low:
        errs.append("Q5 ombre: manca deep teal/teal-emerald")
    for tok in ("no grey", "no brown", "no mud"):
        if tok not in low:
            errs.append(f"Q5 ombre: manca `{tok.upper()}`")
    # Q6 luminosità
    if "luminous" not in low and "light wins" not in low:
        errs.append("Q6 luminosità: manca la clausola positiva")
    if "black murk" not in low:
        errs.append("Q6 luminosità: manca `never black murk`")
    # Q7 rendering
    for tok in ("impasto", "rude beauty"):
        if tok not in low:
            errs.append(f"Q7 rendering: manca `{tok}`")
    if "jaime jones" not in low and "jeff easley" not in low:
        errs.append("Q7 rendering: manca Jones/Easley")
    # Q8 creature → Gerard: solo se figure creature sono *dipinte*
    # (goblin raiders/shapes/silhouettes/swarm) — non basta "NO goblins"
    # nella kill list né "goblin palisade" (aggettivo su oggetto).
    creature_fig = re.search(
        r"goblin (?:raiders|figures|shapes|silhouettes|swarm|ambushers|wall|forms|mass)|"
        r"small wiry goblin|screaming swarm",
        low,
    )
    if creature_fig and "justin gerard" not in low:
        errs.append("Q8 creature: figure creature dipinte senza Justin Gerard")
    # Q9 almeno un'istruzione CAPS inline nel flusso (non solo kill list):
    # NO X / NOBODY / NOTHING / NEVER DRAWN / EMPTY / CLOSED...
    head = text[: int(len(text) * 0.75)]
    caps = {
        t
        for t in re.findall(r"\b[A-Z]{4,}\b", head)
        if t not in ANCHORS and not re.match(r"^[A-ZÀ-Ü' ]+—", t)
    }
    caps.discard(text.split("—")[0].strip().split()[-1] if "—" in text else "")
    if not caps:
        errs.append("Q9 direttiva CAPS inline: nessuna nel flusso")
    # Q10 kill list
    n_no = len(re.findall(r"\bNO\b", text))
    if n_no < KILL_MIN:
        errs.append(f"Q10 kill list: {n_no} voci NO (<{KILL_MIN})")
    # Q11 aspect
    if not re.search(r"\b(21:9|3:4|1:1|16:9)\b", text):
        errs.append("Q11 aspect: nessun aspect ratio dichiarato")
    # Q12 tags (solo file con riga tags attesa: tutti i prompt attivi)
    if "**Tags riuso:**" not in file_text:
        errs.append("Q12 tags: manca la riga `**Tags riuso:**`")

    # --- R9 kernel pittorico (Q13–Q17, PLAN-080) -------------------------
    stripped = _strip_negated(text)
    first_zone = text.split(".")[0].lower()  # prima frase del blocco

    # Q13 medium-first: token medium nella prima frase + nessun token
    # camera prima del primo medium.
    medium_pos = None
    for tok in MEDIUM_TOKENS:
        p = first_zone.find(tok)
        if p >= 0 and (medium_pos is None or p < medium_pos):
            medium_pos = p
    if medium_pos is None:
        errs.append(
            "Q13 medium-first: nessun token medium "
            "(oil painting/impasto/oil) nella prima frase"
        )
    else:
        head_low = first_zone[:medium_pos]
        cam_early = [t for t in CAMERA_TOKENS if t in head_low] + [
            r.pattern for r in CAMERA_RES if r.search(head_low)
        ]
        if cam_early:
            errs.append(
                f"Q13 medium-first: token camera prima del medium {cam_early}"
            )
    # Q14 register ban (REG-CAM / REG-NUM)
    for t in CAMERA_TOKENS:
        if t in low:
            errs.append(f"Q14 REG-CAM: `{t}` nel blocco prompt")
    for r in CAMERA_RES:
        m = r.search(text)
        if m:
            errs.append(f"Q14 REG-CAM: `{m.group(0)}` nel blocco prompt")
    for r in NUMERIC_RES:
        m = r.search(text)
        if m:
            errs.append(f"Q14 REG-NUM: `{m.group(0)}` nel blocco prompt")
    # Q15 floor di stile (su testo senza clausole negate/hedge)
    n_style = sum(_cnt for tok in STYLE_TOKENS
                  for _cnt in [stripped.lower().count(tok)] if _cnt)
    if n_style < STYLE_FLOOR:
        errs.append(
            f"Q15 floor stile: {n_style} token (<{STYLE_FLOOR}, "
            "hedge/negazioni escluse)"
        )
    # Q16 explicit-negation bulk — warn-level, non bloccante.
    neg_w = _negation_words(text)
    if words:
        ratio = neg_w / words
        if ratio > NEG_WARN_RATIO:
            warns.append(
                f"Q16 negation bulk: {neg_w}/{words} parole "
                f"({ratio:.0%} > {NEG_WARN_RATIO:.0%} riferimento corpus)"
            )
    # Q17 placeholder residuo del compiler
    if "<!-- AUTHOR:" in text:
        errs.append("Q17 placeholder: marker `<!-- AUTHOR:` residuo nel blocco")
    return errs, warns


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    include_reserve = "--include-reserve" in sys.argv
    files = sorted(root.glob("*/prompt.md"))
    if not files:
        print(f"nessun prompt.md sotto {root}")
        return 1
    total_err = 0
    for f in files:
        file_text = f.read_text()
        m = re.search(r"```text\n(.*?)```", file_text, re.S)
        if not m:
            print(f"FAIL {f.parent.name}: nessun blocco ```text")
            total_err += 1
            continue
        text = m.group(1).strip()
        slug = f.parent.name
        reserve = bool(
            re.search(r"NON GENERARE|non generare|riserva|RISERVA", file_text)
        )
        errs, warns = lint(slug, text, file_text)
        tag = " (RISERVA)" if reserve else ""
        if reserve and not include_reserve:
            tag += " — saltata"
        if errs and (include_reserve or not reserve):
            total_err += len(errs)
            print(f"FAIL {slug}{tag}")
            for e in errs:
                print(f"      - {e}")
            for w in warns:
                print(f"      ~ {w}")
        else:
            print(f"OK   {slug}{tag} [{len(text.split())} parole]")
            for w in warns:
                print(f"      ~ {w}")
    print(f"\n{'TUTTI OK' if total_err == 0 else f'{total_err} problemi'}")
    return 0 if total_err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
