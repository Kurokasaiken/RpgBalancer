"""Planner B10 — three alternatives to the gold disc (Director 2026-10-27).
Common: title 34px on its own row; every hit-share in ivory (only the most exposed role in ember, with
its bezel glow); skulls grouped as ONE indicator (no heavy black bar), tooltip carries the meaning.
A pennant hanging from the top edge · B heater shield set into the right column · C lacquer side band.
Emblem, skull and stat icons are placeholders drawn here (the Director generates the painted ones)."""
import sys, math
sys.path.insert(0, '.mw/runs/20261027-planner-remock')
from genB8 import *   # CSS, page(), eng(), gl(), star(), SUC, GOLD, EMBER
_src = open('.mw/runs/20261027-planner-remock/genB9.py').read()
exec(_src[_src.index('def leaf'):_src.index('seal = (')])   # leaf, laurel, victory_emblem, skull

IVORY = '#e8d6ae'
def skull_group(size=26, lit=3, tip=None):
    sk = ''.join(f'<span style="margin-left:{0 if i == 0 else -3}px">{skull(size, i < lit)}</span>' for i in range(5))
    t = (f'<span style="position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:8px;padding:6px 12px;border-radius:8px;white-space:nowrap;font-size:16px;color:var(--title);'
         f'background:rgba(4,9,13,.96);box-shadow:0 0 0 1px rgba(185,154,82,.7);z-index:12">Danger: high</span>') if tip else ''
    return (f'<span style="position:relative;display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.28);'
            f'box-shadow:inset 0 0 0 1px rgba(216,189,120,.3)">{sk}{t}</span>')

def header(title=36):
    return (f'<div style="display:flex;gap:18px"><div style="width:220px;height:132px;flex:none;border-radius:10px;background:url(../../../public/assets/scene-library/totem-goblin.jpg) 50% 42%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
            f'<div style="flex:1;min-width:0"><h1 style="font-size:{title}px;line-height:1.05">Goblin Extermination</h1>'
            f'<p style="font-style:italic;font-size:18px;color:var(--title);margin-top:5px">The wood has gone quiet. The goblins have not.</p>'
            f'<p style="font-size:17px;margin-top:4px">Exterminate the goblin camp — none of them must come back to threaten the village.</p>'
            f'<div style="display:flex;gap:12px;margin-top:10px;align-items:center"><span style="display:flex;gap:1px;margin-right:8px">{"".join(star(i < 2) for i in range(5))}</span>'
            f'<span class=tile style="width:58px;height:46px;gap:4px;display:inline-flex;box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)"><img src="../../../public/assets/ui/resources/res-gold-64.webp" width=28 height=28><b class=num style="font-size:17px;color:var(--title)">61</b></span>'
            f'<span class=tile style="width:46px;height:46px;font-family:Cinzel;font-size:18px;color:#7f9894;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.35)">?</span>'
            f'<span style="flex:1"></span><span class=rw style="color:var(--mute)">26 days</span></div></div></div>')

STATS = (f'<div style="display:flex;align-items:center;gap:10px"><span class=tile style="width:60px;height:60px;box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.7)">{gl("⚔️", 32)}</span>'
         f'<span style="width:1px;height:36px;background:rgba(223,184,87,.25);margin:0 6px"></span>'
         f'<span class=tile style="width:44px;height:44px;box-shadow:inset 0 0 0 1px rgba(216,189,120,.4)">{gl("🎯", 22)}</span>'
         f'<span class=tile style="width:44px;height:44px;font-family:Cinzel;font-size:16px;color:#7f9894;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.35)">+3</span></div>')
