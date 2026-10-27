import json
I=json.load(open('icons/lucide.json'))
def ic(k,size,color): return f'<span class=li style="width:{size}px;height:{size}px;color:{color}">{I[k].replace(chr(39),chr(34))}</span>'
GOLD='#d8bd78'; SUC='#9ccc84'; WND='#e3a34f'; DTH='#93a4ad'
H=[('gig','Giggiolillo','Expedition leader',0,65,63,59),('spa','Sir Spaccaculi','Fighter',0,48,43,87),('sal','Salvatrice','Scout',20,38,58,94),('ber','Bertoldo','Bodyguard',80,58,63,5)]
bestS=max(h[4] for h in H); bestP=max(h[5] for h in H)
CSS='''
@font-face{font-family:Cinzel;src:url(../../../public/fonts/cinzel-latin-wght-normal.woff2);font-weight:400 900}
@font-face{font-family:'EB Garamond';src:url(../../../public/fonts/eb-garamond-latin-wght-normal.woff2);font-weight:400 800}
@font-face{font-family:'EB Garamond';font-style:italic;src:url(../../../public/fonts/eb-garamond-latin-wght-italic.woff2);font-weight:400 800}
:root{--hi:#b99a52;--crest:#d8bd78;--title:#e8d6ae;--body:#c9d3cf;--mute:#9fb3a8}
*{box-sizing:border-box;margin:0}
body{width:1440px;height:900px;overflow:hidden;position:relative;background:#04090d url(../../ui-catalog/components/hud-top-tabs/shots/V1/default-ctx-a.png) 0 0/1440px 900px;font-family:'EB Garamond',serif;color:var(--body)}
.li{display:inline-flex}.li svg{width:100%;height:100%}
.lac{background:linear-gradient(180deg,#0f2a35,#09202a 45%,#060f16)}
.plq{position:absolute;border-radius:16px;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 4.75px var(--hi),0 0 0 6px #0b0a08,0 10px 26px rgba(3,26,30,.7)}
h1{font-family:Cinzel;font-weight:600;font-size:20px;letter-spacing:.05em;color:var(--title)}
h3{font-family:Cinzel;font-weight:500;font-size:13px;letter-spacing:.18em;color:var(--crest);text-transform:uppercase}
.mut{color:var(--mute)}
.chip{white-space:nowrap;display:inline-flex;align-items:center;gap:6px;font-family:Cinzel;font-size:13px;letter-spacing:.06em;color:var(--title);padding:5px 10px;border-radius:7px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px rgba(223,184,87,.22)}
.btn{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 26px;border-radius:8px;font-family:Cinzel;font-weight:600;font-size:14px;letter-spacing:.16em;color:var(--title);background:linear-gradient(180deg,#09202a,#060f16);box-shadow:inset 0 0 0 1px var(--hi),inset 0 0 0 3px rgba(6,15,22,.9)}
.btn.sec{color:var(--mute);box-shadow:inset 0 0 0 1px rgba(185,154,82,.4)}
.por{border-radius:10px;object-fit:cover;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 3px var(--hi)}
.bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#b99a52,#d8bd78)}
.test{flex:1;display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:12px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px rgba(223,184,87,.35)}
.test .k{font-family:Cinzel;font-size:12px;letter-spacing:.2em;color:var(--crest)}
.test .n{font-family:Cinzel;font-weight:600;font-size:24px;color:#f1e6cc;letter-spacing:.04em}
.test .b{font-size:15px;color:var(--body)}
.out{display:flex;align-items:center;gap:10px}.out .v{font-family:Cinzel;font-weight:600;font-size:28px;line-height:1}.out .l{font-size:13px;color:var(--mute);letter-spacing:.04em}
.sv{display:flex;align-items:center;gap:5px;font-family:Cinzel;font-weight:600;font-size:17px;font-variant-numeric:tabular-nums}
.note{position:absolute;left:24px;bottom:24px;max-width:400px;font-size:15px;color:#c9d3cf;background:rgba(4,9,13,.9);padding:10px 14px;border-radius:8px;box-shadow:0 0 0 1px rgba(185,154,82,.5);z-index:20}
.note b{display:block;font-family:Cinzel;font-size:13px;letter-spacing:.1em;color:#e8d6ae;margin-bottom:4px}
'''
def card(k,n,role,exp,s,p,w):
    sv=lambda key,val,best: f'<span class=sv style="color:{"#f6e3a8" if val==best else "var(--body)"}">{ic(key,18,GOLD if val==best else "#9fb3a8")}{val}{"<span style=\'font-size:11px;letter-spacing:.1em;color:var(--crest);margin-left:2px\'>BEST</span>" if val==best else ""}</span>'
    return (f'<div style="flex:1;border-radius:12px;padding:12px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px rgba(223,184,87,.2)">'
            f'<div style="display:flex;gap:10px;align-items:center"><img class=por src="img/{k}.jpg" width=56 height=56><div><div style="font-family:Cinzel;font-size:12px;letter-spacing:.12em;color:var(--crest);text-transform:uppercase">{role}</div><div style="font-family:Cinzel;font-size:15px;color:var(--title)">{n}</div></div></div>'
            f'<div style="display:flex;justify-content:space-between;margin-top:12px">{sv("str",s,bestS)}{sv("perc",p,bestP)}</div>'
            f'<div style="margin-top:12px;font-size:13px" class=mut>Takes {exp}% of the hits</div><div class=bar style="margin-top:4px"><i style="width:{max(exp,2)}%"></i></div>'
            f'<div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:14px;color:{WND}">{ic("wound",16,WND)}<span style="font-family:Cinzel;font-weight:600">{w}%</span><span class=mut>wounded</span></div></div>')
