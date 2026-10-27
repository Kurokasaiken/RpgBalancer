"""B8 companion — the real SlotV12Renderer choreography, frame by frame (WAAPI-seeked),
stock vs enhanced geometry (medal 52px, TOOTH_HEIGHT 9, medal kept and lifted while held)."""
CSS = open('.mw/runs/20261027-planner-remock/genB7.py').read().split("CSS = '''")[1].split("'''")[0]
frames = [('0-empty', 'Empty · open'), ('1-in-000', 'Drop · 0 ms'), ('1-in-211', 'Contact · 211 ms'), ('1-in-270', 'Teeth bite · 270 ms'),
          ('2-occupied', 'Locked'), ('3-hold-0.35', 'Hold 35% · teeth out'), ('3-hold-1', 'Hold 100% · open')]
def row(tag, title):
    cells = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><img src="seq/{tag}/{f}.png" width=168 height=168>'
                    f'<span style="font-size:15px;color:var(--body)">{c}</span></div>' for f, c in frames)
    return f'<div style="margin-bottom:26px"><div class=lab style="margin:0 0 8px 6px">{title}</div><div style="display:flex;gap:12px">{cells}</div></div>'
body = (f'<div class="plq lac" style="left:40px;top:110px;width:1360px;padding:26px 28px">'
        f'<h1 style="margin-bottom:20px">Marching-order bezel — your choreography, enhanced geometry</h1>'
        f'{row("stock", "Today (hud64 · medal 44 px · teeth 14)")}{row("pro", "Enhanced (same slam, same teeth timing · medal 52 px · teeth 9 · medal stays and lifts while held)")}</div>')
note = ('<div class=note><b>Ghiera · prima e dopo</b>Fotogrammi del componente vero, fermati con le Web Animations. '
        'Cambiano solo tre valori: diametro del medaglione, altezza dei denti, il medaglione che non sparisce durante la pressione.</div>')
open('.mw/runs/20261027-planner-remock/planner-B8-bezel.html', 'w').write(f'<!doctype html><meta charset=utf-8><style>{CSS}</style><body>{body}{note}</body>')