H = [('gig', 'Expedition leader', 'Giggiolillo', 0), ('spa', 'Fighter', 'Sir Spaccaculi', 0), ('sal', 'Scout', 'Salvatrice', 20), ('ber', 'Bodyguard', 'Bertoldo', 80)]
def slot(k, role, name, share, hover=False):
    top = share == 80
    glow = 'filter:drop-shadow(0 0 14px rgba(217,128,95,.75))' if top else ('filter:drop-shadow(0 0 12px rgba(240,212,138,.55))' if hover else '')
    col, bar, fs = ('#f0a07f', '#d9805f', 34) if top else (IVORY, '#9db8b8', 22)
    return (f'<div style="display:flex;flex-direction:column;align-items:center;width:150px"><img src="img/pslot-{k}.png" width=132 height=132 style="{glow}">'
            f'<span style="font-size:15px;letter-spacing:.14em;color:var(--mute);margin-top:2px">{role}</span><span style="font-family:Cinzel;font-size:15px;color:var(--title);white-space:nowrap">{name}</span>'
            f'<span class=num style="font-size:{fs}px;color:{col};margin-top:6px;line-height:1.1">{share}%</span>'
            f'<span style="width:110px;height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:4px"><i style="display:block;height:100%;width:{max(share,1.5)}%;background:{bar}"></i></span></div>')
PARTY = ('<div style="display:flex;justify-content:space-between;align-items:baseline;padding:0 6px"><span class=lab>Marching order</span><span class=mut style="font-size:15px">share of the incoming hits</span></div>'
         f'<div style="display:flex;justify-content:space-between;padding:0 6px">{"".join(slot(k, r, n, sh, i == 0) for i, (k, r, n, sh) in enumerate(H))}</div>')
BAG = ''.join(f'<span class=tile style="width:64px;height:64px;box-shadow:inset 0 0 0 1px rgba(216,189,120,.45)">{eng(i, 36, GOLD)}<span class=qty>×1</span></span>' for i in ('ico-axe', 'ico-target', 'ico-salve'))
FOOT = (f'<div style="display:flex;gap:10px;align-items:center">{eng("ico-pouch", 30, "var(--crest)")}{BAG}<span style="flex:1"></span><span class="btn sec">Back to map</span><span class=btn>SEND EXPEDITION</span></div>')
hl = 'position:absolute;border-radius:6px;box-shadow:0 0 0 1.5px #f0d48a,0 0 10px rgba(240,212,138,.35);background:rgba(240,212,138,.08)'
SHEET = (f'<div style="position:absolute;left:62px;top:372px;width:380px;height:282px;z-index:6;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6))"><img src="img/sheet2x.png" width=380 height=282 style="display:block">'
         f'<span style="{hl};left:8px;top:139px;width:180px;height:20px"></span><span style="{hl};left:192px;top:139px;width:180px;height:20px"></span>'
         f'<span style="position:absolute;right:-13px;top:96px;width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:13px solid #b99a52"></span></div>')
ROSTER = '<img src="img/roster2x.png" style="position:absolute;left:14px;top:86px;width:418px;height:280px">'
DEFS = ('<defs><linearGradient id="lq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12394a"/><stop offset="1" stop-color="#060f16"/></linearGradient>'
        '<linearGradient id="br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d48a"/><stop offset=".5" stop-color="#b99a52"/><stop offset="1" stop-color="#6b5224"/></linearGradient></defs>')
def verdict_stack(emb, num, skulls, tip=False, gap=6):
    return (f'<div style="display:flex;flex-direction:column;align-items:center;gap:{gap}px">{victory_emblem(emb)}'
            f'<span class=num style="font-size:{num}px;line-height:1;color:{SUC};padding-left:8px">68<small style="font-size:{int(num*.46)}px">%</small></span>{skull_group(skulls, 3, tip)}</div>')
def plaque(left, width, pad_r, inner):
    return f'<div class="plq lac" style="left:{left}px;top:96px;width:{width}px;padding:20px {pad_r}px 20px 22px;display:flex;flex-direction:column;gap:16px">{inner}</div>'
MAIN = f'{header()}<div class=rule></div>{STATS}{PARTY}<div class=rule></div>{FOOT}'

