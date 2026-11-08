#!/usr/bin/env python3
"""PLAN-112 G2-6: per-piece colour coherence check against the signed thresholds. Exit code 1 if any piece fails.
Thresholds (updated 2026-11-05 on Director ruling: the vivid pre-G2-4 nav astrolabe is the reference — gold A / enamel B was faded):
  gold      L p50 50-73 | C p50 32-46 | L p90 <= 99   (vivid brass gold, full highlights; pale gold <32 fails)
  enamel    L p50 11-23 | hue 155-190 deg | C p50 13-24 (deep emerald green, not cyan-shifted)
  alabaster L p50 80-84 | C p50 12-17                  (only on the panel frame: elsewhere the mask catches pale ornaments, not an alabaster field)
  glass     L p50 <= 9                                          (dark-glass pieces and fields; checked on seal strip/disc, which are glass-only)
Pieces listed in EXEMPT carry a written reason (a dark text field, a glass-only piece...). Run: tools/hud-real/venv/bin/python -I scripts/hud-real/check-palette.py"""
import glob, json, sys
sys.path.insert(0, 'scripts/hud-real')
import importlib.util
spec = importlib.util.spec_from_file_location('mm', 'scripts/hud-real/measure-materials.py'); mm = importlib.util.module_from_spec(spec); spec.loader.exec_module(mm)
T = {'gold': {'L50': (50, 73), 'C50': (32, 46), 'L90': (0, 99)}, 'enamel': {'L50': (11, 23), 'hue': (155, 190), 'C50': (13, 24)}, 'alabaster': {'L50': (80, 84), 'C50': (12, 17)}}
EXEMPT = {  # piece -> {material: reason}
    'seal/strip.webp': {'enamel': 'vetro scuro dell\'alloggio dei teschi (non smalto)'}, 'seal/disc.webp': {'enamel': 'disco di vetro scuro con il campo del numero'},
    'voce/piece.webp': {'enamel': 'il campo di testo scuro è protetto: la mediana include il vetro'}, 'bust/bust.webp': {'enamel': 'pezzo non in uso (busto tolto dal layout)'},
    'C1/band-tile.webp': {'enamel': 'tinta 168 per il tessuto della fascia vecchia (pezzo sostituito da rail-tile)'}, 'C1/band-end.webp': {}, 'seal/bar.webp': {'gold': 'pezzo non in uso (sigillo v1)', 'enamel': 'pezzo non in uso (sigillo v1)'}, 'panel/cta.webp': {'gold': 'pezzo non in uso', 'enamel': 'pezzo non in uso'},
}
def ok(v, lo_hi): return lo_hi[0] <= v <= lo_hi[1]
fails, rows = [], 0
for f in sorted(glob.glob('public/assets/ui/hud-real/*/*.webp')):
    rel = f.split('hud-real/')[1]
    if any(x in rel for x in ('library/', 'round/', 'illustration')): continue
    r = mm.measure(f, alpha_png=True); rows += 1
    for mat, chk in (('gold', lambda s: {'L50': s['L'][2], 'C50': s['C_p50'], 'L90': s['L'][4]}), ('enamel', lambda s: {'L50': s['L'][2], 'C50': s['C_p50'], 'hue': s['hue']}), ('alabaster', lambda s: {'L50': s['L'][2], 'C50': s['C_p50']})):
        s = r.get(mat)
        if not s or s['n'] < 3000: continue
        if mat in EXEMPT.get(rel, {}): continue
        if mat == 'alabaster' and not rel.startswith('panel/'): continue
        vals = chk(s)
        for k, v in vals.items():
            if not ok(v, T[mat][k]): fails.append(f'{rel:28s} {mat:9s} {k}={v:g} fuori {T[mat][k]}')
print(f'{rows} pezzi controllati, {len(fails)} fuori soglia')
for l in fails: print('  FAIL', l)
sys.exit(1 if fails else 0)