body=(f'<img src="img/roster-real.png" style="position:absolute;left:14px;top:86px;width:418px;height:282px">'
 f'<div class="plq lac" style="left:452px;top:96px;width:964px;padding:18px 20px 20px">'
 f'<div style="display:flex;gap:16px"><div style="width:220px;height:104px;border-radius:10px;background:url(../../../public/assets/scene-library/accampamento-raider.jpg) 50% 40%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
 f'<div style="flex:1"><h1>Goblin Extermination</h1><p style="font-size:15px;margin-top:4px">Follow their tracks to the camp. None of them must come back to threaten the village.</p><div style="display:flex;gap:8px;margin-top:10px"><span class=chip>Danger · High</span><span class=chip>Reward · 60</span><span class=chip>26 days</span></div></div></div>'
 f'<div style="display:flex;gap:12px;margin-top:16px">'
 f'<div class=test>{ic("str",40,GOLD)}<div><div class=k>PRIMARY STAT</div><div class=n>STRENGTH</div><div class=b>best in the party: <b style="color:#f6e3a8">{bestS}</b> · Giggiolillo</div></div></div>'
 f'<div class=test style="box-shadow:inset 0 0 0 1px rgba(223,184,87,.2)">{ic("perc",32,"#c9b27a")}<div><div class=k>SECONDARY STAT</div><div class=n style="font-size:20px">PERCEPTION</div><div class=b>best in the party: <b style="color:#f6e3a8">{bestP}</b> · Giggiolillo, Bertoldo</div></div></div>'
 f'<div style="width:220px;display:flex;flex-direction:column;justify-content:center;gap:10px;padding-left:8px"><div class=out>{ic("success",26,SUC)}<span class=v style="color:{SUC}">68<small style="font-size:15px">%</small></span><span class=l>success<br>+2% from the bag</span></div><div class=out>{ic("wound",24,WND)}<span class=v style="color:{WND};font-size:24px">100<small style="font-size:14px">%</small></span><span class=l>at least one<br>comes back wounded</span></div></div></div>'
 f'<h3 style="margin:18px 0 10px">Marching order — head → tail · the tail takes the hits</h3>'
 f'<div style="display:flex;gap:12px">{"".join(card(*h) for h in H)}</div>'
 f'<div style="display:flex;gap:10px;margin-top:16px;align-items:center"><h3>Bag 3/3</h3><span class=chip>{ic("str",14,GOLD)} Strength +15</span><span class=chip>{ic("perc",14,GOLD)} Perception +15</span><span class=chip>{ic("heart",14,GOLD)} Healing +20 HP</span><span style="flex:1"></span><span class=btn>SEND EXPEDITION</span><span class="btn sec">BACK</span></div></div>')
note='<div class=note><b>Planner · B2 — formazione, roster invariato</b>Roster reale com\'è (filtri, ordinamento). La prova — statistica principale e secondaria — è l\'elemento più grande. Per eroe: Forza, Percezione (icone del Balancer), quota di colpi e ferita; nessuna probabilità di morte individuale.</div>'
open('planner-B2.html','w').write(f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}{note}</body>')
