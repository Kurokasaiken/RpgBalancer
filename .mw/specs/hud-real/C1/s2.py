import sys; sys.path.insert(0, 'tools/hud-real')
import numpy as np, time
from PIL import Image
import hudreal as H
D = '.mw/specs/hud-real/C1/'
for k in ('top', 'row0', 'bottom'):
    up = Image.open(f'{D}S1-{k}-swinir.png'); t = time.time()
    a = H.birefnet_alpha(up)
    np.save(f'{D}S2-{k}-birefnet.npy', a)
    rgba = np.dstack([np.asarray(up), a]); Image.fromarray(rgba, 'RGBA').save(f'{D}S2-{k}-raw.png')
    bg = Image.new('RGBA', up.size, (255, 0, 255, 255)); bg.alpha_composite(Image.fromarray(rgba, 'RGBA')); bg.save(f'{D}S2-{k}-magenta.png')
    print(k, f'{time.time()-t:.0f}s opaque%', round((a > 128).mean() * 100, 1), flush=True)
