#!/usr/bin/env python3
"""Lint dei prompt d'icona dipinta — PLAN-058 T2.4, bibbia §11.5.

Indipendente dal lint delle scene (`lint-scene-prompts.py`): le icone hanno
regole proprie. Legge la verità dal kit
(`src/docs/docs/art-direction/icons/prompt_kit.yaml`) e controlla ogni
`.mw/specs/icons/<id>/prompt.md`, variante per variante:

  I1 varianti   le tre varianti del kit (GPT image, Gemini, Grok) presenti, ognuna in un blocco ```text
  I2 stile      blocco di stile del kit presente e invariato (e kit coerente con style_sha256)
  I3 soggetto   una sola riga SUBJECT, una frase, con la patina d'accento
  I4 kill list  intestazione della variante + tutte le voci del kit, nell'ordine
  I5 vietati    nessun termine vietato fuori dalla kill list (skull, shiny gold, leaves, frame/border…)
  I6 uscita     riga OUTPUT con sfondo dichiarato (trasparente o #FF00FF) e formato quadrato
  I7 registro   l'id esiste nel registro come icona dipinta

Uso:
    python scripts/lint-icon-prompts.py                    # tutti i prompt in .mw/specs/icons/
    python scripts/lint-icon-prompts.py <dir|prompt.md>…   # solo questi
    python scripts/lint-icon-prompts.py --self-test        # verifica che il lint colga i difetti noti

Exit code 0 = tutti i prompt passano; 1 = almeno un fallimento.
"""
import hashlib
import pathlib
import re
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
KIT = ROOT / "src/docs/docs/art-direction/icons/prompt_kit.yaml"
REGISTRY = ROOT / "src/docs/docs/art-direction/icons/registry.yaml"
DEFAULT_DIR = ROOT / ".mw/specs/icons"
SUBJECT_MAX_CHARS = 320
# I8 — dettagli troppo fini per una taglia d'uso di 20-31 px (glifi POI) e 28 px (risorse):
# raggi, crepe, anelli di crescita, rigature, incisioni, tratti sottili. Il soggetto ne è privo.
FINE_DETAIL_TERMS = (
    "rays", "ray", "cracks", "crack", "rings", "growth rings", "stripes", "scored",
    "engraved", "thin", "fine", "tiny", "hairline", "fringe", "tufts", "scratches",
    "veins", "grain lines", "dots",
)

BLOCK_RE = re.compile(r"^## (?P<title>.+?)\n+```text\n(?P<body>.*?)\n```", re.M | re.S)


def load_kit() -> tuple[dict, list[str]]:
    kit = yaml.safe_load(KIT.read_text())
    errs = []
    if hashlib.sha256(kit["style"].encode()).hexdigest() != kit["style_sha256"]:
        errs.append("KIT: blocco di stile modificato senza aggiornare style_sha256/style_version")
    return kit, errs


def painted_ids() -> set[str]:
    icons = yaml.safe_load(REGISTRY.read_text())["icons"]
    return {i["id"] for i in icons if i["livello"] == "dipinta"}


def sentences(text: str) -> int:
    parts = [p for p in re.split(r"[.!?](?:\s+|$)", text.strip()) if p.strip()]
    return len(parts)


def lint_block(kit: dict, key: str, body: str) -> list[str]:
    v = kit["variants"][key]
    errs: list[str] = []
    lines = body.splitlines()

    # I2 stile
    styles = [kit["style"]] + [kit["style"].replace(kit["materials"]["bronze"], m) for m in kit.get("materials", {}).values()]
    if not any(st in body for st in styles):
        errs.append("I2 stile: blocco di stile assente o modificato")

    # I3 soggetto
    subj = [ln for ln in lines if ln.startswith("SUBJECT:")]
    if len(subj) != 1:
        errs.append(f"I3 soggetto: {len(subj)} righe SUBJECT (attesa 1)")
    else:
        s = subj[0][len("SUBJECT:"):].strip()
        if not s:
            errs.append("I3 soggetto: vuoto")
        if sentences(s) > 1:
            errs.append(f"I3 soggetto: {sentences(s)} frasi (max 1)")
        if len(s) > SUBJECT_MAX_CHARS:
            errs.append(f"I3 soggetto: {len(s)} caratteri (max {SUBJECT_MAX_CHARS})")
        if "patina accent:" not in s.lower():
            errs.append("I3 soggetto: manca `patina accent:` (bibbia §11.3)")
        # I8 dettaglio fine (bibbia §11.4: a 24-28 px si semplifica, non si aggiunge)
        for term in FINE_DETAIL_TERMS:
            if re.search(rf"\b{re.escape(term)}\b", s, re.I):
                errs.append(f"I8 dettaglio fine nel soggetto: `{term}` (a 20-31 px non si legge; bibbia §11.4)")

    # I4 kill list
    kill_lines = [ln for ln in lines if ln.startswith(v["kill_header"])]
    if len(kill_lines) != 1:
        errs.append(f"I4 kill list: intestazione `{v['kill_header']}` trovata {len(kill_lines)} volte (attesa 1)")
        kill_line = ""
    else:
        kill_line = kill_lines[0]
        pos = 0
        for item in kit["kill_list"]:
            idx = kill_line.find(item, pos)
            if idx < 0:
                errs.append(f"I4 kill list: manca o fuori ordine `{item}`")
            else:
                pos = idx + len(item)

    # I5 termini vietati fuori dalla kill list
    rest = "\n".join(ln for ln in lines if ln != kill_line)
    for term in kit["banned_terms"]:
        m = re.search(rf"\b{term}\b", rest, re.I)
        if m:
            errs.append(f"I5 vietato: `{m.group(0)}` fuori dalla kill list")

    # I6 uscita
    out = [ln for ln in lines if ln.startswith("OUTPUT:")]
    if len(out) != 1:
        errs.append(f"I6 uscita: {len(out)} righe OUTPUT (attesa 1)")
    else:
        o = out[0].lower()
        if "background" not in o or not ("transparent" in o or "#ff00ff" in o):
            errs.append("I6 uscita: sfondo non dichiarato (trasparente o #FF00FF)")
        if not ("1:1" in o or re.search(r"\d+\s*[×x]\s*\d+", o)):
            errs.append("I6 uscita: formato quadrato non dichiarato")
    return errs


