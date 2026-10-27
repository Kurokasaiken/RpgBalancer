BR='#d8bd78'
def g(inner,s=20,stroke=BR,fill='none',w=1.6): return f'<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round">{inner}</svg>'
# incised state glyphs (sagoma, non cerchio)
SUC='<path d="M12 21V8"/><path d="M12 8c-3-1-4-4-4-6 2 1 4 3 4 6zM12 8c3-1 4-4 4-6-2 1-4 3-4 6z"/><path d="M12 13c-3-1-5-3-5-6 2 1 5 3 5 6zM12 13c3-1 5-3 5-6-2 1-5 3-5 6z"/><path d="M12 18c-3-1-5-3-5-6 2 1 5 3 5 6zM12 18c3-1 5-3 5-6-2 1-5 3-5 6z"/>'
WND='<path d="M12 3c3 5 6 8 6 12a6 6 0 01-12 0c0-4 3-7 6-12z"/><path d="M9.5 15.5a2.5 2.5 0 002.5 2.5"/>'
DTH='<path d="M12 3a7 7 0 00-7 7c0 2.5 1.2 4.3 3 5.3V19h8v-3.7c1.8-1 3-2.8 3-5.3a7 7 0 00-7-7z"/><path d="M9.5 10.5h.01M14.5 10.5h.01" stroke-width="2.6"/><path d="M10 19v2M14 19v2M12 19v2"/>'
CROWN='<path d="M4 17l1-9 4 4 3-6 3 6 4-4 1 9z"/>'
C={'suc':'#9ccc84','wnd':'#e3a34f','dth':'#93a4ad'}
def stat(kind,val,lab,sub='',big=28):
    ic={'suc':SUC,'wnd':WND,'dth':DTH}[kind]
    return f'<div class="st st-{kind}"><span class=ic>{g(ic,s=big-2,stroke=C[kind],w=1.7)}</span><span class=v style="font-size:{big}px">{val}<small>%</small></span><span class=l>{lab}{("<em>"+sub+"</em>") if sub else ""}</span></div>'
