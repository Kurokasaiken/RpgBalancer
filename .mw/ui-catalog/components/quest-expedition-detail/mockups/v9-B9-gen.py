"""Planner B9 — Director rulings 2026-10-27 (skulls, laurel, protruding seal, role in danger).

- Verdict seal: a brass medallion that crosses the plaque's right edge. Inside: the victory
  emblem (crossed swords on a laurel wreath) and the big %, no words. Under it, a small brass
  cartouche with FIVE skulls (lit = grade, off = the same image dimmed).
- Role in danger: the most exposed slot (bodyguard) gets an ember glow on its bezel and its
  hit-share in large ember; the others are progressively muted. Number/bar form is indifferent.
- Rewards: specific tiles with the real gold icon + a sealed «?» (drops are 100% today, so no %).
- The victory emblem, the skull and the stat icons are PLACEHOLDERS drawn here: the Director
  generates the painted assets (registry ids ui-victory, ui-danger-skull, stat-str, stat-per).
"""
import sys
sys.path.insert(0, '.mw/runs/20261027-planner-remock')
from genB8 import *  # CSS, helpers, page(), eng(), gl(), star(), constants

SEAL_CX, SEAL_CY, SEAL_R = 1320, 330, 104

def leaf(cx, cy, ang, size=9, col='#7fb08c'):
    return (f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{size*0.55:.1f}" ry="{size:.1f}" fill="{col}" '
            f'transform="rotate({ang:.1f} {cx:.1f} {cy:.1f})" stroke="#1d3d2e" stroke-width=".8"/>')
import math
def laurel():
    out = ''
    R = 35
    for side in (-1, 1):
        for i in range(8):
            a = 14 + i * 18                      # degrees from the bottom, climbing to just short of the top
            x = 50 + side * R * math.sin(math.radians(a))
            y = 50 + R * math.cos(math.radians(a))
            rot = 90 - side * a + side * 14       # along the tangent, tips leaning outward
            out += leaf(x, y, rot, size=8.5)
    out += '<path d="M50 87 q-3 6 0 10 q3 -4 0 -10" fill="#7fb08c" stroke="#1d3d2e" stroke-width=".8"/>'
    return out
def victory_emblem(size):
    sw = ('<g stroke-linecap="round">'
          '<g transform="rotate(38 50 46)"><rect x="48.2" y="12" width="3.6" height="50" rx="1.6" fill="#e8d6ae" stroke="#7a6230" stroke-width=".7"/><rect x="41" y="60" width="18" height="3.6" rx="1.6" fill="#d8bd78" stroke="#5e4220" stroke-width=".7"/><rect x="47.2" y="63" width="5.6" height="9" rx="2" fill="#b99a52" stroke="#5e4220" stroke-width=".7"/></g>'
          '<g transform="rotate(-38 50 46)"><rect x="48.2" y="12" width="3.6" height="50" rx="1.6" fill="#e8d6ae" stroke="#7a6230" stroke-width=".7"/><rect x="41" y="60" width="18" height="3.6" rx="1.6" fill="#d8bd78" stroke="#5e4220" stroke-width=".7"/><rect x="47.2" y="63" width="5.6" height="9" rx="2" fill="#b99a52" stroke="#5e4220" stroke-width=".7"/></g></g>')
    return f'<svg width={size} height={size} viewBox="0 0 100 100">{laurel()}{sw}</svg>'

def skull(size, on=True):
    c = '#e6b99a' if on else '#6d7c7e'
    eye = '#ff8a3d' if on else '#26373b'
    op = '1' if on else '.45'
    return (f'<svg width={size} height={size} viewBox="0 0 24 24" style="opacity:{op}"><path d="M12 2.4C7.5 2.4 4.4 5.5 4.4 9.6c0 2.5 1.2 4.3 2.9 5.4V18c0 .9.7 1.6 1.6 1.6h6.2c.9 0 1.6-.7 1.6-1.6v-3c1.7-1.1 2.9-2.9 2.9-5.4 0-4.1-3.1-7.2-7.6-7.2z" fill="{c}" stroke="#2a1a10" stroke-width=".8"/>'
            f'<ellipse cx="8.9" cy="10.4" rx="2.1" ry="2.4" fill="#12100d"/><ellipse cx="15.1" cy="10.4" rx="2.1" ry="2.4" fill="#12100d"/>'
            f'<circle cx="8.9" cy="10.8" r="1" fill="{eye}"/><circle cx="15.1" cy="10.8" r="1" fill="{eye}"/>'
            f'<path d="M12 12.8l-1.1 2.4h2.2z" fill="#12100d"/><path d="M9.8 16.4v2.4M12 16.4v2.4M14.2 16.4v2.4" stroke="#12100d" stroke-width=".9"/></svg>')

