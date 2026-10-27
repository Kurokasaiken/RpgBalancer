"""Planner B7 — the six fixes from the B6 critique (Director: «procedi», 2026-10-27).

1. Closed bezel: a continuous brass ring, portrait ~78% of the diameter, gem
   on the rim as the state light, role + name in a tab fused to the bezel.
   States drawn in the companion file planner-B7-states.
2. Danger: band word (the game's own 4 bands) + ONE engraved claw mark + a
   4-step pip meter. No skulls (engravedIcons.tsx rule D3), no row to count.
3. One strong border only — the verdict. Everything else is grouped by
   space and hairlines.
4. Key stats with no text: primary larger, secondaries smaller, the sealed
   ones as a single «+3» stone. Balancer glyphs (Director ruling).
5. The character sheet anchored to the hovered bezel; the two rows the
   quest tests (Damage → Strength, Accuracy → Perception) outlined.
6. Bag tiles drawn bigger with the game's engraved glyphs and a quantity.
"""
import json
E = json.load(open('.mw/runs/20261027-planner-remock/icons/engraved.json'))
def eng(i, size, color):
    return f'<span style="display:inline-grid;width:{size}px;height:{size}px;color:{color}">{E[i].replace("width=\"24\" height=\"24\"", f"width=\"{size}\" height=\"{size}\"")}</span>'
GOLD = '#d8bd78'; SUC = '#9ccc84'; EMBER = '#d9805f'
STAR = 'M12 2.5l2.8 6.1 6.6.7-4.9 4.5 1.4 6.5L12 17l-5.9 3.3 1.4-6.5-4.9-4.5 6.6-.7z'
def star(on, size=22):
    s = '' if on else ' stroke="rgba(216,189,120,.45)" stroke-width="1.3"'
    return f'<svg width={size} height={size} viewBox="0 0 24 24"><path d="{STAR}" fill="{GOLD if on else "none"}"{s} stroke-linejoin="round"/></svg>'
def _lens(dx, h):
    return f'M{dx} {-h}C{dx+3.6} {-h*.35} {dx+3.6} {h*.35} {dx} {h}C{dx+1} {h*.35} {dx+1} {-h*.35} {dx} {-h}Z'
CLAW = (f'<svg width=46 height=46 viewBox="0 0 24 24"><g transform="translate(11.4 12) rotate(24)" fill="{EMBER}">'
        f'<path d="{_lens(-6.4, 8.4) + _lens(-.6, 10.8) + _lens(5.2, 8.4)}"/></g></svg>')
def gl(g, size):
    return f'<span class=gl style="font-size:{size}px">{g}</span>'

