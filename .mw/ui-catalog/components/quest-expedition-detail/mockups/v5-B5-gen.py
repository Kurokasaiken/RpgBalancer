"""Planner B5 — Director rulings 2026-10-27 on B4.

- Only two forecast numbers: chance of victory (estimate.sim.outcomePct.reward,
  68% as /game shows it for this party) and danger (the offer band — already
  computed: resolvedOffer.bandIds.danger = 'alta'). No deaths, no wounds, no
  hit shares, no costs: the player can retreat at any time.
- Danger = the game's painted claws (public/assets/ui/poi/threat-claws-128.webp).
- Reward = wealth stars + every resource kind the quest can pay (gold from the
  trophy, equipment from the war loot) — several kinds at once, never XP.
- Key stats at quest level only (primary and secondary can be several),
  Balancer glyphs, no values, no scale.
- Party = the marching-order slots, portrait only; hovering an assigned slot
  opens the real character sheet (HeroSheetPanel, captured by a real hover on
  /game) — no mini cards.
"""
GOLD = '#d8bd78'; SUC = '#9ccc84'
STAR = 'M12 2.5l2.8 6.1 6.6.7-4.9 4.5 1.4 6.5L12 17l-5.9 3.3 1.4-6.5-4.9-4.5 6.6-.7z'
def star(fill, size=26):
    s = '' if fill else ' stroke="rgba(216,189,120,.45)" stroke-width="1.3"'
    return f'<svg width={size} height={size} viewBox="0 0 24 24"><path d="{STAR}" fill="{GOLD if fill else "none"}"{s} stroke-linejoin="round"/></svg>'
def claws(n, size):
    return ''.join(
        f'<img src="../../../public/assets/ui/poi/threat-claws-128.webp" width={size} height={size} style="{"" if i < n else "filter:grayscale(1) brightness(.45);opacity:.55"}">'
        for i in range(5))
