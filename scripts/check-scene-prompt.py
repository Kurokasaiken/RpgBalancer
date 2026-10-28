#!/usr/bin/env python3
"""Prompt pre-flight gate (A15-A17): run on every scene prompt BEFORE submit.

Usage: python scripts/check-scene-prompt.py <prompt.txt>
Fails (exit 1) with named violations when the prompt misses required
elements so the failure is mechanical, not remembered.

Checks:
- GEMS: accents must use gemstone/precious vocabulary (A16)
- LIFE: at least 2 life elements (fauna/fungi/flowers/water) (A17)
- EFFECT ZONES: ambient FX declared + painted (manifest parity)
- ZONES: parallax staging (fg/mid/far) described
- FORBIDDEN: no banned scene elements (skulls, people where banned…)
- REGISTER: impasto + palette direction present
- CANOPIES: forest scenes require varied canopies (A18)
"""
import re, sys, pathlib, argparse

GEMS = r'\b(ruby|rub(y|ies)|emerald|sapphire|amethyst|topaz|amber|citrine|jade|turquoise|lapis|garnet|onyx|opal|pearl|crimson|vermilion|ultramarine|veronese)\b'
LIFE = r'\b(bird|jay|lizard|beetle|insect|butterfly|moth|deer|hare|rabbit|fox|squirrel|crow|fly|bees?|mushroom|amanita|fungus|fungi|flowers?|blossom|petals?|water|pool|puddle|stream|creek|moss|fern|berries|leaves)\b'
FX = r'\b(motes|dust|embers|smoke|glow|glint|mist|fog|drift|shaft|leaves|rain|light shaft|reflection)\b'
ZONES = r'\b(foreground|foreground occluder|occluder|mid-?frame|midground|background|far|distance|depth|parallax|treeline|ridge|horizon)\b'
BANNED = r'\b(skulls?|skeletons?|corpses?\b|dead bodies|gore|signature|watermark|lens flare|photoreal|anime|cartoon)\b'
STYLE = r'\b(impasto|brushstroke|brushwork|palette knife|Jaime Jones|Rude Beauty|thick (paint|strokes))\b'
CANOPY = r'\b(pale birch|turquoise|different canop|varied canop|lighter foliage|maple|crimson)\b'

def check(txt):
    t = txt.lower()
    out = []
    def need(pat, name, ok):
        hits = len(re.findall(pat, t))
        out.append((name, hits, ok(hits)))
    need(GEMS, 'gems', lambda h: h >= D['gems'])
    need(LIFE, 'life', lambda h: h >= D['life'])
    need(FX, 'fx', lambda h: h >= 1)
    need(ZONES, 'zones', lambda h: h >= D['zones'])
    need(STYLE, 'style', lambda h: h >= 1)
    need(r'\bforest|fern|tree|trunk|canopy|wood\b', 'forest?', lambda h: h >= 1)
    return out, len(re.findall(BANNED, t)), re.search(r'forest|fern|trunk|canopy|wood', t)

ap = argparse.ArgumentParser()
ap.add_argument('file')
ap.add_argument('--domain', default='rude-beauty',
  choices=['rude-beauty','impero-solare','prismatic','dark-wasteland'])
ap.add_argument('--moment', default='day',
  choices=['dawn','day','golden','dusk','night','gloom'])
a = ap.parse_args()
# luminous-green vocabulary per (domain,moment): day fields need bright greens;
# dusk/golden fields go amber-lit; night fields go blue/teal (green drops out)
LUM_GREENS = {
 'dawn':   'emerald|spring|veronese|dewy|pale green',
 'day':    'emerald|spring|veronese|sunlit|translucent|lime',
 'golden': 'amber-lit|golden-green|honeyed|warm green',
 'dusk':   'shadowed emerald|dusky green|teal shadow',
 'night':  'moonlit|silvered|blue-green|teal',
 'gloom':  'emerald|veronese|jade|deep emerald|saturated green|amber-lit|pools of',
}
DARK_GREENS = 'bottle|swamp|murky green|dark green'
# per-domain thresholds (vocabulary + minimums)
DOM = {
 'rude-beauty':    dict(gems=2, life=2, zones=2, canopy=True),
 'impero-solare':  dict(gems=2, life=2, zones=2, canopy=True),
 'prismatic':      dict(gems=3, life=1, zones=2, canopy=False),
 'dark-wasteland': dict(gems=1, life=1, zones=2, canopy=True),
}
D = DOM[a.domain]
p = pathlib.Path(a.file); txt = p.read_text()
EDIT = bool(re.search(r'\bsame (image|composition|scene|layout|painting|plate)\b', txt.lower()))
rows, banned, is_forest = check(txt)
ok = True
for name, hits, good in rows:
    if EDIT and name in ('zones','forest?'):
        print(f'SKIP {name}: edit prompt, scene anchored by the base image')
        continue
    mark = 'OK ' if good else 'FAIL'
    if not good: ok = False
    print(f'{mark} {name}: {hits}')
if banned:
    ok = False
    print(f'FAIL banned terms present: {banned}')
mom_ok = True
mom_ok = True
if is_forest and not EDIT:
    lum = len(re.findall(LUM_GREENS[a.moment], txt.lower()))
    dark = len(re.findall(DARK_GREENS, txt.lower()))
    good = lum >= 1 and dark == 0
    if not good: ok = False
    print(f'{"OK " if good else "FAIL"} green-tone({a.moment}): luminous-greens {lum}, banned-dark {dark}')
    mom_ok = good
if is_forest and not EDIT and D['canopy']:
    c = len(re.findall(CANOPY, txt.lower()))
    if c < 1:
        ok = False
        print('FAIL canopies: forest scene without varied-canopy trees (A18)')
    else:
        print(f'OK  canopies: {c}')


# --- strict pass: life-elements must carry a color/gem adjective within 4 words ---
LIFE_ELS = r'\b(amanita|mushroom|fungus|flower|blossom|bird|jay|lizard|beetle|butterfly|moth|deer|hare|crow|berries|leaves|leaf|fern|moss|pool|puddle|water|stream)\b'
COLOR = r'(ruby|rub(y|ies)|emerald|sapphire|amethyst|topaz|amber|citrine|jade|turquoise|lapis|garnet|onyx|opal|pearl|crimson|vermilion|ultramarine|veronese|scarlet|violet|indigo|azure|teal|golden|gold|silver|copper|bronze|coral|magenta|chartreuse|lime|moss-green|sky-blue|ice-blue|bone-white|white|black|dark|pale|red|orange|yellow|green|blue|purple|pink|brown|grey|gray)'
t = txt.lower()
bare = []
for m in re.finditer(LIFE_ELS, t):
    ctx = t[max(0, m.start()-60):m.end()+60]
    if not re.search(COLOR, ctx):
        bare.append(m.group(1))
if bare:
    print(f'WARN bare life-elements: {sorted(set(bare))}')
    if len(set(bare)) >= 2:
        ok = False
        print('FAIL strict: life-elements need color adjectives (A16 gemma)')
else:
    print('OK  strict: every life-element carries a color adjective')
print('PROMPT-GATE:', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
