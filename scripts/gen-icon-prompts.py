#!/usr/bin/env python3
"""Generatore dei prompt d'icona dipinta — PLAN-058 T2.3, bibbia §11.5.

Dal registro (`src/docs/docs/art-direction/icons/registry.yaml`) e dal kit
(`src/docs/docs/art-direction/icons/prompt_kit.yaml`) scrive
`.mw/specs/icons/<id>/prompt.md` con tre varianti pronte da incollare
(GPT image, Gemini, Grok). Ogni variante = blocco di stile fisso + riga
soggetto + kill list + contratto d'uscita. Il blocco di stile vive solo nel kit.

Uso:
    python scripts/gen-icon-prompts.py                 # voci dipinte con stato >= prompted
    python scripts/gen-icon-prompts.py --id res-gold   # una voce sola (anche se `needed`)
    python scripts/gen-icon-prompts.py --all           # anche le voci `needed` (bozze)
    python scripts/gen-icon-prompts.py --check         # exit 1 se un prompt.md è diverso da quanto generato

Exit code 0 = ok; 1 = drift (--check) o errore di registro/kit.
"""
import argparse
import hashlib
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "src/docs/docs/art-direction/icons/registry.yaml"
KIT = ROOT / "src/docs/docs/art-direction/icons/prompt_kit.yaml"
OUT_DIR = ROOT / ".mw/specs/icons"
VARIANT_ORDER = ("gpt", "gemini", "grok")
GENERATED_STATES = ("prompted", "candidate", "approved")


def load_kit() -> dict:
    kit = yaml.safe_load(KIT.read_text())
    digest = hashlib.sha256(kit["style"].encode()).hexdigest()
    if digest != kit["style_sha256"]:
        raise SystemExit(
            f"ERRORE kit: il blocco di stile non corrisponde a style_sha256 ({digest}).\n"
            "Se il cambio è voluto: aggiorna style_sha256 e style_version, poi rigenera."
        )
    return kit


def style_for(kit: dict, materia: str = "bronze") -> str:
    """Blocco di stile con la frase MATERIAL scelta (default: bronzo, cioè il blocco del kit)."""
    if materia == "bronze":
        return kit["style"]
    default = kit["materials"]["bronze"]
    if default not in kit["style"]:
        raise SystemExit("ERRORE kit: la frase MATERIAL di default non è nel blocco di stile")
    return kit["style"].replace(default, kit["materials"][materia])


def render_variant(kit: dict, key: str, subject: str, materia: str = "bronze", anchor: bool = True) -> str:
    v = kit["variants"][key]
    kill = "; ".join(kit["kill_list"]) + "."
    # le non-ancore si agganciano alle ancore (T3.1); le materie non-bronze
    # chiedono solo luce e pennellata, non metallo (R-191).
    ref_key = "reference" if materia == "bronze" else "reference_natural"
    reference = [] if anchor else [kit[ref_key]]
    return "\n\n".join(
        [
            v["intro"],
            f"SUBJECT: {subject}",
            *reference,
            style_for(kit, materia),
            f"{v['kill_header']} {kill}",
            v["output"],
        ]
    )


def render_prompt_md(kit: dict, icon: dict) -> str:
    rel_reg = REGISTRY.relative_to(ROOT)
    rel_kit = KIT.relative_to(ROOT)
    taglie = " / ".join(str(t) for t in icon["taglie"])
    lines = [
        f"# Prompt icona — {icon['id']} (kit {kit['style_version']})",
        "",
        f"> Generato da `scripts/gen-icon-prompts.py` da `{rel_reg}` e `{rel_kit}`.",
        "> Non modificare a mano: cambia la riga `soggetto` nel registro (o il kit) e rigenera.",
        "",
        f"- **livello:** {icon['livello']} · **famiglia:** {icon['famiglia']}"
        + (" · **ancora**" if icon.get("ancora") else ""),
        f"- **taglie:** {taglie} px · **file finale:** `{icon['file']}`",
        f"- **fonte:** {icon.get('fonte', '—')}",
        "",
        "Incolla la variante dello strumento che usi. Le varianti differiscono solo",
        "per intestazione, nome della kill list e contratto d'uscita (sfondo).",
    ]
    for key in VARIANT_ORDER:
        lines += [
            "",
            f"## {kit['variants'][key]['title']}",
            "",
            "```text",
            render_variant(kit, key, icon["soggetto"].strip(), icon.get("materia", "bronze"), bool(icon.get("ancora"))),
            "```",
        ]
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--id", action="append", help="genera solo queste voci (ripetibile)")
    ap.add_argument("--all", action="store_true", help="includi anche le voci `needed`")
    ap.add_argument("--check", action="store_true", help="non scrive: exit 1 se un prompt.md è fuori sync")
    ap.add_argument("--pack", metavar="FILE", help="scrive anche un unico .md con tutti i prompt selezionati, da copiare in fila")
    args = ap.parse_args()

    kit = load_kit()
    icons = yaml.safe_load(REGISTRY.read_text())["icons"]
    painted = [i for i in icons if i["livello"] == "dipinta"]
    if args.id:
        known = {i["id"] for i in painted}
        missing = [x for x in args.id if x not in known]
        if missing:
            raise SystemExit(f"ERRORE: id non trovati tra le dipinte: {', '.join(missing)}")
        selected = [i for i in painted if i["id"] in args.id]
    elif args.all:
        selected = painted
    else:
        selected = [i for i in painted if i["stato"] in GENERATED_STATES]

    drift = []
    for icon in selected:
        target = OUT_DIR / icon["id"] / "prompt.md"
        text = render_prompt_md(kit, icon)
        if args.check:
            if not target.exists() or target.read_text() != text:
                drift.append(str(target.relative_to(ROOT)))
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)
        print(f"scritto {target.relative_to(ROOT)}")

    if args.pack and not args.check:
        pack = pathlib.Path(args.pack)
        pack = pack if pack.is_absolute() else ROOT / pack
        body = [
            f"# Pacchetto prompt d'icona — {len(selected)} voci (kit {kit['style_version']})",
            "",
            "> Generato da `scripts/gen-icon-prompts.py --pack`. Per ogni icona: copia il blocco del tuo",
            "> strumento. Per le non-ancore allega `.mw/specs/icons/ANCORE-reference.png` (le sei ancore approvate).",
        ]
        for icon in selected:
            sub = render_prompt_md(kit, icon).split("\n", 1)[1]
            body += ["", "---", "", f"# {icon['id']}", sub.replace("\n## ", "\n### ")]
        pack.write_text("\n".join(body))
        print(f"pacchetto {pack.relative_to(ROOT)}")

    if args.check:
        if drift:
            print("FUORI SYNC (rigenera):\n  " + "\n  ".join(drift))
            return 1
        print(f"ok: {len(selected)} prompt in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())