HEROES=[('gig','Giggiolillo','Expedition leader','Leader',0,59,1,'~2 d'),('spa','Sir Spaccaculi','Fighter','Fighter',0,87,2,'~3 d'),('sal','Salvatrice','Scout','Scout',20,94,6,'~3 d'),('ber','Bertoldo','Bodyguard','Guard',80,5,95,'—')]
CSS='''
@font-face{font-family:Cinzel;src:url(../../../public/fonts/cinzel-latin-wght-normal.woff2);font-weight:400 900}
@font-face{font-family:'EB Garamond';src:url(../../../public/fonts/eb-garamond-latin-wght-normal.woff2);font-weight:400 800}
@font-face{font-family:'EB Garamond';font-style:italic;src:url(../../../public/fonts/eb-garamond-latin-wght-italic.woff2);font-weight:400 800}
:root{--hi:#b99a52;--crest:#d8bd78;--title:#e8d6ae;--body:#c9d3cf;--mute:#9fb3a8;--suc:#9ccc84;--wnd:#e3a34f;--dth:#93a4ad}
*{box-sizing:border-box;margin:0}
body{width:1440px;height:900px;overflow:hidden;position:relative;background:#04090d url(../../ui-catalog/components/hud-top-tabs/shots/V1/default-ctx-a.png) 0 0/1440px 900px;font-family:'EB Garamond',serif;color:var(--body)}
.lac{background:linear-gradient(180deg,#0f2a35,#09202a 45%,#060f16)}
.plq{position:absolute;border-radius:16px;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 4.75px var(--hi),0 0 0 6px #0b0a08,0 10px 26px rgba(3,26,30,.7)}
h1{font-family:Cinzel;font-weight:600;font-size:20px;letter-spacing:.06em;color:var(--title)}
h3{font-family:Cinzel;font-weight:500;font-size:13px;letter-spacing:.18em;color:var(--crest);text-transform:uppercase}
.p{font-size:15px;line-height:1.45}
.mut{color:var(--mute)}
.st{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center}
.st .ic{grid-row:1/3}
.st .v{font-family:Cinzel;font-weight:600;color:#f1e6cc;line-height:1;font-variant-numeric:tabular-nums}
.st .v small{font-size:.55em;margin-left:1px}
.st .l{font-size:13px;letter-spacing:.06em;color:var(--mute)}
.st .l em{display:block;font-size:12px;font-style:italic;color:var(--mute);opacity:.85}
.st-suc .v{color:var(--suc)} .st-wnd .v{color:var(--wnd)} .st-dth .v{color:#c9d3d8}
.chip{white-space:nowrap;display:inline-flex;align-items:center;gap:6px;font-family:Cinzel;font-size:13px;letter-spacing:.06em;color:var(--title);padding:5px 10px;border-radius:7px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px rgba(223,184,87,.22)}
.btn{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 26px;border-radius:8px;font-family:Cinzel;font-weight:600;font-size:14px;letter-spacing:.16em;color:var(--title);background:linear-gradient(180deg,#09202a,#060f16);box-shadow:inset 0 0 0 1px var(--hi),inset 0 0 0 3px rgba(6,15,22,.9)}
.btn.sec{color:var(--mute);box-shadow:inset 0 0 0 1px rgba(185,154,82,.4)}
.warn{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:8px;background:rgba(147,164,173,.08);box-shadow:inset 3px 0 0 var(--dth),inset 0 0 0 1px rgba(147,164,173,.3);font-size:15px;color:#dfe6e9}
.note{position:absolute;left:24px;bottom:24px;max-width:430px;font-size:15px;color:#c9d3cf;background:rgba(4,9,13,.88);padding:10px 14px;border-radius:8px;box-shadow:0 0 0 1px rgba(185,154,82,.5);z-index:20}
.note b{display:block;font-family:Cinzel;font-size:13px;letter-spacing:.1em;color:#e8d6ae;margin-bottom:4px}
.por{border-radius:10px;object-fit:cover;box-shadow:0 0 0 1.25px #0b0a08,0 0 0 3px var(--hi)}
.bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#b99a52,#d8bd78)}
'''
def doc(b,t,n): return f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{b}<div class=note><b>{t}</b>{n}</div></body>'
roster_rows=''.join(f'<div style="display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:8px;{"opacity:.45" if i<4 else ""};box-shadow:inset 0 0 0 1px rgba(223,184,87,.14);margin-top:6px"><img class=por src="img/{k}.jpg" width=34 height=34 style="border-radius:8px"><div style="flex:1"><div style="font-family:Cinzel;font-size:14px;color:var(--title)">{n}</div><div style="font-size:13px" class=mut>{"Assigned · "+r if i<4 else "Free"}</div></div></div>' for i,(k,n,r) in enumerate([(h[0],h[1],h[3]) for h in HEROES]+[('ber','Lisetta',''),('ber','Baldassarre','')]))
# ---------------- A: same three zones, hierarchy rebuilt ----------------
def slotA(k,n,role,exp):
    return f'<div style="text-align:center;width:118px"><img class=por src="img/{k}.jpg" width=64 height=64 style="border-radius:50%"><div style="font-family:Cinzel;font-size:13px;color:var(--title);margin-top:6px">{role}</div><div style="font-size:13px" class=mut>{n}</div><div style="font-family:Cinzel;font-size:18px;color:{"#f1e6cc" if exp else "var(--mute)"};margin-top:2px">{exp}%</div><div class=mut style="font-size:12px">of the hits</div></div>'
A=(f'<div class="plq lac" style="left:24px;top:96px;width:300px;padding:16px 16px 14px"><h3>Roster 6/6</h3>{roster_rows}</div>'
 f'<div class="plq lac" style="left:344px;top:96px;width:660px;padding:16px 18px 18px">'
 f'<h1>Goblin Extermination</h1><div style="height:130px;margin:10px 0 12px;border-radius:10px;background:url(../../../public/assets/scene-library/accampamento-raider.jpg) 50% 40%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
 f'<p class=p>Follow their tracks to the camp. None of them must come back to threaten the village.</p>'
 f'<h3 style="margin:16px 0 8px">Marching order <span class=mut style="font-family:EB Garamond;letter-spacing:0;text-transform:none;font-size:14px">— who takes the incoming hits</span></h3>'
 f'<div style="display:flex;justify-content:space-between;padding:0 10px">{"".join(slotA(h[0],h[1],h[2],h[4]) for h in HEROES)}</div>'
 f'<div style="display:flex;align-items:center;gap:10px;margin-top:16px"><h3>Bag 3/3</h3><span class=chip>Strength +15</span><span class=chip>Perception +15</span><span class=chip>Healing +20 HP</span></div>'
 f'<div style="display:flex;gap:10px;margin-top:18px"><span class=btn style="flex:1">SEND EXPEDITION</span><span class="btn sec">BACK TO MAP</span></div></div>'
 f'<div class="plq lac" style="left:1024px;top:96px;width:392px;padding:16px 18px 18px">'
 f'<div style="display:flex;gap:8px;flex-wrap:wrap"><span class=chip>Danger · High</span><span class=chip>Reward · 60</span><span class=chip>26 days</span></div>'
 f'<h3 style="margin:16px 0 10px">Forecast</h3>'
 f'<div style="display:grid;grid-template-columns:1fr;gap:12px">{stat("suc",68,"Success","+2% from the bag")}{stat("wnd",100,"At least one wounded")}{stat("dth",96,"At least one dies")}</div>'
 f'<div class=warn style="margin-top:14px">{g(DTH,s=22,stroke="#93a4ad")}<span><b style="font-family:Cinzel;font-weight:600">Bertoldo</b>, the bodyguard, dies 95% of the time.</span></div>'
 f'<h3 style="margin:16px 0 8px">By member</h3>'
 + ''.join(f'<div style="display:grid;grid-template-columns:1fr 62px 62px;gap:6px;align-items:center;padding:6px 0;border-top:1px solid rgba(223,184,87,.12);font-size:15px"><span style="color:var(--title)">{h[1]} <span class=mut style="font-size:13px">· {h[3]}</span></span><span style="display:flex;gap:3px;align-items:center;color:var(--wnd)">{g(WND,s=15,stroke="#e3a34f")}{h[5]}%</span><span style="display:flex;gap:3px;align-items:center;color:#c9d3d8">{g(DTH,s=15,stroke="#93a4ad")}{h[6]}%</span></div>' for h in HEROES)
 + '<div class=mut style="font-size:14px;margin-top:10px;font-style:italic">Intel (4) ▸</div></div>')