def gl(g, size):
    return f'<span class=gl style="font-size:{size}px">{g}</span>'

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
.band{border-radius:12px;background:rgba(0,0,0,.24);box-shadow:inset 0 0 0 1px rgba(223,184,87,.2)}
.chip{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px 0 10px;border-radius:10px;font-size:17px;color:var(--title);background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(223,184,87,.3)}
.stone{width:40px;height:40px;border-radius:10px;display:inline-grid;place-items:center;font-family:Cinzel;font-size:18px;color:#6f8a86;background:repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.3)}
.res{display:inline-flex;align-items:center;gap:6px;font-size:17px;color:var(--title)}
.tok{display:flex;flex-direction:column;align-items:center;gap:6px;width:150px}
.tok img{width:104px;height:104px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #0b0a08,0 0 0 5px var(--hi),0 0 0 6.5px #0b0a08,0 8px 18px rgba(0,0,0,.5)}
.tok .r{font-size:16px;color:var(--crest)}
.tok .n{font-family:Cinzel;font-size:15px;color:var(--title);white-space:nowrap}
.slot{height:44px;border-radius:9px;display:inline-flex;align-items:center;gap:8px;padding:0 14px;font-size:17px;color:var(--title);background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 1px rgba(223,184,87,.3)}
.btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 18px;border-radius:8px;font-family:Cinzel;font-weight:600;font-size:15px;letter-spacing:.1em;color:var(--title);background:linear-gradient(180deg,#0c2833,#060f16);box-shadow:inset 0 0 0 1.5px var(--crest),inset 0 0 0 3.5px rgba(6,15,22,.9)}
.btn.sec{color:var(--mute);font-weight:500;box-shadow:none;letter-spacing:.06em;font-size:14px}
.note{position:absolute;left:24px;bottom:24px;max-width:400px;font-size:15px;color:#c9d3cf;background:rgba(4,9,13,.92);padding:10px 14px;border-radius:8px;box-shadow:0 0 0 1px rgba(185,154,82,.5);z-index:20}
.note b{display:block;font-family:Cinzel;font-size:13px;letter-spacing:.1em;color:#e8d6ae;margin-bottom:4px}
'''

header = (
    f'<div style="display:flex;gap:18px">'
    f'<div style="width:230px;height:130px;flex:none;border-radius:10px;background:url(../../../public/assets/scene-library/totem-goblin.jpg) 50% 42%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
    f'<div style="flex:1;min-width:0">'
    f'<h1>Goblin Extermination</h1>'
    f'<p style="font-style:italic;font-size:18px;color:var(--title);margin-top:3px">The wood has gone quiet. The goblins have not.</p>'
    f'<p style="font-size:17px;margin-top:6px"><span class=lab>Objective</span>&nbsp; Exterminate the goblin camp — none of them must come back to threaten the village.</p>'
    f'<div style="display:flex;gap:30px;margin-top:12px;align-items:center">'
    f'<div style="display:flex;align-items:center;gap:10px"><span class=lab>Reward</span><span style="display:flex;gap:1px">{"".join(star(i < 2) for i in range(5))}</span>'
    f'<span style="display:flex;gap:14px;margin-left:8px">'
    f'<span class=res><img src="../../../public/assets/ui/resources/res-gold-64.webp" width=28 height=28>Gold</span>'
    f'<span class=res><span style="width:28px;height:28px;border-radius:7px;box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.6);border:1px dashed transparent;display:inline-grid;place-items:center;font-family:Cinzel;font-size:11px;color:var(--crest)">EQ</span>Equipment</span>'
    f'</span></div>'
    f'<div style="display:flex;align-items:center;gap:10px"><span class=lab>Duration</span><span class=num style="font-size:20px;color:var(--title)">26 days</span></div>'
    f'</div></div></div>'
)

stats = (
    f'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    f'<span class=lab style="margin-right:2px">Primary</span><span class=chip>{gl("⚔️", 22)}Strength</span>'
    f'<span style="width:1px;height:30px;background:rgba(223,184,87,.25);margin:0 8px"></span>'
    f'<span class=lab style="margin-right:2px">Secondary</span><span class=chip>{gl("🎯", 20)}Perception</span>'
    f'<span class=stone>?</span><span class=stone>?</span><span class=stone>?</span>'
    f'<span class=mut style="font-size:15px;margin-left:4px">a scout reveals the sealed ones</span></div>'
)

H = [('gig', 'Giggiolillo', 'Expedition leader'), ('spa', 'Sir Spaccaculi', 'Fighter'),
     ('sal', 'Salvatrice', 'Scout'), ('ber', 'Bertoldo', 'Bodyguard')]
tokens = ''.join(
    f'<div class=tok><img src="img/{k}.jpg" style="{"box-shadow:0 0 0 2px #0b0a08,0 0 0 5px #f0d48a,0 0 0 6.5px #0b0a08,0 0 22px rgba(240,212,138,.45)" if i == 0 else ""}">'
    f'<span class=r>{r}</span><span class=n>{n}</span></div>'
    for i, (k, n, r) in enumerate(H))
party = (
    f'<div class=band style="flex:1;min-width:0;padding:14px 18px 16px">'
    f'<div style="display:flex;justify-content:space-between;align-items:baseline"><span class=lab>Marching order</span>'
    f'<span class=mut style="font-size:15px">head → tail · hover a companion for their sheet</span></div>'
    f'<div style="display:flex;justify-content:space-between;margin-top:14px">{tokens}</div>'
    f'</div>'
)
verdict = (
    f'<div class=band style="width:250px;flex:none;padding:16px 20px;display:flex;flex-direction:column;gap:6px;box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.55)">'
    f'<span class=lab>Chance of victory</span>'
    f'<span class=num style="font-size:68px;line-height:1;color:{SUC}">68<small style="font-size:32px">%</small></span>'
    f'<span style="height:1px;background:rgba(223,184,87,.18);margin:12px 0 8px"></span>'
    f'<span class=lab>Danger</span>'
    f'<span style="display:flex;gap:2px;margin-top:2px">{claws(3, 38)}</span>'
    f'</div>'
)
footer = (
    f'<div style="display:flex;gap:10px;align-items:center"><span class=lab>Bag 3/3</span>'
    f'<span class=slot>{gl("⚔️", 17)} Strength +15</span><span class=slot>{gl("🎯", 17)} Perception +15</span><span class=slot>{gl("❤️", 17)} Healing +20</span>'
    f'<span style="flex:1"></span><span class="btn sec">Back to map</span><span class=btn>SEND EXPEDITION</span></div>'
)
sheet = ('<img src="img/hero-sheet.png" style="position:absolute;left:58px;top:372px;width:381px;height:283px;z-index:6;'
         'filter:drop-shadow(0 14px 24px rgba(0,0,0,.6))">')

body = (
    f'<img src="img/roster-real.png" style="position:absolute;left:14px;top:86px;width:418px;height:282px">'
    f'<div class="plq lac" style="left:452px;top:96px;width:964px;padding:20px;display:flex;flex-direction:column;gap:16px">'
    f'{header}{stats}'
    f'<div style="display:flex;gap:14px">{party}{verdict}</div>'
    f'{footer}</div>'
    f'{sheet}'
)
note = ('<div class=note><b>Planner · B5</b>Solo vittoria e pericolo. Ricompensa = stelle + tipi di risorsa. '
        'Statistiche solo a livello di quest, senza valori. Stato mostrato: mouse sopra Giggiolillo → la sua scheda vera.</div>')
open('.mw/runs/20261027-planner-remock/planner-B5.html', 'w').write(
    f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}{note}</body>')
