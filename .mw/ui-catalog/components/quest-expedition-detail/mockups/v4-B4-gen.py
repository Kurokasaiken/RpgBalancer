"""Planner B4 — the five priority fixes from the B3 critique (Director 2026-10-27).

1. No lying per-hero signal: wound% per hero is gone; each hero shows its
   share of the hits (neutral) and «hurt or worse» (wound + death merged —
   no death odds on their own, so no spoiler, and the bodyguard no longer
   reads as the safest member).
2. One dominant element: the verdict column; the rest is unboxed or
   grouped in one band.
3. The primary stat on a scale with the test mark: STR 70 = even odds per
   combat round (goblin spec, «−20 allo score»), every hero placed on it.
4. Secondary stats: Perception revealed (config keyStats), the other three
   sealed until scouted (QUEST_RULES §2) — no mock Intelligence on screen.
5. A visible delta: Lisetta dragged onto the leader slot → 64% → 48%.

Numbers: estimateForParty(resolvedOffer, members, {runs:1000, seed:1}) run
in the dev build on 2026-10-27 — base 64.1%, Lisetta as leader 48.3%,
avgWounded 2.48, woundedDowntimeAvg 7.4. Per hero (wound/death): Gig
58.9/0.5, Spa 89/1.7, Sal 95.2/4.5, Ber 4.9/95.1. Hero stats from
deriveQuestStats on the live residents.
"""
GOLD = '#d8bd78'; SUC = '#9ccc84'; HURT = '#e3a34f'; CLAW = '#d9805f'; NEUT = '#7fa3a6'
STAR = 'M12 2.5l2.8 6.1 6.6.7-4.9 4.5 1.4 6.5L12 17l-5.9 3.3 1.4-6.5-4.9-4.5 6.6-.7z'
def _lens(dx, h):
    return f'M{dx} {-h}C{dx+3.4} {-h*.35} {dx+3.4} {h*.35} {dx} {h}C{dx+.9} {h*.35} {dx+.9} {-h*.35} {dx} {-h}Z'
CLAWP = _lens(-6.2, 8.2) + _lens(-.6, 10.6) + _lens(5, 8.2)
def svg(d, size, fill, stroke=None, claw=False):
    s = f' stroke="{stroke}" stroke-width="1.3"' if stroke else ''
    p = f'<path d="{d}" fill="{fill}"{s} stroke-linejoin="round"/>'
    if claw:
        p = f'<g transform="translate(11.4 12) rotate(24)">{p}</g>'
    return f'<svg width={size} height={size} viewBox="0 0 24 24">{p}</svg>'
def rating(d, n, color, claw=False, size=24):
    return ''.join(svg(d, size, color, claw=claw) if i < n else svg(d, size, 'none', 'rgba(216,189,120,.38)', claw) for i in range(5))
def gl(g, size):
    return f'<span class=gl style="font-size:{size}px">{g}</span>'

