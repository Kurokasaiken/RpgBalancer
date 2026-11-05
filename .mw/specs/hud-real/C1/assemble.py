import numpy as np
from PIL import Image
D = '.mw/specs/hud-real/C1/'
W, H4 = 260 * 4, 668 * 4
col = Image.new('RGBA', (W, H4), (0, 0, 0, 0))
col.alpha_composite(Image.open(D + 'S2-top.png'), (0, 0))
for i in range(4):
    col.alpha_composite(Image.open(f'{D}S2-row{i}.png'), (0, (227 + 94 * i) * 4))
col.alpha_composite(Image.open(D + 'S2-bottom.png'), (0, 603 * 4))
col.save(D + 'S2-column-master.png')
S = 1600 / 1672 * 2   # design px at DPR 2
out = col.resize((round(W / 4 * S), round(H4 / 4 * S)), Image.LANCZOS)
import os; os.makedirs('public/assets/ui/hud-real/C1', exist_ok=True)
out.save('public/assets/ui/hud-real/C1/column-r1.png', optimize=True)
print(col.size, out.size, os.path.getsize('public/assets/ui/hud-real/C1/column-r1.png') // 1024, 'KB')