def lint_file(kit: dict, ids: set[str], path: pathlib.Path) -> list[str]:
    text = path.read_text()
    errs: list[str] = []
    icon_id = path.parent.name
    if icon_id not in ids:
        errs.append(f"I7 registro: `{icon_id}` non è un'icona dipinta del registro")
    blocks = {m.group("title").strip(): m.group("body") for m in BLOCK_RE.finditer(text)}
    for key, v in kit["variants"].items():
        if v["title"] not in blocks:
            errs.append(f"I1 varianti: manca `## {v['title']}` con blocco ```text")
            continue
        errs += [f"[{key}] {e}" for e in lint_block(kit, key, blocks[v["title"]])]
    return errs


def collect(args: list[str]) -> list[pathlib.Path]:
    targets = [pathlib.Path(a) for a in args] or [DEFAULT_DIR]
    files: list[pathlib.Path] = []
    for t in targets:
        t = t if t.is_absolute() else (pathlib.Path.cwd() / t)
        files += sorted(t.glob("*/prompt.md")) if t.is_dir() else [t]
    return files


def self_test(kit: dict, ids: set[str]) -> int:
    """Ogni difetto noto deve essere colto; il prompt sano deve passare."""
    sample = next(iter(sorted(DEFAULT_DIR.glob("*/prompt.md"))), None)
    if sample is None:
        print("self-test: nessun prompt generato in .mw/specs/icons/ (lancia gen-icon-prompts.py)")
        return 1
    good = sample.read_text()
    first_kill = kit["kill_list"][0]
    mutations = {
        "I1 variante mancante": lambda t: t.replace(f"## {kit['variants']['grok']['title']}", "## Altro", 1),
        "I2 stile ritoccato": lambda t: t.replace("Matte metal, never polished.", "Matte metal.", 1),
        "I3 due frasi": lambda t: re.sub(r"(SUBJECT: [^\n]*)", r"\1 It glows.", t, count=1),
        "I3 senza patina": lambda t: re.sub(r"; patina accent:[^\n]*", ".", t, count=1),
        "I4 voce kill mancante": lambda t: t.replace(first_kill + "; ", "", 1),
        "I5 teschio nel soggetto": lambda t: t.replace("SUBJECT: ", "SUBJECT: A skull and ", 1),
        "I5 cornice nel soggetto": lambda t: t.replace("SUBJECT: ", "SUBJECT: Inside an ornate border, ", 1),
        "I6 sfondo non dichiarato": lambda t: t.replace("fully transparent background (alpha\nchannel)", "", 1)
        .replace("transparent background", "plain", 1),
    }
    tmp = ROOT / ".mw/specs/icons/.selftest"
    failures = 0
    try:
        for name, mutate in [("sano", lambda t: t), *mutations.items()]:
            case = tmp / sample.parent.name / "prompt.md"
            case.parent.mkdir(parents=True, exist_ok=True)
            mutated = mutate(good)
            if name != "sano" and mutated == good:
                print(f"  ✗ {name}: la mutazione non ha cambiato il testo")
                failures += 1
                continue
            case.write_text(mutated)
            errs = lint_file(kit, ids, case)
            ok = (not errs) if name == "sano" else bool(errs)
            print(f"  {'✓' if ok else '✗'} {name}: {len(errs)} errori" + (f" — {errs[0]}" if errs and name != 'sano' else ""))
            failures += 0 if ok else 1
    finally:
        for p in sorted(tmp.rglob("*"), reverse=True):
            p.unlink() if p.is_file() else p.rmdir()
        if tmp.exists():
            tmp.rmdir()
    print(f"self-test: {len(mutations) + 1 - failures}/{len(mutations) + 1} casi corretti")
    return 1 if failures else 0


def main() -> int:
    kit, kit_errs = load_kit()
    ids = painted_ids()
    if "--self-test" in sys.argv[1:]:
        for e in kit_errs:
            print(e)
        return self_test(kit, ids) or (1 if kit_errs else 0)

    files = collect([a for a in sys.argv[1:] if not a.startswith("--")])
    if not files:
        print("nessun prompt.md trovato")
        return 1
    failed = bool(kit_errs)
    for e in kit_errs:
        print(f"✗ {e}")
    for f in files:
        errs = lint_file(kit, ids, f)
        rel = f.relative_to(ROOT) if f.is_relative_to(ROOT) else f
        if errs:
            failed = True
            print(f"✗ {rel}")
            for e in errs:
                print(f"    {e}")
        else:
            print(f"✓ {rel}")
    print(f"\n{len(files)} prompt, {'FALLITO' if failed else 'tutti verdi'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