# A — pennant hanging from the top edge
def variant_a():
    ban = (f'<div style="position:absolute;left:1212px;top:70px;width:158px;height:312px;z-index:8;filter:drop-shadow(0 12px 16px rgba(0,0,0,.55))">'
           f'<svg width=158 height=312 viewBox="0 0 158 312">{DEFS}<path d="M8 12H150V276L79 238 8 276Z" fill="url(#lq)" stroke="#0b0a08" stroke-width="5"/>'
           f'<path d="M8 12H150V276L79 238 8 276Z" fill="none" stroke="url(#br)" stroke-width="2.4"/><rect x="0" y="0" width="158" height="14" rx="7" fill="url(#br)" stroke="#0b0a08" stroke-width="1.5"/>'
           f'<circle cx="6" cy="7" r="6" fill="url(#br)" stroke="#0b0a08"/><circle cx="152" cy="7" r="6" fill="url(#br)" stroke="#0b0a08"/></svg>'
           f'<div style="position:absolute;left:0;right:0;top:30px">{verdict_stack(88, 60, 22, True, 8)}</div></div>')
    return ROSTER + plaque(440, 960, 200, MAIN) + ban + SHEET

# B — heater shield set into the right column
def variant_b():
    sh = (f'<div style="position:absolute;left:1236px;top:236px;width:184px;height:250px;z-index:8;filter:drop-shadow(0 12px 16px rgba(0,0,0,.55))">'
          f'<svg width=184 height=250 viewBox="0 0 184 250">{DEFS}<path d="M10 8H174V128C174 186 136 226 92 242 48 226 10 186 10 128Z" fill="url(#lq)" stroke="#0b0a08" stroke-width="5"/>'
          f'<path d="M10 8H174V128C174 186 136 226 92 242 48 226 10 186 10 128Z" fill="none" stroke="url(#br)" stroke-width="2.4"/>'
          f'<path d="M20 18H164V128C164 180 130 214 92 228 54 214 20 180 20 128Z" fill="none" stroke="rgba(216,189,120,.35)" stroke-width="1"/></svg>'
          f'<div style="position:absolute;left:0;right:0;top:22px">{verdict_stack(78, 56, 20, False, 6)}</div></div>')
    return ROSTER + plaque(440, 900, 150, MAIN) + sh + SHEET

# C — lacquer side band inside the plaque
def variant_c():
    band = (f'<div style="width:190px;flex:none;align-self:stretch;margin:-20px -22px -20px 0;border-radius:0 16px 16px 0;border-left:1px solid rgba(216,189,120,.4);'
            f'background:linear-gradient(180deg,rgba(18,57,74,.55),rgba(6,15,22,.2));display:flex;align-items:center;justify-content:center">'
            f'{verdict_stack(96, 66, 24, True, 12)}</div>')
    mainc = MAIN.replace('font-size:36px;line-height:1.05', 'font-size:31px;line-height:1.05')
    inner = f'<div style="display:flex;gap:22px;align-items:stretch"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">{mainc}</div>{band}</div>'
    return ROSTER + f'<div class="plq lac" style="left:440px;top:96px;width:960px;padding:20px 22px;overflow:hidden">{inner}</div>' + SHEET

NOTES = {'A': 'B10-A · Stendardo appeso al bordo alto: lacca con filo d\'ottone, coda di rondine. Il numero e i teschi stanno dentro.',
         'B': 'B10-B · Scudo araldico incastrato nella colonna destra, esce dal bordo di una settantina di pixel. Filo d\'ottone, niente disco pieno.',
         'C': 'B10-C · Fascia in lacca lungo il lato destro del pannello, senza sporgere e senza anello d\'oro. Tooltip sui teschi.'}
for key, fn in (('A', variant_a), ('B', variant_b), ('C', variant_c)):
    page(fn(), f'<div class=note><b>Planner · {NOTES[key].split(" · ")[0]}</b>{NOTES[key].split(" · ",1)[1]} Titolo 36 px; percentuali in avorio, brace solo sul ruolo più esposto.</div>', f'.mw/runs/20261027-planner-remock/planner-B10{key}.html')