GEM = {'occupied': '#3fbf7f', 'valid': '#f0d48a', 'reject': '#d9805f', 'empty': '#2a3b40'}
def bezel(img, role, name, size=132, state='occupied', hover=False, role_icon=None):
    r = size / 2; pr = r * 0.78
    glow = 'filter:drop-shadow(0 0 14px rgba(240,212,138,.55))' if hover else 'filter:drop-shadow(0 8px 14px rgba(0,0,0,.55))'
    ring_hi = '#f6e3a8' if hover else '#e8cf8a'
    gid = f'g{abs(hash((img, role, state, hover))) % 10**6}'
    inner = (f'<image href="{img}" x="{r-pr}" y="{r-pr}" width="{2*pr}" height="{2*pr}" clip-path="url(#c{gid})" preserveAspectRatio="xMidYMid slice"/>'
             if img else
             f'<circle cx="{r}" cy="{r}" r="{pr}" fill="#081a22"/>'
             f'<foreignObject x="{r-20}" y="{r-20}" width="40" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="color:rgba(216,189,120,.55)">{eng(role_icon, 40, "rgba(216,189,120,.55)") if role_icon else ""}</div></foreignObject>')
    dash = f'<circle cx="{r}" cy="{r}" r="{pr+2}" fill="none" stroke="#f0d48a" stroke-width="2" stroke-dasharray="6 5" opacity=".9"/>' if state == 'valid' else ''
    rej = (f'<circle cx="{r}" cy="{r}" r="{pr}" fill="rgba(217,128,95,.42)"/>'
           f'<circle cx="{r}" cy="{r}" r="{pr-2}" fill="none" stroke="#d9805f" stroke-width="3"/>') if state == 'reject' else ''
    svg = (
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" style="{glow};overflow:visible">'
        f'<defs><radialGradient id="r{gid}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="{ring_hi}"/><stop offset=".55" stop-color="#b99a52"/><stop offset="1" stop-color="#5e4a22"/></radialGradient>'
        f'<clipPath id="c{gid}"><circle cx="{r}" cy="{r}" r="{pr}"/></clipPath></defs>'
        f'<circle cx="{r}" cy="{r}" r="{r-1}" fill="url(#r{gid})" stroke="#0b0a08" stroke-width="1.5"/>'
        f'<circle cx="{r}" cy="{r}" r="{r-5}" fill="none" stroke="rgba(255,240,200,.35)" stroke-width="1"/>'
        f'<circle cx="{r}" cy="{r}" r="{pr+1.5}" fill="#0b0a08"/>'
        f'{inner}{rej}{dash}'
        f'<circle cx="{r}" cy="{r}" r="{pr}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="2"/>'
        f'<g transform="translate({r} {size-5})"><path d="M0 -8 L7 0 L0 8 L-7 0Z" fill="{GEM[state]}" stroke="#0b0a08" stroke-width="1.4"/>'
        f'<path d="M0 -6 L3 -1 L0 0 L-3 -1Z" fill="rgba(255,255,255,.45)"/></g>'
        f'</svg>')
    tab = (f'<div style="margin-top:-2px;min-width:{size-8}px;padding:5px 12px 6px;border-radius:0 0 10px 10px;text-align:center;'
           f'background:linear-gradient(180deg,#0c2833,#060f16);box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)">'
           f'<div style="font-size:14px;color:var(--crest);line-height:1.1">{role}</div>'
           f'<div style="font-family:Cinzel;font-size:15px;color:var(--title);white-space:nowrap;line-height:1.25">{name or "&nbsp;"}</div></div>')
    return f'<div style="display:flex;flex-direction:column;align-items:center">{svg}{tab}</div>'

CSS = '''
@font-face{font-family:Cinzel;src:url(../../../public/fonts/cinzel-latin-wght-normal.woff2);font-weight:400 900}
@font-face{font-family:'EB Garamond';src:url(../../../public/fonts/eb-garamond-latin-wght-normal.woff2);font-weight:400 800}
@font-face{font-family:'EB Garamond';font-style:italic;src:url(../../../public/fonts/eb-garamond-latin-wght-italic.woff2);font-weight:400 800}
:root{--hi:#b99a52;--crest:#d8bd78;--title:#e8d6ae;--body:#c9d3cf;--mute:#9fb3a8}
*{box-sizing:border-box;margin:0}
body{width:1440px;height:900px;overflow:hidden;position:relative;background:#04090d url(../../ui-catalog/components/hud-top-tabs/shots/V1/default-ctx-a.png) 0 0/1440px 900px;font-family:'EB Garamond',serif;color:var(--body)}
.gl{display:inline-grid;place-items:center;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji',sans-serif}
.lac{background:linear-gradient(180deg,#0f2a35,#09202a 45%,#060f16)}
.plq{position:absolute;border-radius:16px;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 4.75px var(--hi),0 0 0 6px #0b0a08,0 10px 26px rgba(3,26,30,.7)}
h1{font-family:Cinzel;font-weight:600;font-size:24px;letter-spacing:.04em;color:var(--title)}
.lab{font-size:16px;color:var(--crest)}
.mut{color:var(--mute)}
.num{font-family:Cinzel;font-weight:600;font-variant-numeric:tabular-nums}
.rule{height:1px;background:linear-gradient(90deg,transparent,rgba(223,184,87,.3) 10%,rgba(223,184,87,.3) 90%,transparent)}
.rw{display:inline-flex;align-items:center;gap:8px;font-size:18px;color:var(--title)}
.tile{position:relative;display:inline-grid;place-items:center;border-radius:12px;background:rgba(0,0,0,.28)}
.qty{position:absolute;right:5px;bottom:2px;font-family:Cinzel;font-weight:600;font-size:14px;color:var(--title)}
.btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 20px;border-radius:8px;font-family:Cinzel;font-weight:600;font-size:15px;letter-spacing:.1em;color:var(--title);background:linear-gradient(180deg,#0c2833,#060f16);box-shadow:inset 0 0 0 1.5px var(--crest),inset 0 0 0 3.5px rgba(6,15,22,.9)}
.btn.sec{color:var(--mute);font-weight:500;box-shadow:none;letter-spacing:.06em;font-size:14px}
.pip{width:26px;height:6px;border-radius:3px;background:rgba(217,128,95,.18)}
.pip.on{background:#d9805f}
.note{position:absolute;left:24px;bottom:24px;max-width:400px;font-size:15px;color:#c9d3cf;background:rgba(4,9,13,.92);padding:10px 14px;border-radius:8px;box-shadow:0 0 0 1px rgba(185,154,82,.5);z-index:20}
.note b{display:block;font-family:Cinzel;font-size:13px;letter-spacing:.1em;color:#e8d6ae;margin-bottom:4px}
'''
CRATE = '<svg width=28 height=28 viewBox="0 0 24 24"><path d="M3 8l9-4.5L21 8v9l-9 4.5L3 17z" fill="none" stroke="#d8bd78" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 8l9 4.5L21 8M12 12.5V21.5" fill="none" stroke="#d8bd78" stroke-width="1.3"/></svg>'