# (portrait, name, slot, hit share, hurt-or-worse, STR, PER)
H = [
    ('gig', 'Giggiolillo', 'Expedition leader', 0, 59, 65, 63),
    ('spa', 'Sir Spaccaculi', 'Fighter', 0, 91, 48, 43),
    ('sal', 'Salvatrice', 'Scout', 20, 100, 38, 58),
    ('ber', 'Bertoldo', 'Bodyguard', 80, 100, 58, 63),
]
BEST_STR = max(h[5] for h in H); BEST_PER = max(h[6] for h in H)
TEST = 70   # STR at which a combat round is even odds (goblin spec)

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
.lab{font-size:15px;color:var(--crest);letter-spacing:.02em}
.mut{color:var(--mute)}
.seal{display:flex;flex-direction:column;gap:4px}
.seal .r{display:flex;gap:2px;align-items:center;height:26px}
.band{border-radius:12px;background:rgba(0,0,0,.24);box-shadow:inset 0 0 0 1px rgba(223,184,87,.2)}
.card{flex:1 1 0;min-width:0;padding:10px 12px 12px;border-radius:12px;background:rgba(0,0,0,.2)}
.por{border-radius:10px;object-fit:cover;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 3px var(--hi)}
.num{font-family:Cinzel;font-weight:600;font-variant-numeric:tabular-nums}
.share{height:8px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden}.share i{display:block;height:100%;background:#5f8588}
.slot{height:42px;border-radius:9px;display:inline-flex;align-items:center;gap:8px;padding:0 12px;font-size:16px;color:var(--title);background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 1px rgba(223,184,87,.3)}
.btn{white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 14px;border-radius:8px;font-family:Cinzel;font-weight:600;font-size:15px;letter-spacing:.1em;color:var(--title);background:linear-gradient(180deg,#0c2833,#060f16);box-shadow:inset 0 0 0 1.5px var(--crest),inset 0 0 0 3.5px rgba(6,15,22,.9)}
.btn.sec{color:var(--mute);font-weight:500;box-shadow:none;letter-spacing:.06em;font-size:14px}
.seal-stone{width:46px;height:46px;border-radius:10px;display:grid;place-items:center;font-family:Cinzel;font-size:20px;color:#6f8a86;background:repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 6px,transparent 6px 12px),rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(159,179,168,.3)}
.note{position:absolute;left:24px;bottom:24px;max-width:400px;font-size:15px;color:#c9d3cf;background:rgba(4,9,13,.92);padding:10px 14px;border-radius:8px;box-shadow:0 0 0 1px rgba(185,154,82,.5);z-index:20}
.note b{display:block;font-family:Cinzel;font-size:13px;letter-spacing:.1em;color:#e8d6ae;margin-bottom:4px}
'''

def pos(v):  # STR 30..80 mapped onto the track width (%)
    return (v - 30) / 50 * 100

track_pins = ''.join(
    f'<img class=por src="img/{h[0]}.jpg" style="position:absolute;left:calc({pos(h[5])}% - 15px);top:{-4 if h[5]==BEST_STR else 4}px;width:30px;height:30px;border-radius:50%;'
    f'{"" if h[5]==BEST_STR else "opacity:.75;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 2px rgba(185,154,82,.6)"}">'
    for h in H)
test_band = (
    f'<div class=band style="padding:12px 16px 12px">'
    f'<div style="display:flex;align-items:baseline;gap:10px">{gl("⚔️", 24)}<span class=lab>The test</span>'
    f'<span class=num style="font-size:22px;color:#f1e6cc">Strength</span>'
    f'<span style="font-size:16px" class=mut>— the strongest of the party fights for everyone</span></div>'
    f'<div style="position:relative;height:38px;margin:12px 16px 0">'
    f'<div style="position:absolute;left:0;right:0;top:12px;height:6px;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(216,189,120,.25))"></div>'
    f'<div style="position:absolute;left:{pos(TEST)}%;top:0;width:2px;height:30px;background:var(--crest)"></div>'
    f'{track_pins}</div>'
    f'<div style="position:relative;height:20px;margin:0 16px;font-size:15px;white-space:nowrap">'
    f'<span style="position:absolute;right:calc({100-pos(BEST_STR)}% + 6px);color:#f6e3a8"><b class=num>{BEST_STR}</b> Giggiolillo</span>'
    f'<span style="position:absolute;left:calc({pos(TEST)}% + 8px);color:var(--crest)">{TEST} · even odds each round</span></div>'
    f'<div style="display:flex;gap:8px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(223,184,87,.15)">'
    f'<span class=lab style="margin-right:4px">Also tested</span>'
    f'<div style="display:flex;align-items:center;gap:8px;padding:0 12px 0 8px;height:40px;border-radius:10px;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(223,184,87,.3)">{gl("🎯", 20)}'
    f'<span style="font-size:16px;color:var(--title)">Perception</span><span style="font-size:15px" class=mut>best <b class=num style="color:#f6e3a8">{BEST_PER}</b></span></div>'
    f'<span class=seal-stone>?</span><span class=seal-stone>?</span><span class=seal-stone>?</span>'
    f'<span style="font-size:15px;margin-left:4px" class=mut>sealed — a scout reveals them</span></div>'
    f'</div>'
)

def card(k, n, role, share, hurt, st, p, drop=False):
    best = st == BEST_STR
    ring = 'box-shadow:inset 0 0 0 2px rgba(216,189,120,.85),0 0 18px rgba(216,189,120,.25)' if drop else ''
    return (
        f'<div class=card style="position:relative;{ring}">'
        f'<div style="display:flex;gap:9px;align-items:center"><img class=por src="img/{k}.jpg" width=44 height=44>'
        f'<div style="min-width:0"><div style="font-size:14px;color:var(--crest);white-space:nowrap">{role}</div>'
        f'<div style="font-family:Cinzel;font-size:13px;letter-spacing:0;color:var(--title);white-space:nowrap">{n}</div></div></div>'
        f'<div style="display:flex;gap:12px;margin-top:9px;align-items:center">'
        f'<span class=num style="display:inline-flex;align-items:center;gap:4px;font-size:{24 if best else 20}px;color:{"#f6e3a8" if best else "var(--body)"}">{gl("⚔️", 17)}{st}</span>'
        f'<span class=num style="display:inline-flex;align-items:center;gap:4px;font-size:15px;color:var(--mute)">{gl("🎯", 14)}{p}</span></div>'
        f'<div style="margin-top:10px;font-size:15px">Takes <b class=num style="color:var(--title)">{share}%</b> of the hits</div>'
        f'<div class=share style="margin-top:5px"><i style="width:{max(share, 1.5)}%"></i></div>'
        f'<div style="margin-top:8px;font-size:15px;color:{HURT}">Hurt or worse <b class=num>{hurt}%</b></div>'
        f'</div>'
    )

cards = ''.join(card(*h, drop=(i == 0)) for i, h in enumerate(H))
ghost = ('<div style="position:absolute;left:28px;top:118px;z-index:5;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:10px;'
         'background:rgba(6,15,22,.92);box-shadow:0 0 0 1.5px var(--crest),0 10px 22px rgba(0,0,0,.6);transform:rotate(-3deg)">'
         '<img class=por src="img/lis.jpg" width=36 height=36 onerror="this.style.display=\'none\'"><span style="font-family:Cinzel;font-size:15px;color:var(--title)">Lisetta</span>'
         f'<span class=num style="font-size:15px;color:var(--mute)">{gl("⚔️", 14)} 42</span></div>')

verdict = (
    f'<div class=band style="width:236px;flex:none;padding:16px 18px;display:flex;flex-direction:column;box-shadow:inset 0 0 0 1.5px rgba(216,189,120,.55)">'
    f'<div class=lab>Chance of success</div>'
    f'<div style="display:flex;align-items:baseline;gap:10px;margin-top:6px">'
    f'<span class=num style="font-size:64px;line-height:1;color:{SUC}">48<small style="font-size:30px">%</small></span>'
    f'<span class=num style="font-size:24px;color:{CLAW}">−16</span></div>'
    f'<div style="font-size:16px;margin-top:6px"><s class=mut>64%</s> &nbsp;if Lisetta leads instead of Giggiolillo</div>'
    f'<div style="height:1px;background:rgba(223,184,87,.18);margin:16px 0"></div>'
    f'<div class=lab>What it will cost</div>'
    f'<div style="font-size:17px;margin-top:6px;line-height:1.35">About <b class=num style="color:{HURT}">2–3</b> come back wounded,<br>'
    f'<b class=num style="color:var(--title)">~7 days</b> of rest each.</div>'
    f'<div style="font-size:15px;margin-top:10px" class=mut>Bag: +2% success</div>'
    f'<span style="flex:1"></span>'
    f'<span class=btn style="margin-top:14px">SEND EXPEDITION</span>'
    f'<span class="btn sec" style="margin-top:4px">Back to map</span>'
    f'</div>'
)

header = (
    f'<div style="display:flex;gap:18px">'
    f'<div style="width:220px;height:124px;flex:none;border-radius:10px;background:url(../../../public/assets/scene-library/totem-goblin.jpg) 50% 42%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
    f'<div style="flex:1;min-width:0">'
    f'<h1>Goblin Extermination</h1>'
    f'<p style="font-style:italic;font-size:18px;color:var(--title);margin-top:3px">The wood has gone quiet. The goblins have not.</p>'
    f'<p style="font-size:17px;margin-top:6px"><span class=lab>Objective</span>&nbsp; Exterminate the goblin camp — none of them must come back to threaten the village.</p>'
    f'<div style="display:flex;gap:34px;margin-top:10px;align-items:flex-end">'
    f'<div class=seal><span class=lab>Reward</span><span class=r>{rating(STAR, 2, GOLD)}</span></div>'
    f'<div class=seal><span class=lab>Danger</span><span class=r>{rating(CLAWP, 3, CLAW, claw=True)}</span></div>'
    f'<div class=seal><span class=lab>Duration</span><span class=r><span class=num style="font-size:20px;color:var(--title)">26 days</span>'
    f'<span class=mut style="font-size:15px;margin-left:8px">· 7 phases</span></span></div>'
    f'<div class=seal><span class=lab>Pays</span><span class=r style="font-size:16px">XP always · gold on return</span></div>'
    f'</div></div></div>'
)

body = (
    f'<img src="img/roster-real.png" style="position:absolute;left:14px;top:86px;width:418px;height:282px">'
    f'<div class="plq lac" style="left:452px;top:84px;width:964px;height:690px;padding:18px 20px;display:flex;flex-direction:column;gap:14px">'
    f'{header}'
    f'<div style="display:flex;gap:14px;flex:1;min-height:0">'
    f'<div style="flex:1;min-width:0;display:flex;flex-direction:column">'
    f'{test_band}'
    f'<div style="display:flex;justify-content:space-between;align-items:baseline;margin:14px 0 8px"><span class=lab>Marching order</span>'
    f'<span class=mut style="font-size:15px">head → tail · the tail takes the hits</span></div>'
    f'<div style="position:relative;display:flex;gap:8px">{ghost}{cards}</div>'
    f'<span style="flex:1"></span>'
    f'<div style="display:flex;gap:8px;align-items:center;margin-top:12px"><span class=lab>Bag 3/3</span>'
    f'<span class=slot>{gl("⚔️", 16)} Strength +15</span><span class=slot>{gl("🎯", 16)} Perception +15</span><span class=slot>{gl("❤️", 16)} Healing +20</span></div>'
    f'</div>{verdict}</div>'
    f'</div>'
)
note = ('<div class=note><b>Planner · B4 — le cinque correzioni</b>Stato mostrato: Lisetta trascinata sul posto del capo. '
        'Numeri dal simulatore vero (1000 tiri): 64% → 48%. Niente ferita per eroe: quota di colpi e «ferito o peggio». '
        'Forza su una scala con la soglia della prova. Secondarie sigillate finché un esploratore non le rivela.</div>')
open('.mw/runs/20261027-planner-remock/planner-B4.html', 'w').write(
    f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}{note}</body>')