seal = (
    f'<div style="position:absolute;left:{SEAL_CX-SEAL_R}px;top:{SEAL_CY-SEAL_R}px;width:{2*SEAL_R}px;height:{2*SEAL_R}px;z-index:8">'
    f'<svg width={2*SEAL_R} height={2*SEAL_R} viewBox="0 0 208 208" style="position:absolute;inset:0;filter:drop-shadow(0 10px 18px rgba(0,0,0,.6))">'
    f'<defs><radialGradient id="sr" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="#f6e3a8"/><stop offset=".5" stop-color="#b99a52"/><stop offset="1" stop-color="#5e4a22"/></radialGradient>'
    f'<radialGradient id="sf" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#12394a"/><stop offset="1" stop-color="#060f16"/></radialGradient></defs>'
    f'<circle cx="104" cy="104" r="102" fill="url(#sr)" stroke="#0b0a08" stroke-width="2"/>'
    f'<circle cx="104" cy="104" r="93" fill="none" stroke="rgba(255,240,200,.35)" stroke-width="1.2"/>'
    f'<circle cx="104" cy="104" r="88" fill="#0b0a08"/><circle cx="104" cy="104" r="85" fill="url(#sf)"/>'
    f'<circle cx="104" cy="104" r="85" fill="none" stroke="rgba(216,189,120,.45)" stroke-width="1"/></svg>'
    f'<div style="position:absolute;left:50%;top:10px;transform:translateX(-50%)">{victory_emblem(98)}</div>'
    f'<div class=num style="position:absolute;left:0;right:0;top:104px;text-align:center;font-size:70px;line-height:1;color:{SUC};padding-left:8px">68<small style="font-size:32px">%</small></div>'
    f'</div>'
    f'<div style="position:absolute;left:{SEAL_CX-104}px;top:{SEAL_CY+SEAL_R-8}px;width:208px;height:50px;z-index:9;display:flex;gap:6px;align-items:center;justify-content:center;border-radius:12px;'
    f'background:linear-gradient(180deg,#0c2833,#060f16);box-shadow:0 0 0 1.5px #0b0a08,0 0 0 4px #b99a52,0 0 0 5.5px #0b0a08,0 8px 16px rgba(0,0,0,.55)">'
    f'{"".join(skull(30, i < 3) for i in range(5))}</div>'
)

header = (
    f'<div style="display:flex;gap:18px">'
    f'<div style="width:220px;height:124px;flex:none;border-radius:10px;background:url(../../../public/assets/scene-library/totem-goblin.jpg) 50% 42%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
    f'<div style="flex:1;min-width:0">'
    f'<h1>Goblin Extermination</h1>'
    f'<p style="font-style:italic;font-size:18px;color:var(--title);margin-top:3px">The wood has gone quiet. The goblins have not.</p>'
    f'<p style="font-size:17px;margin-top:5px">Exterminate the goblin camp — none of them must come back to threaten the village.</p>'
    f'<div style="display:flex;gap:12px;margin-top:10px;align-items:center">'
    f'<span style="display:flex;gap:1px;margin-right:8px">{"".join(star(i < 2) for i in range(5))}</span>'
    f'<span class=tile style="width:58px;height:46px;gap:4px;display:inline-flex;box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)"><img src="../../../public/assets/ui/resources/res-gold-64.webp" width=28 height=28><b class=num style="font-size:17px;color:var(--title)">61</b></span>'
    f'<span class=tile style="width:46px;height:46px;font-family:Cinzel;font-size:18px;color:#7f9894;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.35)">?</span>'
    f'<span style="flex:1"></span><span class=rw style="color:var(--mute)">26 days</span>'
    f'</div></div></div>'
)
stats = (
    f'<div style="display:flex;align-items:center;gap:10px">'
    f'<span class=tile style="width:60px;height:60px;box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.7)">{gl("⚔️", 32)}</span>'
    f'<span style="width:1px;height:36px;background:rgba(223,184,87,.25);margin:0 6px"></span>'
    f'<span class=tile style="width:44px;height:44px;box-shadow:inset 0 0 0 1px rgba(216,189,120,.4)">{gl("🎯", 22)}</span>'
    f'<span class=tile style="width:44px;height:44px;font-family:Cinzel;font-size:16px;color:#7f9894;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.35)">+3</span>'
    f'</div>'
)
H = [('gig', 'Expedition leader', 'Giggiolillo', 0), ('spa', 'Fighter', 'Sir Spaccaculi', 0),
     ('sal', 'Scout', 'Salvatrice', 20), ('ber', 'Bodyguard', 'Bertoldo', 80)]