# ---------------- B: the formation is the hero ----------------
def card(k,n,role,_short,exp,w,d,down):
    hot = d>=50
    return (f'<div style="width:196px;border-radius:12px;padding:12px;background:rgba(0,0,0,.25);box-shadow:inset 0 0 0 1px {"rgba(147,164,173,.7)" if hot else "rgba(223,184,87,.2)"}">'
            f'<div style="display:flex;gap:10px;align-items:center"><img class=por src="img/{k}.jpg" width=58 height=58><div><div style="font-family:Cinzel;font-size:12px;letter-spacing:.14em;color:var(--crest);text-transform:uppercase">{role}</div><div style="font-family:Cinzel;font-size:15px;color:var(--title)">{n}</div></div></div>'
            f'<div style="margin-top:12px;font-size:13px" class=mut>Takes {exp}% of the hits</div><div class=bar style="margin-top:4px"><i style="width:{max(exp,2)}%"></i></div>'
            f'<div style="display:flex;justify-content:space-between;margin-top:12px">{stat("wnd",w,"wound",big=22)}{stat("dth",d,"death",big=22)}</div>'
            f'<div class=mut style="font-size:13px;margin-top:8px">If wounded: down {down}</div></div>')
B=(f'<div class="plq lac" style="left:120px;top:96px;width:1200px;padding:18px 22px 20px">'
 f'<div style="display:flex;gap:18px;align-items:stretch"><div style="width:300px;border-radius:10px;background:url(../../../public/assets/scene-library/accampamento-raider.jpg) 50% 40%/cover;box-shadow:inset 0 0 0 1px rgba(185,154,82,.5)"></div>'
 f'<div style="flex:1"><h1>Goblin Extermination</h1><p class=p style="margin-top:6px">Follow their tracks to the camp. None of them must come back to threaten the village.</p>'
 f'<div style="display:flex;gap:8px;margin-top:10px"><span class=chip>Danger · High</span><span class=chip>Reward · 60</span><span class=chip>26 days</span><span class=chip>Tests Strength · Perception</span></div></div>'
 f'<div style="width:330px;display:flex;flex-direction:column;gap:10px;justify-content:center;padding-left:14px;border-left:1px solid rgba(223,184,87,.2)">{stat("suc",68,"Success","+2% from the bag",30)}{stat("wnd",100,"At least one wounded",big=24)}{stat("dth",96,"At least one dies",big=24)}</div></div>'
 f'<h3 style="margin:18px 0 10px">Marching order — head → tail · the tail takes the hits</h3>'
 f'<div style="display:flex;gap:14px;justify-content:space-between">{"".join(card(*h) for h in HEROES)}<div style="width:230px;display:flex;flex-direction:column;gap:8px"><h3>Bag 3/3</h3><span class=chip>Strength +15</span><span class=chip>Perception +15</span><span class=chip>Healing +20 HP</span><span class=mut style="font-size:13px;font-style:italic">Intel (4) ▸</span></div></div>'
 f'<div style="display:flex;gap:12px;margin-top:16px;align-items:center"><div class=warn style="flex:1">{g(DTH,s=22,stroke="#93a4ad")}<span><b style="font-family:Cinzel;font-weight:600">Bertoldo</b> at the tail dies 95% of the time — swap him, or send him knowing it.</span></div><span class=btn>SEND EXPEDITION</span><span class="btn sec">BACK</span></div></div>'
 f'<div class="plq lac" style="left:120px;top:660px;width:560px;padding:10px 14px"><div style="display:flex;gap:10px;align-items:center"><h3>Roster</h3>'+''.join(f'<img class=por src="img/{k}.jpg" width=40 height=40 style="{"opacity:.4" if i<4 else ""}">' for i,k in enumerate(['gig','spa','sal','ber','ber','ber']))+'<span class=mut style="font-size:13px">drag a portrait onto a card to swap</span></div></div>')