def page(body, note, out):
    open(out, 'w').write(f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}{note}</body>')

if __name__ == '__main__':
    header = (
        f'<div style="display:flex;gap:18px">'
        f'<div style="width:220px;height:124px;flex:none;border-radius:10px;background:url(../../../public/assets/scene-library/totem-goblin.jpg) 50% 42%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
        f'<div style="flex:1;min-width:0">'
        f'<h1>Goblin Extermination</h1>'
        f'<p style="font-style:italic;font-size:18px;color:var(--title);margin-top:3px">The wood has gone quiet. The goblins have not.</p>'
        f'<p style="font-size:17px;margin-top:5px">Exterminate the goblin camp — none of them must come back to threaten the village.</p>'
        f'<div style="display:flex;gap:22px;margin-top:10px;align-items:center">'
        f'<span style="display:flex;gap:1px">{"".join(star(i < 2) for i in range(5))}</span>'
        f'<span class=rw><img src="../../../public/assets/ui/resources/res-gold-64.webp" width=30 height=30><b class=num>61</b> gold</span>'
        f'<span class=rw>{CRATE}War loot</span>'
        f'<span class=rw style="color:var(--mute)">· 26 days</span>'
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
    H = [('img/gig.jpg', 'Expedition leader', 'Giggiolillo', True), ('img/spa.jpg', 'Fighter', 'Sir Spaccaculi', False),
         ('img/sal.jpg', 'Scout', 'Salvatrice', False), ('img/ber.jpg', 'Bodyguard', 'Bertoldo', False)]
    party = ''.join(bezel(i, r, n, hover=h) for i, r, n, h in H)
    verdict = (
        f'<div style="width:250px;flex:none;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;'
        f'background:rgba(0,0,0,.26);box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.6)">'
        f'<span class=lab>Chance of victory</span>'
        f'<span class=num style="font-size:88px;line-height:1.05;color:{SUC};margin:6px 0 0 12px">68<small style="font-size:40px">%</small></span>'
        f'<span style="height:1px;width:100%;background:rgba(223,184,87,.18);margin:16px 0 14px"></span>'
        f'<span class=lab>Danger</span>'
        f'<span style="display:flex;align-items:center;gap:10px;margin-top:4px">{CLAW}<span class=num style="font-size:26px;color:{EMBER}">High</span></span>'
        f'<span style="display:flex;gap:5px;margin-top:8px"><i class="pip on"></i><i class="pip on"></i><i class="pip on"></i><i class=pip></i></span>'
        f'</div>'
    )
    bag = ''.join(
        f'<span class=tile style="width:64px;height:64px;box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)">{eng(i, 36, GOLD)}<span class=qty>×1</span></span>'
        for i in ('ico-axe', 'ico-target', 'ico-salve'))
    footer = (
        f'<div style="display:flex;gap:10px;align-items:center">{eng("ico-pouch", 30, "var(--crest)")}{bag}'
        f'<span style="flex:1"></span><span class="btn sec">Back to map</span><span class=btn>SEND EXPEDITION</span></div>'
    )
    # sheet anchored to the hovered bezel (left of it), damage + accuracy rows outlined
    hl = 'position:absolute;border-radius:6px;box-shadow:0 0 0 1.5px #f0d48a,0 0 10px rgba(240,212,138,.35);background:rgba(240,212,138,.08)'
    sheet = (
        f'<div style="position:absolute;left:66px;top:392px;width:380px;height:282px;z-index:6;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6))">'
        f'<img src="img/sheet2x.png" width=380 height=282 style="display:block">'
        f'<span style="{hl};left:8px;top:139px;width:180px;height:20px"></span>'
        f'<span style="{hl};left:192px;top:139px;width:180px;height:20px"></span>'
        f'<span style="position:absolute;right:-13px;top:96px;width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:13px solid #b99a52"></span>'
        f'</div>')
    body = (
        f'<img src="img/roster2x.png" style="position:absolute;left:14px;top:86px;width:418px;height:280px">'
        f'<div class="plq lac" style="left:452px;top:96px;width:964px;padding:20px 22px;display:flex;flex-direction:column;gap:16px">'
        f'{header}<div class=rule></div>'
        f'<div style="display:flex;gap:22px;align-items:stretch">'
        f'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">{stats}'
        f'<div style="display:flex;justify-content:space-between;padding:0 6px">{party}</div></div>'
        f'{verdict}</div>'
        f'<div class=rule></div>{footer}</div>'
        f'{sheet}'
    )
    note = ('<div class=note><b>Planner · B7</b>Ghiera chiusa, un solo bordo forte (il verdetto), pericolo = fascia + un segno. '
            'Mouse sul capo: scheda ancorata, evidenziate le righe che la prova usa (Danno → Forza, Precisione → Percezione).</div>')
    page(body, note, '.mw/runs/20261027-planner-remock/planner-B7.html')

    # companion: the bezel states, full size
    states = [
        (None, 'Expedition leader', '', 'empty', 'role-leader', 'Empty — role glyph, gem dark'),
        (None, 'Fighter', '', 'valid', 'role-member', 'A companion dragged over it — dashed gold rim, gem lit'),
        ('img/spa.jpg', 'Scout', 'Sir Spaccaculi', 'reject', None, 'Refused — ember wash, gem ember'),
        ('img/sal.jpg', 'Scout', 'Salvatrice', 'occupied', None, 'Occupied — gem green'),
    ]
    cells = ''.join(
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:18px;width:280px">{bezel(i, r, n, size=176, state=s, role_icon=ic)}'
        f'<p style="font-size:18px;text-align:center;color:var(--body);max-width:240px">{cap}</p></div>'
        for i, r, n, s, ic, cap in states)
    sbody = (f'<div class="plq lac" style="left:120px;top:150px;width:1200px;padding:40px 30px">'
             f'<h1 style="text-align:center;margin-bottom:34px">Marching-order bezel — states</h1>'
             f'<div style="display:flex;justify-content:space-around">{cells}</div></div>')
    page(sbody, '<div class=note><b>Planner · B7 — stati della ghiera</b>Vuota, bersaglio valido durante il trascinamento, rifiuto, occupata. Il gioiello sul bordo è la luce di stato.</div>',
         '.mw/runs/20261027-planner-remock/planner-B7-states.html')