RAMP = {0: ('#6f9497', 'var(--mute)', 20), 20: ('#e3a34f', '#e3b765', 24), 80: ('#d9805f', '#f0a07f', 34)}
def slot(k, role, name, share, hover=False):
    bar, col, fs = RAMP[share]
    glow = ('filter:drop-shadow(0 0 14px rgba(217,128,95,.75))' if share == 80 else
            ('filter:drop-shadow(0 0 12px rgba(240,212,138,.55))' if hover else ''))
    flag = (f'<span style="position:absolute;z-index:4;top:-16px;right:6px;font-size:12px;letter-spacing:.12em;color:#ffd7c2;background:#8a3d22;padding:2px 7px;border-radius:5px;box-shadow:0 0 0 1px #0b0a08">TAKES THE HITS</span>' if share == 80 else '')
    return (f'<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:150px">{flag}'
            f'<img src="img/pslot-{k}.png" width=132 height=132 style="{glow}">'
            f'<span style="font-size:15px;letter-spacing:.14em;color:var(--mute);margin-top:2px">{role}</span>'
            f'<span style="font-family:Cinzel;font-size:15px;color:var(--title);white-space:nowrap">{name}</span>'
            f'<span class=num style="font-size:{fs}px;color:{col};margin-top:6px;line-height:1.1">{share}%</span>'
            f'<span style="width:110px;height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:4px"><i style="display:block;height:100%;width:{max(share,1.5)}%;background:{bar}"></i></span>'
            f'</div>')
party = ''.join(slot(k, r, n, sh, hover=(i == 0)) for i, (k, r, n, sh) in enumerate(H))
party_legend = '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:0 6px"><span class=lab>Marching order</span><span class=mut style="font-size:15px">share of the incoming hits</span></div>'
bag = ''.join(
    f'<span class=tile style="width:64px;height:64px;box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)">{eng(i, 36, GOLD)}<span class=qty>×1</span></span>'
    for i in ('ico-axe', 'ico-target', 'ico-salve'))
footer = (f'<div style="display:flex;gap:10px;align-items:center">{eng("ico-pouch", 30, "var(--crest)")}{bag}'
          f'<span style="flex:1"></span><span class="btn sec">Back to map</span><span class=btn>SEND EXPEDITION</span></div>')
hl = 'position:absolute;border-radius:6px;box-shadow:0 0 0 1.5px #f0d48a,0 0 10px rgba(240,212,138,.35);background:rgba(240,212,138,.08)'
sheet = (f'<div style="position:absolute;left:62px;top:372px;width:380px;height:282px;z-index:6;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6))">'
         f'<img src="img/sheet2x.png" width=380 height=282 style="display:block">'
         f'<span style="{hl};left:8px;top:139px;width:180px;height:20px"></span><span style="{hl};left:192px;top:139px;width:180px;height:20px"></span>'
         f'<span style="position:absolute;right:-13px;top:96px;width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:13px solid #b99a52"></span></div>')
body = (
    f'<img src="img/roster2x.png" style="position:absolute;left:14px;top:86px;width:418px;height:280px">'
    f'<div class="plq lac" style="left:440px;top:96px;width:880px;padding:20px 134px 20px 22px;display:flex;flex-direction:column;gap:16px">'
    f'{header}<div class=rule></div>{stats}{party_legend}'
    f'<div style="display:flex;justify-content:space-between;padding:0 6px">{party}</div>'
    f'<div class=rule></div>{footer}</div>'
    f'{seal}{sheet}'
)
note = ('<div class=note><b>Planner · B9</b>Sigillo che sporge dal pannello: emblema di vittoria + %. Sotto, cinque teschi (3 accesi). '
        'Il ruolo più esposto (guardia del corpo) ha alone brace e «TAKES THE HITS». Emblema, teschio e statistiche sono segnaposto disegnati qui.</div>')
page(body, note, '.mw/runs/20261027-planner-remock/planner-B9.html')