# ---------------- C: full-screen war table ----------------
C_=(f'<div style="position:absolute;inset:0;background:url(../../../public/assets/scene-library/accampamento-raider.jpg) 50% 45%/cover;filter:brightness(.55)"></div>'
 f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,14,20,.55),rgba(3,14,20,.1) 35%,rgba(3,14,20,.15) 55%,rgba(3,14,20,.92) 78%)"></div>'
 f'<div class="plq lac" style="left:260px;top:-6px;width:920px;padding:20px 26px 16px;border-radius:0 0 18px 18px;display:flex;gap:26px;align-items:center">'
 f'<div style="flex:1"><h1>Goblin Extermination</h1><p class=p style="margin-top:4px">Follow their tracks to the camp. None of them must come back.</p><div style="display:flex;gap:8px;margin-top:8px"><span class=chip>Danger · High</span><span class=chip>Reward · 60</span><span class=chip>26 days</span></div></div>'
 f'<div style="display:flex;gap:24px">{stat("suc",68,"Success","+2% bag",30)}{stat("wnd",100,"≥1 wounded",big=26)}{stat("dth",96,"≥1 dies",big=26)}</div></div>'
 f'<div class="plq lac" style="left:60px;top:560px;width:1320px;padding:16px 20px 18px;border-radius:18px 18px 0 0;top:auto;bottom:-6px">'
 f'<h3 style="margin-bottom:10px">Marching order — the tail takes the hits</h3><div style="display:flex;gap:16px;align-items:flex-end">'
 + ''.join(f'<div style="flex:1;border-radius:12px;padding:12px;background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 1px {"rgba(147,164,173,.7)" if h[6]>=50 else "rgba(223,184,87,.2)"}"><div style="display:flex;gap:12px;align-items:center"><img class=por src="img/{h[0]}.jpg" width=72 height=72><div style="flex:1"><div style="font-family:Cinzel;font-size:12px;letter-spacing:.14em;color:var(--crest)">{h[2].upper()}</div><div style="font-family:Cinzel;font-size:16px;color:var(--title)">{h[1]}</div><div class=mut style="font-size:13px;margin-top:4px">{h[4]}% of the hits</div><div class=bar style="margin-top:3px"><i style="width:{max(h[4],2)}%"></i></div></div></div><div style="display:flex;gap:18px;margin-top:10px">{stat("wnd",h[5],"wound",big=22)}{stat("dth",h[6],"death",big=22)}</div></div>' for h in HEROES)
 + '<div style="width:220px;display:flex;flex-direction:column;gap:8px"><span class=chip>Strength +15</span><span class=chip>Perception +15</span><span class=chip>Healing +20 HP</span><span class=btn>SEND EXPEDITION</span></div></div></div>')
P={'planner-A':(A,'Planner · A — tre plance, gerarchia rifatta','Stessa struttura di oggi (roster · quest · previsioni), ma i numeri che decidono sono grandi, con icona e colore; l\'avviso più grave sale in cima; i ruoli sotto gli slot passano da 9 a 13 px; intel chiuso.'),
   'planner-B':(B,'Planner · B — la formazione è l\'eroe','Una lastra larga: in alto quest e tre esiti; in mezzo i quattro eroi in ordine di marcia, ognuno con quota di colpi, ferita e morte. Roster ridotto a ritratti da trascinare.'),
   'planner-C':(C_,'Planner · C — tavolo di guerra a schermo intero','La scena dipinta del luogo a tutto schermo (livello «racconto»), quest ed esiti in alto, la formazione in basso come plinto. Il roster qui sarebbe un cassetto laterale (non disegnato).')}
for k,(b,t,n) in P.items():
    h=doc(b,t,n)
    if k=='planner-C': h=h.replace('<div class=note>','<div class=note style="bottom:auto;top:150px">')
    open(f'{k}.html','w').write(h)
