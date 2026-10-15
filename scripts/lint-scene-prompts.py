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


def lint(slug: str, text: str, file_text: str) -> list[str]:
    errs: list[str] = []
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
    return errs


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
        errs = lint(slug, text, file_text)
        tag = " (RISERVA)" if reserve else ""
        if reserve and not include_reserve:
            tag += " — saltata"
        if errs and (include_reserve or not reserve):
            total_err += len(errs)
            print(f"FAIL {slug}{tag}")
            for e in errs:
                print(f"      - {e}")
        else:
            print(f"OK   {slug}{tag} [{len(text.split())} parole]")
    print(f"\n{'TUTTI OK' if total_err == 0 else f'{total_err} problemi'}")
    return 0 if total_err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
